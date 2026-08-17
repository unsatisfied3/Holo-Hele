import { Link } from "@tanstack/react-router";
import { ArrivalTimeDisplay } from "@/components/transit/ArrivalTimeDisplay";
import { RouteLineBadge } from "@/components/icons/FigmaIcon";
import type { TheBusArrival } from "@/types/transit";

interface StopArrivalItemProps {
  stopId: string;
  arrival: TheBusArrival;
  trackingAvailable?: boolean;
}

export function StopArrivalItem({
  stopId,
  arrival,
  trackingAvailable = true,
}: StopArrivalItemProps) {
  const content = (
    <>
      <RouteLineBadge route={arrival.route} />

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug text-ink">{arrival.headsign}</h3>
      </div>

      <ArrivalTimeDisplay arrival={arrival} colorNearLive />
    </>
  );

  if (!trackingAvailable) {
    return (
      <div className="flex min-h-[67px] items-center gap-3 px-4 py-3">
        {content}
      </div>
    );
  }

  return (
    <Link
      to="/stops/$id/track/$arrivalId"
      params={{ id: stopId, arrivalId: arrival.id }}
      className="flex min-h-[67px] items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
    >
      {content}
    </Link>
  );
}
