import Link from "next/link";

export default function TrackingNotFound() {
  return (
    <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-ink">Bus not found</h1>
      <p className="text-sm text-body">
        This arrival is no longer listed, or tracking is unavailable for it.
      </p>
      <Link
        href="/home"
        className="rounded-[var(--radius-pill)] bg-primary px-5 py-3 text-sm font-medium text-on-primary"
      >
        Back to map
      </Link>
    </main>
  );
}
