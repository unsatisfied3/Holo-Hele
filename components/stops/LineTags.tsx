import { useI18n } from "@/lib/i18n";

interface LineTagsProps {
  lines: string[];
}

export function LineTags({ lines }: LineTagsProps) {
  const { t } = useI18n();
  return (
    <section className="border-b border-hairline bg-canvas px-4 py-4">
      <h2 className="text-sm font-bold text-ink">{t("Lines")}</h2>
      <div className="mt-3 flex flex-wrap gap-1">
        {lines.map((line) => (
          <span
            key={line}
            className="rounded-[2px] bg-canvas-soft px-1 py-1 text-xs text-ink"
          >
            {line}
          </span>
        ))}
      </div>
    </section>
  );
}
