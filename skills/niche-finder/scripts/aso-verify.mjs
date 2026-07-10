#!/usr/bin/env node
// 사용법: node scripts/aso-verify.mjs <hypotheses.json>
// niche-finder 스킬 출력(가설 목록)의 진위를 라이브 iTunes API 로 재검증한다 = checker A.
// maker(스킬)와 checker(이 파일)를 분리해 스킬이 자기 산출물을 스스로 통과시키지 못하게 한다.
// exit 0 = 통과, 1 = 위반, 2 = 사용법/파싱 오류.
//
// 검증 항목:
//  1) 스키마    — 필수 필드 non-empty, verdict.type==="hypothesis", reviewQuotes>=3
//  2) 숫자 진위 — topApps[].trackId 를 iTunes Lookup 재조회해 ratingCount/genre tolerance 일치(조작 차단)
//  3) 인용 진위 — reviewQuotes 가 실제 RSS 리뷰 원문에 부분일치(지어내기 차단). RSS 빈 피드면 fail 아닌 skip.
//  4) 4.3 중복 — 가설 상호 niche/differentiationNote 상이 + dupRisk43 플래그 all-true(스팸 리젝 가드)

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 4.3 참고 정보(기존 앱 bundleId)는 실행 중인 프로젝트(cwd) 기준으로 찾는다.
// apps/ 모노레포가 아닌 프로젝트에선 조용히 [] — 검증 실패 아님(정보성).
const root = process.cwd();
const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.error("사용법: node scripts/aso-verify.mjs <hypotheses.json>");
  process.exit(2);
}

let doc;
try {
  doc = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`✗ JSON 파싱 실패: ${e.message}`);
  process.exit(2);
}
const hyps = Array.isArray(doc) ? doc : Array.isArray(doc?.hypotheses) ? doc.hypotheses : null;
if (!hyps || hyps.length === 0) {
  console.error("✗ 가설 배열이 비었다 (top-level array 또는 { hypotheses: [...] })");
  process.exit(2);
}

const country = doc?.country || "us";
const fails = [];
const skips = [];
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "vibe-expo-aso-verify/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// iTunes Lookup: 존재하는 trackId 는 results[0] 반환. 조작/무효 id 는 results:[] (HTTP 200).
async function lookup(trackId) {
  const data = await getJson(`https://itunes.apple.com/lookup?id=${trackId}&country=${country}`);
  return data?.results?.[0] ?? null;
}

async function realReviews(trackId) {
  try {
    const data = await getJson(
      `https://itunes.apple.com/${country}/rss/customerreviews/id=${trackId}/page=1/sortBy=mostRecent/json`,
    );
    const entries = Array.isArray(data?.feed?.entry) ? data.feed.entry : [];
    return entries.filter((e) => e["im:rating"]?.label).map((e) => norm(e.content?.label));
  } catch {
    return null; // 네트워크 오류 → 검증 불가(skip), 빈 배열(피드 공백)과 구분
  }
}

// 기존 앱들의 bundleId(4.3 상호 유일성 참고용)
function existingBundleIds() {
  const appsDir = join(root, "apps");
  if (!existsSync(appsDir)) return [];
  const ids = [];
  for (const slug of readdirSync(appsDir)) {
    const env = join(appsDir, slug, ".env");
    if (!existsSync(env)) continue;
    const m = readFileSync(env, "utf8").match(/^\s*APP_BUNDLE_ID\s*=\s*(.+)$/m);
    if (m) ids.push(m[1].trim());
  }
  return ids;
}

