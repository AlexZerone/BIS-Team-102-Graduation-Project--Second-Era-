import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { getCurrentUser, homeFor, type Role } from "@/lib/auth";
import { btn } from "@/components/ui";
import { MobileMenu, NavLinks } from "@/components/site-nav";
import { I18nProvider } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { setLocale } from "@/i18n/actions";
import { m } from "@/i18n/translate";
import { logout } from "./auth-actions";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Arabic glyphs; Latin text keeps Geist because it comes first in the font stack.
const plexArabic = IBM_Plex_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "500", "600"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: "Second Era", template: "%s · Second Era" },
    description: t("Practical, company-backed training that turns students into verified, hire-ready candidates."),
  };
}

const NAV: Record<Role | "guest", [string, string][]> = {
  guest: [["/courses", m("Courses")], ["/jobs", m("Jobs")], ["/plans", m("Plans")]],
  student: [["/dashboard", m("Dashboard")], ["/courses", m("Courses")], ["/jobs", m("Jobs")], ["/profile", m("Profile")]],
  instructor: [["/dashboard", m("My courses")], ["/courses", m("Catalog")], ["/profile", m("Profile")]],
  company: [["/dashboard", m("Dashboard")], ["/courses", m("Courses")], ["/profile", m("Company profile")]],
  admin: [["/admin", m("Admin")], ["/admin/users", m("Users")], ["/admin/messages", m("Messages")], ["/courses", m("Courses")], ["/jobs", m("Jobs")], ["/profile", m("Profile")]],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const links = NAV[user && user.status === "active" ? user.role : "guest"].map(([href, label]): [string, string] => [href, t(label)]);
  const other = t.locale === "ar" ? "en" : "ar";
  const languageSwitch = (vertical: boolean) => (
    <form action={setLocale.bind(null, other)}>
      <button
        lang={other}
        className={`w-full rounded-md px-2 text-start text-sm text-muted hover:bg-line/50 hover:text-foreground ${vertical ? "py-3" : "py-1.5"}`}
      >
        {other === "ar" ? "العربية" : "English"}
      </button>
    </form>
  );
  const account = (vertical: boolean) =>
    user ? (
      <>
        <bdi className={`text-sm text-muted ${vertical ? "block border-t border-line px-2 pt-3 pb-1" : ""}`}>{user.name}</bdi>
        <form action={logout}>
          <button className={`w-full rounded-md px-2 text-start text-sm text-muted hover:bg-line/50 hover:text-foreground ${vertical ? "py-3" : "py-1.5"}`}>
            {t("Log out")}
          </button>
        </form>
      </>
    ) : (
      <>
        <NavLinks links={[["/login", t("Log in")]]} vertical={vertical} />
        <Link href="/register" className={btn.primary}>
          {t("Get started")}
        </Link>
      </>
    );

  return (
    <html
      lang={t.locale}
      dir={t.dir}
      className={`${geistSans.variable} ${geistMono.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={t.locale}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-30 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
          >
            {t("Skip to content")}
          </a>
          <header className="border-b border-line bg-surface">
            <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3" aria-label={t("Main")}>
              <Link href={user ? homeFor(user.role) : "/"} dir="ltr" className="me-4 text-lg font-semibold tracking-tight">
                Second <span className="text-brand">Era</span>
              </Link>
              <div className="hidden items-center gap-1 sm:flex">
                <NavLinks links={links} />
              </div>
              <div className="ms-auto hidden items-center gap-2 sm:flex">
                {languageSwitch(false)}
                {account(false)}
              </div>
              <MobileMenu>
                <NavLinks links={links} vertical />
                {languageSwitch(true)}
                {account(true)}
              </MobileMenu>
            </nav>
          </header>
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none">
            {children}
          </main>
          <footer className="border-t border-line py-6 text-center text-sm text-muted">
            <Link href="/contact" className="hover:text-foreground">
              {t("Contact & support")}
            </Link>
            <span className="mx-2">·</span>
            {t("Second Era, Helwan University BIS graduation project")}
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
