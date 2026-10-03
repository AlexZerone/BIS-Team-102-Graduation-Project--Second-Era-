import Link from "next/link";
import { btn } from "@/components/ui";
import { getT } from "@/i18n/server";
import { titled } from "@/i18n/metadata";

export const generateMetadata = titled("Page not found");

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="mt-2 text-2xl font-semibold">{t("We couldn't find that page")}</h1>
      <p className="mt-2 text-muted">
        {t("It may have been removed, or the link is mistyped. Courses under review are only visible to their instructor.")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/courses" className={btn.primary}>
          {t("Browse courses")}
        </Link>
        <Link href="/dashboard" className={btn.secondary}>
          {t("Go to dashboard")}
        </Link>
      </div>
    </div>
  );
}
