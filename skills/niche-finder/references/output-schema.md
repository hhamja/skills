# 출력 스키마 계약 (niche-finder)

스킬 출력 = 이 스키마의 JSON 파일. `scripts/aso-verify.mjs`가 이 계약을 **기계 검증**한다.
필드명은 camelCase 고정(검증기와 일치). 위반 시 `aso-verify` exit 1.

```jsonc
{
  "country": "us",                 // aso-verify 가 재조회에 쓸 스토어프론트
  "seed": "study timer",           // 입력 시드(카테고리/키워드)
  "generatedAt": "<ISO8601>",      // 후처리로 스탬프(스킬은 값 지어내지 말 것)
  "hypotheses": [                   // 근거 기반 랭킹(상위=유망). 배열이 곧 우선순위.
    {
      "niche": "학습 세션용 벌금형 뽀모도로",      // 한 줄, 좁을수록 좋음. 가설끼리 중복 금지(4.3)
      "seedKeyword": "study timer",

      "quantAnchors": {                            // 정량 앵커 필수 — 없으면 스키마 위반
        "topApps": [                               // aso-probe 출력에서 그대로 옮김(지어내지 말 것)
          { "trackId": 123456, "name": "...", "avgRating": 3.4,
            "ratingCount": 812, "genre": "Productivity" }   // ← 검증기가 Lookup 재조회로 대조
        ],
        "reviewVelocityNote": "≈40 reviews/mo (RSS coarse)",
        "competitorDensity": "상위 24개 중 ratingCount>1k 은 3개"
      },

      "reviewQuotes": [                            // 원문 인용 ≥3, 수요 지어내기 방지
        { "trackId": 123456, "stars": 2,
          "text": "<실제 리뷰 원문 그대로>",       // ← 검증기가 실제 RSS 원문에 부분일치 대조
          "painPoint": "이 리뷰가 가리키는 미충족 니즈" }
      ],

      "distributionAngle": "내가 가진 불공정 유통 우위 — 도달 가능한 커뮤니티/롱테일 SEO/ASO 앵글",
      "differentiationNote": "app-core 재사용 80% 위 고유 20%(리뷰 갭에서 도출). 가설끼리 중복 금지",

      "dupRisk43": {                               // Apple Guideline 4.3 스팸 리젝 가드 — 세 플래그 all-true 여야
        "binaryDistinct": true, "conceptDistinct": true, "metadataDistinct": true,
        "note": "기존 apps/* 및 다른 가설과 실질 차별 근거"
      },

      "verdict": {
        "type": "hypothesis",                      // 고정값. "검증된 수요"가 아님을 스키마로 강제
        "confidence": "low",                       // low | med (high 금지 — 사전예측 과신 방지)
        "nextProbe": "확신을 올리려면 더 볼 것(예: 자동완성 검색량)"
      },

      "paidApiTrigger": null                        // 유료 API(AppFigures 월납 1개월) 정당화 조건 or null
    }
  ]
}
```

## 검증 규칙 (aso-verify.mjs)
- `verdict.type` ≠ `"hypothesis"` → fail.
- `reviewQuotes.length < 3` → fail.
- `quantAnchors.topApps` 비었거나 `trackId` 없음 → fail.
- `topApps[].ratingCount` 가 Lookup 실측과 ±max(25%,50) 초과 이탈 → fail(조작).
- `reviewQuotes[].text` 가 실제 RSS 리뷰에 부분일치 실패 → fail(지어내기). **단 RSS 빈 피드/오류는 skip**.
- `dupRisk43` 세 플래그 중 하나라도 false → fail. `niche`/`differentiationNote` 가설 상호 중복 → fail.
