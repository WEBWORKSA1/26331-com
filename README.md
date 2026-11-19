# 26331.com — Numbers Lab

Free calculators and plain-English guides for money, business and AI decisions. **26 tools · 3 hubs · 31-day plan.**

Static site for GitHub Pages (free plan, `main` branch, root folder). No server, no framework.

## Structure
- `src/` — page bodies (edit these). First line is JSON metadata.
- `scripts/build.py` — wraps `src/` pages in the shared layout → root HTML + `sitemap.xml`.
- `scripts/refresh.py` — daily number-of-the-day + FX rates → `data/daily.json`, then rebuild.
- `.github/workflows/auto-refresh.yml` — runs the refresh daily at 03:17 UTC and commits changes.
- `js/tools.js` (26 calculators), `js/numbers.js` (Number Explorer), `js/main.js` (forms, consent, popups, config).
- `docs/RESEARCH.md` — research, idea scoring, 25-site benchmark, AdSense checklist.
- `docs/PROMPTS.md` — phase-wise build prompts.

## Edit & rebuild
```bash
python3 scripts/build.py
```

## Config
- **Donation payment links:** `js/main.js` → `CONFIG.donateLinks` (Stripe, PayPal or Buy Me a Coffee). Empty = pledge form only.
- **Forms:** all forms post to FormSubmit. The **first** submission triggers a one-time activation email to the site inbox — click it once to start receiving submissions.

## Custom domain
1. DNS at your registrar: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; CNAME `www` → `webworksa1.github.io`.
2. Repo → Settings → Pages → Custom domain `26331.com` → Enforce HTTPS (this adds the `CNAME` file).

## Legal
© 2026 26331.com. “26331” is used only as a domain name; no exclusive trademark rights in the number are claimed. See `disclaimer.html`.
