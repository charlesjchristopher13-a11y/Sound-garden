# Sound Garden

Sound-first phonics practice for kindergarten learners and the grown-ups who help them. Children pick a picture,
hear a sound or blend, say it out loud and play a short listening game.

Version 4 rebuilds the v3 app (one `index.html` + `app.js`) as an installable, offline-capable web app. It keeps all
159 cards and every sound file.

## What's new in v4

| Area | v3 | v4 |
| --- | --- | --- |
| First screen | 73 two-sound blends | **Today's practice**: the next 5 cards on a beginner path, one tap to start |
| Links | One URL for everything | Every set, filter, search and card has its own URL; browser Back works |
| Audio | New `<audio>` element per tap | Web Audio: decoded once, starts on finger-down, plays through the iPhone silent switch, preloads the next card |
| Progress | One list of starred card numbers | Learners, dated tries, grown-up ratings (needs practice / secure), Sound Hunt results, backup and restore, visible save errors |
| Card IDs | Array positions | Stable ids (`bl`, `end-sk`, `short-a`); old stars migrate automatically |
| Labels | Sound and spelling mixed | `spelling` and `phonemes` stored separately |
| Sound Hunt | Blends or singles, random | Grown-up picks the pool, balanced rounds, no same-sound distractors, pictures-only option, results saved |
| Offline | No | Installable app; everything, including all audio (~3 MB), is cached |
| Accessibility | Partial | WCAG 2.2 AA checked with axe in light and dark mode, focus management, 48–64px targets, reduced motion, Andika font |

## Stack

- [SvelteKit 3](https://svelte.dev/docs/kit) + Svelte 5 + TypeScript, built with `adapter-static`. Every route is
  prerendered, so the `build/` folder runs on any static host.
- Web Audio API for playback (`src/lib/audio.svelte.ts`).
- IndexedDB via `idb-keyval` for progress (`src/lib/progress.svelte.ts`), with localStorage as a fallback.
- Service worker for offline use (`src/service-worker.ts`).
- [Andika](https://software.sil.org/andika/), a typeface designed for early readers, self-hosted.
- Vitest for unit tests; Playwright + axe-core for browser and accessibility tests.

## Getting started

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in build/
npm run preview    # serve the build
npm run check      # type-check
npm test           # unit + browser tests
```

Node 22.17 or newer is required.

## Project layout

```
src/
  lib/
    data/cards.json        the catalog (source of truth)
    catalog.ts             types, sets, families, search, beginner path
    audio.svelte.ts        sound player
    progress.svelte.ts     learners, ratings, storage, backup
    hunt.ts                Sound Hunt round generation
    components/            SoundButton, Tile
  routes/
    +page.svelte           Today's practice
    sounds/                set overview, grids, cards (/sounds/[set]/[card])
    play/                  Sound Hunt
    progress/              learners, summary, backup
    guide/                 grown-up guide
  service-worker.ts
static/audio/              sound files: clear/ single sounds, blends/ joined and slow blends
content/legacy/            the v3 app and its extracted catalog, kept for reference
scripts/build-catalog.mjs  the one-time v3 → v4 catalog migration
tests/unit, tests/e2e
```

## Editing content

Edit `src/lib/data/cards.json`. Rules:

- **Never change or reuse a card `id`.** Saved progress is keyed by it. To retire a card, delete it; progress for
  unknown ids is dropped on load.
- `spelling` is what's written on the card. `phonemes` is what the child hears, one entry per sound. Blend part
  buttons play `static/audio/clear/<phoneme>.mp3`.
- Audio paths are relative to `static/audio/`. `npm run test:unit` fails if any file is missing.
- `blend.advanced: true` labels a card "Extra challenge" and keeps it out of the beginner path and Sound Hunt.

### Known content follow-ups

From the project guide's priority list, still to do:

1. **One recorded voice** for core sounds and connected blends. Drop new files into `static/audio/` and update the
   paths; no code changes needed.
2. **Content review.** Single-sound cards still use their v3 sound label (e.g. `ā`) as `spelling`. A phonics specialist
   should set real spellings and a consistent phoneme notation, and check that `ct`, `rked` and similar cards are
   age-appropriate.
3. **Illustrations** to replace emoji, which look different on every device.

## Deploying

### GitHub Pages (current)

`.github/workflows/pages.yml` builds and publishes the site on every push to `main` (and the
`claude/lucid-cori-l2v8w8` branch). It is served at `https://<owner>.github.io/Sound-garden/`.

One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

To check a build the way Pages serves it:

```sh
BASE_PATH=/Sound-garden npm run test:e2e
```

The browser tests use `tests/static-server.mjs`, a strict server that behaves like GitHub Pages.

### Other hosts

`npm run build` writes a static site to `build/` that works on any static host. Set `BASE_PATH` when the site is not
at a domain root. `vercel.json` configures Vercel. Every page is `<path>/index.html`, and `404.html` is the fallback.

Progress is stored per browser and per site address, so learners who used v3 on the old address will see their
stars only if v4 is served from that same address. Otherwise, start fresh or enter them again.

## Privacy

No accounts, analytics or third-party requests. Learner names and progress stay in the browser. Backups are plain
JSON files the grown-up downloads.

## Credits

Sound recordings: [Phonicademy](https://phonicademy.com), used under its
[audio license](https://phonicademy.com/audio-license). Check that the license covers redistributing the files in
this repository before making it public.
