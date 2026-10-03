import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { DomainError } from "./errors";

// ponytail: local disk outside /public. On serverless hosts swap for S3/R2 behind these two functions.
const ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? ".data/uploads");
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveResume(userId: number, file: File) {
  if (file.size === 0) throw new DomainError("Choose a PDF file.");
  if (file.size > MAX_BYTES) throw new DomainError("Resume must be 5 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Check the content, not the client-supplied name or MIME type.
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") throw new DomainError("Resume must be a PDF.");
  const rel = `resumes/${userId}-${randomBytes(8).toString("hex")}.pdf`;
  await mkdir(path.join(ROOT, "resumes"), { recursive: true });
  await writeFile(path.join(ROOT, rel), bytes);
  return rel;
}

function resolveInside(rel: string) {
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Path escapes storage root");
  return full;
}

export const readStored = async (rel: string) => readFile(resolveInside(rel));
export const deleteStored = async (rel: string) => unlink(resolveInside(rel)).catch(() => {});
