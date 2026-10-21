"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { coverFor } from "@/components/event-covers";
import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/components/hooks/usePrefersReducedMotion";
import { LEGACY_THEME, themeFor } from "@/data/events";
import type { EventMeta, EventTheme } from "@/data/events";
import { WIDE_QUERY } from "@/lib/media";

/** Bao lâu thì chuyển sang sự kiện tiếp theo. */
const AUTOPLAY_MS = 6500;
/** Lần đầu chờ lâu hơn, cho người xem kịp định hướng. */
const FIRST_DELAY_MS = 9000;
const SLIDE_DURATION = 0.6;
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
  // Mỗi sự kiện đều có một theme có hiệu lực: theme riêng, hoặc theme
  // cũ (đúng bằng màu hard-code của sự kiện đầu tiên).
  const theme: EventTheme = activeEvent ? themeFor(activeEvent) : LEGACY_THEME;

  // Vị trí của track. Track dài bằng `count` lần màn hình, nên lệch
  // 100/count % là đúng một màn hình.
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

  // Tab bị ẩn thì dừng chuyển sự kiện.
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

      if (
        Math.abs(distance) > SWIPE_DISTANCE ||
        Math.abs(velocity) > SWIPE_VELOCITY
      ) {
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
      <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-event-base">
        <p className="px-6 text-center font-serif text-2xl font-light italic text-event-ink">
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
      className="relative h-screen w-full overflow-hidden bg-event-base"
      style={themeVars(theme)}
      onPointerEnter={() => setIsInteracting(true)}
      onPointerLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={handleBlurCapture}
    >
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <motion.div
        className="flex h-full w-full"
        initial={{ x: "0%", y: "0%" }}
        animate={trackControls}
        style={{
          width: isWide ? `${count * 100}%` : "100%",
          height: isWide ? "100%" : `${count * 100}%`,
          flexDirection: isWide ? "row" : "column",
        }}
      >
        {events.map((event, slideIndex) => {
          const isActive = slideIndex === index;
          const Cover = coverFor(event);

          return (
            <motion.div
              key={event.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Sự kiện ${slideIndex + 1} trên ${count}: ${event.occasion}`}
              aria-hidden={isActive ? undefined : true}
              className="h-full shrink-0"
              style={{
                width: isWide ? `${100 / count}%` : "100%",
                height: isWide ? "100%" : `${100 / count}%`,
                pointerEvents: isActive ? "auto" : "none",
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
              <Cover event={event} isActive={isActive} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Chrome đặt trên các slide, màu theo sự kiện đang hiện. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-7">
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
                          ? "w-6 bg-event-accent"
                          : "w-1.5 bg-event-muted hover:bg-event-accent"
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
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border border-event-accent text-event-muted transition-colors hover:text-event-accent sm:ml-2"
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
          className="absolute inset-x-0 bottom-0 z-20 h-px bg-event-muted/30"
        >
          <motion.div
            key={index}
            className="h-full origin-left bg-event-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: cycleDelay / 1000, ease: "linear" }}
          />
        </div>
      ) : null}
    </section>
  );
}

function themeVars(theme: EventTheme): CSSVars {
  return {
    "--event-base": theme.base,
    "--event-surface": theme.surface,
    "--event-ink": theme.ink,
    "--event-muted": theme.muted,
    "--event-accent": theme.accent,
    "--event-accent-2": theme.accent2,
  };
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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-event-accent text-event-muted transition-colors hover:text-event-accent"
    >
      {children}
    </button>
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
