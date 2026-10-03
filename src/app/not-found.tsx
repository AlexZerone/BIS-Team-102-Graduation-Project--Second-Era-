import Link from "next/link";
import { btn } from "@/components/ui";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">
        It may have been removed, or the link is mistyped. Courses under review are only visible to their instructor.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/courses" className={btn.primary}>
          Browse courses
        </Link>
        <Link href="/dashboard" className={btn.secondary}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
