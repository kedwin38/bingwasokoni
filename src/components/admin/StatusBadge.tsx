export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: "bg-signal-soft text-forest-dark",
    PENDING: "bg-amber/20 text-amber-dark",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-red-100 text-red-700",
    TIMEOUT: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-cream-deep text-slate"}`}>
      {status}
    </span>
  );
}
