#!/usr/bin/env python3
"""
build_citations.py — parse the 4 citation-list markdown files into a per-id
citation map, then match each citation string to papers.json/guidelines.json
entries by normalized title. Writes a MATCH REPORT (no blind writes).
"""
import json, re, unicodedata, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "data"

# ---------- 1. parse citation lists ----------
LISTS = [
    (ROOT / "source/blogs/cispoly-news-update/raw/clippings/academic_papers/宫颈癌文献引用列表.md", "cervical"),
    (ROOT / "source/blogs/cispoly-news-update/raw/clippings/academic_papers/子宫内膜癌引用列表.md", "endometrial"),
    (ROOT / "source/blogs/cispoly-news-update/raw/clippings/academic_papers/卵巢癌引用列表.md", "ovarian"),
    (ROOT / "source/blogs/cispoly-news-update/raw/clippings/clinical_guidelines/指南共识引用列表.md", None),  # mixed cancer
]

def norm(s: str) -> str:
    """Normalize a title for fuzzy matching: strip punctuation/space/case, unify unicode."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "", s.lower())
    return s

def split_entries(text: str):
    """Split a numbered citation list like '1. ... \n 2. ...' into raw entries."""
    return re.findall(r"^\s*\d+[\.、]\s*(.+)$", text, re.M)

def parse_citation(entry: str):
    """Extract (title, full_citation) from a citation line.
    Format: 'Authors. Title. Journal vol, pages (year).'
    Title = the sentence(s) between the first '. ' and the last '. '
    (we keep the whole entry as the canonical citation; title extraction is
    best-effort for matching only).
    """
    entry = entry.strip()
    # strip a leading authors segment: up to the 2nd period after author list.
    # Robust heuristic: split on '. ' and drop the first token(s) that look
    # like an author list (contain ',' '&' 'et al' or CJK surnames w/ 等/et al).
    parts = entry.split(". ")
    # find index of the title start: first part that is NOT authors-like
    title_start = 0
    for i, p in enumerate(parts):
        # author part: short (< 40 chars) and looks like names
        looks_authors = (
            len(p) < 45 and (
                "," in p or "&" in p or "et al" in p.lower() or "等" in p or "，" in p
            )
        )
        if not looks_authors or i == 0 and len(parts) == 1:
            title_start = i
            break
    title = ". ".join(parts[title_start:])
    # cut journal tail: up to last ' vol,' or ' (year)'
    m = re.match(r"^(.*?)(?:\.?\s*(?:[A-Za-z\u4e00-\u9fff][^。(]*?(?:\d+[–\-,]\d+|\d+)?\s*\(.*?\)|\(.*?\))\s*)$", title)
    if m:
        title = m.group(1).strip().rstrip(".")
    return title, entry

all_citations = []  # (title, citation, cancer)
for path, cancer in LISTS:
    if not path.exists():
        print(f"!! missing list: {path}")
        continue
    text = path.read_text(encoding="utf-8")
    for entry in split_entries(text):
        if not entry or entry.startswith("!"):
            continue
        t, c = parse_citation(entry)
        all_citations.append((t, c, cancer))
    print(f"  parsed {path.name}: {len(split_entries(text))} entries")

print(f"\nTOTAL citations parsed: {len(all_citations)}")

# ---------- 2. load app data ----------
papers = json.loads((SRC / "papers.json").read_text(encoding="utf-8"))
guides = json.loads((SRC / "guidelines.json").read_text(encoding="utf-8"))

def best_match(title, entries, cancer=None):
    nt = norm(title)
    best, bestscore = None, 0
    for t, c, cat in entries:
        if cancer and cat and cat != cancer:
            continue
        # token-overlap score on normalized titles
        a, b = set(nt), set(norm(t))
        # use char bigrams for robustness
        def bigrams(s):
            return {s[i:i+2] for i in range(len(s)-1)} if len(s) > 1 else {s}
        ba, bb = bigrams(nt), bigrams(norm(t))
        score = len(ba & bb) / max(1, len(ba | bb))
        if score > bestscore:
            bestscore, best = score, (t, c)
    return best, bestscore

print("\n=== PAPER MATCH REPORT (id | matched_citation_title | score) ===")
paper_report = []
for p in papers:
    cit, score = best_match(p["title"], all_citations, p.get("cancer"))
    paper_report.append((p["id"], p["title"], cit, score))
    flag = "OK" if score >= 0.6 else ("LOW" if score >= 0.4 else "MISS")
    print(f"  [{flag}] {p['id'][:48]}  <-  {cit[0] if cit else '???'} ({score:.2f})")

print("\n=== GUIDELINE MATCH REPORT ===")
for g in guides:
    cit, score = best_match(g["title"], all_citations, g.get("cancer"))
    flag = "OK" if score >= 0.6 else ("LOW" if score >= 0.4 else "MISS")
    print(f"  [{flag}] {g['id'][:48]}  <-  {cit[0] if cit else '???'} ({score:.2f})")

# ---------- 3. unmatched citation entries (citations with no paper/guideline) ----------
paper_titles = [norm(p["title"]) for p in papers]
guide_titles = [norm(g["title"]) for g in guides]
print("\n=== UNMATCHED citation entries (in lists but no app entry) ===")
for t, c, cat in all_citations:
    nt = norm(t)
    if not any(best_match(t, [(pt, "", None)]) and norm(pt) == nt or (any(norm(x) == nt for x in paper_titles + guide_titles)) for pt in []):
        pass
# simpler: brute
matched_ids = set()
for p in papers:
    cit, _ = best_match(p["title"], all_citations, p.get("cancer"))
    if cit:
        matched_ids.add(id(cit))
for g in guides:
    cit, _ = best_match(g["title"], all_citations, g.get("cancer"))
    if cit:
        matched_ids.add(id(cit))
for i, (t, c, cat) in enumerate(all_citations):
    if id(c) not in matched_ids:
        print(f"  [unmatched] {c}")

# ---------- 4. write report file ----------
out = ROOT / "test" / "citation_match_report.md"
with out.open("w", encoding="utf-8") as f:
    f.write("# Citation Match Report\n\n")
    f.write("## Papers\n\n")
    for pid, ptitle, cit, score in paper_report:
        f.write(f"- {pid}\n  - title: {ptitle}\n  - matched: {cit[0] if cit else '???'} ({score:.2f})\n  - citation: {cit[1] if cit else ''}\n\n")
    f.write("## Guidelines\n\n")
    for g in guides:
        cit, score = best_match(g["title"], all_citations, g.get("cancer"))
        f.write(f"- {g['id']}\n  - matched: {cit[0] if cit else '???'} ({score:.2f})\n  - citation: {cit[1] if cit else ''}\n\n")
print(f"\nReport written to {out}")
