# 시호한의원 홈페이지 (thesiho.kr)

Astro 기반 정적 사이트. Cloudflare Workers(정적 자산)에 연결되어 main 브랜치에 push하면 자동 배포됩니다.

## 자주 하는 작업

- **진료 항목 추가/수정**: `src/content/treatments/*.md` — frontmatter는 `title`, `summary`(1–2문장, 메타 설명에 사용), `order`, `faqs`(선택). `faqs`에 `q`/`a` 쌍을 넣으면 페이지 하단에 아코디언으로 표시되고 FAQPage 구조화 데이터가 자동 생성됨
- **FAQ 추가**: `src/content/faq/*.md` — frontmatter는 `question`(환자가 실제 검색할 법한 질문형 문장), `category`, `order`. FAQPage 구조화 데이터는 자동 생성됨
- **보험한약 목록 수정**: `src/data/insurance-herbs.ts`
- **주소/전화/링크/진료시간 수정**: `src/data/clinic.ts` (전 페이지 + JSON-LD에 반영됨). 진료시간을 고치면 `src/content/faq/opening-hours.md` 도 함께 고치세요 — 마크다운에서는 변수를 못 씁니다
- **새 페이지**: `src/pages/*.astro`, 레이아웃은 `src/layouts/Base.astro` 사용
- **폰트 변경**: `src/layouts/Base.astro` 의 `--sans`(본문)와 `--head`(제목) 두 변수. 지금은 둘 다 Noto Sans KR(SIL OFL, 무료)이며 Google Fonts 에서 `wght@400..800` 가변 폰트 한 벌로 받습니다. 굵기를 `400;500;700` 처럼 나열해 받으면 내려받는 파일이 다섯 배가 되니 범위(`..`) 표기를 유지하세요
- **탕전 실적 띠에 한약 종류 추가**: `src/data/decoction-labels.json` — 포탈의 분류를 공개 이름으로 바꾸는 표. 등록된 것만 표시되고 나머지는 버립니다. 자세한 내용은 README 참고
- **`src/data/decoctions.json` 은 사람이 고치지 마세요** — 매일 아침 워크플로가 씁니다

## 콘텐츠 작성 규칙 (GEO)

- **반복되는 문장은 `src/data/clinic.ts` 에 있습니다** — 주소(`address.body` / `address.short`), 초진 안내(`firstVisitNote`), 야간진료(`nightNote`), 복용 중인 약 안내(`currentTreatmentNote`), 대표원장 경력 연수(`leadDoctorYears`). 페이지에 직접 적지 말고 가져다 쓰세요
- **글과 `{식}` 을 다른 줄에 두면 사이 공백이 사라집니다** — `한방병원에서` / 줄바꿈 / `{clinic.leadDoctorYears}` 는 `한방병원에서9년 이상` 으로 나갑니다. 화면은 멀쩡해 보이고 검색엔진만 붙여 읽습니다. 줄 끝에 `{' '}` 를 붙이거나 한 줄에 쓰세요. `npm run check:text` 가 잡습니다
- 제목(H2)은 질문형으로: "추나요법이란 무엇인가요?" — AI 검색 엔진이 인용하기 좋은 형태
- 한 문단에 하나의 주제, 구체적 정보(전화번호, 조건, 위치)를 본문에 직접 포함
- **의료광고법 주의**: 치료 효과 보장("완치", "특효"), 환자 후기, 비교 광고 표현 금지. "~에 사용합니다", "~을 목표로 합니다" 수준으로 작성
- 새 페이지를 만들면 `public/llms.txt`에도 링크 추가

## 자동화 리포트 응답 규칙

- 검색 노출 일일 리포트(`tools/seo-report.py` 기반) 등 예약된 루틴에 응답할 때는 항상 한국어로 작성합니다. 리포트 본문뿐 아니라 세션에 남기는 대화 요약·최종 답변도 한국어를 사용하세요.

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
- `npm run check:decoctions` — 탕전 띠가 세 가지 데이터 상태(비어 있음 / 하루치 / 여러 날)에서 모두 빌드되는지 확인. 티커나 `decoctions.json` 구조를 건드렸으면 실행하세요
- `npm run check:text` — 본문을 고쳤으면 `npm run build` 뒤에 실행하세요. 줄바꿈 때문에 공백이 사라져 단어가 붙는 자리(`한방병원에서9년`), 공백 없는 `<br>`, 35자 넘는 title, 80자 넘는 description, 겹치는 title·H1 을 잡습니다
