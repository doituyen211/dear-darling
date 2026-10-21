# A Letter (Next.js)

A personal site for celebration letters. The home page is a public, full-screen
carousel of the occasions inside it; each occasion opens into an experience
behind a six-digit PIN — a short personal message revealed one line at a time
and then an audio recording, or a one-line greeting on a field of flowers.

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

Two layers, and they never touch:

```
/              browse layer    PUBLIC. One occasion per screen — metadata only.
/e/<eventId>   detail layer    PIN gate → that occasion's experience.
```

- **`/`** renders `components/EventCarousel.tsx`. Each slide is a full screen
  rendered by that occasion's own cover (`components/event-covers/<id>.tsx`), so
  no two occasions look alike. It contains **metadata only** — a title, a date,
  one short preview line and a lock badge.
- **`/e/<eventId>`** renders `components/EventExperience.tsx`, which puts the
  `PinGate` in front of the occasion's content and then plays it. The content
  is fetched with a dynamic `import()` *after* the gate opens, so the text never
  ships in the home page's bundle.

### Files

```
app/
  layout.tsx              fonts + metadata (noindex)
  page.tsx                the carousel (public)
  e/[eventId]/page.tsx    one occasion: generateStaticParams, notFound(), PIN gate
  globals.css             design tokens, the daisy pattern, reduced-motion rules
components/
  EventCarousel.tsx       slider: axis, autoplay, swipe, dots, play/pause
  event-covers/
    index.tsx             the cover registry + a fallback cover
    <id>.tsx              one full-screen composition per occasion
  EventExperience.tsx     detail layer: gate → letter or greeting
  GreetingStage.tsx      a greeting: flowers + one centred line
  PinGate.tsx             6-digit PIN, SHA-256, per-occasion hash + session key
  MessageSequence.tsx     plays the lines one at a time
  SplitText.tsx           GSAP character-by-character reveal
  FinalAudio.tsx          native <audio controls>
  patterns/daisy.tsx      the five-petal daisy field
  hooks/                  useMediaQuery, usePrefersReducedMotion
data/
  events/index.ts         registry of every occasion (metadata only) + themes
  events/<id>.ts          the content of one occasion
  events/loaders.ts       import() maps — one lazy chunk per occasion
  messages.ts             the first letter's lines
  security.ts             SHA-256 hashes of the PINs
lib/
  media.ts                WIDE_QUERY — the one breakpoint, used by CSS and JS
  random.ts               seeded() — deterministic randomness, SSR-safe
DESIGN.md                 the design system and the rules for this site
```

## 4. Add an occasion

1. Write the content in `data/events/<id>.ts`:

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

   For a one-line greeting instead of a letter:

   ```ts
   import type { GreetingBody } from "./index";

   export const greeting: GreetingBody = { text: "Chúc mừng 20/10 em" };
   ```

2. Give it a cover in `components/event-covers/<id>.tsx` — a full-screen
   composition, its own colours and its own layout — and register it in
   `components/event-covers/index.tsx`.

3. Register it in `data/events/index.ts`:

   ```ts
   {
     id: "mua-20-10",
     occasion: "Mùa 20/10",
     title: "Ngày của những người con gái",
     date: "2026-10-20",
     preview: "Một ngày để ghi nhớ, và một món quà nhỏ chỉ dành riêng cho em.",
     experience: "greeting",
     status: "ready",
     requiresPin: true,
     order: 0,
     published: true,
   }
   ```

   `preview` is shown **before** the PIN, so it must not quote the letter.

4. Add the loader in `data/events/loaders.ts` — in the map that matches the
   kind of content you wrote:

   ```ts
   // letters
   "mua-20-10": () => import("./mua-20-10"),
   // greetings
   "mua-20-10": () => import("./mua-20-10"),
   ```

5. Add a PIN in `data/security.ts` (see below).

## 5. The PIN

Each occasion has its own six-digit code. Only the SHA-256 hash is stored, in
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
  button; the thin line along the bottom shows the progress of the current
  cycle.
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

The full system is in `DESIGN.md`. In short:

- **Foundation**: a warm cream (`#f7f4ed`) ground with charcoal (`#1c1c1c`)
  text, every grey derived from charcoal at a different opacity, warm borders
  (`#eceae4`) instead of shadows, and soft focus shadows instead of hard
  outlines.
- **Type**: Fraunces (serif, warm, a little literary) carries every message;
  Instrument Sans is reserved for small helper copy.
- **Per occasion**: each one can declare its own `theme` and its own cover, so
  no two occasions look alike. The first occasion keeps its original dark
  palette exactly.
- **Audio player**: intentionally the plain native `<audio controls>`
  element, lightly tinted to match the palette — no custom JS player,
  no autoplay, no aggressive preloading (`preload="metadata"`).
- **Motion**: one orchestrated moment per occasion, nothing scattered.

## 9. Tests

```bash
npm test
```

Vitest with React Testing Library. `tests/setup.ts` stubs `window.matchMedia`
(jsdom has none) and lets a test drive it with `setMediaQuery(query, matches)`.

- `tests/events-registry.test.ts` — registry integrity, plus guards that the
  public registry never imports the letter content and that no preview quotes
  a line of the letter.
- `tests/pin-gate.test.tsx` — the gate's behaviour (right code opens, wrong code
  shows the same message, reload locks again) and per-occasion codes.
- `tests/event-carousel.test.tsx` — autoplay, manual navigation, focus
  behaviour, the empty and single-occasion cases, and reduced motion.
- `tests/event-experience.test.tsx` — the detail layer before and after unlock.
- `tests/patterns.test.tsx` — the daisy field.
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
