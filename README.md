# A Letter (Next.js)

A personal site for celebration letters. The home page is a public carousel of
the occasions inside it; each occasion opens into a short personal message
revealed one line at a time, then an audio recording the visitor presses play
on themselves. Every letter is behind a six-digit PIN.

## 1. Install

```bash
npm install
```

## 2. Run it locally

```bash
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm test          # Vitest
npm run typecheck # tsc --noEmit
npm run build     # also typechecks
npm run start     # production server
```

`npm run lint` is `next lint`, which needs ESLint — it is not installed and
there is no ESLint config, so it opens an interactive setup prompt instead of
linting. Use `npm run typecheck` and `npm run build` instead.

## 3. How it is put together

There are two layers, and they never touch:

```
/              browse layer    PUBLIC. Occasion cards only — no letter text.
/e/<eventId>   detail layer    PIN gate → letter → recording.
```

- **`/`** renders `components/EventCarousel.tsx`. It slides automatically
  through the occasions, one card in focus at a time. It contains **metadata
  only** — a title, a date, one short preview line and a lock badge.
- **`/e/<eventId>`** renders `components/EventExperience.tsx`, which puts the
  `PinGate` in front of the letter and then plays it. The letter body is
  fetched with a dynamic `import()` *after* the gate opens, so the text never
  ships in the home page's bundle.

### Files

```
app/
  layout.tsx              fonts + metadata (noindex)
  page.tsx                the carousel (public)
  e/[eventId]/page.tsx    one occasion: generateStaticParams, notFound(), PIN gate
  globals.css
components/
  EventCarousel.tsx       slider: axis, autoplay, swipe, dots, play/pause
  EventCard.tsx           one card — metadata only, links to /e/<id>
  EventExperience.tsx     detail layer: gate → letter → recording
  PinGate.tsx             6-digit PIN, SHA-256, per-event hash + session key
  MessageSequence.tsx     plays the lines one at a time
  SplitText.tsx           GSAP character-by-character reveal
  FinalAudio.tsx          native <audio controls>
  hooks/                  useMediaQuery, usePrefersReducedMotion
data/
  events/index.ts         registry of every occasion (metadata only)
  events/<id>.ts          the letter body of one occasion
  events/loaders.ts       import() map — one lazy chunk per occasion
  messages.ts             the first letter's lines (wrapped by events/thu-dau.ts)
  security.ts             SHA-256 hashes of the PINs
lib/
  media.ts                WIDE_QUERY — the one breakpoint, used by CSS and JS
```

## 4. Add an occasion

1. Write the letter in `data/events/<id>.ts`:

   ```ts
   import type { EventBody } from "./index";

   export const body: EventBody = {
     lines: [
       "Dòng đầu tiên của thư.",
       "Dòng thứ hai.",
     ],
     // audio: { src: "/audio/ten-file.m4a", type: "audio/mp4" },
   };
   ```

   Keep each line short. The reveal staggers at 0.1s per character, so a
   380-character line takes about 40 seconds on its own.

2. Register it in `data/events/index.ts`:

   ```ts
   {
     id: "mua-20-10",
     occasion: "Mùa 20/10",
     title: "Ngày của những người con gái",
     date: "2026-10-20",
     preview: "Một ngày để ghi nhớ, và một món quà nhỏ chỉ dành riêng cho em.",
     status: "ready",
     requiresPin: true,
     order: 0,
     published: true,
   }
   ```

   `preview` is shown **before** the PIN, so it must not quote the letter.

3. Add the loader in `data/events/loaders.ts`:

   ```ts
   "mua-20-10": () => import("./mua-20-10"),
   ```

4. Add a PIN in `data/security.ts` (see below).

That is all — the carousel picks the new card up automatically.

## 5. The PIN

Each letter has its own six-digit code. Only the SHA-256 hash is stored, in
`data/security.ts`:

```ts
export const PIN_HASH = "…";           // the default code
export const EVENT_PIN_HASHES = {
  "thu-dau": PIN_HASH,
  "mua-20-10": "…",
};
```

To change a code, generate its hash in the browser console (F12 → Console):

