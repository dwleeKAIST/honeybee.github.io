#!/usr/bin/env python3
"""rank-history.jsonl 을 읽어 순위 추이 차트와 이 브랜치의 README 를 다시 그립니다.

매일 아침 루틴이 측정값을 한 줄 append 한 뒤 실행합니다.

  python3 render-readme.py

내보내는 것
  charts/place.svg   네이버 플레이스 순위 추이 (키워드별 작은 그래프)
  charts/site.svg    네이버 웹문서 순위 추이
  README.md          위 두 장 + 최근 측정값 표

차트는 GitHub 이 <img> 로 읽습니다. 그래서 색은 밝은 테마 값을 속성으로
직접 박고, 어두운 테마는 <style> 안의 미디어 쿼리로만 덮습니다. 혹시
스타일이 걸러지더라도 밝은 테마 그림은 그대로 나옵니다.
"""
import json
import os

HISTORY = 'rank-history.jsonl'
CHART_DIR = 'charts'
WINDOW_DAYS = 30        # 차트에 그릴 최근 일수

# 밝은 테마 → 어두운 테마
INK, INK_D = '#0b0b0b', '#ffffff'
INK2, INK2_D = '#52514e', '#c3c2b7'
MUTED = '#898781'
GRID, GRID_D = '#e1e0d9', '#2c2c2a'
AXIS, AXIS_D = '#c3c2b7', '#383835'
SURF, SURF_D = '#fcfcfb', '#1a1a19'
GOOD, GOOD_D = '#006300', '#0ca30c'
BAD = '#d03b3b'
PLACE, PLACE_D = '#2a78d6', '#3987e5'    # 카테고리 1번 슬롯
SITE, SITE_D = '#eb6834', '#d95926'      # 카테고리 2번 슬롯

FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif"

COLS = 3
PW, PLOT_H = 236, 76
TITLE_H, LANE_GAP, LANE_H, XLAB_H = 24, 7, 9, 16
PANEL_H = TITLE_H + PLOT_H + LANE_GAP + LANE_H + XLAB_H
GAP_X, GAP_Y = 32, 18
M_L, M_R, M_T, M_B = 42, 20, 62, 14
TITLE_X = 20


