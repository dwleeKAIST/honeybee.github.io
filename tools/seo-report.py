#!/usr/bin/env python3
"""시호한의원 검색 노출 측정.

두 축을 봅니다.
  1. 사람이 직접 검색 — 네이버 플레이스 순위, 네이버 웹문서 순위/페이지
  2. AI 검색 준비 상태 — 크롤러 접근, llms.txt·사이트맵, 구조화 데이터

AI 답변에 인용되는지 자체는 이 스크립트로 알 수 없습니다.
루틴에서 WebSearch로 별도 확인합니다.

사용:
  python3 tools/seo-report.py           표 출력
  python3 tools/seo-report.py --json    JSON 출력 (히스토리 적재용)
"""
import json, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126 Safari/537.36')
CLINIC = '시호한의원'
DOMAIN = 'thesiho.kr'
PER_PAGE = 15
MAX_PAGES = 4          # 웹문서 4페이지(60위)까지

KEYWORDS = [
    '동탄 한의원', '동탄 목동 한의원',
    '동탄 교통사고 추나', '동탄 수험생 보약', '동탄 한약', '동탄 공진단',
    '동탄 경옥고', '동탄 피부미용 한의원', '동탄 초음파약침', '동탄 매선',
    '동탄 체형교정', '동탄 다이어트 한의원',
    '초음파약침', '매선', '공진단',          # 비지역 — 경쟁 강도 참고
]

AI_BOTS = ['GPTBot/1.2', 'ClaudeBot/1.0', 'PerplexityBot/1.0',
           'OAI-SearchBot/1.0', 'Google-Extended']


def get(url, ua=UA, timeout=30):
    req = urllib.request.Request(url, headers={
        'User-Agent': ua, 'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.naver.com/'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read().decode('utf-8', 'replace')


def place_rank(html):
    """플레이스 블록 내 순위. (순위 or None, 표시된 업체 목록)"""
    txt = re.sub(r'<script.*?</script>', '', html, flags=re.S)
    txt = re.sub(r'<[^>]+>', '\n', txt)
    seq = []
    for line in txt.split('\n'):
        line = line.strip()
        m = re.fullmatch(r'([가-힣A-Za-z0-9\s]{2,20}(?:한의원|한방병원))', line)
        if m:
            n = m.group(1).strip()
            if not seq or seq[-1] != n:
                seq.append(n)
    rank = seq.index(CLINIC) + 1 if CLINIC in seq else None
    return rank, seq


def site_rank(keyword):
    """웹문서 탭에서 thesiho.kr 순위와 페이지."""
    for page in range(1, MAX_PAGES + 1):
        start = (page - 1) * PER_PAGE + 1
        url = ('https://search.naver.com/search.naver?where=web'
               f'&query={urllib.parse.quote(keyword)}&start={start}')
        try:
            _, html = get(url)
        except Exception:
            return None, None
        hosts, seen = [], set()
        for h in re.findall(r'https?://([a-z0-9.-]+)', html):
            if h.endswith(('naver.com', 'pstatic.net', 'w3.org', 'naver.net')):
                continue
            if h not in seen:
                seen.add(h); hosts.append(h)
        for i, h in enumerate(hosts, 1):
            if DOMAIN in h:
                return (page - 1) * PER_PAGE + i, page
        time.sleep(1.2)
    return None, None


def ai_readiness():
    r = {'bots': {}, 'files': {}, 'schema': []}
    for bot in AI_BOTS:
        try:
            code, _ = get(f'https://{DOMAIN}/', ua=bot, timeout=25)
        except Exception:
            code = 0
        r['bots'][bot.split('/')[0]] = code
    for p in ['/llms.txt', '/robots.txt', '/sitemap-index.xml']:
        try:
            code, _ = get(f'https://{DOMAIN}{p}', ua='ClaudeBot/1.0', timeout=25)
        except Exception:
            code = 0
        r['files'][p] = code
    try:
        _, html = get(f'https://{DOMAIN}/faq/', timeout=25)
        r['schema'] = sorted(set(re.findall(r'"@type":"([A-Za-z]+)"', html)))
    except Exception:
        pass
    try:
        _, sm = get(f'https://{DOMAIN}/sitemap-0.xml', timeout=25)
        r['sitemap_urls'] = len(re.findall(r'<loc>', sm))
    except Exception:
        r['sitemap_urls'] = 0
    return r


def main():
    kst = datetime.now(timezone(timedelta(hours=9)))
    rows = []
    for kw in KEYWORDS:
        try:
            _, html = get('https://search.naver.com/search.naver?'
                          f'query={urllib.parse.quote(kw)}')
        except Exception as e:
            rows.append({'keyword': kw, 'error': str(e)[:60]}); continue
        pr, seq = place_rank(html)
        sr, sp = site_rank(kw)
        rows.append({'keyword': kw, 'place_rank': pr, 'place_listed': len(seq),
                     'top3': seq[:3], 'site_rank': sr, 'site_page': sp})
        time.sleep(1.5)

    result = {'date': kst.strftime('%Y-%m-%d'), 'time': kst.strftime('%H:%M KST'),
              'keywords': rows, 'ai': ai_readiness()}

    if '--json' in sys.argv:
        print(json.dumps(result, ensure_ascii=False)); return

    print(f'시호한의원 검색 노출 — {result["date"]} {result["time"]}\n')
    print(f'{"키워드":24} {"플레이스":>9} {"웹사이트":>12}  상위 3곳')
    print('-' * 100)
    for r in rows:
        if 'error' in r:
            print(f'{r["keyword"]:24} {"조회실패":>9}'); continue
        p = f'{r["place_rank"]}위' if r['place_rank'] else '미노출'
        s = f'{r["site_rank"]}위 ({r["site_page"]}p)' if r['site_rank'] else '미노출'
        print(f'{r["keyword"]:24} {p:>9} {s:>12}  {", ".join(r["top3"])}')
    ai = result['ai']
    print(f'\nAI 크롤러 접근: ' + ', '.join(f'{k} {v}' for k, v in ai['bots'].items()))
    print(f'참고 파일      : ' + ', '.join(f'{k} {v}' for k, v in ai['files'].items()))
    print(f'구조화 데이터  : {", ".join(ai["schema"])}')
    print(f'사이트맵 URL   : {ai["sitemap_urls"]}개')


if __name__ == '__main__':
    main()
