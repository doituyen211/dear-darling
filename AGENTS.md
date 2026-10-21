# AGENTS.md

Personal site for celebration letters: a public full-screen carousel of
occasions on `/`, and a PIN-protected experience per occasion at `/e/<id>`.
Vietnamese user-facing copy.

## Setup & commands

- `npm install` first — `node_modules` is gitignored and is usually absent.
- `npm run dev` → http://localhost:3000. `npm run build` / `npm run start` for production.
- `npm test` (Vitest + React Testing Library), `npm run typecheck` (`tsc --noEmit`).
- **No formatter, no CI, no ESLint config.**
  - `npm run build` also typechecks, so it is the real verification gate.
  - `npm run lint` runs `next lint`, which needs ESLint — it is not installed and
    there is no config, so it drops into an interactive "How would you like to
    configure ESLint?" prompt and hangs. Don't rely on it.
- `npm run typecheck` writes `tsconfig.tsbuildinfo`; it is gitignored, but delete
  it anyway if you see it in `git status`.
- **Don't run `next build` while `next dev` is running** — they share `.next` and
  the dev server ends up with `Cannot find module './vendor-chunks/...'` or
  `Next.js build worker exited with code: 3221226505`. Stop the dev server
  first, then build. If the dev server serves stale CSS after a change, kill the
  `next` processes by PID and restart it — deleting `.next` alone is not enough.
- Motion and pacing can only be judged in a browser. After a change, `npm run build`
  then open `/` and watch the reveal.

## Architecture — two layers, deliberately separate

```
/                    browse layer   PUBLIC. One occasion per screen, metadata only.
/e/<eventId>         detail layer   PIN gate → that occasion's experience.
```

- `app/page.tsx` — server component. Renders `<EventCarousel events={publishedEvents} />`.
- `app/e/[eventId]/page.tsx` — server component. `generateStaticParams`, `notFound()`
  for unknown ids, resolves the per-occasion PIN hash, renders `<EventExperience>`.
- `components/EventCarousel.tsx` — the slider: axis, autoplay, swipe, dots, play/pause.
- `components/event-covers/index.tsx` — **the cover registry**: `covers[id]` → component.
- `components/event-covers/<id>.tsx` — one full-screen composition per occasion.
- `components/EventExperience.tsx` — the detail layer. Routes on `event.experience`:
  `letter` → `EventStages` (frozen), `greeting` → `GreetingStage`.
- `components/GreetingStage.tsx` — the greeting experience: flowers + one centred line.
- `components/PinGate.tsx` — 6-digit PIN gate. Optional `pinHash` / `sessionScope` props.
- `components/MessageSequence.tsx` — plays `lines` one at a time. **Frozen.**
- `components/SplitText.tsx` — GSAP character reveal. **Frozen.**
- `components/FinalAudio.tsx` — native `<audio controls>`. **Frozen.**
- `components/patterns/daisy.tsx` — the five-petal daisy field.
- `components/patterns/daisy.tsx` — the daisy field: 36 flowers + 12 drifting petals.
- `components/patterns/daisy-flower.tsx` — one flower; its five petals open one by one.
- `components/patterns/daisy-petals.tsx` — the layer of petals drifting over the field.
- `components/hooks/useMediaQuery.ts` — `matchMedia` with cleanup.
- `components/hooks/usePrefersReducedMotion.ts` — motion-aware, hydration-safe.
- `components/hooks/useIsomorphicLayoutEffect.ts` — `useLayoutEffect` on the client only.
- `lib/flower.ts` — the flower's layout data and its timing constants.
- `data/events/index.ts` — registry of every occasion (**metadata only**), plus
  `EventTheme`, `LEGACY_THEME` and `themeFor()`.
- `data/events/<id>.ts` — the content of one occasion (`body` or `greeting`).
- `data/events/loaders.ts` — two dynamic-`import()` maps, one lazy chunk per occasion.
- `data/messages.ts` — the first letter's lines. **Frozen.**
- `data/security.ts` — SHA-256 hashes of the PINs.
- `lib/media.ts` — `WIDE_QUERY`, the single breakpoint used by CSS *and* JS.
- `lib/random.ts` — `seeded()`, deterministic randomness for SSR-safe patterns.- `app/layout.tsx` — loads Fraunces + Instrument Sans via `next/font/google`.
- `tailwind.config.ts` — Lovable palette tokens, the `wide` screen, `event-*` colors.

## Rules that are easy to break by accident

- **The registry and the covers must never contain or import the letter content.**
  `data/events/index.ts` must not import `data/events/<id>.ts`,
  `data/events/loaders.ts`, or `data/messages.ts`, and a cover must not import a
  content module either. `tests/events-registry.test.ts` enforces the first one,
  and also that no `preview` string contains any line of the letter.
- **The carousel must never mount `MessageSequence` / `SplitText`.** `SplitText` uses
  GSAP `ScrollTrigger`, whose trigger position is computed from the element's rect —
  inside a slide that is translated off-screen it never fires, so the letter hangs
  forever. The letter only exists on `/e/<id>`, where the page does not scroll.
- **The carousel must never touch authorization.** It does not import `PinGate` or
  `data/security.ts`. Autoplay / swiping / selecting an occasion can never grant access.
