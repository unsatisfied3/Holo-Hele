import { notFound } from "next/navigation";
import { TrackingScreen } from "@/components/tracking/TrackingScreen";
import { getStopById } from "@/lib/thebus/stops";

interface TrackPageProps {
  params: Promise<{ id: string; arrivalId: string }>;
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { id, arrivalId } = await params;
  const stop = getStopById(id);

  if (!stop) {
    notFound();
  }

  return <TrackingScreen stop={stop} arrivalId={arrivalId} />;
}
