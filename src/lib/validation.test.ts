import { expect, it } from "vitest";
import { z } from "zod";
import { fieldError, optionalLink, safeNext } from "./validation";

it("only allows same-site return paths after sign-in", () => {
  expect(safeNext("/learn/3?tab=1")).toBe("/learn/3?tab=1");
  for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "evil", "", null, ["/x"]]) expect(safeNext(bad)).toBeNull();
});

it("reports which field failed validation", () => {
  const r = z.object({ name: z.string().min(2, "Too short") }).safeParse({ name: "a" });
  expect(r.success || fieldError(r.error)).toEqual({ error: "Too short", field: "name" });
});

it("accepts only http(s) links", () => {
  expect(optionalLink.parse("https://github.com/x")).toBe("https://github.com/x");
  expect(optionalLink.parse("")).toBeNull();
  expect(optionalLink.safeParse("javascript:alert(1)").success).toBe(false);
});
