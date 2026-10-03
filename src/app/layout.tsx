import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getCurrentUser, type Role } from "@/lib/auth";
import { NavLink } from "@/components/ui";
import { logout } from "./auth-actions";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Second Era", template: "%s · Second Era" },
  description: "Practical, company-backed training that turns students into verified, hire-ready candidates.",
};

const NAV: Record<Role | "guest", [string, string][]> = {
  guest: [["/courses", "Courses"], ["/jobs", "Jobs"], ["/plans", "Plans"]],
  student: [["/dashboard", "Dashboard"], ["/courses", "Courses"], ["/jobs", "Jobs"], ["/profile", "Profile"]],
  instructor: [["/dashboard", "My courses"], ["/courses", "Catalog"], ["/profile", "Profile"]],
  company: [["/dashboard", "Dashboard"], ["/courses", "Courses"], ["/profile", "Company profile"]],
  admin: [["/admin", "Admin"], ["/admin/users", "Users"], ["/admin/messages", "Messages"], ["/courses", "Courses"], ["/jobs", "Jobs"], ["/profile", "Profile"]],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line bg-surface">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3" aria-label="Main">
            <Link href="/" className="mr-4 text-lg font-semibold tracking-tight">
              Second <span className="text-brand">Era</span>
            </Link>
            {NAV[user && user.status === "active" ? user.role : "guest"].map(([href, label]) => (
              <NavLink key={href} href={href}>
                {label}
              </NavLink>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <>
                  <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
                  <form action={logout}>
                    <button className="rounded-md px-2 py-1 text-sm text-muted hover:bg-line/50 hover:text-foreground">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <NavLink href="/login">Log in</NavLink>
                  <Link href="/register" className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-ink">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          <Link href="/contact" className="hover:text-foreground">
            Contact &amp; support
          </Link>
          <span className="mx-2">·</span>Second Era, Helwan University BIS graduation project
        </footer>
      </body>
    </html>
  );
}
