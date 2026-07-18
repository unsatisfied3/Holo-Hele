import { QuickDestinationChips } from "@/components/transit/QuickDestinationChips";
import { SearchBar } from "@/components/ui/SearchBar";

export function SearchOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] px-4 pt-[max(env(safe-area-inset-top),2.5rem)]">
      <div className="pointer-events-auto space-y-2.5">
        <SearchBar />
        <QuickDestinationChips />
      </div>
    </div>
  );
}
