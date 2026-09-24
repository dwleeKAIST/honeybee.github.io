#!/usr/bin/env node
// 빌드된 HTML 의 글이 사람이 읽는 대로 뽑히는지 확인합니다.
//
//   npm run build && npm run check:text
//
// 왜 필요한가
//   Astro(JSX) 는 줄 끝과 줄 앞의 줄바꿈 공백을 지웁니다. 그래서
//
//     ...한방병원에서
//     {clinic.leadDoctorYears} 근무했습니다.
//
//   처럼 써 두면 화면에서는 줄이 바뀌어 멀쩡해 보이지만, 실제 HTML 은
//   '한방병원에서9년 이상 근무했습니다' 라는 한 덩어리가 됩니다.
//   <br> 을 앞뒤 공백 없이 쓸 때도 같은 일이 생깁니다. 검색엔진과 AI
//   검색은 이 붙어버린 글자를 읽으므로 화면으로는 절대 못 잡습니다.
//   실제로 같은 실수를 여섯 번 했고, 그때마다 이 검사로 찾았습니다.
//   고치는 방법은 줄 끝에 {' '} 를 붙이는 것입니다.
//
//   태그가 하나라도 사이에 있으면(<strong>제목</strong><span>설명</span>
//   같은 카드) 검색엔진이 거기서 끊어 읽으므로 짚지 않습니다. 태그
//   없이 한 덩어리로 이어진 자리만 봅니다.
//
//   다만 원본에서 글줄 다음 줄이 <strong> 으로 시작하는 자리는 짚습니다.
//   인라인 태그는 앞뒤에 공백을 만들지 않으므로 '시호한의원은초음파로'
//   처럼 화면에서도 붙어 보입니다. 실제로 네 곳 있었습니다.
//
// 아래도 함께 지킵니다.
//   - <title> 이 35자 이내인지 (구글이 그보다 길면 자릅니다)
//   - meta description 이 있고 80자 이내인지 (네이버 권고)
//   - <h1> 이 정확히 한 개인지
//   - 페이지마다 <title> 과 <h1> 이 겹치지 않는지 (같은 검색어를 두
//     페이지가 나눠 가지면 둘 다 밀립니다)
//   - 닫는 따옴표 자리에 여는 따옴표가 찍히지 않았는지

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const src = join(root, 'src');

const TITLE_MAX = 35; // '| 시호한의원'(8자)까지 포함한 길이
const DESC_MAX = 80;

async function filesWithExt(dir, ext) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await filesWithExt(p, ext)));
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

const unescape = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const stripCode = (html) =>
  html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

const plain = (html) => unescape(stripCode(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// 태그 사이의 글 덩어리. 이 안에서 글자가 붙으면 쓸 때 실수한 것입니다.
const textNodes = (html) =>
  stripCode(html)
    .split(/<[^>]+>/)
    .map(unescape);

// 문장부호 바로 뒤에 글자가 붙은 자리. 소수점(21.5)과 자릿수 쉼표
// (1,000)는 뒤가 숫자라 걸리지 않습니다.
const GLUED = /[가-힣a-zA-Z0-9)\]][.,][가-힣a-zA-Z(]/g;

// 닫혀야 할 자리에 찍힌 여는 따옴표. 마크다운의 smartypants 는
// "...할까요?"라는 처럼 물음표 뒤에서 닫는 따옴표를 여는 따옴표로
// 뒤집습니다. 화면으로는 잘 안 보이고 글을 뽑으면 인용이 안 닫힙니다.
// 고치는 방법은 마크다운에 닫는 따옴표(”)를 직접 적는 것입니다.
// 여는 따옴표는 공백·줄 시작·여는 괄호 뒤에만 올 수 있습니다.
const OPEN_QUOTE = /[^\s(\[\u2018]\u201c/g;

const files = await filesWithExt(dist, '.html');
if (files.length === 0) {
  console.error('dist 가 비어 있습니다. npm run build 를 먼저 실행하세요.');
  process.exit(1);
}

const problems = [];
const titles = new Map();
const h1s = new Map();

// ── 1) 원본 .astro — 줄바꿈이 공백을 먹는 자리 ──────────────────
//
// 글과 {식} 이 줄을 달리하면 그 사이 공백이 사라집니다. 어느 쪽이
// 앞인지와 무관하게 붙으므로 두 방향을 모두 봅니다. <style> 안쪽과
// 태그 속성 자리( src={x} 처럼 )는 글이 아니므로 건너뜁니다.
// 태그 안(속성 자리)인지 줄을 넘겨가며 따라갑니다. <img\n  src={x}\n
// alt="..." /> 처럼 여러 줄에 걸친 태그의 속성은 글이 아닙니다.
// 따옴표 안의 < > 와 {식} 안쪽은 세지 않습니다.
function scanTagState(line, state) {
  let { inTag, quote, depth } = state;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = '';
      continue;
    }
    if (depth > 0) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      continue;
    }
    if (ch === '"' || ch === "'") { if (inTag) quote = ch; continue; }
    if (ch === '{') { if (inTag) depth = 1; continue; } // 속성 자리의 {식} 만 셉니다
    if (ch === '<') inTag = true;
    else if (ch === '>') inTag = false;
  }
  return { inTag, quote, depth };
}

