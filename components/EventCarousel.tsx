"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import type { PanInfo } from "framer-motion";
import EventCard from "@/components/EventCard";
import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/components/hooks/usePrefersReducedMotion";
import { WIDE_QUERY } from "@/lib/media";
import type { EventMeta } from "@/data/events";

/** Bao lâu thì chuyển sang sự kiện tiếp theo. */
const AUTOPLAY_MS = 6500;
/** Lần đầu chờ lâu hơn, cho người xem kịp định hướng. */
const FIRST_DELAY_MS = 9000;
const SLIDE_DURATION = 0.55;
const EASE = [0.22, 1, 0.36, 1] as const;
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

type CSSVars = React.CSSProperties & Record<`--${string}`, string | undefined>;

interface EventCarouselProps {
  /** Sự kiện đã công khai, đã sắp xếp theo thứ tự hiển thị. */
  events: EventMeta[];
}

export default function EventCarousel({ events }: EventCarouselProps) {
  const count = events.length;
  const [index, setIndex] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const isWide = useMediaQuery(WIDE_QUERY);
  const reducedMotion = usePrefersReducedMotion();
  const trackControls = useAnimation();
  const wasWide = useRef(isWide);
  const draggedRef = useRef(false);

  const activeEvent = events[index];

  // Vị trí của track. Dùng phần trăm theo kích thước của chính track:
  // track dài bằng `count` lần khung nhìn, nên lệch 100/count % = đúng
  // một khung nhìn.
  const offset = useMemo(() => {
    const percent = count > 0 ? (index * 100) / count : 0;
    return {
      x: isWide ? `-${percent}%` : "0%",
      y: isWide ? "0%" : `-${percent}%`,
    };
  }, [count, index, isWide]);

  // Track chuyển sang vị trí mới. Khi đổi trục (xoay máy, đổi kích
  // thước cửa sổ) thì nhảy thẳng, nếu không sẽ trượt chéo qua giữa.
  useEffect(() => {
    const axisChanged = wasWide.current !== isWide;
    wasWide.current = isWide;

    if (axisChanged) {
      trackControls.set(offset);
      return;
    }

    void trackControls.start({
      ...offset,
      transition: {
        duration: reducedMotion ? 0 : SLIDE_DURATION,
        ease: EASE,
      },
    });
  }, [offset, isWide, reducedMotion, trackControls]);

  // Tab bị ẩn thì dừng chuyển slide.
  useEffect(() => {
    const onVisibilityChange = () => setIsPageVisible(!document.hidden);

    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const canAutoplay =
    count > 1 &&
    !isUserPaused &&
    !isInteracting &&
    isPageVisible &&
    !reducedMotion;

  const cycleDelay = hasAdvanced ? AUTOPLAY_MS : FIRST_DELAY_MS;

  // Một `setTimeout` duy nhất, được cài lại mỗi khi index đổi. Nhờ vậy
  // điều hướng tay sẽ reset đồng hồ đếm ngược, và không bao giờ có hai
  // timer cùng sống.
  useEffect(() => {
    if (!canAutoplay) return;
    // Đã tới sự kiện cuối thì dừng hẳn, không lặp vòng.
    if (index >= count - 1) return;

    const timer = setTimeout(() => {
      setIndex(index + 1);
      setHasAdvanced(true);
    }, cycleDelay);

    return () => clearTimeout(timer);
  }, [canAutoplay, count, cycleDelay, index]);

  const go = useCallback(
    (step: number) => {
      if (count === 0) return;
      const next = (index + step + count) % count;
      setIndex(next);
      setHasAdvanced(true);
      setAnnouncement(
        `Sự kiện ${next + 1} trên ${count}: ${events[next].occasion}`,
      );
    },
    [count, events, index],
  );

  const goTo = useCallback(
    (target: number) => {
      setIndex(target);
      setHasAdvanced(true);
      setAnnouncement(
        `Sự kiện ${target + 1} trên ${count}: ${events[target].occasion}`,
      );
    },
    [count, events],
  );

  const togglePlay = useCallback(() => {
    if (isUserPaused) {
      // Đang ở sự kiện cuối thì bắt đầu lại từ đầu.
      if (index >= count - 1) {
        setIndex(0);
        setAnnouncement(`Sự kiện 1 trên ${count}: ${events[0].occasion}`);
      }
      setIsUserPaused(false);
    } else {
      setIsUserPaused(true);
    }
  }, [count, events, index, isUserPaused]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const distance = isWide ? info.offset.x : info.offset.y;
      const velocity = isWide ? info.velocity.x : info.velocity.y;

      if (Math.abs(distance) > SWIPE_DISTANCE || Math.abs(velocity) > SWIPE_VELOCITY) {
        go(distance < 0 ? 1 : -1);
      }

      // Vuốt rồi thả tay vẫn có thể sinh ra sự kiện click. Đánh dấu để
      // bỏ qua click đó, tránh mở nhầm sự kiện.
      if (Math.abs(distance) > 8) {
        draggedRef.current = true;
      }
    },
    [go, isWide],
  );

  const handleSlideClick = useCallback((event: React.MouseEvent) => {
    if (!draggedRef.current) return;
    draggedRef.current = false;
    event.preventDefault();
  }, []);

  const handleBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
        setIsInteracting(false);
      }
    },
    [],
  );

  if (count === 0) {
    return (
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-950">
        <Backdrop />
        <p className="relative z-10 px-6 text-center font-serif text-2xl font-light italic text-candle-light">
          Chưa có sự kiện nào để hiện.
        </p>
      </main>
    );
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Những dịp anh đã chuẩn bị cho em"
      className="relative flex h-screen h-dvh w-full flex-col items-center justify-center overflow-hidden bg-ink-950"
      onPointerEnter={() => setIsInteracting(true)}
      onPointerLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={handleBlurCapture}
    >
      <Backdrop />

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div className="relative z-10 flex h-full w-full max-w-5xl flex-col items-center justify-center gap-[clamp(0.75rem,2vh,1.75rem)] px-4 py-[clamp(1rem,3vh,2.5rem)]">
        <p className="text-center font-serif text-lg font-light italic text-candle-muted/80">
          Những dịp anh đã chuẩn bị cho em.
        </p>

        <div
          className="relative min-h-0 w-full max-h-[min(70vh,28rem)] flex-1 overflow-hidden"
        >
          <motion.div
            className="flex"
            initial={{ x: "0%", y: "0%" }}
            animate={trackControls}
            style={{
              width: isWide ? `${count * 100}%` : "100%",
              height: isWide ? "100%" : `${count * 100}%`,
              flexDirection: isWide ? "row" : "column",
            }}
          >
            {events.map((event, slideIndex) => {
              const distance = slideIndex - index;
              const isActive = distance === 0;
              const isNeighbour = Math.abs(distance) === 1;

              return (
                <motion.div
                  key={event.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Sự kiện ${slideIndex + 1} trên ${count}: ${event.occasion}`}
                  className="shrink-0"
                  aria-hidden={isActive ? undefined : true}
                  style={{
                    width: isWide ? `${100 / count}%` : "100%",
                    height: isWide ? "100%" : `${100 / count}%`,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  animate={{
                    opacity: isActive ? 1 : isNeighbour ? 0.28 : 0,
                    scale: isActive ? 1 : isNeighbour ? 0.9 : 0.85,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : SLIDE_DURATION,
                    ease: EASE,
                  }}
                  drag={isWide ? "x" : "y"}
                  dragConstraints={
                    isWide
                      ? { left: -180, right: 180, top: 0, bottom: 0 }
                      : { left: 0, right: 0, top: -180, bottom: 180 }
                  }
                  dragElastic={0.2}
                  dragSnapToOrigin
                  onDragEnd={handleDragEnd}
                  onClick={handleSlideClick}
                >
                  <div
                    className="mx-auto h-full w-full max-w-xl px-3 py-2"
                    style={
                      {
                        ...(event.accent
                          ? { "--event-accent": event.accent }
                          : {}),
                      } as CSSVars
                    }
                  >
                    <EventCard event={event} isActive={isActive} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {count > 1 ? (
            <>
              <NavButton label="Sự kiện trước" onClick={() => go(-1)}>
                <span aria-hidden="true">←</span>
              </NavButton>

              {events.map((event, dotIndex) => {
                const isCurrent = dotIndex === index;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => goTo(dotIndex)}
                    aria-label={`Xem sự kiện ${dotIndex + 1}: ${event.occasion}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className="flex h-11 w-8 items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isCurrent
                          ? "w-6 bg-candle-gold"
                          : "w-1.5 bg-candle-muted/40 hover:bg-candle-muted"
                      }`}
                    />
                  </button>
                );
              })}

              <NavButton label="Sự kiện sau" onClick={() => go(1)}>
                <span aria-hidden="true">→</span>
              </NavButton>
            </>
          ) : null}

          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={!isUserPaused}
            aria-label="Tự động chuyển sự kiện"
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border border-candle-muted/25 text-candle-muted transition-colors hover:border-candle-gold/60 hover:text-candle-gold focus-visible:border-candle-gold/70 sm:ml-2"
          >
            {isUserPaused ? <PlayIcon /> : <PauseIcon />}
          </button>
        </div>
      </div>

      {/* Thanh tiến trình của lượt tự động, nằm sát đáy màn hình nên
          không chiếm thêm chiều cao nào. */}
      {canAutoplay ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-candle-muted/10"
        >
          <motion.div
            key={index}
            className="h-full origin-left bg-candle-gold/60"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: cycleDelay / 1000, ease: "linear" }}
          />
        </div>
      ) : null}
    </section>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-candle-muted/25 text-candle-muted transition-colors hover:border-candle-gold/60 hover:text-candle-gold focus-visible:border-candle-gold/70"
    >
      {children}
    </button>
  );
}

function Backdrop() {
  return (
    <>
      {/* Quiet background: a warm gradient wash plus a single soft
        glow behind the text, like a lamp on a desk. Nothing here
        competes with the words. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-950 to-black" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-candle-gold/10 blur-[120px] animate-glow-pulse" />
    </>
  );
}

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <rect x="4" y="3" width="3" height="10" rx="1" />
      <rect x="9" y="3" width="3" height="10" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M5 3.8v8.4a.8.8 0 0 0 1.22.68l6.4-4.2a.8.8 0 0 0 0-1.36l-6.4-4.2A.8.8 0 0 0 5 3.8Z" />
    </svg>
  );
}
