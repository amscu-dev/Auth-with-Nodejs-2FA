import { randomUUID } from "crypto";

export function generateUniqueCode() {
  return randomUUID().replace(/-/g, "").substring(0, 25);
}
