# 시호한의원 홈페이지

Astro 정적 사이트. 자세한 작업 가이드는 CLAUDE.md 참고.

## 배포 (최초 1회 설정)

1. GitHub에 이 저장소 push
2. Cloudflare Pages → Create project → 저장소 연결
   - Build command: `npm run build`
   - Output directory: `dist`
3. Custom domains에서 `thesiho.kr` 연결 (기존 플랫폼의 DNS 레코드 교체)
4. 배포 후 확인: `/sitemap-index.xml`, `/robots.txt`, `/llms.txt`
