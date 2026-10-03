"use client";

import Link from "next/link";
import { btn } from "@/components/ui";
import { useT } from "@/i18n/client";

/** Unexpected server errors. The digest lets support find the matching server log entry. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-lg py-12 text-center" role="alert">
      <h1 className="text-2xl font-semibold">{t("Something went wrong")}</h1>
      <p className="mt-2 text-muted">
        {t("Nothing you entered was lost unless you were saving it. Try again, and if it keeps happening, contact support.")}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted">
          {t("Reference:")} <bdi>{error.digest}</bdi>
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className={btn.primary}>
          {t("Try again")}
        </button>
        <Link href="/contact" className={btn.secondary}>
          {t("Contact support")}
        </Link>
      </div>
    </div>
  );
}
