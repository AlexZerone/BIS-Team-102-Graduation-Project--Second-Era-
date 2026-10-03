"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Locale } from "./translate";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Translator for client components. */
export function useT() {
  const locale = useContext(LocaleContext);
  return useMemo(() => makeT(locale), [locale]);
}
