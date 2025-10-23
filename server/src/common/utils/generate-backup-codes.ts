import { randomUUID } from "crypto";
import { hashValue } from "./bcrypt";

export async function generateBackupCodes(numberOfCodes: number) {
  const backupCodes = Array.from({ length: numberOfCodes }, () =>
    randomUUID().replace(/-/g, "").substring(0, 8)
  );
  const hashedBackupCodes = await Promise.all(
    backupCodes.map((code) => hashValue(code))
  );

  return { backupCodes, hashedBackupCodes };
}
