#!/usr/bin/env python3
# check_links.py — GitHub Actions 用リンク死活確認スクリプト
import os
import re
import sys
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TIMEOUT = 15
SKIP_PREFIXES = ('data:', 'javascript:', 'mailto:', 'tel:', '#')

def extract_links(html):
    seen = set()
    for m in re.finditer(r'(?:href|src)="([^"]+)"', html):
        url = m.group(1).strip()
        if any(url.startswith(p) for p in SKIP_PREFIXES):
            continue
        seen.add(url)
    return seen

def check_external(url, cache):
    if url in cache:
        return cache[url]
    headers = {'User-Agent': 'Mozilla/5.0 (link-checker)'}
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            result = (True, r.status)
    except urllib.error.HTTPError as e:
        result = (e.code < 400, e.code)
    except Exception as e:
        result = (False, str(e))
    cache[url] = result
    return result

html_files = sorted(f for f in os.listdir(BASE_DIR) if f.endswith('.html'))
print(f"対象 HTML: {len(html_files)} ファイル\n")

broken = []
cache = {}

for fname in html_files:
    with open(os.path.join(BASE_DIR, fname), encoding='utf-8') as f:
        html = f.read()
    for url in extract_links(html):
        if url.startswith(('http://', 'https://')):
            print(f"  確認中: {url[:70]}", end='\r', flush=True)
            ok, status = check_external(url, cache)
            if not ok:
                broken.append((fname, url, status, '外部'))
        else:
            clean = url.split('?')[0].split('#')[0]
            if not os.path.exists(os.path.join(BASE_DIR, clean)):
                broken.append((fname, url, 'ファイル不在', '内部'))

print()
print('=' * 64)
if not broken:
    print('✅  全リンク OK')
    sys.exit(0)
else:
    print(f'❌  {len(broken)} 件のリンク切れ\n')
    for fname, url, status, kind in broken:
        print(f'  [{kind}] {fname}')
        print(f'    URL   : {url}')
        print(f'    Status: {status}\n')
    print('=' * 64)
    sys.exit(1)
