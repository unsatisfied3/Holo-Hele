import { notFound } from "next/navigation";
import { StopDetailScreen } from "@/components/stops/StopDetailScreen";
import { getStopById } from "@/lib/thebus/stops";

interface StopPageProps {
  params: Promise<{ id: string }>;
}

export default async function StopPage({ params }: StopPageProps) {
  const { id } = await params;
  const stop = getStopById(id);

  if (!stop) {
    notFound();
  }

  return <StopDetailScreen stop={stop} />;
}
