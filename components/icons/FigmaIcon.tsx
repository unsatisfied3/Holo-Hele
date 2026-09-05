import { FIGMA_ICONS, type FigmaIconName } from "@/lib/figma-icons";

interface FigmaIconProps {
  name: FigmaIconName;
  size?: number;
  className?: string;
  alt?: string;
}

export function FigmaIcon({
  name,
  size = 20,
  className = "",
  alt = "",
}: FigmaIconProps) {
  return (
    <img
      src={FIGMA_ICONS[name]}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      aria-hidden={alt ? undefined : true}
    />
  );
}

export type { FigmaIconName };

/** Live ETA waves — tint via `text-live` (soon) or `text-body` (farther out). */
export function LiveSignalIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 10.3495 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.74748 0C1.20141 -1.96423e-08 0.759086 0.442325 0.75908 0.988396C0.75908 1.53447 1.2014 1.97679 1.74748 1.97679C5.40072 1.97679 8.37206 4.94948 8.37273 8.60205C8.37273 8.87508 8.48331 9.12217 8.66216 9.30101C8.841 9.47986 9.08809 9.59044 9.36113 9.59044C9.9072 9.59044 10.3499 9.14778 10.3495 8.60205C10.3488 3.85801 6.48946 -6.14386e-06 1.74748 0Z"
        fill="currentColor"
      />
      <path
        d="M1.39855 3.80919C0.852461 3.80918 0.410142 4.2515 0.410154 4.79759C0.410148 5.34366 0.852473 5.78599 1.39854 5.78598C3.14393 5.78598 4.56338 7.20612 4.56338 8.9515C4.56338 9.22454 4.67395 9.47164 4.85279 9.65048C5.03164 9.82932 5.27874 9.9399 5.55177 9.9399C6.09786 9.93991 6.54018 9.49759 6.54017 8.9515C6.54051 6.11636 4.23369 3.80885 1.39855 3.80919Z"
        fill="currentColor"
      />
      <path
        d="M0 8.76707C0 9.448 0.552003 10 1.23293 10C1.91386 10 2.46587 9.448 2.46587 8.76707C2.46587 8.08614 1.91386 7.53414 1.23293 7.53414C0.552003 7.53414 0 8.08614 0 8.76707Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Figma schedule/clock — tint via text color on the parent or className. */
export function ScheduleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16.5 16.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0.75 8.25C0.75 9.23491 0.943993 10.2102 1.3209 11.1201C1.69781 12.0301 2.25026 12.8569 2.9467 13.5533C3.64314 14.2497 4.46993 14.8022 5.37987 15.1791C6.28982 15.556 7.26509 15.75 8.25 15.75C9.23491 15.75 10.2102 15.556 11.1201 15.1791C12.0301 14.8022 12.8569 14.2497 13.5533 13.5533C14.2497 12.8569 14.8022 12.0301 15.1791 11.1201C15.556 10.2102 15.75 9.23491 15.75 8.25C15.75 6.26088 14.9598 4.35322 13.5533 2.9467C12.1468 1.54018 10.2391 0.75 8.25 0.75C6.26088 0.75 4.35322 1.54018 2.9467 2.9467C1.54018 4.35322 0.75 6.26088 0.75 8.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 4.08333V8.25L10.75 10.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Calendar date selector — tint via text color on the parent or className. */
export function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="4"
        width="15"
        height="13.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M2.5 8H17.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 2.5V5.5M14 2.5V5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Settings sliders — follows the same monochrome, tintable icon treatment. */
export function SettingsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 6H9M15 6H20M4 12H13M19 12H20M4 18H7M13 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Figma bus-stop sign icon used on nearby stop rows. */
export function BusStopSignIcon() {
  return (
    <div
      className="flex h-[29px] w-[33px] items-center justify-center rounded-[4px] border border-b-[3px] border-ink p-1.5"
      aria-hidden="true"
    >
      <FigmaIcon
        name="nearbyBusStopSign"
        size={17}
        className="h-[17px] w-[21px]"
      />
    </div>
  );
}

/** Figma route badge: bus icon + route number in a bordered box. */
export function RouteLineBadge({ route }: { route: string }) {
  return (
    <div
      className="box-border flex h-[30px] min-w-[3.25rem] shrink-0 items-center justify-center gap-1 rounded-[4px] border border-b-[3px] border-ink px-1.5 py-1"
      aria-hidden="true"
    >
      <FigmaIcon
        name="busRoute"
        size={14}
        className="h-[17px] w-[14px] shrink-0"
      />
      <span className="whitespace-nowrap text-base font-semibold leading-none text-ink">
        {route}
      </span>
    </div>
  );
}

/** Alert triangle used for service disruptions and rider notices. */
export function AlertTriangleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2.75 22 20.5H2L12 2.75Z" fill="currentColor" />
      <path
        d="M12 8V14M12 17.25H12.01"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
