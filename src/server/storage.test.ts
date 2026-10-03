import { expect, it } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.STORAGE_DIR = await mkdtemp(path.join(tmpdir(), "second-era-"));
const { saveResume, readStored } = await import("./storage");

const file = (body: string) => new File([body], "cv.pdf", { type: "application/pdf" });

it("stores real PDFs and rejects anything else by content", async () => {
  const rel = await saveResume(7, file("%PDF-1.7 fake body"));
  expect(rel).toMatch(/^resumes\/7-[0-9a-f]{16}\.pdf$/);
  expect((await readStored(rel)).toString()).toContain("%PDF-");

  await expect(saveResume(7, file("<html>not a pdf</html>"))).rejects.toThrow(/must be a PDF/);
  await expect(saveResume(7, file(""))).rejects.toThrow(/Choose a PDF/);
});

it("refuses paths outside the storage root", async () => {
  await expect(readStored("../../etc/passwd")).rejects.toThrow(/escapes/);
});
