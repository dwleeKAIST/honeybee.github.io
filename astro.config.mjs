import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thesiho.kr',
  integrations: [
    // 원장 검수 대기 중인 페이지는 사이트맵에서 제외합니다. 공개 시 filter를 지우세요.
    sitemap({ filter: (page) => !page.includes("/posture") }),
  ],
});
