# 시호한의원 홈페이지 (thesiho.kr)

Astro 기반 정적 사이트. Cloudflare Pages에 연결되어 main 브랜치에 push하면 자동 배포됩니다.

## 자주 하는 작업

- **진료 항목 추가/수정**: `src/content/treatments/*.md` — frontmatter는 `title`, `summary`(1–2문장, 메타 설명에 사용), `order`, `faqs`(선택). `faqs`에 `q`/`a` 쌍을 넣으면 페이지 하단에 아코디언으로 표시되고 FAQPage 구조화 데이터가 자동 생성됨
- **FAQ 추가**: `src/content/faq/*.md` — frontmatter는 `question`(환자가 실제 검색할 법한 질문형 문장), `category`, `order`. FAQPage 구조화 데이터는 자동 생성됨
- **보험한약 목록 수정**: `src/data/insurance-herbs.ts`
- **주소/전화/링크/진료시간 수정**: `src/data/clinic.ts` (전 페이지 + JSON-LD에 반영됨)
- **새 페이지**: `src/pages/*.astro`, 레이아웃은 `src/layouts/Base.astro` 사용

## 콘텐츠 작성 규칙 (GEO)

- 제목(H2)은 질문형으로: "추나요법이란 무엇인가요?" — AI 검색 엔진이 인용하기 좋은 형태
- 한 문단에 하나의 주제, 구체적 정보(전화번호, 조건, 위치)를 본문에 직접 포함
- **의료광고법 주의**: 치료 효과 보장("완치", "특효"), 환자 후기, 비교 광고 표현 금지. "~에 사용합니다", "~을 목표로 합니다" 수준으로 작성
- 새 페이지를 만들면 `public/llms.txt`에도 링크 추가

## 배포 (Cloudflare Workers 정적 자산)

- `wrangler.jsonc`의 Worker 이름은 `thesiho`. Astro가 만든 `dist/`를 그대로 서빙하며 서버 코드는 없음
- 빌드 명령 `npm run build`, 출력 디렉터리 `dist`, 프로덕션 브랜치 `main`
- Node 22.12 이상 필요 (Astro 7). 빌드 환경의 버전은 `.nvmrc`로 고정되어 있음
- main에 push하면 약 2~3분 뒤 프로덕션(thesiho.kr) 배포
- 미리보기 주소는 Pages 방식(`<브랜치>.<프로젝트>.pages.dev`)이 아닙니다. Workers는
  Cloudflare 대시보드의 Compute → thesiho → Deployments에서 확인해야 하며,
  `workers.dev` 서브도메인이 꺼져 있으면 미리보기 주소 자체가 없습니다

## 명령어

- `npm run dev` — 로컬 개발 서버
- `npm run build` — 빌드 검증 (커밋 전 실행 권장)
