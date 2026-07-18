import {
  LiveSignalIcon,
  ScheduleIcon,
} from "@/components/icons/FigmaIcon";
import type { TheBusArrival } from "@/types/transit";

interface ArrivalTimeDisplayProps {
  arrival: TheBusArrival;
  colorNearLive?: boolean;
}

function isNearArrival(arrival: TheBusArrival): boolean {
  return arrival.minutesUntil != null && arrival.minutesUntil <= 20;
}

function arrivalToneClass(
  arrival: TheBusArrival,
  colorNearLive: boolean,
): "text-live" | "text-body" | "text-ink" {
  const near = isNearArrival(arrival);

  if (arrival.estimated && colorNearLive && near) {
    return "text-live";
  }

  if (colorNearLive && !near) {
    return "text-body";
  }

  return "text-ink";
}

export function ArrivalTimeDisplay({
  arrival,
  colorNearLive = false,
}: ArrivalTimeDisplayProps) {
  const toneClass = arrivalToneClass(arrival, colorNearLive);

  if (arrival.estimated && arrival.minutesUntil != null) {
    const label =
      arrival.minutesUntil === 0 ? "Now" : `${arrival.minutesUntil} min`;

    return (
      <div
        className={`flex shrink-0 items-center gap-1 text-sm font-semibold ${toneClass}`}
      >
        <LiveSignalIcon className={`h-2.5 w-2.5 shrink-0 ${toneClass}`} />
        <span>{label}</span>
      </div>
    );
  }

  if (arrival.estimated) {
    return (
      <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-body">
        <LiveSignalIcon className="h-2.5 w-2.5 shrink-0 text-body" />
        <span>{arrival.stopTime}</span>
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-end gap-1 ${toneClass}`}>
      <ScheduleIcon className={`mb-0.5 h-[11px] w-[11px] shrink-0 ${toneClass}`} />
      <div className="text-right leading-tight">
        <p className="text-sm font-semibold">{arrival.stopTime}</p>
        <p className="text-[9px] font-medium">Scheduled time</p>
      </div>
    </div>
  );
}
