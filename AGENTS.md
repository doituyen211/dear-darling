# AGENTS.md

Personal site for celebration letters: a public carousel of occasions on `/`, and
a PIN-protected letter + recording per occasion at `/e/<id>`. Vietnamese
user-facing copy, English code comments.

## Setup & commands

- `npm install` first — `node_modules` is gitignored and is usually absent.
- `npm run dev` → http://localhost:3000. `npm run build` / `npm run start` for production.
- `npm test` (Vitest), `npm run typecheck` (`tsc --noEmit`).
- **No test-free repo, no formatter, no CI, no ESLint config.**
  - `npm run build` also typechecks, so it is the real verification gate.
  - `npm run lint` runs `next lint`, which needs ESLint — it is not installed and
    there is no config, so it drops into an interactive "How would you like to
    configure ESLint?" prompt and hangs. Don't rely on it.
- `npm run typecheck` writes `tsconfig.tsbuildinfo`; it is gitignored, but delete
  it anyway if you see it in `git status`.
- **Don't run `next build` while `next dev` is running** — they share `.next` and
  the dev server ends up with `Cannot find module './vendor-chunks/...'`. Stop the
  dev server, or delete `.next` and restart it.
- Motion and pacing can only be judged in a browser. After a change, `npm run build`
  then open `/` and watch the reveal.

## Architecture — two layers, deliberately separate

```
/                      browse layer   PUBLIC. Metadata only, no letter text.
/e/<eventId>           detail layer   PIN gate → letter → recording.
```

- `app/page.tsx` — server component. Renders `<EventCarousel events={publishedEvents} />`.
- `app/e/[eventId]/page.tsx` — server component. `generateStaticParams`, `notFound()`
  for unknown ids, resolves the per-event PIN hash, renders `<EventExperience>`.
- `components/EventCarousel.tsx` — the slider: axis, autoplay, drag, dots, play/pause.
- `components/EventCard.tsx` — one card. Metadata only; links to `/e/<id>`.
- `components/EventExperience.tsx` — the detail layer: `PinGate` → `EventStages`
  → `MessageSequence` → `FinalAudio`.
- `components/PinGate.tsx` — 6-digit PIN gate. Optional `pinHash` / `sessionScope` props.
- `components/MessageSequence.tsx` — plays `lines` one at a time. **Do not modify.**
- `components/SplitText.tsx` — GSAP character reveal. **Do not modify.**
- `components/FinalAudio.tsx` — native `<audio controls>`, optional `src` / `type`.
- `data/events/index.ts` — registry of **safe metadata** for every occasion.
- `data/events/<id>.ts` — the letter body of one occasion.
- `data/events/loaders.ts` — `import()` map, one lazy chunk per occasion.
- `data/messages.ts` — the first letter's lines. Untouched; wrapped by
  `data/events/thu-dau.ts`.
- `data/security.ts` — SHA-256 hashes of the PINs.
- `lib/media.ts` — `WIDE_QUERY`, the single breakpoint used by CSS *and* JS.
- `app/layout.tsx` — loads Fraunces + Instrument Sans via `next/font/google`.
- `tailwind.config.ts` — palette tokens `ink-*` / `candle-*`, plus the `wide` screen.

## Rules that are easy to break by accident

- **The carousel must never contain or import the letter content.** `data/events/index.ts`
  must not import `data/events/<id>.ts`, `data/events/loaders.ts`, or `data/messages.ts`.
  `tests/events-registry.test.ts` enforces this, and also that no `preview` string
  contains any line of the letter.
- **The carousel must never mount `MessageSequence` / `SplitText`.** `SplitText` uses
  GSAP `ScrollTrigger`, whose trigger position is computed from the element's rect —
  inside a slide that is translated off-screen it never fires, so the letter hangs
  forever. The letter only exists on `/e/<id>`, where the page does not scroll.
- **The carousel must never touch authorization.** It does not import `PinGate` or
  `data/security.ts`. Autoplay / swiping / selecting an event can never grant access.
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
  re-locks. The write is per-event (`letter-unlocked:<id>`), except the first
  occasion, which keeps the original `letter-unlocked` key.
- `gsap` is pinned `^3.15.0` under the free "no charge" license, so `gsap/SplitText`
  ships in the public package. No Club plugin install needed, and none is missing.
- `SplitText` waits on `document.fonts.ready` before animating
  (`components/SplitText.tsx:50-58`), so the first reveal is delayed until webfonts
  load. Don't "fix" that by removing the wait.
- Reduced motion is only partly wired: `MessageSequence` shortens its timers via
  framer-motion's `useReducedMotion` and `globals.css` collapses CSS animations, but
  the GSAP reveal in `SplitText` is not motion-aware.
- The first letter takes **~159 seconds** to play (0.1s per character stagger, and
  one line is 382 characters). Never put the letter inside a rotating carousel.

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

- Vietnamese for user-facing strings, English for code comments. Keep it that way.
- Use the `@/` import alias (`@/*` → repo root): `@/components/...`, `@/data/...`.
- Tailwind classes only; no CSS modules. Palette comes from `tailwind.config.ts`.
- No Prettier or ESLint config — match the surrounding style (2-space indent, double
  quotes, semicolons, trailing commas).
- Commit messages are lowercase and informal, e.g. `update: wrap pin code for secure`.

## Adding an occasion

1. `data/events/<id>.ts` — export `body: EventBody` (`lines`, optional `audio`).
2. `data/events/index.ts` — add an `EventMeta` entry (`id`, `occasion`, `title`,
   `date`, `preview`, `order`, `published`).
3. `data/events/loaders.ts` — add the `import()` line.
4. `data/security.ts` — add the PIN hash to `EVENT_PIN_HASHES` (omit it to reuse
   the default gate).

The `preview` is shown before authentication — it must not quote the letter.
