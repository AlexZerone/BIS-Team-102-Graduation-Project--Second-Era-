import { ar } from "./ar";

// English text is the key: t("Courses") is looked up in the Arabic dictionary and falls back
// to the English itself, so a missing translation shows English instead of breaking.

export type Locale = "en" | "ar";
/** Values are shown as-is (user data is never translated) unless marked `{ key }`. */
export type Params = Record<string, string | number | { key: string }>;

export const LOCALES: Locale[] = ["en", "ar"];

/** Marks a string for translation without translating it yet (server messages, labels). */
export const m = <S extends string>(s: S) => s;

// Western digits in Arabic too: consistent with codes, phone numbers and scores.
const INTL: Record<Locale, string> = { en: "en-GB", ar: "ar-EG-u-nu-latn" };

export function translate(locale: Locale, key: string, params?: Params): string {
  const s = locale === "ar" ? (ar[key] ?? key) : key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    if (v === undefined) return "";
    if (typeof v === "number") return new Intl.NumberFormat(INTL[locale]).format(v);
    if (typeof v === "object") return locale === "ar" ? (ar[v.key] ?? v.key) : v.key;
    // First-strong isolate (like <bdi>): an English title inside an Arabic sentence, or the
    // reverse, keeps its own direction instead of scrambling the punctuation around it.
    return `⁨${v}⁩`;
  });
}

// Display names for enum values stored in the database.
export const ENUM_LABELS: Record<string, string> = {
  beginner: m("Beginner"),
  intermediate: m("Intermediate"),
  advanced: m("Advanced"),
  draft: m("Draft"),
  pending: m("Pending"),
  published: m("Published"),
  rejected: m("Rejected"),
  active: m("Active"),
  completed: m("Completed"),
  suspended: m("Suspended"),
  submitted: m("Submitted"),
  shortlisted: m("Shortlisted"),
  hired: m("Hired"),
  open: m("Open"),
  closed: m("Closed"),
  resolved: m("Resolved"),
  internship: m("Internship"),
  full_time: m("Full-time"),
  part_time: m("Part-time"),
  student: m("Student"),
  instructor: m("Instructor"),
  company: m("Company"),
  admin: m("Admin"),
};

export function makeT(locale: Locale) {
  const t = (key: string, params?: Params) => translate(locale, key, params);
  const dateFmt = new Intl.DateTimeFormat(INTL[locale], { day: "numeric", month: "short", year: "numeric" });
  const numFmt = new Intl.NumberFormat(INTL[locale]);
  return Object.assign(t, {
    locale,
    dir: (locale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
    date: (d: Date | null) => (d ? dateFmt.format(d) : "—"),
    num: (n: number) => numFmt.format(n),
    egp: (n: number) => (locale === "ar" ? `${numFmt.format(n)} ج.م` : `${numFmt.format(n)} EGP`),
    label: (v: string) => t(ENUM_LABELS[v] ?? v),
  });
}

export type T = ReturnType<typeof makeT>;
