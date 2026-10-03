import { getT } from "@/i18n/server";

/** Shown instantly while a server-rendered page loads, so navigation never looks frozen. */
export default async function Loading() {
  const t = await getT();
  return (
    <div role="status" aria-label={t("Loading")} className="animate-pulse space-y-6 motion-reduce:animate-none">
      <div className="h-8 w-64 max-w-full rounded-md bg-line" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
