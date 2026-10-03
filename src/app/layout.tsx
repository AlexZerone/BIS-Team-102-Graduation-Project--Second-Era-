import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { getCurrentUser, type Role } from "@/lib/auth";
import { btn } from "@/components/ui";
import { MobileMenu, NavLinks } from "@/components/site-nav";
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
  const links = NAV[user && user.status === "active" ? user.role : "guest"];
  const account = (vertical: boolean) =>
    user ? (
      <>
        <span className={`text-sm text-muted ${vertical ? "border-t border-line px-2 pt-3 pb-1" : ""}`}>{user.name}</span>
        <form action={logout}>
          <button className={`w-full rounded-md px-2 text-start text-sm text-muted hover:bg-line/50 hover:text-foreground ${vertical ? "py-3" : "py-1.5"}`}>
            Log out
          </button>
        </form>
      </>
    ) : (
      <>
        <NavLinks links={[["/login", "Log in"]]} vertical={vertical} />
        <Link href="/register" className={btn.primary}>
          Get started
        </Link>
      </>
    );

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-30 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="border-b border-line bg-surface">
          <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3" aria-label="Main">
            <Link href="/" className="me-4 text-lg font-semibold tracking-tight">
              Second <span className="text-brand">Era</span>
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              <NavLinks links={links} />
            </div>
            <div className="ms-auto hidden items-center gap-2 sm:flex">{account(false)}</div>
            <MobileMenu>
              <NavLinks links={links} vertical />
              {account(true)}
            </MobileMenu>
          </nav>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none">
          {children}
        </main>
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
