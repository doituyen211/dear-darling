import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventExperience from "@/components/EventExperience";
import { events, getEventById } from "@/data/events";
import { EVENT_PIN_HASHES, sessionScopeFor } from "@/data/security";

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

export function generateStaticParams() {
  return events
    .filter((event) => event.published)
    .map((event) => ({ eventId: event.id }));
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = getEventById(eventId);

  return {
    title: event ? event.title : "Không tìm thấy sự kiện",
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const event = getEventById(eventId);

  if (!event || !event.published) {
    notFound();
  }

  const pinHash = EVENT_PIN_HASHES[eventId];

  return (
    <EventExperience
      event={event}
      pinHash={pinHash}
      sessionScope={sessionScopeFor(eventId, pinHash)}
    />
  );
}
