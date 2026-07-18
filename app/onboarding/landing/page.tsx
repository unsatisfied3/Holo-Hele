"use client";

import { useRouter } from "next/navigation";
import { HoloHeleLogo } from "@/components/brand/HoloHeleLogo";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="app-shell flex min-h-dvh flex-col bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-20">
        <HoloHeleLogo />
      </div>

      <div aria-hidden="true" className="relative h-[358px] w-full overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-canvas-soft" />
        <div className="absolute inset-x-0 bottom-16 h-20 bg-canvas-softer" />
        <div className="absolute bottom-32 left-1/2 h-24 w-28 -translate-x-1/2 rounded-t-[var(--radius-xl)] bg-primary" />
        <div className="absolute bottom-24 left-1/4 h-16 w-3 rounded-full bg-ink/20" />
        <div className="absolute bottom-24 right-1/4 h-16 w-3 rounded-full bg-ink/20" />
      </div>

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <Button fullWidth onClick={() => router.push("/onboarding/language")}>
          Get started
        </Button>
      </div>
    </main>
  );
}
