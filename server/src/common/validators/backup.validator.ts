import z from "zod";

const backupCodeSchema = z.string().trim().min(1).max(8);

export const verifyBackupCodeSchema = z.object({
  backupCode: backupCodeSchema,
});

export type BackupCodeType = z.infer<typeof backupCodeSchema>;
