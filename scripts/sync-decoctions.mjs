#!/usr/bin/env node
// 시호 포탈의 탕전 목록을 홈페이지 티커용 집계로 바꿉니다.
// 매일 아침 7시(KST) .github/workflows/sync-decoctions.yml 이 실행합니다.
//
//   사용법
//     node scripts/sync-decoctions.mjs                 (환경변수로 원본 지정)
//     node scripts/sync-decoctions.mjs export.csv      (파일 직접 지정)
//     node scripts/sync-decoctions.mjs --dry-run       (파일을 쓰지 않고 결과만)
//
//   원본 지정 방법 (하나만)
//     SIHO_EXPORT_FILE=/path/to/export.csv
//     SIHO_EXPORT_URL=https://...
//       + SIHO_EXPORT_SECRET  (시호 포탈. x-stats-secret 헤더로 보냅니다)
//       + SIHO_EXPORT_TOKEN   (그 밖의 Bearer 인증)
//
//   시호 포탈 연결
//     SIHO_EXPORT_URL=https://<포탈>/api/public/decoction-stats?days=14
//     SIHO_EXPORT_SECRET=<포탈의 PUBLIC_STATS_SECRET 과 같은 값>
//     응답 { items: [{ date, class, count }] } 을 그대로 읽습니다.
//     class 는 포탈의 '분류'입니다. 처방명이나 약재 구성이 아닙니다.
//
// ── 지켜야 할 원칙 ──────────────────────────────────────────────
// 이 스크립트는 날짜와 처방 종류, 건수만 뽑아냅니다.
// 환자 이름·성별·나이·연락처·차트번호는 읽지도, 쓰지도 않습니다.
// 원본에 그런 열이 있어도 무시합니다. 결과 파일이 그대로 공개되므로,
// 개인을 특정할 수 있는 값이 한 글자도 섞이지 않아야 합니다.
// (의료법 제19조 비밀 누설 금지, 개인정보보호법 제23조 민감정보)
//
// 공개 이름표는 src/data/decoction-labels.json 에 등록된 것만 씁니다.
// 등록되지 않은 처방은 버립니다(fail-closed).
// ───────────────────────────────────────────────────────────────

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LABELS = join(root, 'src/data/decoction-labels.json');
const OUT = join(root, 'src/data/decoctions.json');

/** 티커에 보여줄 기간(일). 이 값만 고치면 됩니다.
 *  포탈 URL 의 ?days= 는 이보다 크거나 같으면 됩니다(넉넉히 받아 걸러냅니다). */
const WINDOW_DAYS = 7;

/** 원본에서 읽을 열 이름 후보. 포탈 내보내기 형식에 맞추어 늘리세요. */
const DATE_KEYS = ['조제일', '조제일자', '일자', '날짜', 'date', '탕전일'];
// 분류(class)를 읽습니다. 포탈의 prescription 은 처방 이름이 아니라
// 약재 구성 전체('황기12 백출8 …')라 쓰지 않습니다.
const KIND_KEYS = ['분류', 'class', 'category'];
const QTY_KEYS = ['수량', '건수', 'qty', 'count'];
// 포탈 응답은 이미 (날짜, 분류)로 묶여 있어 count 가 그날의 건수입니다.

/** 읽지 않을 열. 실수로 들어와도 무시합니다. */
const FORBIDDEN_KEYS = [
  '환자', '환자명', '성명', '이름', '성별', '나이', '생년', '연락처',
  '전화', '휴대', '차트', '주민', 'name', 'patient', 'phone', 'chart',
  // 약재 구성과 자유 입력란
  '처방', 'prescription', '비고', 'bigo', '메모', 'memo',
];

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const fileArg = argv.find((a) => !a.startsWith('--'));

function fail(msg) {
  console.error(`[sync-decoctions] ${msg}`);
  process.exit(1);
}

