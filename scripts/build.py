#!/usr/bin/env python3
"""Static site builder for 26331.com.

Each file in src/ is a page body. Its first line is an HTML comment holding JSON
metadata: {"title": ..., "description": ..., "nav": ..., "scripts": [...], "type": ...}.
The builder wraps the body in the shared layout and writes it to the same relative
path at the repo root. Run: python3 scripts/build.py
"""
import json, os, re, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DOMAIN = "https://26331.com"
ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>'
INQUIRY = "https://web.works/contact"

NAV = [
    ("tools.html", "Tools", "tools"),
    ("number.html", "Number Explorer", "number"),
    ("ai.html", "AI Hub", "ai"),
    ("learn/index.html", "Learn", "learn"),
    ("videos.html", "Videos", "videos"),
    ("community.html", "Community", "community"),
    ("support.html", "Support", "support"),
]


def layout(meta, body, rel):
    depth = rel.count("/")
    r = "../" * depth
    path = rel.replace("index.html", "")
    canonical = f"{DOMAIN}/{path}"
    title = meta["title"]
    desc = meta["description"]
    active = meta.get("nav", "")
    cur = ' aria-current="page"'
    menu = "".join(
        f'<li><a href="{r}{href}"{cur if key == active else ""}>{label}</a></li>'
        for href, label, key in NAV
    )
    scripts = "".join(f'<script src="{r}js/{s}" defer></script>' for s in meta.get("scripts", []))
    ld = {
        "@context": "https://schema.org",
        "@type": meta.get("type", "WebPage"),
        "name": title,
        "description": desc,
        "url": canonical,
        "isPartOf": {"@type": "WebSite", "name": "26331.com — Numbers Lab", "url": DOMAIN + "/"},
    }
    if meta.get("type") == "Article":
        ld.update({"headline": title, "datePublished": meta.get("date", "2026-11-19"),
                   "author": {"@type": "Organization", "name": "26331.com Editorial Team"},
                   "publisher": {"@type": "Organization", "name": "26331.com"}})
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="site-root" content="{r}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{DOMAIN}/assets/og.svg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d1321">
<link rel="icon" href="{r}assets/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="{r}manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{r}css/style.css">
{ADSENSE}
<script type="application/ld+json">{json.dumps(ld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar" role="note"><a href="{INQUIRY}" target="_blank" rel="noopener nofollow">Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership</a></div>
<header class="site-header">
  <nav class="wrap nav" aria-label="Main">
    <a class="logo" href="{r}index.html"><span class="badge">26331</span><span>Numbers Lab</span></a>
    <button class="burger" aria-label="Open menu" aria-expanded="false">☰</button>
    <ul class="menu">{menu}<li><a class="cta" href="{r}grow.html">Free Growth Review</a></li></ul>
  </nav>
</header>
<main id="main">
{body.replace('{{R}}', r)}
</main>
<footer>
  <div class="wrap">
    <div class="foot">
      <div>
        <a class="logo" href="{r}index.html" style="color:#fff"><span class="badge">26331</span><span>Numbers Lab</span></a>
        <p style="margin-top:12px">Free calculators, number tools and plain-English guides for money, business and AI decisions. 26 tools · 3 hubs · a 31-day growth plan.</p>
        <a class="btn lime small" href="{r}grow.html">Get your free growth review</a>
      </div>
      <div><h4>Tools</h4><ul>
        <li><a href="{r}tools.html#loan">Loan &amp; EMI</a></li><li><a href="{r}tools.html#margin">Profit margin</a></li>
        <li><a href="{r}tools.html#breakeven">Break-even</a></li><li><a href="{r}tools.html#ai-cost">AI cost estimator</a></li>
        <li><a href="{r}number.html">Number Explorer</a></li><li><a href="{r}tools.html#words">Cheque writer</a></li></ul></div>
      <div><h4>Get involved</h4><ul>
        <li><a href="{r}grow.html">Free growth review</a></li><li><a href="{r}community.html#contests">Contests &amp; prizes</a></li>
        <li><a href="{r}community.html#talent">Careers &amp; talent pool</a></li><li><a href="{r}community.html#sponsor">Advertise &amp; sponsor</a></li>
        <li><a href="{r}support.html">Support the project</a></li><li><a href="{r}videos.html">Videos</a></li></ul></div>
      <div><h4>Company</h4><ul>
        <li><a href="{r}about.html">About</a></li><li><a href="{r}contact.html">Contact</a></li>
        <li><a href="{r}privacy.html">Privacy policy</a></li><li><a href="{r}terms.html">Terms of use</a></li>
        <li><a href="{r}disclaimer.html">Disclaimer &amp; trademark</a></li><li><a href="{INQUIRY}" target="_blank" rel="noopener nofollow">Buy / partner with this site</a></li></ul></div>
    </div>
    <div class="legal-note">
      <p>© <span data-year>2026</span> 26331.com. All original text, tools and design on this site are protected by copyright. “26331” is used here only as a domain name and numeric identifier; we claim no exclusive trademark rights in the number itself and are not affiliated with any company, product, postal area or code that uses the same digits. Third-party names belong to their owners and are used for identification only. Calculators are for education and do not constitute financial, tax or legal advice. This site uses cookies and shows ads served by Google — see our <a href="{r}privacy.html">privacy policy</a>.</p>
    </div>
  </div>
</footer>
<div class="cookie" id="cookie" role="dialog" aria-label="Cookie notice">
  <strong>Cookies &amp; ads.</strong> We use cookies for analytics and to show ads from Google, which may use cookies to personalise ads. <a href="{r}privacy.html">Learn more</a>.
  <div class="btns"><button class="btn small" data-consent="all">Accept</button><button class="btn small ghost" data-consent="essential">Essential only</button></div>
</div>
<div class="modal" id="leadModal" role="dialog" aria-modal="true" aria-labelledby="lm-title">
  <div class="box">
    <button class="x" aria-label="Close">×</button>
    <span class="eyebrow">Free · 31 days</span>
    <h3 id="lm-title">Get the 31-Day Numbers-First Growth Plan</h3>
    <p class="muted">One short email a day: one number to track, one action to take. Built for owners, freelancers and side-hustlers.</p>
    <form data-form="31-day plan signup" data-success="You're in! Day 1 lands in your inbox shortly.">
      <div class="hp"><input name="_hp" tabindex="-1" autocomplete="off"></div>
      <label>First name<input name="name" required autocomplete="given-name"></label>
      <label>Email<input name="email" type="email" required autocomplete="email"></label>
      <label class="check"><input type="checkbox" name="consent" value="yes" required> I agree to receive the plan and occasional updates. Unsubscribe anytime.</label>
      <button class="btn lime" type="submit">Send me Day 1</button>
      <div class="form-msg" role="status"></div>
    </form>
  </div>
</div>
<a class="btn lime sticky-cta" href="{r}grow.html">Free growth review →</a>
<script src="{r}js/main.js" defer></script>
{scripts}
</body>
</html>
"""


def main():
    pages = []
    for f in sorted(SRC.rglob("*.html")):
        rel = f.relative_to(SRC).as_posix()
        text = f.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--(.*?)-->\s*", text, re.S)
        meta = json.loads(m.group(1))
        body = text[m.end():]
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(layout(meta, body, rel), encoding="utf-8")
        if not meta.get("noindex"):
            pages.append((rel, meta.get("priority", "0.7")))
    today = datetime.date.today().isoformat()
    urls = "".join(
        f"<url><loc>{DOMAIN}/{rel.replace('index.html', '')}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>"
        for rel, p in pages
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n',
        encoding="utf-8")
    print(f"built {len(pages)} indexable pages")


if __name__ == "__main__":
    main()
