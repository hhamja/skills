#!/usr/bin/env node
// 사용법: node scripts/aso-probe.mjs <keyword> [country] [limit]
// iTunes Search API + 리뷰 RSS 로 무료 ASO 신호를 수집해 stdout 에 JSON 출력.
// 키/계정/유료구독 불필요. 매출·다운로드 추정은 하지 않는다(비공개 데이터라 불가).
// 출력은 "유통 우위 필터" 스킬이 소비할 가설 재료이지 검증된 수요가 아니다.
//
// 신호: 상위앱 평점 수(설치 규모 프록시), 리뷰 증가속도(모멘텀 프록시),
//       경쟁 밀도, 낮은 별점 리뷰 원문(페인포인트 채굴용).

const [, , keyword, countryArg, limitArg] = process.argv;
const country = countryArg || "us";
const limit = Math.min(Number(limitArg) || 8, 20);

if (!keyword) {
  console.error("사용법: node scripts/aso-probe.mjs <keyword> [country] [limit]");
  process.exit(2);
}

const UA = "vibe-expo-aso-probe/1.0";

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

// 리뷰 RSS 는 최근순 최대 ~50건. 첫 entry 는 앱 정보(별점 필드 없음)라 걸러낸다.
// Apple 리뷰 RSS 는 간헐적으로 HTTP 200 + 빈 피드(entry 없음)를 반환한다(레이트리밋 아님, 알려진 불안정).
// 그래서 리뷰는 best-effort 보조 신호다. load-bearing 정량 앵커는 Search API(평점 수·경쟁 밀도)에서 온다.
// ponytail: RSS 3회 재시도가 상한. 그래도 비면 note 로 "데이터 없음"을 "불만 없음"과 구분해 표시.
async function fetchReviews(trackId) {
  const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${trackId}/page=1/sortBy=mostRecent/json`;
  let data = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      data = await getJson(url);
      if (Array.isArray(data?.feed?.entry)) break; // 실데이터 확보
    } catch (e) {
      if (attempt === 2) return { reviews: [], velocityPerMonth: null, note: `RSS 실패: ${e.message}` };
    }
  }
  const entries = Array.isArray(data?.feed?.entry) ? data.feed.entry : [];
  if (entries.length === 0) {
    return { reviews: [], velocityPerMonth: null, note: "RSS 빈 피드(Apple 간헐적) — 리뷰 데이터 없음" };
  }
  const reviews = entries
    .filter((e) => e["im:rating"]?.label) // 앱 정보 entry 제외
    .map((e) => ({
      stars: Number(e["im:rating"].label),
      title: e.title?.label ?? "",
      text: e.content?.label ?? "",
      date: e.updated?.label ?? null,
    }));

  // 증가속도 추정(coarse): 최근 리뷰 건수 / 최신~최오래 리뷰 간 개월 수.
  let velocityPerMonth = null;
  const dated = reviews.filter((r) => r.date).map((r) => Date.parse(r.date)).filter((t) => !Number.isNaN(t));
  if (dated.length >= 2) {
    const spanMs = Math.max(...dated) - Math.min(...dated);
    const spanMonths = Math.max(spanMs / (1000 * 60 * 60 * 24 * 30.44), 0.25);
    velocityPerMonth = Math.round((reviews.length / spanMonths) * 10) / 10;
  }
  return { reviews, velocityPerMonth, note: null };
}

async function main() {
  const searchUrl =
    `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}` +
    `&country=${country}&entity=software&media=software&limit=${limit}`;
  const search = await getJson(searchUrl);
  const results = Array.isArray(search.results) ? search.results : [];

  const apps = [];
  for (const r of results) {
    const { reviews, velocityPerMonth, note } = await fetchReviews(r.trackId);
    const lowStar = reviews.filter((rv) => rv.stars <= 3).slice(0, 5);
    apps.push({
      trackId: r.trackId,
      name: r.trackName,
      seller: r.sellerName ?? null,
      genre: r.primaryGenreName ?? null,
      avgRating: r.averageUserRating ?? null,
      ratingCount: r.userRatingCount ?? 0,
      price: r.price ?? 0,
      formattedPrice: r.formattedPrice ?? null,
      firstRelease: r.releaseDate ?? null,
      lastUpdate: r.currentVersionReleaseDate ?? null,
      reviewVelocityPerMonth: velocityPerMonth,
      recentReviewSample: reviews.length,
      lowStarReviews: lowStar,
      note,
    });
  }

  const rated = apps.filter((a) => a.ratingCount > 0);
  const summary = {
    competitorCount: apps.length,
    strongCompetitors: apps.filter((a) => a.ratingCount >= 1000).length, // 검증된 대량 수요
    medianRatingCount: rated.length
      ? rated.map((a) => a.ratingCount).sort((x, y) => x - y)[Math.floor(rated.length / 2)]
      : 0,
    paidOrSubscriptionPresent: apps.some((a) => a.price > 0),
  };

  console.log(
    JSON.stringify(
      { keyword, country, fetchedAt: new Date().toISOString(), summary, apps },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(`aso-probe 실패: ${e.message}`);
  process.exit(1);
});
