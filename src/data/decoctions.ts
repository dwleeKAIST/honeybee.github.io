// 원내 탕전실 조제 실적 — 홈 하단 티커에 씁니다.
//
// 값은 scripts/sync-decoctions.mjs 가 매일 아침 decoctions.json 에 씁니다.
// 사람이 직접 고치지 마세요. 표시할 이름표는 decoction-labels.ts 에 있습니다.
//
// ⚠ 환자 이름·성별·나이·연락처는 이 파일에 절대 들어오지 않습니다.
// 날짜 + 공개 이름표 + 건수만 담습니다. 개인을 특정할 수 있는 정보를
// 공개하면 의료법 제19조(비밀 누설 금지)와 개인정보보호법 제23조
// (민감정보)에 걸립니다. 이름을 마스킹해도(예: 이O욱) 날짜와 처방이
// 함께 있으면 지인은 특정할 수 있어 안전하지 않습니다.
import raw from './decoctions.json';

export interface DecoctionItem {
  /** YYYY-MM-DD */
  date: string;
  /** decoction-labels.ts 의 공개 이름표 */
  label: string;
  /** 같은 날 같은 이름표의 건수 */
  count: number;
}

export interface Decoctions {
  /** 마지막 갱신 시각(ISO, KST). 아직 한 번도 못 받았으면 null */
  updatedAt: string | null;
  /**
   * 담겨 있는 '조제가 있던 날'의 수. 달력 날짜가 아닙니다.
   * 휴진일은 세지 않으므로 달력으로는 이보다 길게 걸칠 수 있습니다.
   */
  activeDays: number;
  /** 담겨 있는 총 건수 */
  total: number;
  items: DecoctionItem[];
}

export const decoctions = raw as Decoctions;

/** 데이터가 실제로 들어왔는지. 비어 있으면 티커를 아예 렌더하지 않습니다. */
export const hasDecoctions =
  decoctions.total > 0 && decoctions.items.length > 0;

/** '9월 7일' 형태로. */
export function formatDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}
