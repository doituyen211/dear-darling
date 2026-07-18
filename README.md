# A Letter (Next.js)

A single-page site that reveals a short personal message one line at a
time, then opens into an audio recording the visitor presses play on
themselves.

## 1. Install

```bash
npm install
```

## 2. Run it locally

```bash
npm run dev
```

Open http://localhost:3000.

## 3. Replace the messages

Edit `data/messages.ts` — it's a plain string array:

```ts
export const messages: string[] = [
  "Hey.",
  "I wanted to tell you something...",
  // add, remove, or reorder lines freely
];
```

Keep each entry short (one sentence, roughly). Nothing else in the
project needs to change — `MessageSequence` just reads this array and
plays it back, one line at a time, with a fade between each.

## 4. Replace the audio

Drop your recording into:

```
public/audio/message.mp3
```

replacing the placeholder file of the same name. `FinalAudio.tsx`
already points at `/audio/message.mp3`, so no code change is needed.
If you'd rather use a different filename or format (e.g. `.wav`),
update the `<source src=... type=...>` line in
`components/FinalAudio.tsx`.

## 5. Build for production

```bash
npm run build
npm run start
```

Deploy the way you'd deploy any Next.js app (Vercel, or `next start`
behind any Node host).

---

## How the message sequence works

`app/page.tsx` holds one piece of state: whether the visitor is still
in the `"letter"` stage or has reached the `"audio"` stage.

`components/MessageSequence.tsx` drives the letter stage:

1. It renders the current message through `SplitText`, which reveals
   the sentence one character at a time.
2. `SplitText` calls `onLetterAnimationComplete` once every character
   has finished animating in.
3. The sentence then **holds** on screen for ~2.7 seconds.
4. It fades out over ~0.7 seconds.
5. After a short ~0.45 second pause, the next message begins — or, if
   that was the last message, `onComplete` fires and `page.tsx` swaps
   in `FinalAudio`.

All of the timing lives at the top of `MessageSequence.tsx` as three
constants (`HOLD_MS`, `EXIT_MS`, `PAUSE_MS`) if you want the pacing
faster, slower, or more even.

If the visitor's system has "reduce motion" turned on, `SplitText`
skips the character-by-character stagger and every wait shortens
considerably, so the message still reads clearly without relying on
motion.

## A note on "ReactBits' SplitText"

ReactBits (reactbits.dev) is a copy-paste component library rather
than an installable npm package, and its official `SplitText` build
is wired to GSAP's `SplitText` plugin — a paid Club GreenSock add-on.
The brief asked not to pull in GSAP unless it was strictly required,
so `components/SplitText.tsx` here is a small, from-scratch component
that reproduces the same visible behavior (characters animating in
one at a time, gently, staggered) using `framer-motion`, which was
already a dependency. Each character rises slightly and comes into
focus from a soft blur rather than fading flatly — that "resolving
into clarity" motion is the one deliberate signature touch on an
otherwise very quiet page.

If you do have access to the real ReactBits `SplitText` (with GSAP)
and prefer it, it's a drop-in swap: it exposes the same
`text` / `onLetterAnimationComplete` props this stand-in uses.

## Design notes

- **Background**: a near-black indigo gradient with one soft, slowly
  breathing gold glow behind the text — like a desk lamp, not a stage
  light.
- **Type**: Fraunces (serif, warm, a little literary) carries every
  message; Instrument Sans is reserved for the small helper line under
  the audio player so it never competes with the letter itself.
- **Audio player**: intentionally the plain native `<audio controls>`
  element, lightly tinted to match the palette — no custom JS player,
  no autoplay, no aggressive preloading (`preload="none"`).

## Project structure

```
app/
  layout.tsx        — loads Fraunces + Instrument Sans, page metadata
  page.tsx           — background + switches between letter/audio stages
  globals.css        — resets, reduced-motion handling, audio tinting
components/
  SplitText.tsx      — character-by-character reveal (see note above)
  MessageSequence.tsx — plays messages[] one at a time with pacing
  FinalAudio.tsx     — title, native <audio>, helper line
data/
  messages.ts        — the array you edit
public/audio/
  message.mp3        — replace with your recording
```

## Known audit note

`npm audit` may report a moderate-severity PostCSS advisory
(GHSA-qx2v-qp2m-jg93) nested inside Next.js's own internal build
tooling. It's a build-time-only dependency (not shipped to visitors)
and, at the time of writing, affects the internal PostCSS version
bundled by every current stable release of Next.js — there isn't yet
a non-breaking fix upstream. Worth revisiting with `npm audit` before
you deploy.
