// 사이트 내부 링크를 한곳에서 관리합니다.
// 아직 만들지 않은 페이지는 null로 두세요. 링크가 필요한 자리에서는
// 값이 채워질 때까지 링크를 감추고, 경로가 생기면 자동으로 나타납니다.
export const pages = {
  treatments: '/treatments/',
  faq: '/faq/',
  insuranceHerbs: '/insurance-herbs/',
  doctors: '/doctors/',
  contact: '/contact/',
  /** 수험생 클리닉 — 청소년·수험생 관련 안내를 여기로 연결합니다. */
  studentCare: '/student-care/' as string | null,
  /** 소아 진료 독립 페이지. 만들면 '/pediatrics/' 처럼 경로를 채우세요. */
  pediatrics: null as string | null,
};
