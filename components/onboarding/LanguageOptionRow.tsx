"use client";

import type { LanguageOption } from "@/types/transit";
import { cn } from "@/lib/utils";

const LANGUAGE_ICON_PATHS: Record<LanguageOption["code"], string> = {
  en: "/icons/languages/us-circle.png",
  haw: "/icons/languages/hi-circle.png",
  ilo: "/icons/languages/ph-circle.png",
  tl: "/icons/languages/ph-circle.png",
  ja: "/icons/languages/jp-circle.png",
  zh: "/icons/languages/cn-circle.png",
  ko: "/icons/languages/kr-circle.png",
  vi: "/icons/languages/vn-circle.png",
};

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
    <label
      className={cn(
        "flex h-12 w-full cursor-pointer items-center justify-between rounded-[var(--radius-xs)] px-5 text-left transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-blue",
        selected
          ? "border-2 border-brand-blue bg-brand-blue-soft"
          : "border border-charcoal-400 bg-canvas hover:bg-canvas-soft",
      )}
    >
      <input
        checked={selected}
        className="sr-only"
        name="language"
        onChange={() => onSelect(option.code)}
        type="radio"
        value={option.code}
      />
      <span className="flex min-w-0 items-center gap-2">
        <img
          alt=""
          aria-hidden="true"
          className="h-6 w-6 shrink-0 rounded-full bg-brand-blue-subtle object-contain p-[5px]"
          data-language-icon={option.code}
          height={24}
          src={LANGUAGE_ICON_PATHS[option.code]}
          width={24}
        />
        <span className="truncate text-sm font-normal text-ink">
          {option.nativeLabel}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-ink" : "border-charcoal-400",
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full bg-brand-blue",
            !selected && "opacity-0",
          )}
        />
      </span>
    </label>
  );
}
