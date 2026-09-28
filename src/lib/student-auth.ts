import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashStudentPin(pin: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyStudentPin(pin: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(pin, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === actual.length && timingSafeEqual(actual, expectedBuffer);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
