// public/images/ 에 파일이 있으면 경로를, 없으면 null을 돌려줍니다.
// 사진을 나중에 올려도 되도록, 파일이 없으면 그 자리를 비워 둡니다.
// 빌드는 프로젝트 루트에서 실행되므로 cwd 기준으로 확인합니다.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// 확장자를 신경 쓰지 않아도 되도록, 이름이 같으면 아래 순서로 찾습니다.
const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.JPG', '.JPEG', '.PNG'];

/**
 * 파일명을 확장자 없이 넘기면 알아서 찾습니다.
 *   img('doctors-together')  →  '/images/doctors-together.png' (있는 것)
 * 확장자를 붙여 넘기면 그 파일만 찾습니다.
 */
export function img(name: string): string | null {
  const dir = join(process.cwd(), 'public/images');
  const candidates = /\.[a-zA-Z0-9]+$/.test(name)
    ? [name]
    : EXTS.map((e) => name + e);
  for (const file of candidates) {
    if (existsSync(join(dir, file))) return `/images/${file}`;
  }
  return null;
}

/**
 * 사이트에서 쓰는 사진 이름. 확장자는 적지 않습니다.
 * public/images/ 에 아래 이름으로 올리면 해당 위치에 자동으로 표시됩니다.
 * (jpg · jpeg · png · webp 무엇이든 됩니다)
 */
export const photos = {
  /** 의료진 2인 사진 — 홈 히어로, 의료진 소개 */
  together: 'doctors-together',
  /** 접수 데스크와 대기 공간 — 오시는 길 */
  roomReceptionDesk: 'room-reception',
  /** 진료실 상담 — 의료진 소개 */
  consult: 'consult-room',
  /** 김은미 대표원장 — 인물 사진 */
  kimEunmi: 'doctor-kim-eunmi',
  /** 박종규 진료원장 — 인물 사진 */
  parkJonggyu: 'doctor-park-jonggyu',
  /** 김은미 대표원장 — 이력 카드 이미지 */
  cardKimEunmi: 'profile-kim-eunmi',
  /** 박종규 진료원장 — 이력 카드 이미지 */
  cardParkJonggyu: 'profile-park-jonggyu',
  /** 진료시간표 이미지 — 의료진 소개 */
  schedule: 'schedule',
  /** 월경통 발생 기전 인포그래픽 — 수험생 클리닉 월경통 항목 */
  menstrualMechanism: 'menstrual-pain-mechanism',
  /** 월경통 첩약 건강보험 인포그래픽 — 자주 묻는 질문 */
  menstrualInsurance: 'menstrual-pain-insurance',
  /** 보폐고 제품 사진 — 보폐고 안내. 실제 원내 제품 사진만 올립니다 */
  bopyego: 'product-bopyego',
  /** 사향원방공진단 제품 사진 — 공진단 안내 */
  productGongjindan: 'product-gongjindan-red',
  /** 경옥고 제품 사진 — 공진단 안내 */
  productGyeongokgo: 'product-gyeongokgo-black',
  /** 공진단 포장을 열어 환이 보이는 사진 — 공진단 안내 */
  productGongjindanBox: 'product-gongjindan-box',
  /**
   * 사향 품질보증서와 CITES 인증 사향, 공진단 한 환 — 공진단 안내.
   * ⚠ 사진 안의 안내 카드에 '효과가 탁월', '극대화하는 효과' 같은
   *    문구가 읽힙니다. 원장이 확인한 뒤 그대로 쓰기로 했습니다
   *    (2026-09). 다만 그 문구를 alt 나 본문으로 옮겨 적지 마세요.
   *    사진 속 글자와 달리 사이트가 직접 하는 주장이 됩니다
   *    (의료법 제56조).
   */
  productGongjindanSahyang: 'product-gongjindan-sahyang',
  /** 시호 로고가 인쇄된 다이어트 캡슐 — 한방 다이어트 */
  productDietCapsule: 'product-diet-capsule',

  /* ── 원내 시설 사진 ────────────────────────────────────────
     ⚠ 환자가 찍힌 사진, 이름·처방전·연락처가 보이는 사진은 올리지
        마세요. 의료법 제19조(비밀 누설 금지), 개인정보보호법 제23조.
     올린 것만 표시되고 없는 것은 그 자리가 렌더되지 않습니다. */
  /** 추나 치료실 — 체형교정 · 추나요법 */
  roomChuna: 'room-chuna',
  /** 침 치료실 (커튼으로 나뉜 침대) — 통증 · 교통사고 */
  roomAcupuncture: 'room-acupuncture',
  /** 복도 — 오시는 길 */
  roomHallway: 'room-hallway',
  /** 세면대 — 오시는 길 */
  roomWashstand: 'room-washstand',
  /** 진료실 책상과 서가 — 오시는 길 */
  roomConsultDesk: 'room-consult-desk',
  /** 층 복도에서 본 입구 — 간판과 진료시간 안내판. 오시는 길 */
  roomEntrance: 'room-entrance',
  /** 시호한의원 간판 — 시호는 무슨 뜻인가요 */
  roomSign: 'room-sign',
  /** 인바디와 신장계가 있는 검사·상담 공간 — 소아 진료 */
  roomInbody: 'room-inbody',

  /* ── 진료 장면 사진 ────────────────────────────────────────
     공간 사진(room-*)과 달리 실제 치료 모습입니다.
     ⚠ 환자가 등장하는 사진은 본인 동의를 받은 것만 올려주세요.
        얼굴이나 신체 특징으로 알아볼 수 있으면 개인정보입니다.
     지금 올라와 있는 care-* 사진의 모델은 원장의 동생이며 본인 동의를
     받았습니다(원장 확인, 2026-09). 새 사진을 올릴 때도 같은 확인이
     필요합니다. */
  /** 추나요법 시술 장면 — 체형교정 · 통증 */
  careChuna: 'care-chuna',
  /** 윈백 고주파 온열치료 장면 — 소화 · 월경통 · 통증 */
  careHighfreq: 'care-highfreq',
  /** 메가약침 주입 장치 — 소화 */
  careMegayakchim: 'care-megayakchim',
  /** 복부 초음파로 자궁을 확인하는 장면 — 월경통 */
  careUltrasoundGyn: 'care-ultrasound-gyn',
  /**
   * 원내 탕전실 사진 — 홈 하단 조제 현황 띠.
   * 네 장 모두 올려도 되고 한 장만 올려도 됩니다. 있는 것만 표시됩니다.
   * ⚠ 환자 이름·처방전·연락처가 찍힌 사진은 올리지 마세요.
   *   의료법 제19조(비밀 누설 금지), 개인정보보호법 제23조(민감정보).
   */
  decoctionRoom: 'decoction-room',
  /** 조제탕전실 명패 */
  decoctionSign: 'decoction-sign',
  decoctionWeighing: 'decoction-weighing',
  decoctionBrewing: 'decoction-brewing',
  decoctionPacked: 'decoction-packed',
} as const;
