"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btn } from "@/components/ui";

const EVERY_MS = 4000;
const MAX_TRIES = 15; // about a minute

/** Re-renders the page in place until the payment settles, then gives control back to the user. */
export function PaymentPoller() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, EVERY_MS);
    return () => clearTimeout(t);
  }, [tries, router]);

  if (tries < MAX_TRIES) return <p className="text-sm text-muted">Checking automatically…</p>;
  return (
    <div className="space-y-2" role="status">
      <p className="text-sm">
        This is taking longer than usual. If you completed the payment, it will still be applied. You can check again
        or come back later.
      </p>
      <button className={btn.secondary} onClick={() => setTries(0)}>
        Check again
      </button>
    </div>
  );
}
