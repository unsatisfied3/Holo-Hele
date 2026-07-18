"use client";

import Link from "next/link";
import { FigmaIcon } from "@/components/icons/FigmaIcon";
import type { StopLocation } from "@/types/transit";

interface StopDetailHeaderProps {
  stop: StopLocation;
}

const actionButtonClass =
  "inline-flex items-center justify-center rounded-[var(--radius-xs)] border border-charcoal-600 bg-canvas-softer p-2 text-ink";

export function StopDetailHeader({ stop }: StopDetailHeaderProps) {
  return (
    <div className="border-b border-charcoal-500 bg-canvas">
      <header className="flex items-center border-b border-hairline px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <Link
          href="/home"
          aria-label="Back to map"
          className="flex h-10 w-6 shrink-0 items-center justify-start text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-semibold text-ink">Stop</h1>
        <span className="h-10 w-6 shrink-0" aria-hidden="true" />
      </header>

      <section className="px-4 pb-4 pt-6">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-medium leading-snug text-ink">{stop.name}</h2>
            <p className="mt-2 text-xs text-body">Stop {stop.id}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button type="button" className={`${actionButtonClass} gap-1 px-2`}>
              <FigmaIcon name="schedule" size={20} className="h-5 w-5" />
              <span className="text-sm font-medium">Schedule</span>
            </button>
            <button type="button" aria-label="Show stop on map" className={actionButtonClass}>
              <FigmaIcon name="place" size={20} className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Save to favorites" className={actionButtonClass}>
              <FigmaIcon name="favorite" size={20} className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
