import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function token() {
  const b = randomBytes(10);
  return Array.from(b, (n) => alphabet[n % 62]).join("");
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
function key() {
  const raw = process.env.CAPABILITY_ENCRYPTION_KEY;
  if (!raw) throw new Error("CAPABILITY_ENCRYPTION_KEY is required");
  return createHash("sha256").update(raw).digest();
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((x) => x.toString("base64url")).join(".");
}
export function decrypt(value: string) {
  const [i, t, d] = value.split(".").map((x) => Buffer.from(x, "base64url"));
  const c = createDecipheriv("aes-256-gcm", key(), i);
  c.setAuthTag(t);
  return Buffer.concat([c.update(d), c.final()]).toString();
}
export function safeHashEqual(value: string, digest: string) {
  const actual = Buffer.from(hash(value));
  const expected = Buffer.from(digest);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
