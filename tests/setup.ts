import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { afterEach } from "vitest";

// React Testing Library chỉ tự động cleanup khi `globals: true` (khi đó
// `afterEach` là global). Ở đây ta import tường minh để mỗi test bắt
// đầu với DOM sạch.
afterEach(() => {
  cleanup();
});

/**
 * jsdom does not implement `window.matchMedia`, and both framer-motion
 * (`useReducedMotion`) and our own `useMediaQuery` hook depend on it.
 * This mock keeps a per-query match state that tests can drive through
 * `setMediaQuery`.
 */
type MediaListener = (event: MediaQueryListEvent) => void;

const matchState = new Map<string, boolean>();
const listeners = new Map<string, Set<MediaListener>>();

function notify(query: string) {
  const event = {
    matches: matchState.get(query) ?? false,
    media: query,
  } as MediaQueryListEvent;
  listeners.get(query)?.forEach((listener) => listener(event));
}

window.matchMedia = ((query: string) => ({
  get matches() {
    return matchState.get(query) ?? false;
  },
  media: query,
  onchange: null,
  addEventListener: (_type: string, listener: MediaListener) => {
    if (!listeners.has(query)) listeners.set(query, new Set());
    listeners.get(query)!.add(listener);
  },
  removeEventListener: (_type: string, listener: MediaListener) => {
    listeners.get(query)?.delete(listener);
  },
  // Legacy API, still used by some libraries.
  addListener: (listener: MediaListener) => {
    if (!listeners.has(query)) listeners.set(query, new Set());
    listeners.get(query)!.add(listener);
  },
  removeListener: (listener: MediaListener) => {
    listeners.get(query)?.delete(listener);
  },
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

/** Set the match state of a media query and notify its listeners. */
export function setMediaQuery(query: string, matches: boolean) {
  matchState.set(query, matches);
  notify(query);
}

/**
 * Đưa mọi media query về trạng thái "không khớp" và báo cho các listener
 * biết. Không xoá danh sách listener, vì framer-motion đăng ký listener
 * của riêng nó (`(prefers-reduced-motion)`) và cần nó còn sống.
 */
export function resetMediaQueries() {
  matchState.clear();
  listeners.forEach((set, query) => {
    set.forEach((listener) =>
      listener({
        matches: false,
        media: query,
      } as MediaQueryListEvent),
    );
  });
}

// jsdom has no FontFaceSet, and `SplitText` reads `document.fonts.status`.
// GSAP cũng đăng ký listener trên `document.fonts`, nên polyfill phải là
// một EventTarget đầy đủ.
if (!("fonts" in document)) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      status: "loaded",
      ready: Promise.resolve(),
      add: () => {},
      load: () => Promise.resolve([]),
      check: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    },
  });
}

// jsdom's crypto does not implement SubtleCrypto, which `PinGate` needs.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto,
  });
}