for (const f of await filesWithExt(src, '.astro')) {
  const rel = relative(root, f);
  const lines = (await readFile(f, 'utf8')).split('\n');

  // 프런트매터(--- ... ---) 는 자바스크립트이므로 건너뜁니다.
  let start = 0;
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    if (end > 0) start = end + 1;
  }

  let inStyle = false;
  let state = { inTag: false, quote: '', depth: 0 };
  for (let i = start; i < lines.length - 1; i++) {
    const before = state;
    state = scanTagState(lines[i], state);
    if (/<(style|script)\b/.test(lines[i])) inStyle = true;
    if (/<\/(style|script)>/.test(lines[i])) { inStyle = false; continue; }
    if (inStyle) continue;
    // 줄의 시작이나 끝이 태그 속성 자리면 글이 아닙니다.
    if (before.inTag || state.inTag || before.depth > 0 || state.depth > 0) continue;

    const a = lines[i].replace(/\s+$/, '');
    const b = lines[i + 1].replace(/^\s+/, '');
    if (!a || !b) continue;

    const at = (where) =>
      problems.push(
        `${rel}:${i + 1}\n    ${where} — 줄 끝에 {' '} 를 붙이세요` +
          `\n    …${a.trim().slice(-45)}  ⟵붙음⟶  ${b.slice(0, 45)}…`,
      );

    // (가) 글줄 끝 → 다음 줄이 {식} 으로 시작
    if (
      /^\{/.test(b) && !b.startsWith("{' '}") && !b.startsWith('{/*') &&
      /[가-힣0-9a-zA-Z.,·)\]]$/.test(a) && !/[{},]$/.test(a)
    ) at('줄바꿈이 공백을 먹습니다');

    // (나) 줄이 {식} 으로 끝 → 다음 줄이 글자로 시작
    if (
      /\{[^{}]*\}$/.test(a) && !a.endsWith("{' '}") && /^[가-힣0-9a-zA-Z]/.test(b)
    ) at('줄바꿈이 공백을 먹습니다');

    // (다) 글줄 끝 → 다음 줄이 <strong> 같은 인라인 태그로 시작
    //
    //   ...오시는 경우가 많습니다. 시호한의원은
    //   <strong>초음파로 성장판</strong>을 확인합니다.
    //
    // 이렇게 쓰면 '시호한의원은초음파로' 로 나갑니다. (가)·(나)와 원인이
    // 같고, 인라인 태그는 앞뒤에 공백을 만들지 않으므로 화면에서도
    // 붙어 보입니다. 아래 HTML 검사가 태그 경계를 일부러 건너뛰기
    // 때문에 여기서 잡아야 합니다.
    //
    // 문장이 끝난 자리(마침표·쉼표·여는 괄호 뒤)는 짚지 않습니다.
    // 붙어도 티가 나지 않고, 카드처럼 일부러 붙이는 곳이 있습니다.
    if (
      /^<(?:strong|em|b|i|a|span|code)\b/.test(b) &&
      /[가-힣0-9a-zA-Z)\]]$/.test(a) && !/[.,?!:;/(\[{]$/.test(a)
    ) at('인라인 태그 앞의 공백이 사라집니다');
  }
}

// ── 2) 빌드된 HTML ────────────────────────────────────────────

for (const f of files) {
  const url = '/' + relative(dist, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const html = await readFile(f, 'utf8');
  const say = (msg) => problems.push(`${url}\n    ${msg}`);

  for (const node of textNodes(html)) {
    for (const m of node.matchAll(GLUED)) {
      const around = node.slice(Math.max(0, m.index - 35), m.index + 35).replace(/\s+/g, ' ');
      say(`글자가 붙었습니다 — 줄 끝에 {' '} 가 빠졌는지 보세요\n    …${around}…`);
    }
  }

  // 닫는 따옴표 자리에 여는 따옴표가 찍힌 곳
  for (const node of textNodes(html)) {
    for (const m of node.matchAll(OPEN_QUOTE)) {
      const around = node.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ');
      say(`닫는 따옴표 자리에 여는 따옴표(“)가 찍혔습니다 — 마크다운에 ” 를 직접 적으세요\n    …${around}…`);
    }
  }

  // 앞뒤로 공백이 없는 <br>. 화면은 멀쩡해도 글을 뽑으면 단어가 붙습니다.
  for (const m of stripCode(html).matchAll(/(.?)<br\b[^>]*>(.?)/g)) {
    if (/\S/.test(m[1]) && /\S/.test(m[2]) && m[1] !== '>' && m[2] !== '<') {
      say(`<br> 앞뒤에 공백이 없습니다 — …${m[0]}…`);
    }
  }

  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  const t = title ? unescape(title[1]).trim() : '';
  if (!t) say('<title> 이 없습니다');
  else {
    if ([...t].length > TITLE_MAX) say(`<title> ${[...t].length}자 (${TITLE_MAX}자 이내) — ${t}`);
    if (titles.has(t)) say(`<title> 이 ${titles.get(t)} 와 같습니다 — ${t}`);
    else titles.set(t, url);
  }

  const desc = html.match(/<meta name="description" content="([\s\S]*?)"/);
  const d = desc ? unescape(desc[1]).trim() : '';
  if (!d) say('meta description 이 없습니다');
  else if ([...d].length > DESC_MAX) say(`description ${[...d].length}자 (${DESC_MAX}자 이내)`);

  const heads = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => plain(m[1]));
  if (heads.length !== 1) say(`<h1> 이 ${heads.length}개입니다 (1개여야 합니다)`);
  for (const h of heads) {
    if (h1s.has(h)) say(`<h1> 이 ${h1s.get(h)} 와 같습니다 — ${h}`);
    else h1s.set(h, url);
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length}곳\n`);
  for (const p of problems) console.error('  ' + p + '\n');
  process.exit(1);
}
console.log(`✓ ${files.length}개 페이지 — 붙어버린 글자 없음, title·description·h1 정상`);
