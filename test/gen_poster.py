#!/usr/bin/env python3
"""
gen_poster.py — 从结构化 JSON 生成中英双语 poster.html（复用已验证模板结构）

用法：
  python gen_poster.py <data.json> <output_dir>

data.json 结构（每篇一篇）：
[
  {
    "id": "唯一id（用于目录名）",
    "cancer": "cervical",
    "kicker": "英文kicker",
    "kicker_zh": "中文kicker",
    "title": "英文标题",
    "title_zh": "中文标题",
    "subtitle": "英文副标题",
    "subtitle_zh": "中文副标题",
    "authors": "英文作者",
    "authors_zh": "中文作者",
    "source": "英文来源+DOI(可含<a>)",
    "source_zh": "中文来源+DOI(可含<a>)",
    "panels": [
      {"title": "EN标题", "title_zh": "ZH标题",
       "bullets": ["EN要点(可含<strong>等)"],
       "bullets_zh": ["ZH要点"],
       "stats": [{"big": "231", "lab_en": "...", "lab_zh": "..."}],  // 可选
       "figure": {"src": "images/xxx.jpg", "caption": "EN图注", "caption_zh": "ZH图注"}  // 可选
      }
    ],
    "takeaway": {"title": "Take-away", "title_zh": "核心结论",
                 "bullets": [...], "bullets_zh": [...]}
  }
]
"""
import json, sys, pathlib, re

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
  :root {{
    --primary: {primary}; --secondary: {secondary}; --accent: {accent};
    --accent-deep: {accent_deep}; --bg: #FFFFFF;
    --panel: rgba(233, 233, 233, 0.55); --panel-alt: rgba(192, 57, 43, 0.07);
    --text: #3A3232; --muted: #5C5252; --line: rgba(192, 57, 43, 0.24);
  }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: 100%; height: 100%; overflow: hidden;
    font-family: "Segoe UI","Helvetica Neue",Arial,"Microsoft YaHei",sans-serif;
    color: var(--text); background: var(--bg); }}
  body {{ display: flex; align-items: center; justify-content: center; }}
  .poster {{
    width: 1920px; height: 1080px; display: flex; flex-direction: column;
    background: #FFFFFF; padding: 22px 34px 18px 34px;
    zoom: calc(min(100vw / 1920px, 100vh / 1080px)); flex: none; position: relative;
  }}
  .titleband {{
    background: linear-gradient(135deg, rgba(192,57,43,0.94) 0%, rgba(192,57,43,0.84) 50%, rgba(230,126,34,0.88) 100%);
    color: #fff; padding: 16px 32px 13px 32px; flex: 0 0 auto;
    border-radius: 10px 10px 0 0; position: relative;
  }}
  .langswitch {{ position: absolute; top: 12px; right: 22px; display: flex; gap: 4px;
    background: rgba(255,255,255,0.18); border-radius: 16px; padding: 3px; }}
  .langswitch button {{ border: none; background: transparent; color: #fff; cursor: pointer;
    font: 600 11px/1 "Segoe UI",sans-serif; padding: 5px 12px; border-radius: 13px; letter-spacing: 0.5px; }}
  .langswitch button.on {{ background: #fff; color: var(--accent-deep); }}
  .kicker {{ font-size: 12px; letter-spacing: 2.4px; text-transform: uppercase;
    color: rgba(255,255,255,0.92); font-weight: 600; margin-bottom: 4px; }}
  .titleband h1 {{ font-size: 29px; font-weight: 700; line-height: 1.14; letter-spacing: 0.2px; }}
  .titleband .subtitle {{ font-size: 14.5px; color: rgba(255,255,255,0.93); margin-top: 4px; font-weight: 400; }}
  .titleband .meta {{ margin-top: 7px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 6px;
    font-size: 11.5px; line-height: 1.45; color: rgba(255,255,255,0.9); }}
  .titleband .meta .authors {{ font-weight: 600; color: #FFF; }}
  .titleband .meta .source {{ margin-top: 3px; }}
  .titleband .meta .source a {{ color: #FFF; text-decoration: underline; text-underline-offset: 2px; }}
  .body {{ flex: 1 1 auto; display: grid; grid-template-columns: 1fr 1.12fr 1fr; gap: 14px;
    padding: 12px 0 0 0; min-height: 0; background: #FFFFFF; border-radius: 0 0 10px 10px; }}
  .col {{ display: flex; flex-direction: column; gap: 10px; min-height: 0; }}
  .panel {{ background: var(--panel); border: 1px solid var(--line); border-radius: 8px;
    padding: 11px 19px 9px 19px; flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; }}
  .panel h3 {{ font-size: 15.5px; font-weight: 700; color: var(--primary);
    border-bottom: 2px solid var(--accent-deep); padding-bottom: 4px; margin-bottom: 7px;
    display: flex; align-items: center; gap: 6px; }}
  .panel h3 .num {{ display: inline-flex; align-items: center; justify-content: center;
    width: 21px; height: 21px; background: rgba(192,57,43,0.88); color: #fff;
    border-radius: 5px; font-size: 12px; flex: 0 0 auto; }}
  .panel p, .panel li {{ font-size: 13.8px; line-height: 1.5; color: var(--muted); }}
  .panel ul {{ list-style: none; flex: 1; display: flex; flex-direction: column;
    justify-content: space-evenly; margin: 0; padding: 0; }}
  .panel ul li {{ padding-left: 13px; position: relative; margin-bottom: 0; }}
  .panel ul li::before {{ content: ""; position: absolute; left: 0; top: 7px; width: 6px; height: 6px;
    border-radius: 50%; background: var(--secondary); }}
  .panel ul li strong {{ color: var(--primary); }}
  .panel ul li:last-child {{ margin-bottom: 0; }}
  .panel.figpanel {{ background: var(--panel-alt); padding-bottom: 10px; }}
  .figwrap {{ display: flex; flex-direction: column; gap: 5px; min-height: 0; }}
  .figwrap img {{ display: block; border: 1px solid var(--line); border-radius: 5px; background: #fff; }}
  .figwrap img.wide {{ display: block; width: 100%; height: auto; max-width: 100%; margin: 0 auto; }}
  .figwrap .figcap {{ font-size: 11.3px; color: var(--muted); font-style: italic; line-height: 1.32; }}
  .figwrap .figcap strong {{ color: var(--primary); font-style: normal; }}
  .panel.takeaway {{ background: rgba(230,126,34,0.14); border: 1.5px solid rgba(192,57,43,0.55); }}
  .panel.takeaway h3 {{ color: var(--accent-deep); border-bottom-color: var(--accent-deep); }}
  .panel.takeaway ul li::before {{ background: var(--accent-deep); }}
  .panel.takeaway ul li strong {{ color: #8E2519; }}
  .statrow {{ display: flex; gap: 10px; margin: 2px 0 6px 0; }}
  .stat {{ flex: 1; background: #fff; border: 1px solid var(--line); border-radius: 6px; padding: 6px 8px; text-align: center; }}
  .stat .big {{ font-size: 19px; font-weight: 800; color: var(--primary); line-height: 1.1; }}
  .stat .lab {{ font-size: 10px; color: var(--muted); margin-top: 2px; line-height: 1.2; }}
  body.lang-zh [data-lang="en"], body.lang-en [data-lang="zh"] {{ display: none; }}
</style>
</head>
<body>
<div class="poster">
  <header class="titleband">
    <div class="langswitch"><button id="btn-en">EN</button><button id="btn-zh">中文</button></div>
    <div class="kicker" data-i18n="kicker">{kicker}</div>
    <h1 data-i18n="title">{title}</h1>
    <div class="subtitle" data-i18n="subtitle">{subtitle}</div>
    <div class="meta">
      <div class="authors" data-i18n="authors">{authors}</div>
      <div class="source" data-i18n="source">{source}</div>
    </div>
  </header>
  <main class="body">
    {{COLUMNS}}
  </main>
</div>
<script>
(function () {{
  var DICT = {{
    en: {{
      kicker: {kicker_q},
      title: {title_q},
      subtitle: {subtitle_q},
      authors: {authors_q},
      source: {source_q},
      {DICT_EN}
    }},
    zh: {{
      kicker: {kicker_zh_q},
      title: {title_zh_q},
      subtitle: {subtitle_zh_q},
      authors: {authors_zh_q},
      source: {source_zh_q},
      {DICT_ZH}
    }}
  }};
  function apply(lang) {{
    var strings = DICT[lang] || DICT.en;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {{
      var k = el.getAttribute('data-i18n');
      if (strings[k] != null) el.innerHTML = strings[k];
    }});
    document.body.className = 'lang-' + lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.getElementById('btn-en').className = (lang === 'en') ? 'on' : '';
    document.getElementById('btn-zh').className = (lang === 'zh') ? 'on' : '';
    try {{ localStorage.setItem('poster_lang', lang); }} catch (e) {{}}
    try {{
      var u = new URL(location.href); u.searchParams.set('lang', lang);
      history.replaceState({{}}, '', u.toString());
    }} catch (e) {{}}
  }}
  function initialLang() {{
    try {{
      var p = new URLSearchParams(location.search).get('lang');
      if (p === 'en' || p === 'zh') return p;
      var s = localStorage.getItem('poster_lang');
      if (s === 'en' || s === 'zh') return s;
    }} catch (e) {{}}
    return 'en';
  }}
  document.getElementById('btn-en').onclick = function () {{ apply('en'); }};
  document.getElementById('btn-zh').onclick = function () {{ apply('zh'); }};
  apply(initialLang());
  var DESIGN_W = 1920, DESIGN_H = 1080;
  var poster = document.querySelector('.poster');
  function fit() {{
    var s = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    poster.style.zoom = s;
  }}
  var r = poster.getBoundingClientRect();
  if (r.width >= DESIGN_W - 1 && (window.innerWidth < DESIGN_W || window.innerHeight < DESIGN_H)) {{
    window.addEventListener('resize', fit); fit();
  }}
}})();
</script>
</body>
</html>
"""

def esc(s: str) -> str:
    """Escape for JSON string literal inside JS."""
    return json.dumps(s, ensure_ascii=False)

def build_columns(data: dict) -> str:
    """Build 3-column HTML from panels list. Middle column is never empty:
       figure → middle (hero evidence); else stats panel → middle (key results),
       with extra content so the stretched panel reads full; remaining panels
       (plus takeaway) split left/right with left column filled first."""
    panels = data["panels"]
    cols = [[], [], []]
    figs = [i for i, p in enumerate(panels) if "figure" in p]
    if figs:
        # 有图：图放中栏，其余按阅读顺序左右交替
        for i in figs:
            cols[1].append(i)
        rest = [i for i in range(len(panels)) if i not in cols[1]]
        for k, i in enumerate(rest):
            cols[0 if k % 2 == 0 else 2].append(i)
    else:
        stats = [i for i, p in enumerate(panels) if "stats" in p]
        if stats:
            # 无图有数据：关键结果面板独占中栏（内容已加量）
            cols[1].append(stats[0])
            rest = [i for i in range(len(panels)) if i != stats[0]]
            # 左列优先填充（takeaway 会在右列补位，保证每列至少一块）
            for k, i in enumerate(rest):
                cols[0 if k % 2 == 0 else 2].append(i)
        else:
            # 无图无数据：按 i%3 均分；若中栏为空（panel 数为 2 的倍数分布所致），把右列第一个移到中栏
            for i, p in enumerate(panels):
                cols[i % 3].append(i)
            if not cols[1] and cols[2]:
                cols[1].append(cols[2].pop(0))
    tk = data.get("takeaway")
    out = []
    for ci in range(3):
        items = sorted(cols[ci])
        html = '<section class="col">'
        for idx in items:
            html += build_panel(panels[idx], idx + 1)
        if ci == 2 and tk:
            html += build_takeaway(tk, len(panels) + 1)
        html += "</section>"
        out.append(html)
    return "\n    ".join(out)

def build_panel(p: dict, num: int) -> str:
    cls = "panel figpanel" if "figure" in p else "panel"
    h = f'<div class="{cls}">\n        <h3><span class="num">{num}</span><span data-i18n="s{num}t">{p["title"]}</span></h3>'
    if "stats" in p:
        h += '\n        <div class="statrow">'
        for si, st in enumerate(p["stats"]):
            h += f'\n          <div class="stat"><div class="big">{st["big"]}</div><div class="lab" data-i18n="st{num}_{si}">{st["lab_en"]}</div></div>'
        h += "\n        </div>"
    h += '\n        <ul>'
    for bi, b in enumerate(p["bullets"]):
        h += f'\n          <li data-i18n="s{num}b{bi}">{b}</li>'
    h += "\n        </ul>"
    if "figure" in p:
        f = p["figure"]
        h += f'\n        <div class="figwrap">\n          <img class="wide" src="{f["src"]}" alt="{f.get("alt", "")}">'
        h += f'\n          <div class="figcap"><strong>{f.get("fig_label", "Fig.")}</strong> <span data-i18n="s{num}c">{f["caption"]}</span></div>'
        h += "\n        </div>"
    h += "\n      </div>"
    return h

def build_takeaway(tk: dict, num: int) -> str:
    h = f'<div class="panel takeaway">\n        <h3><span class="num">{num}</span><span data-i18n="s{num}t">{tk["title"]}</span></h3>\n        <ul>'
    for bi, b in enumerate(tk["bullets"]):
        h += f'\n          <li data-i18n="s{num}b{bi}">{b}</li>'
    h += "\n        </ul>\n      </div>"
    return h

def build_dict_entries(data: dict) -> tuple[str, str]:
    """Build JS dict entries for EN and ZH from panels."""
    en = []
    zh = []
    panels = data["panels"]
    for i, p in enumerate(panels):
        num = i + 1
        en.append(f"s{num}t: {esc(p['title'])}")
        zh.append(f"s{num}t: {esc(p['title_zh'])}")
        if "stats" in p:
            for si, st in enumerate(p["stats"]):
                en.append(f"st{num}_{si}: {esc(st['lab_en'])}")
                zh.append(f"st{num}_{si}: {esc(st['lab_zh'])}")
        for bi, b in enumerate(p["bullets"]):
            en.append(f"s{num}b{bi}: {esc(b)}")
            zh.append(f"s{num}b{bi}: {esc(p['bullets_zh'][bi])}")
        if "figure" in p:
            en.append(f"s{num}c: {esc(p['figure']['caption'])}")
            zh.append(f"s{num}c: {esc(p['figure']['caption_zh'])}")
    tk = data.get("takeaway")
    if tk:
        num = len(panels) + 1
        en.append(f"s{num}t: {esc(tk['title'])}")
        zh.append(f"s{num}t: {esc(tk['title_zh'])}")
        for bi, b in enumerate(tk["bullets"]):
            en.append(f"s{num}b{bi}: {esc(b)}")
            zh.append(f"s{num}b{bi}: {esc(tk['bullets_zh'][bi])}")
    return ",\n      ".join(en), ",\n      ".join(zh)

def gen(data: dict) -> str:
    dict_en, dict_zh = build_dict_entries(data)
    # 癌种配色：cervical 红 / endometrial 蓝 / ovarian 紫 / guideline 通用深青
    palette = {
        "cervical": ("#C0392B", "#E67E22", "#F5C6C0", "#96281E"),
        "endometrial": ("#1F6FB2", "#3E9BD6", "#C9E4F5", "#155A8A"),
        "ovarian": ("#7A4FB2", "#A87FD6", "#E4D5F5", "#5A3A8A"),
        "guideline": ("#0E7C66", "#2FA88E", "#C9EBE0", "#0A5F4E"),
    }
    pr, sc, ac, ad = palette.get(data.get("cancer", "cervical"), palette["cervical"])
    html = TPL.format(
        primary=pr, secondary=sc, accent=ac, accent_deep=ad,
        title=data["title"],
        kicker=data["kicker"], subtitle=data["subtitle"],
        authors=data["authors"], source=data["source"],
        kicker_q=esc(data["kicker"]), title_q=esc(data["title"]),
        subtitle_q=esc(data["subtitle"]), authors_q=esc(data["authors"]), source_q=esc(data["source"]),
        kicker_zh_q=esc(data["kicker_zh"]), title_zh_q=esc(data["title_zh"]),
        subtitle_zh_q=esc(data["subtitle_zh"]), authors_zh_q=esc(data["authors_zh"]), source_zh_q=esc(data["source_zh"]),
        DICT_EN=dict_en, DICT_ZH=dict_zh,
    )
    # replace {{COLUMNS}} placeholder
    # {{COLUMNS}} in the format string becomes {COLUMNS} after .format()
    html = html.replace("{COLUMNS}", build_columns(data))
    return html

def main():
    data_path, out_dir = sys.argv[1], sys.argv[2]
    items = json.loads(pathlib.Path(data_path).read_text(encoding="utf-8"))
    out = pathlib.Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for item in items:
        pid = item["id"]
        d = out / pid
        d.mkdir(parents=True, exist_ok=True)
        (d / "poster.html").write_text(gen(item), encoding="utf-8")
        # copy figures if provided
        for p in item.get("panels", []):
            if "figure" in p and p["figure"].get("src_local"):
                src = pathlib.Path(p["figure"]["src_local"])
                if src.exists():
                    (d / "images").mkdir(exist_ok=True)
                    import shutil
                    shutil.copy(src, d / "images" / pathlib.Path(p["figure"]["src"]).name)
        print(f"  ✓ {pid[:60]}")
    print(f"\n{len(items)} posters generated in {out}")

if __name__ == "__main__":
    main()
