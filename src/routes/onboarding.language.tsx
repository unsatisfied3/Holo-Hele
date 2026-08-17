import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LanguageOptionRow } from "@/components/onboarding/LanguageOptionRow";
import { languages } from "@/lib/mock/languages";
import { saveLanguage } from "@/lib/onboarding";
import type { LanguageCode } from "@/types/transit";

export const Route = createFileRoute("/onboarding/language")({
  component: LanguagePage,
});

function LanguagePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<LanguageCode>("en");

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),2.875rem)] pt-[max(env(safe-area-inset-top),3.5rem)]">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-ink">Choose your language</h1>
        <p className="mt-1 text-sm text-body">
          Select your preferred language for Holo Hele.
        </p>
      </header>

      <fieldset className="m-0 flex min-w-0 flex-1 flex-col gap-3.5 overflow-y-auto border-0 p-0">
        <legend className="sr-only">Choose your language</legend>
        {languages.map((option) => (
          <LanguageOptionRow
            key={option.code}
            option={option}
            selected={selected === option.code}
            onSelect={setSelected}
          />
        ))}
      </fieldset>

      <div className="mt-6">
        <button
          className="flex h-10 w-full items-center justify-center rounded-[var(--radius-md)] bg-brand-blue px-5 text-sm font-normal text-on-primary transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          type="button"
          onClick={() => {
            saveLanguage(selected);
            void navigate({ to: "/onboarding/location" });
          }}
        >
          Continue →
        </button>
      </div>
    </main>
  );
}
