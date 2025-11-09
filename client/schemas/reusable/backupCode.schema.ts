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
    /^[a-zA-Z0-9]{8}$/,
    "Backup code must contain only letters and numbers."
  );
