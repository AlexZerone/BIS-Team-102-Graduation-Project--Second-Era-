import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { ar } from "./ar";
import { makeT, translate } from "./translate";

const SRC = fileURLToPath(new URL("..", import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.includes(".test.") ? [p] : [];
  });

const STR = `"((?:[^"\\\\\\n]|\\\\.)+)"`;
const EVERYWHERE = [
  new RegExp(`\\b(?:t|m|titled)\\(\\s*${STR}`, "g"),
  new RegExp(`new DomainError\\(\\s*${STR}`, "g"),
  new RegExp(`\\b(?:error|ok|message):\\s*${STR}`, "g"),
];
// Validation messages and other user-facing sentences in actions and server code.
const SENTENCE = new RegExp(`"([A-Z][^"\\n]*[.!?…])"`, "g");
const isServerText = (f: string) => /actions\.ts$|[\\/]server[\\/]|validation\.ts$/.test(f);

/** Every string the UI can show, as written in the code. */
function usedKeys() {
  const keys = new Set<string>();
  for (const file of walk(SRC)) {
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    const code = readFileSync(file, "utf8");
    for (const re of [...EVERYWHERE, ...(isServerText(file) ? [SENTENCE] : [])])
      for (const m of code.matchAll(re)) keys.add(JSON.parse(`"${m[1]}"`));
  }
  return keys;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

it("has an Arabic translation for every UI string", () => {
  const missing = [...usedKeys()].filter((k) => !ar[k]);
  expect(missing).toEqual([]);
});

it("keeps the same {placeholders} in every translation", () => {
  const broken = Object.entries(ar).filter(([en, tr]) => placeholders(en).join() !== placeholders(tr).join());
  expect(broken).toEqual([]);
});

it("translates, isolates user values, and formats numbers", () => {
  expect(translate("en", "Courses")).toBe("Courses");
  expect(translate("ar", "Courses")).toBe(ar.Courses);
  expect(translate("ar", "No such key")).toBe("No such key");
  // User data is never looked up in the dictionary, and is direction-isolated.
  expect(translate("ar", "Welcome, {name}", { name: "Courses" })).toContain("⁨Courses⁩");
  expect(translate("ar", "Upgrade to {plan}", { plan: { key: "Premium" } })).toContain(ar.Premium);
  const t = makeT("ar");
  expect(t.dir).toBe("rtl");
  expect(t.num(1500)).toMatch(/^1.500$/); // Western digits with a grouping separator
  expect(t.egp(1500)).toContain("ج.م");
});
