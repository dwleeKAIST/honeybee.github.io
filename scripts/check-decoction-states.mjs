#!/usr/bin/env node
// 탕전 티커가 어떤 데이터 상태에서도 빌드되는지 확인합니다.
//
//   node scripts/check-decoction-states.mjs
//
// 왜 필요한가
//   decoctions.json 은 보통 비어 있고, 실적이 들어오면 채워집니다.
//   컴포넌트가 items[0] 을 그냥 읽으면 빈 상태에서 빌드가 깨집니다.
//   실제로 한 번 깨뜨렸습니다(formatDay(undefined) → TypeError).
//   평소 개발 중에는 파일이 비어 있어 채워진 상태를 시험하지 않게 되고,
//   반대로 실적이 들어온 뒤에는 빈 상태를 시험하지 않게 됩니다.
//   그래서 세 상태를 모두 넣어 빌드해 봅니다.
//
// 원본 decoctions.json 은 끝에 반드시 되돌립니다(중간에 실패해도).

import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(root, 'src/data/decoctions.json');
const OUT = join(root, 'dist/index.html');

const states = [
  {
    name: '비어 있음 (데이터를 아직 못 받은 상태)',
    data: { updatedAt: null, activeDays: 0, total: 0, items: [] },
    expectTicker: false,
  },
  {
    name: '조제일 1일',
    data: {
      updatedAt: '2026-09-08T07:00:00+09:00',
      activeDays: 1,
      total: 2,
      items: [{ date: '2026-09-08', label: '비염 한약', count: 2 }],
    },
    expectTicker: true,
    expectPeriod: '9월 8일',
    expectTitle: '최근 조제일 1일',
  },
  {
    // 배포 도중 데이터 파일과 컴포넌트의 버전이 어긋날 수 있습니다.
    // 실제로 워크플로가 예전 형태(windowDays)로 써 둔 파일이 남은 적이
    // 있습니다. 조제일 수를 items 에서 세므로 이 경우에도 맞아야 합니다.
    name: '예전 형태 (activeDays 없이 windowDays)',
    data: {
      updatedAt: '2026-09-08T07:00:00+09:00',
      windowDays: 7,
      total: 3,
      items: [
        { date: '2026-09-08', label: '비염 한약', count: 2 },
        { date: '2026-09-02', label: '소화 한약', count: 1 },
      ],
    },
    expectTicker: true,
    expectPeriod: '9월 2일~9월 8일',
    expectTitle: '최근 조제일 2일',
  },
  {
    name: '조제일 여러 날 (달력으로는 띄엄띄엄)',
    data: {
      updatedAt: '2026-09-08T07:00:00+09:00',
      activeDays: 3,
      total: 4,
      items: [
        { date: '2026-09-08', label: '분골 녹용 보약', count: 2 },
        { date: '2026-09-05', label: '기본 보약', count: 1 },
        { date: '2026-08-26', label: '교통사고 한약', count: 1 },
      ],
    },
    expectTicker: true,
    expectPeriod: '8월 26일~9월 8일',
    expectTitle: '최근 조제일 3일',
  },
];

const original = await readFile(FILE, 'utf-8');
let failed = 0;

try {
  for (const st of states) {
    await writeFile(FILE, JSON.stringify(st.data, null, 2) + '\n');

    const build = spawnSync('npm', ['run', 'build'], {
      cwd: root,
      encoding: 'utf-8',
    });
    if (build.status !== 0) {
      console.error(`✗ ${st.name} — 빌드 실패`);
      console.error((build.stdout + build.stderr).split('\n').slice(-8).join('\n'));
      failed++;
      continue;
    }

    const html = await readFile(OUT, 'utf-8');
    const shown = html.includes('class="ledger"');
    if (shown !== st.expectTicker) {
      console.error(
        `✗ ${st.name} — 티커 표시가 예상과 다릅니다 (예상 ${st.expectTicker}, 실제 ${shown})`,
      );
      failed++;
      continue;
    }

    if (st.expectTitle) {
      const m = html.match(/ledger-title[^>]*>([\s\S]*?)<\/p>/);
      const title = m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '(없음)';
      if (!title.includes(st.expectTitle)) {
        console.error(
          `✗ ${st.name} — 머리글에 '${st.expectTitle}' 이 없습니다 (실제 '${title}')`,
        );
        failed++;
        continue;
      }
    }

    if (st.expectPeriod) {
      const m = html.match(/ledger-time[^>]*>([^<]*)/);
      const period = m ? m[1].trim() : '(없음)';
      if (period !== st.expectPeriod) {
        console.error(
          `✗ ${st.name} — 기간 표기가 다릅니다 (예상 '${st.expectPeriod}', 실제 '${period}')`,
        );
        failed++;
        continue;
      }
    }

    console.log(`✓ ${st.name}`);
  }
} finally {
  await writeFile(FILE, original);
  spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf-8' });
}

if (failed) {
  console.error(`\n${failed}건 실패`);
  process.exit(1);
}
console.log('\n모든 상태 통과');
