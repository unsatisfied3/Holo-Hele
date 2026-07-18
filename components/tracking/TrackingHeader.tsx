import Link from "next/link";
import { FigmaIcon } from "@/components/icons/FigmaIcon";

interface TrackingHeaderProps {
  stopId: string;
}

export function TrackingHeader({ stopId }: TrackingHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-canvas pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="pointer-events-auto flex items-center px-3 pb-3">
        <Link
          href={`/stops/${stopId}`}
          aria-label="Back to stop"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-ink">Tracking</h1>
        <span className="h-10 w-10 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
