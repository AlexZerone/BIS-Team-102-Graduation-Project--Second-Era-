import type { Metadata } from "next";
import { getT } from "./server";

/** `export const generateMetadata = titled("Courses")`: a page title in the visitor's language. */
export const titled =
  (title: string) =>
  async (): Promise<Metadata> => ({ title: (await getT())(title) });
