import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thesiho.kr',
  // /preview/ 아래는 승인 전 시안이라 sitemap 에서 제외합니다.
  // 페이지 자체에도 noindex 를 걸어 둡니다.
  integrations: [sitemap({ filter: (page) => !page.includes('/preview/') })],
});
