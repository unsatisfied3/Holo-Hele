"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageOptionRow } from "@/components/onboarding/LanguageOptionRow";
import { Button } from "@/components/ui/Button";
import { languages } from "@/lib/mock/languages";
import { saveLanguage } from "@/lib/onboarding";
import type { LanguageCode } from "@/types/transit";

export default function LanguagePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<LanguageCode>("en");

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),3.5rem)]">
      <header className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-ink">Choose your language</h1>
        <p className="mt-1 text-sm text-body">
          Select your preferred language for Holo Hele.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto">
        {languages.map((option) => (
          <LanguageOptionRow
            key={option.code}
            option={option}
            selected={selected === option.code}
            onSelect={setSelected}
          />
        ))}
      </div>

      <div className="mt-6 px-2">
        <Button
          fullWidth
          onClick={() => {
            saveLanguage(selected);
            router.push("/onboarding/location");
          }}
        >
          Continue →
        </Button>
      </div>
    </main>
  );
}