def load():
    days = []
    with open(HISTORY, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                days.append(json.loads(line))
    return days


def rows(day):
    return {r['keyword']: r for r in day['keywords']}


def value(row, field):
    """측정 실패(error)와 미노출(null)은 둘 다 값 없음으로 봅니다."""
    return None if row is None or 'error' in row else row.get(field)


def keywords_in_order(days):
    order = []
    for d in days:
        for r in d['keywords']:
            if r['keyword'] not in order:
                order.append(r['keyword'])
    return order


def series(days, field):
    """[(키워드, [값 or None ...])] — 한 번이라도 잡힌 키워드만."""
    out = []
    for kw in keywords_in_order(days):
        vals = [value(rows(d).get(kw), field) for d in days]
        if any(v is not None for v in vals):
            out.append((kw, vals))
    return out


def domain(vals):
    """칸마다 제 눈금을 씁니다. 순위 폭이 키워드별로 너무 달라 공통 눈금을
    쓰면 1페이지권 키워드의 움직임이 보이지 않습니다."""
    v = [x for x in vals if x is not None]
    lo, hi = max(1, min(v) - 1), max(v) + 1
    return lo, max(hi, lo + 5)       # 평평한 선을 확대해 과장하지 않도록


def ticks(lo, hi):
    if hi - lo >= 10:
        mid = round((lo + hi) / 10) * 5
        if lo < mid < hi:
            return [lo, mid, hi]
    return [lo, hi]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def delta(cur, prev):
    """순위는 숫자가 작을수록 좋습니다. (표시문자, 색 or None)"""
    if cur is None and prev is None:
        return '·', None
    if cur is None:
        return '이탈', BAD
    if prev is None:
        return '신규', GOOD
    d = prev - cur
    if d == 0:
        return '–', None
    return (f'▲{d}', GOOD) if d > 0 else (f'▼{-d}', BAD)


def figure(title, note, data, dates, color, color_d):
    """키워드별 작은 그래프를 격자로 늘어놓은 SVG 한 장."""
    n = len(data)
    rows_n = (n + COLS - 1) // COLS
    W = M_L + COLS * PW + (COLS - 1) * GAP_X + M_R
    H = M_T + rows_n * PANEL_H + (rows_n - 1) * GAP_Y + M_B
    nd = len(dates)

    def x(i):
        return 0 if nd < 2 else i * PW / (nd - 1)

    o = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" font-family="{FONT}" role="img" '
        f'aria-label="{esc(title)}">',
        '<style>@media (prefers-color-scheme: dark){'
        f'.s{{fill:{SURF_D}}}.t1{{fill:{INK_D}}}.t2{{fill:{INK2_D}}}'
        f'.g{{stroke:{GRID_D}}}.ax{{stroke:{AXIS_D}}}'
        f'.k{{stroke:{color_d}}}.kf{{fill:{color_d}}}.r{{stroke:{SURF_D}}}'
        f'.up{{fill:{GOOD_D}}}}}</style>',
        f'<rect class="s" width="{W}" height="{H}" rx="10" fill="{SURF}"/>',
        f'<text class="t1" x="{TITLE_X}" y="30" font-size="15" '
        f'font-weight="600" fill="{INK}">{esc(title)}</text>',
        f'<text class="t2" x="{TITLE_X}" y="48" font-size="11" '
        f'fill="{INK2}">{esc(note)}</text>',
    ]

    for i, (kw, vals) in enumerate(data):
        col, row = i % COLS, i // COLS
        px = M_L + col * (PW + GAP_X)
        py = M_T + row * (PANEL_H + GAP_Y)
        top = py + TITLE_H                     # 그래프 윗변 (그 칸의 최상위)
        bot = top + PLOT_H
        lane = bot + LANE_GAP
        first_col = col == 0
        last_row = i + COLS >= len(data)
        lo, hi = domain(vals)

        def y(v, top=top, lo=lo, hi=hi):
            return top + (v - lo) / (hi - lo) * PLOT_H

        o.append(f'<text class="t1" x="{px}" y="{py + 13}" font-size="12" '
                 f'font-weight="600" fill="{INK}">{esc(kw)}</text>')

        cur = vals[-1]
        prev = vals[-2] if len(vals) > 1 else None
        txt, dc = delta(cur, prev)
        head = f'{cur}위' if cur is not None else '미노출'
        # 무채색(MUTED)과 빨강(BAD)은 두 테마가 같은 값이라 클래스를 걸지 않습니다
        hc = ' class="t1"' if cur is not None else ''
        dcls = ' class="up"' if dc == GOOD else ''
        o.append(
            f'<text x="{px + PW}" y="{py + 13}" font-size="12" '
            f'text-anchor="end" style="font-variant-numeric:tabular-nums">'
            f'<tspan{hc} fill="{INK if cur is not None else MUTED}">{head}</tspan>'
            f'<tspan{dcls} dx="5" fill="{dc or MUTED}">{txt}</tspan></text>')

        for v in ticks(lo, hi):
            gy = y(v)
            o.append(f'<line class="g" x1="{px}" y1="{gy:.1f}" '
                     f'x2="{px + PW}" y2="{gy:.1f}" stroke="{GRID}" '
                     f'stroke-width="1"/>')
            o.append(f'<text x="{px - 7}" y="{gy + 3.5:.1f}" '
                     f'font-size="10" text-anchor="end" fill="{MUTED}" '
                     f'style="font-variant-numeric:tabular-nums">{v}</text>')

        o.append(f'<line class="ax" x1="{px}" y1="{bot}" x2="{px + PW}" '
                 f'y2="{bot}" stroke="{AXIS}" stroke-width="1"/>')

        run = []
        for j, v in enumerate(vals):
            if v is None:
                o.append(f'<rect x="{px + x(j) - 2:.1f}" y="{lane + 2}" '
                         f'width="4" height="4" rx="1" fill="{MUTED}"/>')
                if len(run) > 1:
                    o.append(path(run, color))
                elif len(run) == 1:
                    o.append(f'<circle class="kf" cx="{run[0][0]:.1f}" '
                             f'cy="{run[0][1]:.1f}" r="2.5" fill="{color}"/>')
                run = []
            else:
                run.append((px + x(j), y(v)))
        if len(run) > 1:
            o.append(path(run, color))
        elif len(run) == 1:
            o.append(f'<circle class="kf" cx="{run[0][0]:.1f}" '
                     f'cy="{run[0][1]:.1f}" r="2.5" fill="{color}"/>')

        if vals[-1] is not None:
            cx, cy = px + x(nd - 1), y(vals[-1])
            o.append(f'<circle class="r" cx="{cx:.1f}" cy="{cy:.1f}" r="4" '
                     f'fill="none" stroke="{SURF}" stroke-width="2"/>')
            o.append(f'<circle class="kf" cx="{cx:.1f}" cy="{cy:.1f}" r="4" '
                     f'fill="{color}"/>')

        if first_col:
            o.append(f'<text x="{px - 9}" y="{lane + 8}" '
                     f'font-size="9" text-anchor="end" fill="{MUTED}">미노출</text>')

        if last_row:
            for j in xlabels(nd):
                o.append(
                    f'<text x="{px + x(j):.1f}" '
                    f'y="{lane + LANE_H + 13}" font-size="9" fill="{MUTED}" '
                    f'text-anchor="{anchor(j, nd)}" '
                    f'style="font-variant-numeric:tabular-nums">'
                    f'{dates[j][5:]}</text>')

    o.append('</svg>')
    return '\n'.join(o)


def path(pts, color):
    d = 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in pts)
    return (f'<path class="k" d="{d}" fill="none" stroke="{color}" '
            f'stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>')