// ── 원본 읽기 ───────────────────────────────────────────────────
async function loadSource() {
  const file = fileArg || process.env.SIHO_EXPORT_FILE;
  if (file) return { text: await readFile(file, 'utf-8'), from: file };

  const url = process.env.SIHO_EXPORT_URL;
  if (!url) {
    fail(
      '원본을 찾을 수 없습니다. SIHO_EXPORT_FILE 또는 SIHO_EXPORT_URL 을 지정하세요.',
    );
  }
  const headers = { Accept: 'application/json, text/csv' };
  // 시호 포탈은 공유 비밀을 전용 헤더로 받습니다.
  const secret = process.env.SIHO_EXPORT_SECRET;
  if (secret) headers['x-stats-secret'] = secret;
  const token = process.env.SIHO_EXPORT_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    // 상태 코드만으로는 원인을 알기 어려워 본문도 함께 보여줍니다.
    //   503 → 포탈에 PUBLIC_STATS_SECRET / PUBLIC_STATS_CLINIC_ID 가 없음
    //   401 → 양쪽 비밀 값이 다름
    //   500 → 포탈에서 오류. 본문과 Cloud Run 로그를 확인하세요
    const body = await res.text().catch(() => '');
    const hint = body ? ` — ${body.slice(0, 300).replace(/\s+/g, ' ')}` : '';
    fail(`포탈 응답 ${res.status} ${res.statusText}${hint}`);
  }
  return { text: await res.text(), from: url.replace(/\?.*$/, '') };
}

