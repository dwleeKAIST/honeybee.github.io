// Cloudflare Web Analytics — 방문자 수 측정.
//
// 쿠키를 쓰지 않고 개인정보를 수집하지 않습니다. 봇은 세지 않고 실제 방문자만
// 집계합니다. 이 토큰은 페이지 HTML에 그대로 실리는 공개 값이라 숨길 필요가
// 없습니다. (Cloudflare API 토큰과는 다른 것입니다)
//
// 측정을 끄려면 빈 문자열로 두면 됩니다. 스크립트가 아예 들어가지 않습니다.
//
// 주의: Cloudflare 대시보드에서 자동 주입(Enable / Enable, excluding EU)을
// 함께 켜면 스크립트가 두 번 들어가 방문자가 중복 집계됩니다. 이 파일로
// 넣는 동안에는 대시보드 설정을 'Enable with JS Snippet installation'으로
// 두세요.
export const webAnalyticsToken = 'a54465207ea44ca09dee6ed23d00ea51';
