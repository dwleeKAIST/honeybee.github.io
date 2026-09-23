// 글 날짜는 언제나 한국 시간으로 보여 줍니다.
//
// 빌드 서버(Cloudflare, GitHub Actions)는 UTC 로 돕니다. Date 의
// getFullYear()/getMonth()/getDate() 는 서버 시간대를 따르므로,
// 새벽에 올린 글은 표시 날짜가 하루 밀립니다. Intl 로 시간대를
// 못 박아 두면 어디서 빌드해도 같은 날짜가 나옵니다.

const KST = 'Asia/Seoul';

// en-CA 로케일은 YYYY-MM-DD 로 찍어 줍니다.
const ymd = new Intl.DateTimeFormat('en-CA', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** <time datetime="..."> 와 구조화 데이터에 쓰는 2026-09-23 형태 */
export const isoDate = (d: Date) => ymd.format(d);

/** 화면에 보여 주는 2026년 9월 23일 형태 */
export const koreanDate = (d: Date) => {
  const [y, m, day] = ymd.format(d).split('-');
  return `${Number(y)}년 ${Number(m)}월 ${Number(day)}일`;
};
