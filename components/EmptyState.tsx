export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-night-850/40 px-6 py-10 text-center">
      <p className="font-display text-base font-semibold text-cl-white">{title}</p>
      <p className="mt-2 text-sm text-cl-muted">{detail}</p>
    </div>
  );
}
