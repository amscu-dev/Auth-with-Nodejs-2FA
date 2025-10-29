import { config } from "@/config/app.config";
import bcrypt from "bcrypt";
import crypto from "crypto";

export function hmacWithPepper(password: string) {
  return crypto
    .createHmac("sha256", config.PASSWORD_SECRET_PEPPER)
    .update(password)
    .digest("hex");
}

export const hashValue = async (
  value: string,
  saltRounds: number = 12
): Promise<string> => {
  const hmac = hmacWithPepper(value);
  return await bcrypt.hash(hmac, saltRounds);
};

export const compareValue = async (
  value: string,
  hashedValue: string
): Promise<boolean> => {
  const hmac = hmacWithPepper(value);
  return await bcrypt.compare(hmac, hashedValue);
};