def xlabels(nd):
    if nd <= 4:
        return list(range(nd))
    return sorted({0, nd // 3, 2 * nd // 3, nd - 1})


def anchor(j, nd):
    return 'start' if j == 0 else ('end' if j == nd - 1 else 'middle')


def readme(days):
    last, prev = days[-1], days[-2] if len(days) > 1 else None
    cur_rows, prev_rows = rows(last), rows(prev) if prev else {}
    lines = [
        '# 검색 노출 히스토리',
        '',
        '시호한의원([thesiho.kr](https://thesiho.kr)) 의 네이버 검색 노출을 매일',
        '아침 측정해 쌓아 둔 브랜치입니다. 측정은 main 의 `tools/seo-report.py`,',
        '이 문서와 차트는 `render-readme.py` 가 자동으로 그립니다.',
        '',
        '> **데이터 전용 브랜치입니다. main 에 머지하지 마세요.**',
        '> README 와 `charts/` 는 매일 다시 쓰이므로 직접 고쳐도 다음 날 덮어써집니다.',
        '',
        f'측정 {len(days)}일 · {days[0]["date"]} ~ {last["date"]} · '
        f'마지막 갱신 {last["date"]} {last["time"]}',
        '',
        '## 네이버 플레이스 순위',
        '',
        f'![키워드별 네이버 플레이스 순위 추이]({CHART_DIR}/place.svg)',
        '',
        '## 네이버 웹문서 순위',
        '',
        f'![키워드별 네이버 웹문서 순위 추이]({CHART_DIR}/site.svg)',
        '',
        f'## 최근 측정값 — {last["date"]}',
        '',
        '| 키워드 | 플레이스 | 전일 | 웹문서 | 전일 |',
        '| --- | ---: | :---: | ---: | :---: |',
    ]
    for kw in keywords_in_order(days):
        c, p = cur_rows.get(kw), prev_rows.get(kw)
        if c is None:
            continue
        if 'error' in c:
            lines.append(f'| {kw} | 측정실패 | · | 측정실패 | · |')
            continue
        pr, sr = c.get('place_rank'), c.get('site_rank')
        pd = delta(pr, value(p, 'place_rank'))[0]
        sd = delta(sr, value(p, 'site_rank'))[0]
        place = f'{pr}위' if pr else f'미노출 ({c.get("place_listed", 0)}곳 중)'
        site = f'{sr}위 · {c.get("site_page")}p' if sr else '미노출'
        lines.append(f'| {kw} | {place} | {pd} | {site} | {sd} |')

    ai = last.get('ai', {})
    bots, files = ai.get('bots', {}), ai.get('files', {})
    bad = ([f'{k} {v}' for k, v in bots.items() if v != 200]
           + [f'{k} {v}' for k, v in files.items() if v != 200])
    lines += [
        '',
        '## AI 크롤러 · 색인 파일',
        '',
        (f'⚠ 응답 이상: {", ".join(bad)}' if bad else
         f'크롤러 {len(bots)}종({", ".join(bots)}) 과 '
         f'{", ".join(files)} 모두 200 정상.'),
        '',
        f'구조화 데이터 `{"`, `".join(ai.get("schema", []))}` · '
        f'사이트맵 {ai.get("sitemap_urls", 0)}개 URL',
        '',
        '## 파일',
        '',
        '| 파일 | 내용 |',
        '| --- | --- |',
        '| `rank-history.jsonl` | 하루 한 줄. 측정 원본이라 **사람이 고치지 마세요** |',
        '| `render-readme.py` | 이 README 와 `charts/*.svg` 생성기 |',
        '',
        '차트는 최근 ' + str(WINDOW_DAYS) + '일만 그립니다. 선이 끊긴 구간과 아래 띠의',
        '점은 그날 순위에 잡히지 않았거나(미노출) 측정이 실패한 날입니다.',
        '',
    ]
    return '\n'.join(lines)


def main():
    days = load()
    if not days:
        raise SystemExit('rank-history.jsonl 이 비어 있습니다')
    win = days[-WINDOW_DAYS:]
    dates = [d['date'] for d in win]
    os.makedirs(CHART_DIR, exist_ok=True)

    note = (f'{dates[0]} ~ {dates[-1]} ({len(dates)}일) · 위로 갈수록 상위 · '
            f'칸마다 세로 눈금이 다릅니다 · 끊긴 구간은 미노출')
    for name, field, title, c, cd in [
        ('place', 'place_rank', '네이버 플레이스 순위', PLACE, PLACE_D),
        ('site', 'site_rank', '네이버 웹문서 순위', SITE, SITE_D),
    ]:
        data = series(win, field)
        if not data:
            continue
        with open(f'{CHART_DIR}/{name}.svg', 'w', encoding='utf-8') as f:
            f.write(figure(title, note, data, dates, c, cd))

    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme(days))
    print(f'{len(days)}일치 → README.md, {CHART_DIR}/place.svg, {CHART_DIR}/site.svg')


if __name__ == '__main__':
    main()
