import { BottomNav } from "@/components/layout/BottomNav";

export function AppShell({
  children,
  hideBottomNav = false,
}: {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}) {
  return (
    <div className="app-shell">
      <div className="app-main">{children}</div>
      {hideBottomNav ? null : <BottomNav />}
    </div>
  );
}
