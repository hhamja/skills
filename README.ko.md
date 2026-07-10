# minseok-skills

> [Claude Code](https://www.anthropic.com/claude-code)용 개인 범용 **스킬 컬렉션** — 에이전트 엔지니어링 생산성 도구를 설치형 플러그인으로 배포하는 채널.

[English](README.md) · **한국어**

![version](https://img.shields.io/badge/version-0.2.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-8A63D2)

이 플러그인은 재사용 가능한 **범용** 스킬의 집이다. 루프 엔지니어링 전용인
[`loopkit`](https://github.com/hhamja/loopkit)과 역할을 나눈다. 스킬은 배포할
만큼 여물면 여기로 "졸업"하며, git 태그 + `plugin.json` SemVer + `CHANGELOG.md`로
버전 관리한다.

## 스킬

| 스킬 | 하는 일 |
|---|---|
| **`toolsmith`** | 에이전트 엔지니어링 셋업과 대상 프로젝트를 감사해, 도구/스킬/커맨드/훅/스크립트 후보를 machine-verifiable '완료' 정의와 함께 순위 리포트로 낸다. |
| **`niche-finder`** | 무료 App Store 신호만으로 "내가 불공정한 유통 우위를 가진 좁은 니치"를 찾아, 정량 앵커·리뷰 원문 인용이 붙은 테스트 가능한 가설 목록을 낸다. 독립 검증기가 라이브 API 재조회로 조작 증거를 차단. |

## 설치

```
/plugin marketplace add hhamja/minseok-skills
/plugin install minseok-skills@minseok-skills
```

(로컬 개발 시엔 작업 사본을 가리키게: `/plugin marketplace add ~/develop/minseok-skills`.)

## 컨벤션 (loop-harness 하우스 스타일)

- **점진 공개** — 얇은 상주 `SKILL.md`가 깊은 자료는 `references/*.md`로 라우팅.
- **machine-verifiable "done"** — 모든 제안에 수용 테스트(명령 exit 0 / 파일 존재 / 출력 일치)를 붙인다.
- **결정형은 스크립트, 판단은 프롬프트** — 세기·스캔·파싱은 `scripts/*.sh`에.
- **토큰 예산** — `scripts/check_budget.sh`가 상주 표면 ≤300단어, 각 `SKILL.md` 본문 ≤500단어를 exit-code로 강제.

## 테스트

```
bash scripts/check_budget.sh    # 예산 증명 — exit 0이어야 함
```

## 라이선스

MIT — [LICENSE](LICENSE) 참고.
