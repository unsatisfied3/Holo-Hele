"use client";

import type { LanguageOption } from "@/types/transit";
import { cn } from "@/lib/utils";

interface LanguageOptionRowProps {
  option: LanguageOption;
  selected: boolean;
  onSelect: (code: LanguageOption["code"]) => void;
}

export function LanguageOptionRow({
  option,
  selected,
  onSelect,
}: LanguageOptionRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.code)}
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-[var(--radius-md)] border px-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected
          ? "border-ink bg-canvas-softer"
          : "border-hairline bg-canvas hover:bg-canvas-softer",
      )}
      aria-pressed={selected}
    >
      <span className="text-sm font-medium text-ink">{option.nativeLabel}</span>
      <span
        aria-hidden="true"
        className={cn(
          "h-3.5 w-3.5 rounded-full border-2",
          selected ? "border-ink bg-ink" : "border-hairline bg-canvas",
        )}
      />
    </button>
  );
}
