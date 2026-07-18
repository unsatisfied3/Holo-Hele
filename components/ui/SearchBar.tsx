import { FigmaIcon } from "@/components/icons/FigmaIcon";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Where to?" }: SearchBarProps) {
  return (
    <div className="h-[47px] rounded-[var(--radius-pill)] border border-hairline bg-canvas px-[15px]">
      <label className="flex h-full items-center gap-2.5">
        <FigmaIcon name="search" size={24} className="h-6 w-6 shrink-0" />
        <input
          type="search"
          readOnly
          placeholder={placeholder}
          aria-label="Search destination"
          className="w-full bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none"
        />
      </label>
    </div>
  );
}
