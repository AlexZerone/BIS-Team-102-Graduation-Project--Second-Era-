import { expect, it } from "vitest";
import { courseLocks } from "./courses";

it("keeps drafts and unenrolled courses fully editable", () => {
  for (const status of ["draft", "rejected", "published"] as const)
    expect(courseLocks(status, 0, 0)).toEqual({ reviewing: false, lessons: false, details: false, assessments: false, passingScore: false, title: false });
});

it("freezes grading once students enroll, and the title once certificates exist", () => {
  expect(courseLocks("published", 3, 0)).toMatchObject({ lessons: false, details: false, assessments: true, passingScore: true, title: false });
  expect(courseLocks("published", 3, 1)).toMatchObject({ lessons: false, details: false, title: true });
});

it("locks everything while under review", () => {
  expect(Object.values(courseLocks("pending", 0, 0)).every(Boolean)).toBe(true);
});
