// 화면 아래 띠 배너로 띄우는 안내. 끝내려면 promo를 null로 바꾸면 됩니다.
//
// - start / end 는 'YYYY-MM-DD' 형식이며 end 당일까지 노출됩니다.
// - 기간이 지나면 빌드 시점에도, 방문 시점에도 표시되지 않습니다.
//   (배포를 다시 하지 않아도 방문자 브라우저에서 날짜를 확인해 사라집니다)
// - image 는 src/lib/img.ts 의 img() 로 찾으므로 확장자를 붙이지 않아도 됩니다.
//   파일이 없으면 배너 자체가 뜨지 않습니다.
export type Promo = {
  /** 방문자가 배너를 닫았는지 구분하는 값. 내용을 바꾸면 이 값도 바꿉니다. */
  id: string;
  /** 띠 배너의 굵은 제목. */
  title: string;
  /** 제목 아래 한 줄. 기간과 핵심 조건만 짧게 적습니다. */
  note: string;
  /** 포스터 이미지. 배너를 누르면 전체가 열립니다. */
  image: string;
  /** 포스터 대체 텍스트(스크린리더용). */
  imageAlt: string;
  start: string;
  end: string;
  /** 포스터 아래에 함께 안내할 페이지. 없으면 링크를 넣지 않습니다. */
  more?: { href: string; label: string };
};

export const promo: Promo | null = {
  id: 'chuseok-2026',
  title: '시호 추석 선물이벤트',
  note: '9월 1일~10월 18일 · 전 제품 보자기 포장 · 배송 무료',
  image: 'event-chuseok-2026',
  imageAlt:
    '시호 추석 선물이벤트 안내. 시호공진단 10환·30환, 녹용경옥고 30포, 관절고 30환 구성과 가격, 전 제품 보자기 포장과 무료 배송, 행사 기간 2026년 9월 1일부터 10월 18일까지, 문의 031-376-1505',
  start: '2026-09-01',
  end: '2026-10-18',
  more: { href: '/gongjindan/', label: '공진단 · 경옥고 안내 보기' },
};
