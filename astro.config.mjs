import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thesiho.kr',
  integrations: [
    sitemap({
      // 작성 중인 페이지는 사이트맵에서 제외합니다 (Base의 noindex와 짝).
      // 본문이 완성되면 이 filter를 지우세요.
      filter: (page) => !page.includes('/student-care'),
    }),
  ],
});
