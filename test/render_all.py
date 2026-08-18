#!/usr/bin/env python3
"""重新渲染全部 57 张海报 PNG（en/zh），复制 poster.png，并跑几何检查。"""
import glob, os, sys, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_check import run_one, assess
from playwright.sync_api import sync_playwright

posts = sorted(glob.glob('public/posters/*/*/poster.html'))
print(f'{len(posts)} posters to render')
fails_total = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    for i, f in enumerate(posts, 1):
        poster = os.path.abspath(f)
        d = os.path.dirname(poster)
        url = 'file:///' + poster.replace('\\', '/')
        statuses = []
        for lg in ('en', 'zh'):
            png_out = os.path.join(d, f'poster_{lg}.png')
            res = run_one(page, f'{url}?lang={lg}', png_out, 1920, 1080)
            fails = assess(res, 1920, 1080)
            statuses.append('OK' if not fails else 'FAIL')
            for fl in fails:
                fails_total.append(f'{f.split("posters")[1]}[{lg}] {fl}')
        shutil.copy(os.path.join(d, 'poster_en.png'), os.path.join(d, 'poster.png'))
        print(f'[{i}/{len(posts)}] {" ".join(statuses)} {f.split("posters")[1]}')
    browser.close()
print(f'\n=== {len(fails_total)} failures ===')
for fl in fails_total[:40]:
    print('  ', fl)
