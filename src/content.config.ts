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

// 건강칼럼 — 원장이 쓰는 글. 파일을 추가하면 목록과 sitemap 에 자동으로
// 들어갑니다. 파일 이름이 주소가 됩니다(student-rhinitis-sleep.md →
// /columns/student-rhinitis-sleep/).
//
// ⚠ 치료 전후 사진과 환자 후기(치료경험담)는 올리지 마세요. 의료법
//    제56조 제2항이 금지합니다. 이 칼럼은 '진료실에서 무엇을 확인하는지'
//    를 설명하는 글이며, 치료 결과를 보여주는 게시판이 아닙니다.
const columns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(), // 글 제목. H1 과 <title> 에 함께 쓰입니다
    summary: z.string(), // 목록과 meta description. 80자 이내로 씁니다
    date: z.coerce.date(), // 발행일 'YYYY-MM-DD'
    author: z.string().default('김은미 대표원장'),
    category: z.string().default('진료 이야기'),
    // 글 끝에 붙는 관련 페이지 링크
    related: z
      .array(z.object({ href: z.string(), label: z.string() }))
      .default([]),
  }),
});

export const collections = { treatments, faq, columns };