// ── 파싱 ────────────────────────────────────────────────────────
/** 아주 단순한 CSV 파서. 따옴표와 줄바꿈만 처리합니다. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(cell); cell = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = []; cell = '';
      continue;
    }
    cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  if (rows.length < 2) fail('원본에 데이터 행이 없습니다.');

  const head = rows[0].map((h) => h.replace(/^﻿/, '').trim());
  return rows.slice(1).map((r) => {
    const o = {};
    head.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
    return o;
  });
}

function parseSource(text) {
  const t = text.trim();
  if (t.startsWith('[') || t.startsWith('{')) {
    const j = JSON.parse(t);
    const arr = Array.isArray(j) ? j : (j.items ?? j.rows ?? j.data);
    if (!Array.isArray(arr)) fail('JSON 안에서 배열을 찾지 못했습니다.');
    return arr;
  }
  return parseCsv(t);
}

/** 여러 이름 후보 중 실제로 있는 열의 값을 꺼냅니다. */
function pick(row, keys) {
  for (const k of Object.keys(row)) {
    const norm = k.replace(/\s+/g, '').toLowerCase();
    if (keys.some((c) => norm.includes(c.toLowerCase()))) {
      const v = row[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return null;
}

/** 2026-09-07 / 2026.09.07 / 20260907 / 2026/9/7 → 2026-09-07 */
function normalizeDate(raw) {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  const m = raw.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return null;
}

// ── 본 작업 ─────────────────────────────────────────────────────
function kstToday() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function kstNowIso() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${d.toISOString().slice(0, 19)}+09:00`;
}

async function main() {
  const { rules } = JSON.parse(await readFile(LABELS, 'utf-8'));
  const toLabel = (raw) => {
    const s = raw.replace(/\s+/g, '');
    for (const { match, label } of rules) {
      if (s.includes(match.replace(/\s+/g, ''))) return label;
    }
    return null;
  };

  const { text, from } = await loadSource();
  const rows = parseSource(text);

  const today = kstToday();
  const oldest = new Date(Date.parse(`${today}T00:00:00Z`) - (WINDOW_DAYS - 1) * 86400000)
    .toISOString()
    .slice(0, 10);

  const buckets = new Map(); // JSON([date, label]) → { date, label, count }
  const skipped = { noDate: 0, noKind: 0, unmapped: 0, outOfRange: 0 };
  const unmappedKinds = new Set();

  for (const row of rows) {
    const rawDate = pick(row, DATE_KEYS);
    if (!rawDate) { skipped.noDate++; continue; }
    const date = normalizeDate(rawDate);
    if (!date) { skipped.noDate++; continue; }
    if (date < oldest || date > today) { skipped.outOfRange++; continue; }

    const rawKind = pick(row, KIND_KEYS);
    if (!rawKind) { skipped.noKind++; continue; }

    const label = toLabel(rawKind);
    if (!label) { skipped.unmapped++; unmappedKinds.add(rawKind); continue; }

    const qty = Number(pick(row, QTY_KEYS) ?? 1);
    const n = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;

    const key = JSON.stringify([date, label]);
    const hit = buckets.get(key);
    if (hit) hit.count += n;
    else buckets.set(key, { date, label, count: n });
  }

  // 최근 날짜부터, 같은 날은 건수 많은 것부터
  const items = [...buckets.values()].sort((a, b) =>
    a.date === b.date ? b.count - a.count : b.date.localeCompare(a.date),
  );

  const total = items.reduce((s, it) => s + it.count, 0);

  // 안전장치 — 이름표는 우리 표에서 온 것만이어야 합니다.
  const allowed = new Set(rules.map((r) => r.label));
  const bad = items.filter((it) => !allowed.has(it.label));
  if (bad.length) fail(`등록되지 않은 이름표가 섞였습니다: ${bad[0].label}`);

  // 안전장치 — 금지 열이 결과에 흘러들지 않았는지 최종 확인
  const dump = JSON.stringify(items);
  for (const k of FORBIDDEN_KEYS) {
    if (dump.includes(k)) fail(`결과에 '${k}' 가 포함되었습니다. 중단합니다.`);
  }

  // 조제 내역이 없는 날은 파일을 건드리지 않습니다.
  //
  // 휴진일이나 조제가 없던 기간에 '0건'으로 덮어쓰면 티커가 사라집니다.
  // 원장 요청에 따라 그럴 때는 이전 기록을 그대로 두고, 다음에 실적이
  // 생기면 그때 갱신합니다. 티커는 데이터에 담긴 실제 날짜를 표시하므로
  // 오래된 기록이 최신인 것처럼 보이지는 않습니다.
  if (total === 0) {
    console.log(
      '[sync-decoctions] 기간 내 조제 내역이 없습니다. 이전 기록을 그대로 둡니다.',
    );
    return;
  }

  const next = {
    updatedAt: kstNowIso(),
    windowDays: WINDOW_DAYS,
    total,
    items,
  };

  console.log(`[sync-decoctions] 원본: ${from}`);
  console.log(`[sync-decoctions] 행 ${rows.length} → 항목 ${items.length}, 총 ${total}건`);
  console.log(`[sync-decoctions] 건너뜀:`, skipped);
  if (unmappedKinds.size) {
    // 로그(공개 저장소의 Actions 기록)에 원본이 길게 남지 않도록
    // 짧은 값만, 30자까지 자르고, 20종까지만 찍습니다.
    // 분류는 관리 목록에서 고르는 짧은 값이라 이 정도면 충분합니다.
    const shown = [...unmappedKinds]
      .filter((k) => k.length <= 30)
      .slice(0, 20)
      .map((k) => `'${k}'`);
    const hidden = unmappedKinds.size - shown.length;
    console.log(
      `[sync-decoctions] 이름표 미등록 분류 ${unmappedKinds.size}종` +
        (shown.length ? ` — ${shown.join(', ')}` : '') +
        (hidden > 0 ? ` (그 밖에 ${hidden}종은 30자를 넘어 생략)` : ''),
    );
    console.log('  공개하려면 src/data/decoction-labels.json 의 rules 에 추가하세요.');
  }

  if (dryRun) {
    console.log(JSON.stringify(next, null, 2));
    return;
  }

  const prev = await readFile(OUT, 'utf-8').catch(() => '');
  const body = JSON.stringify(next, null, 2) + '\n';
  // updatedAt 만 다른 경우는 변경으로 보지 않습니다(무의미한 커밋 방지).
  const strip = (s) => s.replace(/"updatedAt":[^,]*,/, '');
  if (strip(prev) === strip(body)) {
    console.log('[sync-decoctions] 변경 없음');
    return;
  }
  await writeFile(OUT, body);
  console.log(`[sync-decoctions] ${OUT} 갱신`);
}

main().catch((e) => fail(e.stack ?? String(e)));