```js
crypto.subtle.digest("SHA-256", new TextEncoder().encode("123456"))
  .then(buf => console.log(
    [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("")
  ));
```

Copy the hex string into `data/security.ts`.

> The codes currently in use belong to the recipient. Change them only when
> asked.
>
> This is a light privacy screen, not real security: everything runs in the
> browser, and six digits is only a million combinations. The letter text also
> ships as a static chunk, so someone determined could still read it.

## 6. The carousel

- **Direction.** Vertical (portrait and narrow) or horizontal (landscape, or
  768px and wider). One breakpoint, `WIDE_QUERY` in `lib/media.ts`, feeds both
  the CSS and the JS so they cannot drift apart.
- **Autoplay.** Every 6.5 seconds, with a 9-second pause before the first
  change. It stops when you hover or focus the carousel, when the browser tab
  is hidden, and when the system asks for reduced motion. There is a play/pause
  button; the thin gold line along the bottom shows the progress of the
  current cycle.
- **Navigation.** Arrow buttons, dots, and swiping. Autoplay stops at the last
  occasion instead of looping; the arrows still wrap around.
- **Motion.** With `prefers-reduced-motion: reduce`, the carousel does not
  rotate on its own and slide changes are instant.

## 7. How the message sequence works

`components/MessageSequence.tsx` drives the letter stage:

1. It renders the current line through `SplitText`, which reveals the
   sentence one character at a time.
2. `SplitText` calls `onLetterAnimationComplete` once every character has
   finished animating in.
3. The sentence then **holds** on screen for ~2.7 seconds.
4. It fades out over ~0.7 seconds.
5. After a short ~0.45 second pause, the next line begins — or, if that was
   the last line, `onComplete` fires and the recording is shown.

All of the timing lives at the top of `MessageSequence.tsx` as three
constants (`HOLD_MS`, `EXIT_MS`, `PAUSE_MS`) if you want the pacing
faster, slower, or more even.

## 8. Design notes

- **Background**: a near-black indigo gradient with one soft, slowly
  breathing gold glow behind the text — like a desk lamp, not a stage
  light.
- **Type**: Fraunces (serif, warm, a little literary) carries every
  message; Instrument Sans is reserved for the small helper line under
  the audio player so it never competes with the letter itself.
- **Audio player**: intentionally the plain native `<audio controls>`
  element, lightly tinted to match the palette — no custom JS player,
  no autoplay, no aggressive preloading (`preload="metadata"`).
- **Motion**: one orchestrated moment per occasion, nothing scattered.
  `SplitText` resolves each character into focus from a soft blur rather
  than fading it flatly.

## 9. Tests

```bash
npm test
```

Vitest with React Testing Library. `tests/setup.ts` stubs `window.matchMedia`
(jsdom has none) and lets a test drive it with `setMediaQuery(query, matches)`.

- `tests/events-registry.test.ts` — registry integrity, plus guards that the
  public registry never imports the letter content and that no preview quotes
  a line of the letter.
- `tests/pin-gate.test.tsx` — the legacy gate's behaviour (right code opens,
  wrong code shows the same message, reload locks again) and per-event codes.
- `tests/event-carousel.test.tsx` — autoplay, manual navigation, focus
  behaviour, the empty and single-occasion cases, and reduced motion.
- `tests/event-experience.test.tsx` — the detail layer before and after unlock.
- `tests/home-page.test.tsx` — the home page shows no letter text.

## 10. Deploy

```bash
npm run build
npm run start
```

Or deploy to Vercel. There is no CI in this repository — deploy is manual.
`next/font/google` fetches the fonts at build time, so the build machine
needs network access.

## Known audit note

`npm audit` reports advisories in Tailwind CSS 3's build-time dependencies
(`braces`, `chokidar`, `fast-glob`, `micromatch`) and a PostCSS advisory
nested inside Next.js's own internal build tooling. None of them are shipped
to visitors. Clearing the Tailwind ones means migrating to Tailwind 4, which
rewrites the config format; the nested PostCSS one affects the version every
current Next.js release bundles. Worth a look with `npm audit` before you
deploy.
