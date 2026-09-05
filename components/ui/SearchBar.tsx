import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { useI18n } from "@/lib/i18n";

interface SearchBarProps {
  placeholder?: string;
  onActivate?: () => void;
}

export function SearchBar({
  placeholder,
  onActivate,
}: SearchBarProps) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t("Where to?");
  return (
    <div className="h-[49px] rounded-[var(--radius-pill)] border border-hairline bg-canvas px-[15px] transition-[transform,border-color,background-color] duration-150 ease-out hover:border-charcoal-400 focus-within:border-transit-blue has-[:active]:scale-[0.985] motion-reduce:transform-none">
      <label className="flex h-full items-center gap-2.5">
        <FigmaIcon name="search" size={24} className="h-6 w-6 shrink-0" />
        <input
          type="search"
          readOnly
          onClick={onActivate}
          onFocus={onActivate}
          placeholder={resolvedPlaceholder}
          aria-label={t("Search destination")}
          className="w-full bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none"
        />
      </label>
    </div>
  );
}
