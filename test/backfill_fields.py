#!/usr/bin/env python3
"""
backfill_fields.py — extract doi / affiliation / abstract for papers.json &
guidelines.json entries from their clippings markdown files (if a clipping
exists), and from citation strings. Dry-run by default; --apply to write.
Prints a per-entry report of what was found / still missing.
"""
import json, re, unicodedata, pathlib, os, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "data"
CLIP = ROOT / "source" / "blogs" / "cispoly-news-update" / "raw" / "clippings"
APPLY = "--apply" in sys.argv

def norm(s):
    if not s: return ""
    s = re.sub(r"<[^>]+>", "", s)
    s = unicodedata.normalize("NFKC", s)
    return re.sub(r"[^\w\u4e00-\u9fff]+", "", s.lower())

# map: clippings dir per cancer
CLIP_DIRS = {
    "cervical": CLIP / "academic_papers" / "CISCER",
    "endometrial": CLIP / "academic_papers" / "CISENDO",
    "ovarian": CLIP / "academic_papers" / "CISOVA",
}

def find_clipping(title, cancer):
    """Return (path, text) of the clipping md best matching title, or (None, None)."""
    d = CLIP_DIRS.get(cancer)
    if not d or not d.exists():
        return None, None
    nt = norm(title)
    best, bestscore = None, 0
    for f in os.listdir(d):
        if not f.endswith(".md"):
            continue
        p = d / f
        try:
            head = p.read_text(encoding="utf-8", errors="ignore")[:2000]
        except OSError:
            continue
        # title from frontmatter or filename
        m = re.search(r'title:\s*"([^"]+)"', head)
        ft = m.group(1) if m else f[:-3]
        nft = norm(ft)
        sc = 0
        if nt == nft: sc = 1.0
        elif len(nt) > 15 and len(nft) > 15 and (nt in nft or nft in nt): sc = 0.85
        else:
            a, b = set(nt), set(nft)
            sc = len(a & b) / max(1, len(a | b))
        if sc > bestscore:
            bestscore, best = sc, p
    if best and bestscore >= 0.5:
        return best, best.read_text(encoding="utf-8", errors="ignore")
    return None, None

DOI_RE = re.compile(r"10\.\d{4,9}/[^\s\)\]\"'<>]+")
DOI_RE2 = re.compile(r"doi:\s*(10\.\d{4,9}/[^\s\)\]\"'<>]+)", re.I)

def extract_doi(text, citation):
    """Try frontmatter, body doi: links, then citation string."""
    if text:
        m = DOI_RE2.search(text)
        if m:
            return m.group(1).strip(".,;")
        m = DOI_RE.search(text)
        if m:
            return m.group(0).strip(".,;")
    if citation:
        m = DOI_RE.search(citation)
        if m:
            return m.group(0).strip(".,;")
    return None

def extract_affiliation(text):
    """Affiliation: first 'Department ... China' style run in the author block."""
    if not text:
        return None
    m = re.search(r"((?:Department|Department of|School of|Hospital|Center|Centre)[^。\n]{10,220}?China)", text)
    if m:
        return m.group(1).strip()
    m2 = re.search(r"(北京[^。\n]{5,150}|北京大学[^。\n]{5,150}|[A-Za-z][^。\n]{10,220}China)", text)
    if m2:
        return m2.group(1).strip()
    return None

def extract_abstract(text):
    """Abstract: text between '## Abstract' / '摘要' and the next ## heading."""
    if not text:
        return None
    m = re.search(r"(?:##\s*(?:ABSTRACT|Abstract|摘要)|###\s*(?:ABSTRACT|Abstract|摘要))\s*\n(.*?)(?=\n##|\n###|\Z)", text, re.S)
    if m:
        return m.group(1).strip()[:1500] or None
    m2 = re.search(r"ABSTRACT\s*\n(.*?)(?=\n##|\n###|\Z)", text, re.S)
    if m2:
        return m2.group(1).strip()[:1500] or None
    return None

def run():
    papers = json.loads((SRC / "papers.json").read_text(encoding="utf-8"))
    guides = json.loads((SRC / "guidelines.json").read_text(encoding="utf-8"))
    report = []
    n_fixed = {"doi": 0, "affiliation": 0, "abstract": 0}

    for p in papers:
        path, text = find_clipping(p["title"], p["cancer"])
        row = {"id": p["id"][:50], "clip": bool(path)}
        if not p.get("doi"):
            doi = extract_doi(text, p.get("citation"))
            if doi:
                p["doi"] = doi; n_fixed["doi"] += 1
            row["doi"] = doi or "MISS"
        if not p.get("affiliation"):
            aff = extract_affiliation(text)
            if aff:
                p["affiliation"] = aff; n_fixed["affiliation"] += 1
            row["aff"] = (aff or "MISS")[:60]
        if not p.get("abstract"):
            ab = extract_abstract(text)
            if ab:
                p["abstract"] = ab; n_fixed["abstract"] += 1
            row["abs"] = "OK" if ab else "MISS"
        report.append(row)

    for g in guides:
        path, text = find_clipping(g["title"], g["cancer"])
        row = {"id": g["id"][:50], "clip": bool(path)}
        if not g.get("doi"):
            doi = extract_doi(text, g.get("citation"))
            if doi:
                g["doi"] = doi; n_fixed["doi"] += 1
            row["doi"] = doi or "MISS"
        if not g.get("abstract"):
            ab = extract_abstract(text)
            if ab:
                g["abstract"] = ab; n_fixed["abstract"] += 1
            row["abs"] = "OK" if ab else "MISS"
        report.append(row)

    print(f"fixed: {n_fixed}")
    print("=" * 100)
    for r in report:
        if any(v == "MISS" for v in (r.get("doi"), r.get("aff"), r.get("abs")) if v is not None):
            print(f"  [{r['id']}] clip={r['clip']} doi={r.get('doi','ok')} aff={r.get('aff','ok')} abs={r.get('abs','ok')}")

    if APPLY:
        (SRC / "papers.json").write_text(json.dumps(papers, ensure_ascii=False, indent=2), encoding="utf-8")
        (SRC / "guidelines.json").write_text(json.dumps(guides, ensure_ascii=False, indent=2), encoding="utf-8")
        print("\nAPPLIED")
    else:
        print("\n(dry run)")

if __name__ == "__main__":
    run()
