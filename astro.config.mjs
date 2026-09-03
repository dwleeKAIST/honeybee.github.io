import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thesiho.kr',
  integrations: [
    sitemap({
      // 검수 전 페이지는 사이트맵에서 제외합니다 (Base의 noindex와 짝).
      // 검수가 끝나면 이 filter를 지우세요.
      filter: (page) => !page.includes('/student-care/herbal-medicine'),
    }),
  ],
});
