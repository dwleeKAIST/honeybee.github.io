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
// 데이터 상태 외에 아래도 함께 지킵니다.
//   - 제목이 <h2 id="ledger-heading"> 이고 section 이 그것을 가리키는지
//   - 설명문에 조제일 수가 들어가고, '최근 N일간'처럼 달력 기간으로
//     읽히는 문구가 아닌지 (activeDays 는 달력 일수가 아닙니다)
//   - 날짜가 <time datetime="YYYY-MM-DD"> 로 적혀 있는지
//   - 종류별 집계 표가 자바스크립트 없이 HTML 에 들어 있는지
// 검색엔진과 AI 검색이 이 영역을 읽는 지점이라 되돌아가지 않게 막습니다.
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
    expectLead: '최근 1일',
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
    expectLead: '최근 2일',
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
    expectLead: '최근 3일',
  },
];

/** HTML 조각에서 태그를 떼고 공백을 정리합니다. */
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

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

    // 제목은 h2 여야 합니다. 검색엔진이 이 영역의 의미를 잡는 지점이고,
    // 예전에 <p> 였습니다. 되돌아가지 않도록 여기서 지킵니다.
    if (st.expectTicker) {
      if (!/<h2 id="ledger-heading"[^>]*>\s*시호한의원 원내 탕전실/.test(html)) {
        console.error(`✗ ${st.name} — id="ledger-heading" 인 h2 제목이 없습니다`);
        failed++;
        continue;
      }
      if (!/aria-labelledby="ledger-heading"/.test(html)) {
        console.error(`✗ ${st.name} — section 이 h2 를 aria-labelledby 로 가리키지 않습니다`);
        failed++;
        continue;
      }
    }

    if (st.expectLead) {
      const m = html.match(/ledger-lead[^>]*>([\s\S]*?)<\/p>/);
      const lead = m ? text(m[1]) : '(없음)';
      if (!lead.includes(st.expectLead)) {
        console.error(
          `✗ ${st.name} — 설명문에 '${st.expectLead}' 이 없습니다 (실제 '${lead}')`,
        );
        failed++;
        continue;
      }
      // '최근 7일'처럼 달력 기간으로 읽히는 문구를 넣지 않았는지 확인합니다.
      // activeDays 는 조제가 있었던 날의 수라 달력 일수와 다릅니다.
      if (/최근 \d+일간/.test(lead)) {
        console.error(
          `✗ ${st.name} — 설명문에 '최근 N일간'이 있습니다. 조제일 수는 달력 일수가 아닙니다 ('${lead}')`,
        );
        failed++;
        continue;
      }
    }

    if (st.expectPeriod) {
      const m = html.match(/class="ledger-time"[^>]*>([\s\S]*?)<\/p>/);
      // text() 가 태그를 공백으로 바꾸므로 '~' 주변 공백은 지웁니다.
      // 화면에서는 <time>9월 2일</time>~<time>9월 8일</time> 로 붙어 있습니다.
      const period = m ? text(m[1]).replace(/\s*~\s*/g, '~') : '(없음)';
      if (period !== st.expectPeriod) {
        console.error(
          `✗ ${st.name} — 기간 표기가 다릅니다 (예상 '${st.expectPeriod}', 실제 '${period}')`,
        );
        failed++;
        continue;
      }
      // 날짜는 <time datetime> 으로 적혀야 합니다(크롤러가 읽는 지점).
      const iso = st.data.items.map((it) => it.date);
      const missing = [...new Set([iso[0], iso[iso.length - 1]])].filter(
        (d) => !html.includes(`datetime="${d}"`),
      );
      if (missing.length) {
        console.error(
          `✗ ${st.name} — <time datetime> 이 없습니다: ${missing.join(', ')}`,
        );
        failed++;
        continue;
      }
    }

    // 종류별 집계 표. 티커는 날짜별로 흐르므로 종류별 합계는 표로만
    // 읽을 수 있습니다. 자바스크립트 없이 HTML 에 들어 있어야 합니다.
    if (st.expectTicker) {
      const labels = [...new Set(st.data.items.map((it) => it.label))];
      const tbl = html.match(/<details class="ledger-detail"[\s\S]*?<\/details>/);
      const body = tbl ? text(tbl[0]) : '';
      const gone = labels.filter((l) => !body.includes(l));
      if (!tbl || gone.length) {
        console.error(
          `✗ ${st.name} — 종류별 집계 표에 빠진 항목: ${gone.join(', ') || '(표 자체가 없음)'}`,
        );
        failed++;
        continue;
      }
      if (!body.includes(`${st.data.total}건`)) {
        console.error(`✗ ${st.name} — 집계 표에 합계 ${st.data.total}건이 없습니다`);
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
