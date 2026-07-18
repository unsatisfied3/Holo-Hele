import { ArrivalTimeDisplay } from "@/components/transit/ArrivalTimeDisplay";
import { RouteLineBadge } from "@/components/icons/FigmaIcon";
import type { TheBusArrival } from "@/types/transit";

interface RouteArrivalRowProps {
  arrival: TheBusArrival;
}

export function RouteArrivalRow({ arrival }: RouteArrivalRowProps) {
  return (
    <article className="flex h-[67px] items-center gap-3 bg-canvas-muted pl-8 pr-4 py-2.5">
      <RouteLineBadge route={arrival.route} />

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug text-ink">{arrival.headsign}</h3>
      </div>

      <ArrivalTimeDisplay arrival={arrival} colorNearLive />
    </article>
  );
}
