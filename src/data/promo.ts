// 홈 팝업으로 띄우는 안내. 끝내려면 promo를 null로 바꾸면 됩니다.
//
// - start / end 는 'YYYY-MM-DD' 형식이며 end 당일까지 노출됩니다.
// - 기간이 지나면 빌드 시점에도, 방문 시점에도 표시되지 않습니다.
//   (배포를 다시 하지 않아도 방문자 브라우저에서 날짜를 확인해 사라집니다)
// - image 는 src/lib/img.ts 의 img() 로 찾으므로 확장자를 붙이지 않아도 됩니다.
//   파일이 없으면 팝업 자체가 뜨지 않습니다.
export type Promo = {
  /** 방문자가 '오늘 하루 보지 않기'를 눌렀는지 구분하는 값. 내용을 바꾸면 이 값도 바꿉니다. */
  id: string;
  /** 스크린리더와 이미지 대체 텍스트에 쓰입니다. */
  title: string;
  image: string;
  start: string;
  end: string;
  /** 팝업을 눌렀을 때 이동할 페이지. 없으면 이미지만 보여줍니다. */
  href?: string;
};

export const promo: Promo | null = {
  id: 'chuseok-2026',
  title: '시호 추석 선물이벤트 — 2026년 9월 1일부터 10월 18일까지',
  image: 'event-chuseok-2026',
  start: '2026-09-01',
  end: '2026-10-18',
  href: '/gongjindan/',
};
