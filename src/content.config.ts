import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const treatments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/treatments' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(), // 목록/메타 설명에 사용 (1–2문장)
    order: z.number().default(99),
    // 선택. 채우면 페이지 하단에 아코디언으로 표시되고 FAQPage 구조화 데이터가 자동 생성됩니다.
    faqs: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(), // 실제 환자가 검색할 법한 질문형 문장
    category: z.string().default('일반'),
    order: z.number().default(99),
  }),
});

export const collections = { treatments, faq };
