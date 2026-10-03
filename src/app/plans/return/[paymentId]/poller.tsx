"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btn } from "@/components/ui";
import { useT } from "@/i18n/client";

const EVERY_MS = 4000;
const MAX_TRIES = 15; // about a minute

/** Re-renders the page in place until the payment settles, then gives control back to the user. */
export function PaymentPoller() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const t = useT();
  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const timer = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, EVERY_MS);
    return () => clearTimeout(timer);
  }, [tries, router]);

  if (tries < MAX_TRIES) return <p className="text-sm text-muted">{t("Checking automatically…")}</p>;
  return (
    <div className="space-y-2" role="status">
      <p className="text-sm">
        {t("This is taking longer than usual. If you completed the payment, it will still be applied. You can check again or come back later.")}
      </p>
      <button className={btn.secondary} onClick={() => setTries(0)}>
        {t("Check again")}
      </button>
    </div>
  );
}
