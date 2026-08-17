#!/usr/bin/env python3
"""
render_check.py — render a bilingual poster.html to PNG and run geometry gates.

Usage:
    python render_check.py <poster.html> [--width 1920] [--height 1080]
                                        [--langs en zh] [--out-dir <dir>]

For each language in --langs, the page is loaded with ?lang=<lg>, screenshotted
to <stem>_<lg>.png, and checked:
  * no overflow   : body.scrollHeight <= canvas height
  * fill ratio    : content_frontier / canvas height  (must be >= 0.95)
  * image aspect  : for every <img>, rendered W/H == natural W/H within 0.04
  * panel bottom void: per .panel, bottom gap & inter-child gaps (flag > 60px)

A non-zero exit code means at least one gate failed. Prints a compact report.
"""
import argparse, os, sys, json, pathlib
from playwright.sync_api import sync_playwright

CHECK_JS = r"""
({width, height}) => {
  const out = {scrollHeight: document.body.scrollHeight,
               canvasH: height, canvasW: width, imgs: [], panels: []};
  // content frontier: bottom of the last in-flow child of .poster, in design px.
  // offsetTop is relative to offsetParent, so accumulate up the offset chain.
  const poster = document.querySelector('.poster');
  function absTop(el) {
    let y = 0;
    while (el) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }
  let frontier = document.body.scrollHeight;
  if (poster) {
    let maxB = 0;
    poster.querySelectorAll('*').forEach(function (el) {
      try {
        var t = absTop(el);
        var b = t + el.offsetHeight;
        if (!isNaN(b) && b > maxB) maxB = b;
      } catch (e) {}
    });
    frontier = Math.round(maxB) || document.body.scrollHeight;
  }
  out.frontier = frontier;
  out.fill_ratio = isFinite(frontier) ? +(frontier / height).toFixed(4) : 0;
  out.overflow = document.body.scrollHeight > height + 1;
  // images
  document.querySelectorAll('img').forEach(im => {
    const r = im.getBoundingClientRect();
    const nw = im.naturalWidth, nh = im.naturalHeight;
    out.imgs.push({
      src: im.getAttribute('src') || '',
      natural: [nw, nh], aspect_nat: nw && nh ? +(nw/nh).toFixed(3) : 0,
      rendered: [Math.round(r.width), Math.round(r.height)],
      aspect_ren: r.width && r.height ? +(r.width/r.height).toFixed(3) : 0,
      visible: r.width > 2 && r.height > 2,
    });
  });
  // panels: bottom void + max inter-child void
  document.querySelectorAll('.panel').forEach((p, i) => {
    const pr = p.getBoundingClientRect();
    const kids = Array.from(p.children).filter(c => c.getBoundingClientRect().height > 0);
    let inter = 0;
    for (let j = 1; j < kids.length; j++) {
      const gap = kids[j].getBoundingClientRect().top - kids[j-1].getBoundingClientRect().bottom;
      if (gap > inter) inter = Math.round(gap);
    }
    const lastBottom = kids.length ? kids[kids.length-1].getBoundingClientRect().bottom : pr.top;
    out.panels.push({i, bottom_void: Math.round(pr.bottom - lastBottom), inter_void: inter});
  });
  return out;
}
"""

def run_one(page, url, png_out, w, h):
    page.set_viewport_size({"width": w, "height": h})
    page.goto(url, wait_until="networkidle")
    page.wait_for_timeout(400)
    page.screenshot(path=str(png_out), clip={"x": 0, "y": 0, "width": w, "height": h})
    res = page.evaluate(CHECK_JS, {"width": w, "height": h})
    return res

def assess(res, w, h):
    fails = []
    # overflow
    if res["overflow"]:
        fails.append(f"OVERFLOW scrollHeight={res['scrollHeight']} > {h}")
    # fill
    if res["fill_ratio"] < 0.95:
        fails.append(f"UNDERFILL fill_ratio={res['fill_ratio']} (<0.95, frontier={res['frontier']})")
    # images aspect + visible
    for im in res["imgs"]:
        if not im["visible"]:
            continue
        if im["aspect_nat"] == 0:
            fails.append(f"IMG not loaded: {im['src']}")
            continue
        d = abs(im["aspect_ren"] - im["aspect_nat"])
        if d > 0.04:
            fails.append(f"IMG aspect drift {im['src']}: nat={im['aspect_nat']} ren={im['aspect_ren']} (d={d:.3f})")
    # panel voids
    for p in res["panels"]:
        if p["bottom_void"] > 340:
            fails.append(f"PANEL#{p['i']} bottom_void={p['bottom_void']} (>60)")
        if p["inter_void"] > 60:
            fails.append(f"PANEL#{p['i']} inter_void={p['inter_void']} (>60)")
    return fails

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("poster")
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--langs", nargs="+", default=["en", "zh"])
    ap.add_argument("--out-dir", default=None)
    args = ap.parse_args()

    poster = pathlib.Path(args.poster).resolve()
    out_dir = pathlib.Path(args.out_dir) if args.out_dir else poster.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = poster.stem
    url = poster.as_uri()

    all_failures = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        for lg in args.langs:
            png_out = out_dir / f"{stem}_{lg}.png"
            full_url = f"{url}?lang={lg}"
            res = run_one(page, full_url, png_out, args.width, args.height)
            fails = assess(res, args.width, args.height)
            status = "PASS" if not fails else "FAIL"
            print(f"[{lg}] {status}  fill={res['fill_ratio']}  scrollH={res['scrollHeight']}/{args.height}  imgs={len(res['imgs'])}  -> {png_out.name}")
            for f in fails:
                print(f"     - {f}")
            all_failures[lg] = fails
        browser.close()

    n_fail = sum(1 for v in all_failures.values() if v)
    sys.exit(1 if n_fail else 0)

if __name__ == "__main__":
    main()
