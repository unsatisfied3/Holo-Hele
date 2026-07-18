import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { Chip } from "@/components/ui/Chip";

export function QuickDestinationChips() {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip icon={<FigmaIcon name="home" size={18} className="h-[18px] w-[18px]" />}>
        Home
      </Chip>
      <Chip icon={<FigmaIcon name="work" size={18} className="h-[18px] w-[18px]" />}>
        Work
      </Chip>
      <Chip icon={<FigmaIcon name="other" size={18} className="h-[18px] w-[18px]" />}>
        Other
      </Chip>
    </div>
  );
}
