# 시호한의원 홈페이지

Astro 정적 사이트. 자세한 작업 가이드는 CLAUDE.md 참고.

## 배포

Cloudflare Workers 정적 자산 방식입니다 (Pages 아님). `wrangler.jsonc` 의
Worker 이름은 `thesiho` 이고, Astro 가 만든 `dist/` 를 그대로 서빙합니다.

- 빌드 명령 `npm run build`, 출력 디렉터리 `dist`, 프로덕션 브랜치 `main`
- main 에 push 하면 2~3분 뒤 thesiho.kr 에 반영됩니다
- 배포 후 확인: `/sitemap-index.xml`, `/robots.txt`, `/llms.txt`

## 탕전 실적 띠 (홈 하단)

"원내 탕전실 · 최근 조제일 7일 · N건" 이라는 흐르는 띠입니다. 숫자는 매일
아침 7시(KST) 에 시호 포탈에서 받아옵니다.

```
포탈 API ──> .github/workflows/sync-decoctions.yml (07:00 KST)
             └─ scripts/sync-decoctions.mjs
                └─ src/data/decoctions.json 갱신 → main 커밋 → 자동 배포
```

| 파일 | 역할 |
| --- | --- |
| `src/components/DecoctionTicker.astro` | 띠. 데이터가 비면 아무것도 렌더하지 않습니다 |
| `src/data/decoctions.json` | 집계 결과. **사람이 직접 고치지 마세요** |
| `src/data/decoction-labels.json` | 포탈의 분류를 공개 이름으로 바꾸는 표 |
| `scripts/sync-decoctions.mjs` | 받아서 집계 |

### 알아둘 점

- **환자 정보는 표시하지 않습니다.** 날짜 · 한약 종류 · 건수만 집계합니다.
  포탈 쪽에서도 환자 이름과 약재 구성은 애초에 내보내지 않습니다
- **이름표에 등록된 분류만 나갑니다.** 등록되지 않은 값은 버립니다.
  예상 못 한 데이터가 그대로 홈페이지에 실리지 않게 하는 장치입니다
- **조제가 없던 날은 갱신하지 않습니다.** 0건으로 덮어써 띠가 사라지지 않도록,
  이전 기록을 그대로 둡니다
- **'조제일 7일' 은 달력 7일이 아닙니다.** 조제 기록이 있는 최근 7일치라
  달력으로는 열흘 넘게 걸칠 수 있습니다. 머리글 옆에 실제 날짜 범위를 적습니다

### 표시할 종류를 추가하려면

`src/data/decoction-labels.json` 의 `rules` 에 한 줄 넣습니다. 규칙은 세 가지
형태이고 위에서부터 먼저 맞는 것을 씁니다.

```json
{ "match": "비염", "label": "비염 한약" }              // 들어 있으면
{ "prefix": "TA", "label": "교통사고 한약" }           // 로 시작하면
{ "pattern": "^[0-9]+-[0-9]+$", "label": "기본 보약" } // 정규식
```

포탈의 드롭다운 목록(`siho_portal` 의 `client/src/tabs/Decoction/decoctionKinds.js`)
과 맞춰야 합니다. 한쪽에만 추가하면 띠에 나타나지 않습니다.

## 원내 사진 올리기

`public/images/` 에 아래 이름으로 올리면 해당 위치에 자동으로 표시됩니다.
파일이 없으면 그 자리가 렌더되지 않으므로, 한 장만 올려도 됩니다.
확장자는 `jpg` · `jpeg` · `png` · `webp` 무엇이든 됩니다.

| 파일 이름 | 사진 | 표시되는 곳 |
| --- | --- | --- |
| `room-chuna` | 추나 치료실 (추나 베드) | 체형교정 |
| `room-acupuncture` | 침 치료실 (커튼으로 나뉜 침대) | 통증 · 교통사고 · 오시는 길 |
| `room-hallway` | 원내 복도 | 오시는 길 |
| `room-consult-desk` | 진료실 (책상 · 서가) | 오시는 길 |
| `room-washstand` | 세면대 | 오시는 길 |
| `product-bopyego` | 보폐고 제품 | 보폐고 |

`room-*` 사진 다섯 장은 오시는 길의 「원내는 어떻게 되어 있나요?」에서
격자로 함께 보이고, 추나·침 치료실은 해당 진료 페이지에도 한 장씩
들어갑니다.

이미 올라와 있는 사진: `doctors-together` `clinic-reception` `consult-room`
`doctor-kim-eunmi` `doctor-park-jonggyu` `profile-*` `schedule`
`ultrasound-*` `menstrual-pain-*` `product-gongjindan-red`
`product-gyeongokgo-black`

⚠ 환자가 찍힌 사진, 환자 이름·처방전·연락처가 보이는 사진은 올리지
마세요. 의료법 제19조(비밀 누설 금지)와 개인정보보호법 제23조(민감정보)에
걸립니다.

### 원내 탕전실 사진 (선택)

띠 안에 원내 탕전실 사진을 넣을 수 있습니다. `public/images/` 에 아래
이름으로 올리면 그 사진만 표시되고, 없으면 사진 영역 자체가 나오지
않습니다. 네 장 중 한 장만 올려도 됩니다.

| 파일 이름 | 내용 |
| --- | --- |
| `decoction-room` | 탕전실 전경 |
| `decoction-weighing` | 약재 계량·조제 |
| `decoction-brewing` | 탕전 과정 |
| `decoction-packed` | 조제를 마친 한약 |

확장자는 `jpg` · `jpeg` · `png` · `webp` 무엇이든 됩니다.

⚠ 환자 이름·처방전·연락처가 찍힌 사진은 올리지 마세요. 의료법
제19조(비밀 누설 금지)와 개인정보보호법 제23조(민감정보)에 걸립니다.

### 처음 켤 때

Actions 시크릿 두 개가 필요합니다. 없으면 워크플로가 아무 일도 하지 않습니다.

```
SIHO_EXPORT_URL     https://<포탈 주소>/api/public/decoction-stats?days=60
SIHO_EXPORT_SECRET  포탈의 PUBLIC_STATS_SECRET 과 같은 값
```

`Settings → Actions → General → Workflow permissions` 을 **Read and write** 로
두어야 합니다. 워크플로가 `decoctions.json` 을 main 에 커밋하기 때문입니다.

바로 확인하려면 `Actions → 탕전 실적 갱신 → Run workflow`.