- **`thu-dau` is frozen.** The first occasion's experience — `MessageSequence`,
  `SplitText`, `FinalAudio`, `data/messages.ts` — must not change. `git diff`
  against `main` for those paths has to stay empty. It also does **not** declare a
  `theme`, so it keeps the legacy dark palette.
- **Themes are opt-in.** An occasion without `EventMeta.theme` uses `LEGACY_THEME`
  (the exact old colours) and must not be wrapped in a theme wrapper.
- **`prefers-reduced-motion`**: use `components/hooks/usePrefersReducedMotion.ts`, not
  framer-motion's `useReducedMotion`. The framer-motion hook returns `null` on the
  server but the real value on the client, which breaks hydration.
- **One breakpoint, one source.** `WIDE_QUERY` in `lib/media.ts` is imported by
  `tailwind.config.ts` (for the `wide:` screen) and by the carousel (for the axis).
  Vertical when portrait *and* narrow; horizontal when landscape *or* ≥ 768px.
- **One autoplay timer.** A single `setTimeout` re-armed by an effect keyed on
  `[canAutoplay, index, count, cycleDelay]`. Never use `setInterval` here — manual
  navigation must reset the countdown, and two live timers will fight.
- **PIN storage**: only the SHA-256 hex, never the digits (`data/security.ts` has the
  snippet to regenerate). The current codes are in use by the recipient — don't
  change them unless asked.
- **The PIN is not real security.** It is entirely client-side and 6 digits is 1M
  combinations. It is a privacy screen against casual link-sharing, nothing more.
  The letter text is also still served as a public static chunk, so a determined
  visitor can read it. True confidentiality would need a server-side gate.
- **"Remember me" is currently dead code.** `PinGate` writes `sessionStorage` on
  success but the read block in the mount effect is commented out, so a reload
  re-locks. The write is per-occasion (`letter-unlocked:<id>`), except the first
  occasion, which keeps the original `letter-unlocked` key.
- `gsap` is pinned `^3.15.0` under the free "no charge" license, so `gsap/SplitText`
  ships in the public package. No Club plugin install needed, and none is missing.
- `SplitText` waits on `document.fonts.ready` before animating
  (`components/SplitText.tsx:50-58`), so the first reveal is delayed until webfonts
  load. Don't "fix" that by removing the wait.
- Reduced motion is only partly wired: `MessageSequence` shortens its timers via
  framer-motion's `useReducedMotion` and `globals.css` collapses CSS animations, but
  the GSAP reveal in `SplitText` is not motion-aware.
- **The first letter takes **~159 seconds** to play** (0.1s per character stagger, and
  one line is 382 characters). Never put the letter inside a rotating carousel.
- **`seeded()` must stay rounded.** `Math.sin` differs between Node and the
  browser around the 11th decimal place — enough for React to report a
  hydration mismatch. `lib/random.ts` rounds to four decimals; anything
  derived from it inherits that.
- **A flower's petals pivot on `originX`/`originY` inside the `animate`
  target**, not as props. framer-motion computes `transform-origin` for SVG
  elements from the element's own bounding box, so without them a petal
  collapses toward the middle of the ellipse instead of the flower's centre.

## Testing quirks

- `tests/setup.ts` stubs `window.matchMedia` (jsdom has none) and exposes
  `setMediaQuery(query, matches)` / `resetMediaQueries()` for tests to drive it.
- framer-motion reads the media query `"(prefers-reduced-motion)"` (no `: reduce`);
  our own hook uses `"(prefers-reduced-motion: reduce)"`. Set the right one.
- **userEvent does not work with Vitest's fake timers** — it looks for a global
  `jest`, doesn't see the fake clock, and hangs. Use `fireEvent` in tests that need
  deterministic timing, and a separate `describe` with real timers for realistic
  interaction.
- RTL auto-cleanup needs `globals: true`; we don't use it, so `tests/setup.ts`
  calls `cleanup()` in an `afterEach` explicitly.
- GSAP splits the letter into per-character elements, so `getByText` fails. Query
  by the `aria-label` on the paragraph instead.

## Conventions

- Vietnamese for user-facing strings. **Code comments are mixed in this repo** —
  several original files use Vietnamese comments, others English. Match the file
  you are editing rather than converting it.
- Use the `@/` import alias (`@/*` → repo root): `@/components/...`, `@/data/...`.
- Tailwind classes only; no CSS modules. Palette comes from `tailwind.config.ts`.
- No Prettier or ESLint config — match the surrounding style (2-space indent, double
  quotes, semicolons, trailing commas).
- Commit messages are lowercase and informal, e.g. `update: wrap pin code for secure`.

## Adding an occasion

1. `data/events/<id>.ts` — a letter (`export const body: EventBody`) or a greeting
   (`export const greeting: GreetingBody`).
2. `components/event-covers/<id>.tsx` — its full-screen composition, registered in
   `components/event-covers/index.tsx`.
3. `data/events/index.ts` — an `EventMeta` entry (`id`, `occasion`, `title`, `date`,
   `preview`, `experience`, `order`, `published`, optional `theme`).
4. `data/events/loaders.ts` — one line in the matching import map.
5. `data/security.ts` — add the PIN hash to `EVENT_PIN_HASHES`.

The `preview` is shown before authentication — it must not quote the letter.
`DESIGN.md` has the full recipe and the design rules.