async function verify() {
  const nicheSeen = new Set();
  const diffSeen = new Set();

  for (let i = 0; i < hyps.length; i++) {
    const h = hyps[i];
    const tag = `가설#${i + 1}(${h?.niche || "무제"})`;

    // 1) 스키마
    if (!norm(h?.niche)) fails.push(`${tag}: niche 비어있음`);
    if (h?.verdict?.type !== "hypothesis") fails.push(`${tag}: verdict.type 는 "hypothesis" 여야(검증된 수요 아님)`);
    if (!norm(h?.distributionAngle)) fails.push(`${tag}: distributionAngle 비어있음(유통 우위 없이 착수 금지)`);
    if (!norm(h?.differentiationNote)) fails.push(`${tag}: differentiationNote 비어있음(고유 20% 없음)`);
    const quotes = Array.isArray(h?.reviewQuotes) ? h.reviewQuotes : [];
    if (quotes.length < 3) fails.push(`${tag}: reviewQuotes ${quotes.length}개 (원문 인용 최소 3 — 수요 지어내기 방지)`);
    const topApps = Array.isArray(h?.quantAnchors?.topApps) ? h.quantAnchors.topApps : [];
    if (topApps.length === 0) fails.push(`${tag}: quantAnchors.topApps 비어있음(정량 앵커 필수)`);

    // 2) 숫자 진위 — topApps ratingCount/genre 재검증
    for (const a of topApps) {
      if (a?.trackId == null) { fails.push(`${tag}: topApps 항목에 trackId 없음`); continue; }
      let live;
      try { live = await lookup(a.trackId); }
      catch { skips.push(`${tag}: trackId ${a.trackId} Lookup 네트워크오류 — 숫자검증 skip`); continue; }
      if (!live) { fails.push(`${tag}: trackId ${a.trackId} 무효/조작(Lookup 결과 없음)`); continue; }
      const liveCount = live.userRatingCount ?? 0;
      const claimed = Number(a.ratingCount ?? 0);
      const tol = Math.max(liveCount * 0.25, 50); // 평점은 시간에 따라 변함 → 관대한 tolerance
      if (Math.abs(liveCount - claimed) > tol)
        fails.push(`${tag}: trackId ${a.trackId} ratingCount 불일치(주장 ${claimed} vs 실측 ${liveCount})`);
      if (a.genre && live.primaryGenreName && norm(a.genre) !== norm(live.primaryGenreName))
        fails.push(`${tag}: trackId ${a.trackId} genre 불일치(주장 ${a.genre} vs 실측 ${live.primaryGenreName})`);
    }

    // 3) 인용 진위 — 실제 RSS 원문 부분일치. 빈 피드/오류면 skip(false negative 방지).
    const reviewCache = new Map();
    for (const q of quotes) {
      if (q?.trackId == null || !norm(q?.text)) { fails.push(`${tag}: reviewQuote 에 trackId/text 없음`); continue; }
      if (!reviewCache.has(q.trackId)) reviewCache.set(q.trackId, await realReviews(q.trackId));
      const real = reviewCache.get(q.trackId);
      if (real === null) { skips.push(`${tag}: trackId ${q.trackId} RSS 오류 — 인용검증 skip`); continue; }
      if (real.length === 0) { skips.push(`${tag}: trackId ${q.trackId} RSS 빈 피드 — 인용검증 skip`); continue; }
      const needle = norm(q.text).slice(0, 40);
      const matched = real.some((r) => r.includes(needle) || needle.length >= 12 && needle.includes(r.slice(0, 40)));
      if (!matched) fails.push(`${tag}: 인용 미검증(실제 리뷰에 없음): "${q.text.slice(0, 50)}..."`);
    }

    // 4) 4.3 중복 가드
    const d = h?.dupRisk43 || {};
    if (!(d.binaryDistinct && d.conceptDistinct && d.metadataDistinct))
      fails.push(`${tag}: dupRisk43 플래그가 all-true 아님(4.3 스팸 리젝 리스크)`);
    const nk = norm(h?.niche), dk = norm(h?.differentiationNote);
    if (nicheSeen.has(nk)) fails.push(`${tag}: niche 가 다른 가설과 중복(4.3 상호 차별 위반)`);
    if (diffSeen.has(dk)) fails.push(`${tag}: differentiationNote 가 다른 가설과 중복`);
    nicheSeen.add(nk); diffSeen.add(dk);
  }

  const existing = existingBundleIds();
  if (existing.length) console.error(`ℹ 참고: 기존 앱 bundleId ${existing.length}개 — new-app 시 유일성 재확인 필요`);

  for (const s of skips) console.error(`… skip: ${s}`);
  if (fails.length) {
    console.error(`\n✗ aso-verify: ${fails.length}개 위반`);
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✓ aso-verify: 가설 ${hyps.length}개 통과 (skip ${skips.length}개)`);
  process.exit(0);
}

verify().catch((e) => { console.error(`aso-verify 실패: ${e.message}`); process.exit(1); });
