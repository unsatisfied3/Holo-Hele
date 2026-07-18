import { AppShell } from "@/components/layout/AppShell";

export default function HelpPage() {
  return (
    <AppShell>
      <main className="flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-ink">Help</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-body">
          Transit help and support content will be added in a future update.
        </p>
      </main>
    </AppShell>
  );
}
