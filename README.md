# Astral

Personalised cosmic dashboard — Western · Vedic · Kabbalah · Numerology · Chinese BaZi.

Enter your birth data, see your chart computed across five traditions simultaneously.

## Stack
- Single-file React rendered via Babel standalone (no build step)
- Static deploy on Vercel
- Realistic star-map background (8 constellations, ~850 stars)

## Local dev
```bash
python3 -m http.server 8787
open http://localhost:8787/
```

## Roadmap
- [ ] Phase 2 — astronomy-engine live Western/Vedic calc
- [ ] Auth (Clerk)
- [ ] Stripe — $9.99/mo paywall unlocks Vedic + Kabbalah + deep readings
- [ ] Share-your-chart URL encoding
- [ ] PDF export
