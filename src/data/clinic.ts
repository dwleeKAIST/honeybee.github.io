// 한의원 기본 정보 — 이 파일만 수정하면 전 페이지와 구조화 데이터에 반영됩니다.
export const clinic = {
  name: '시호한의원',
  nameEn: 'SIHO Korean Medicine Clinic',
  slogan: '더 건강한 내일을 만드는 치유의 공간',
  // 구조화 데이터(JSON-LD)와 llms.txt용. 길어도 무방하며 정보가 많은 편이 유리합니다.
  description:
    '경기 화성시 동탄에 위치한 시호한의원입니다. 추나, 도침, 약침, 매선 치료와 소화불량·불면·피로·스트레스 진료, 수험생·갱년기·다이어트·소아한약 클리닉을 운영합니다.',
  // 검색결과에 표시되는 meta description용. 네이버가 80자 이내를 권고합니다.
  metaDescription:
    '경기 화성시 동탄 시호한의원. 추나·도침·약침·매선과 소화·불면·피로 진료, 수험생·갱년기 클리닉을 운영합니다.',
  phone: '031-376-1505',
  phoneIntl: '+82-31-376-1505',
  address: {
    full: '경기 화성시 동탄신리천로 407 동탄리더스타워 2층 204~206호',
    street: '동탄신리천로 407, 동탄리더스타워 2층 204~206호',
    city: '화성시',
    region: '경기도',
    postalCode: '',
    country: 'KR',
  },
  links: {
    kakaoMap: 'https://place.map.kakao.com/1899651443',
    naverMap: 'https://naver.me/Fyn3KnhN',
    tMap: 'https://tmap.life/fc669a1f',
    googleMap: 'https://maps.app.goo.gl/kSMzv5j38YLKJhce7',
    kakaoChannel: 'http://pf.kakao.com/_LxdhFG',
    naverBooking: 'http://naver.me/GgBsC8Nk',
  },
  // 진료시간 — 출처: 네이버 플레이스(시호한의원) 등록 정보
  // schema는 schema.org openingHours 형식. 점심시간은 두 구간으로 분리해 표기합니다.
  hours: [
    {
      days: '월·화·목',
      open: '09:30',
      close: '20:00',
      lunch: '12:30–14:00',
      schema: ['Mo,Tu,Th 09:30-12:30', 'Mo,Tu,Th 14:00-20:00'],
    },
    {
      days: '수',
      open: '09:30',
      close: '21:00',
      lunch: '12:30–14:00',
      note: '야간진료',
      schema: ['We 09:30-12:30', 'We 14:00-21:00'],
    },
    {
      days: '금',
      open: '09:30',
      close: '20:00',
      lunch: '12:30–14:20',
      schema: ['Fr 09:30-12:30', 'Fr 14:20-20:00'],
    },
    {
      days: '토',
      open: '09:30',
      close: '14:00',
      note: '점심시간 없이 진료',
      schema: ['Sa 09:30-14:00'],
    },
  ] as {
    days: string;
    open: string;
    close: string;
    lunch?: string;
    note?: string;
    schema: string[];
  }[],
  // 휴진일 — 접수 마감은 진료 종료 30분 전입니다.
  closedDays: '일요일 정기휴무 · 공휴일 휴진',
  lastReception: '접수 마감은 진료 종료 30분 전입니다.',
};
