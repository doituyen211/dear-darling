# AGENTS.md

Single-page Next.js 15 (App Router) site: a personal letter revealed one line at a
time, then an audio recording. Vietnamese user-facing copy, English code comments.

## Setup & commands

- `npm install` first — `node_modules` is gitignored and is usually absent.
- `npm run dev` → http://localhost:3000. `npm run build` / `npm run start` for production.
- **No test suite, no formatter, no CI, no ESLint config, no `typecheck` script.**
  - Typecheck: `npx tsc --noEmit`. It writes `tsconfig.tsbuildinfo` (the tsconfig
    sets `incremental: true`) and that file is **not** gitignored — delete it after
    typechecking or you will leave the tree dirty.
  - `npm run build` also typechecks (`next.config.mjs` does not set
    `typescript.ignoreBuildErrors`), so it is the real verification gate.
  - `npm run lint` runs `next lint`, which needs ESLint — it is not installed and
    there is no config, so it drops into an interactive "How would you like to
    configure ESLint?" prompt and hangs. Don't rely on it. (`next lint` is also
    deprecated in Next 15.5 and removed in Next 16.)
- Motion and pacing can only be judged in a browser. After a change, `npm run build`
  then open `/` and watch the reveal.

## Trust the code, not README.md

The README is stale in four ways that will bite you:

- Audio is `public/audio/message.m4a` (not `.mp3`); `components/FinalAudio.tsx:23`
  points at `/audio/message.m4a` with `type="audio/mp4"`. `public/audio/README.txt`
  is wrong too. Changing the file/format means editing that `<source>` line.
- `components/SplitText.tsx` is **GSAP** (`gsap/SplitText` + `ScrollTrigger`, driven by
  `@gsap/react`'s `useGSAP`), not the from-scratch framer-motion component the README
  describes.
- The audio element uses `preload="metadata"` (`components/FinalAudio.tsx:19`), not
  `preload="none"`.
- The README never mentions the PIN gate.

## Architecture

- `app/page.tsx` — client component. Owns the only app state, `stage: "letter" | "audio"`,
  and wraps the whole page in `<PinGate>`.
- `components/PinGate.tsx` — 6-digit PIN gate in front of everything.
- `components/MessageSequence.tsx` — plays `data/messages.ts` one line at a time.
  All pacing lives in three constants at the top: `HOLD_MS`, `EXIT_MS`, `PAUSE_MS`.
- `components/SplitText.tsx` — GSAP character-by-character reveal.
- `components/FinalAudio.tsx` — plain native `<audio controls>`. Keep it native.
- `data/messages.ts` — the letter text. Edit here to change content; nothing else.
- `data/security.ts` — SHA-256 hex of the PIN.
- `app/layout.tsx` — loads Fraunces + Instrument Sans via `next/font/google`.
- `tailwind.config.ts` — palette tokens `ink-*` / `candle-*`. Use these, not raw hex.

## Gotchas

- **PIN storage** (`data/security.ts`): store the SHA-256 hex of the PIN, never the
  digits. The file header has a copy-paste snippet for regenerating the hash. The
  default PIN is `000000` — change it before deploying.
- **"Remember me" is currently dead code.** `PinGate` writes
  `sessionStorage["letter-unlocked"]` on success (`components/PinGate.tsx:119`) but the
  read block in the mount effect is commented out (`components/PinGate.tsx:41-43`), so a
  reload re-locks. Uncomment to re-enable.
- The PIN is **not real security** — it is entirely client-side and 6 digits is 1M
  combinations. It is a privacy screen against casual link-sharing, nothing more.
- `gsap` is pinned `^3.15.0` under the free "no charge" license, so `gsap/SplitText`
  ships in the public package. No Club plugin install needed, and none is missing.
- `SplitText` waits on `document.fonts.ready` before animating (`components/SplitText.tsx:50-58`),
  so the first reveal is delayed until webfonts load. Don't "fix" that by removing the wait.
- Reduced motion is only partly wired: `MessageSequence` shortens its timers via
  framer-motion's `useReducedMotion` and `globals.css` collapses CSS animations, but the
  GSAP reveal in `SplitText` is not motion-aware. If you touch the animation, cover both paths.
- `MessageSequence` collects `setTimeout` handles in a ref and clears them on unmount
  (`components/MessageSequence.tsx:32-37`). Keep that pattern when adding delays.

## Conventions

- Vietnamese for user-facing strings, English for code comments. Keep it that way.
- Use the `@/` import alias (`@/*` → repo root): `@/components/...`, `@/data/...`.
- Tailwind classes only; no CSS modules. Palette comes from `tailwind.config.ts`.
- No Prettier or ESLint config — match the surrounding style (2-space indent, double
  quotes, semicolons, trailing commas).
- Commit messages are lowercase and informal, e.g. `update: wrap pin code for secure`.

## Rules

- Alway suggest commit message after done phase or task.
- Never commit code.
