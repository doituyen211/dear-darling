import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { messages } from "@/data/messages";
import { covers } from "@/components/event-covers";
import {
  events,
  getEventById,
  publishedEvents,
  type EventMeta,
} from "@/data/events";
import { hasEventBody, loadEventBody } from "@/data/events/loaders";

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("event registry", () => {
  it("gives every event a unique id and a unique order", () => {
    const ids = events.map((event) => event.id);
    const orders = events.map((event) => event.order);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("publishes events in display order", () => {
    const orders = publishedEvents.map((event) => event.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("only publishes events that are marked published", () => {
    publishedEvents.forEach((event) => {
      expect(event.published).toBe(true);
    });
    expect(publishedEvents.length).toBe(
      events.filter((event) => event.published).length,
    );
  });

  it("has a body loader for every published event", () => {
    publishedEvents.forEach((event) => {
      expect(hasEventBody(event.id)).toBe(true);
    });
  });

  it("has its own cover for every published event", () => {
    publishedEvents.forEach((event) => {
      expect(covers[event.id]).toBeDefined();
    });
  });

  it("declares how each event is read", () => {
    events.forEach((event) => {
      expect(["letter", "greeting"]).toContain(event.experience);
    });
  });

  it("keeps dates parseable when they are set", () => {
    events.forEach((event) => {
      if (!event.date) return;
      expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(event.date))).toBe(false);
    });
  });

  it("looks events up by id", () => {
    expect(getEventById(publishedEvents[0].id)).toEqual(publishedEvents[0]);
    expect(getEventById("khong-ton-tai")).toBeUndefined();
  });

  it("exposes no content fields on the registry", () => {
    const forbidden = ["lines", "body", "load", "content", "audio"];
    events.forEach((event) => {
      forbidden.forEach((key) => {
        expect(event).not.toHaveProperty(key);
      });
    });
  });
});

describe("protected content never leaks into the public registry", () => {
  it("does not import any content module from the registry", () => {
    const source = readSource("data/events/index.ts");

    expect(source).not.toMatch(/from\s+["']\.\/(thu-dau|mua-20-10)["']/);
    expect(source).not.toMatch(/from\s+["']\.\/loaders["']/);
    expect(source).not.toMatch(/@\/data\/messages/);
  });

  it("keeps every preview free of the letter text", () => {
    const WINDOW = 30;

    events.forEach((event) => {
      messages.forEach((line) => {
        expect(event.preview).not.toContain(line);
        expect(line).not.toContain(event.preview);

        for (let i = 0; i + WINDOW <= line.length; i += 1) {
          expect(event.preview).not.toContain(line.slice(i, i + WINDOW));
        }
      });
    });
  });

  it("never puts message lines into a preview", () => {
    events.forEach((event) => {
      messages.forEach((line) => {
        expect(Object.values(event)).not.toContain(line);
      });
    });
  });
});

describe("event bodies", () => {
  it("loads the first letter unchanged", async () => {
    const body = await loadEventBody("thu-dau");

    expect(body).not.toBeNull();
    expect(body!.lines).toEqual(messages);
    expect(body!.audio).toEqual({
      src: "/audio/message.m4a",
      type: "audio/mp4",
    });
  });

  it("returns null for an event without a body", async () => {
    expect(await loadEventBody("khong-ton-tai")).toBeNull();
  });

  it("gives every published event at least one line to read", async () => {
    for (const event of publishedEvents) {
      const body = await loadEventBody(event.id);
      expect(body!.lines.length).toBeGreaterThan(0);
    }
  });
});
