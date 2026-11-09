import { AppError } from "../utils/AppError";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Uploaded MIME labels are untrusted. Recognize preview-safe formats by bytes;
// all other files are inert downloads, never HTML/SVG on the API origin.
export function detectMime(bytes: Buffer, declared: string) {
  if (bytes.length > MAX_UPLOAD_BYTES) throw new AppError(413, "File exceeds 10 MB");
  if (!/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(declared)) {
    throw new AppError(400, "Invalid MIME type");
  }
  let detected = "application/octet-stream";
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) detected = "image/png";
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) detected = "image/jpeg";
  else if (["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString())) detected = "image/gif";
  else if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") detected = "image/webp";
  else if (bytes.subarray(0, 5).toString() === "%PDF-") detected = "application/pdf";
  const recognized = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"];
  if (recognized.includes(declared) && declared !== detected) throw new AppError(400, "File bytes do not match MIME type");
  return detected;
}
