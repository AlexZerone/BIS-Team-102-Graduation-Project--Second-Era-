import { cache } from "react";
import { cookies, headers } from "next/headers";
import { makeT, type Locale } from "./translate";

export const LOCALE_COOKIE = "lang";

/** The visitor's chosen language, else their browser's preference, else English. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (chosen === "ar" || chosen === "en") return chosen;
  return /^ar\b/i.test((await headers()).get("accept-language") ?? "") ? "ar" : "en";
});

/** Translator for server components and actions, cached per request. */
export const getT = cache(async () => makeT(await getLocale()));
