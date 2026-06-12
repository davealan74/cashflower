# Cashflower 🌼

[![Built with Pollinations](https://img.shields.io/badge/Built%20with-Pollinations-8a2be2?style=for-the-badge)](https://pollinations.ai)

**Turn pollen into profit.** Cashflower is a bring-your-own-pollen (BYOP) web app for
[Pollinations.ai](https://pollinations.ai): six guided side-hustle pipelines that each end in a
sellable digital product, plus a ROI ledger that proves — in your own numbers — that you earned
more than the pollen cost.

**Live:** https://cashflower.cru2.net

## The idea

A flux image costs ~$0.002 of pollen. A six-print wall-art bundle built from those images sells
for $4–12 on Etsy. A 30-day social pack for a local café sells for $50–150. A winning freelance
proposal costs three text generations — about a fiftieth of a cent. The margin between what
generation costs and what finished products sell for is enormous; Cashflower packages that margin
into repeatable pipelines and then **keeps score**: every generation is priced into a local
ledger, every sale you log is set against it, and the dashboard shows your true multiplier.
Break even and the flower opens its first petal. Hit 1,000× and it blooms.

## The six tracks

| No. | Track | Deliverable | Sells for |
|-----|-------|-------------|-----------|
| 01 | Printable Art Studio | Wall-art bundle + Etsy listing copy | $4–12 |
| 02 | Print-on-Demand Designs | Shirt/mug graphics + titles & tags | $3–8/sale royalty |
| 03 | Social Pack Factory | 30-day caption calendar + 8 branded images + pitch | $50–150 |
| 04 | Voiceover Studio | Script + finished TTS narration + Fiverr gig copy | $15–60 |
| 05 | Proposal Forge | Tailored proposal + questions + work sample | $50–500 jobs |
| 06 | Content Engine | Outline, SEO article, meta copy, hero image | $30–150 |

Every track opens with the honest math: conservative pollen cost vs realistic market price vs
your time, plus a concrete path to the first sale.

## BYOP done right

- **One-click connect** via `enter.pollinations.ai/authorize` (key returns in the URL fragment —
  it never touches a server, because there is no server), with paste-key fallback.
- **Your key stays in your browser** — sessionStorage by default, localStorage only on explicit
  opt-in. Disconnect wipes it.
- **Strictly sequential** request queue: one generation in flight, never a retry storm.
- **Throttle-aware**: Pollinations returns a 768×512 placeholder instead of HTTP 429 when
  throttling; Cashflower detects the dimension mismatch and tells you instead of pretending.
- **402 vs 429 vs auth** errors are distinguished, explained, and never auto-retried.
- App earnings share enabled and disclosed — the app earns only when users generate, at no
  extra pollen cost to them.

## Stack

Vite + Svelte 5 (runes) + TypeScript. Pure static output — host it anywhere. Ledger in
IndexedDB, zip export via fflate, receipt cards rendered on canvas. No analytics, no tracking,
no backend.

```bash
npm install
npm run dev      # local dev server
npm test         # vitest unit suite (costs, ROI, BYOP parsing, track recipes)
npm run check    # svelte-check
npm run build    # static build to dist/
```

Optional: set `VITE_BYOP_CLIENT_ID` (or paste the `pk_` id in Settings) to enable the
one-click authorize button.

## Author

Built by **Dave Alan Caruana** / [Techmagic](https://techmagic.info), Malta.

© 2026 Dave Alan Caruana. MIT licence.
