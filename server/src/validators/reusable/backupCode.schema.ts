import { z } from "zod";

const BACKUP_CODE_SIZE = 8;

export const backupCodeSchema = z
  .string()
  .trim()
  .min(1, { message: "Backup code is required." })
  .length(
    BACKUP_CODE_SIZE,
    `Backup code must be exactly ${BACKUP_CODE_SIZE} characters long.`
  )
  .regex(
    /^[0-9a-f]{8}$/,
    "Backup code must contain only hexadecimal characters (0-9, a-f)."
  );
