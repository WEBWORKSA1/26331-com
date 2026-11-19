#!/usr/bin/env python3
"""Daily data refresh for 26331.com (run by GitHub Actions).

Writes data/daily.json with:
  - number: a deterministic "number of the day" and its facts
  - fx: reference currency rates (USD base) from open.er-api.com, kept from the
        previous run if the fetch fails
Then rebuilds pages so the sitemap lastmod stays current.
"""
import json, datetime, pathlib, urllib.request, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "daily.json"

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()

def words(n):
    def h(x):
        s = []
        if x >= 100: s.append(ONES[x // 100] + " hundred"); x %= 100
        if x >= 20: s.append(TENS[x // 10] + ("-" + ONES[x % 10] if x % 10 else ""))
        elif x or not s: s.append(ONES[x])
        return " ".join(s)
    if n == 0: return "zero"
    parts, scales, i = [], ["", "thousand", "million", "billion"], 0
    while n:
        c = n % 1000
        if c: parts.insert(0, h(c) + (" " + scales[i] if scales[i] else ""))
        n //= 1000; i += 1
    return " ".join(parts)

def factors(n):
    f, d = [], 2
    while d * d <= n:
        while n % d == 0: f.append(d); n //= d
        d += 1
    if n > 1: f.append(n)
    return f

def main():
    today = datetime.date.today()
    prev = {}
    if OUT.exists():
        try: prev = json.loads(OUT.read_text())
        except Exception: prev = {}
    # Number of the day: 26331 on the 26th, otherwise a stable pseudo-random 5-digit number.
    seed = int(today.strftime("%Y%m%d"))
    n = 26331 if today.day == 26 else 10000 + (seed * 2633 + 31) % 90000
    f = factors(n)
    number = {
        "value": f"{n}",
        "factors": "prime" if len(f) == 1 else " × ".join(map(str, f)),
        "binary": bin(n)[2:],
        "hex": hex(n)[2:].upper(),
        "words": words(n),
        "date": today.isoformat(),
    }
    fx = prev.get("fx")
    try:
        with urllib.request.urlopen("https://open.er-api.com/v6/latest/USD", timeout=20) as r:
            j = json.load(r)
        if j.get("result") == "success":
            fx = {"base": "USD", "updated": j.get("time_last_update_utc", today.isoformat())[:16], "rates": j["rates"]}
    except Exception as e:
        print("fx fetch failed, keeping previous rates:", e, file=sys.stderr)
    OUT.write_text(json.dumps({"number": number, "fx": fx, "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}, indent=1))
    subprocess.run([sys.executable, str(ROOT / "scripts" / "build.py")], check=True)

if __name__ == "__main__":
    main()
