interface LineTagsProps {
  lines: string[];
}

export function LineTags({ lines }: LineTagsProps) {
  return (
    <section className="border-b border-hairline bg-canvas px-4 py-4">
      <h2 className="text-sm font-bold text-ink">Lines</h2>
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
