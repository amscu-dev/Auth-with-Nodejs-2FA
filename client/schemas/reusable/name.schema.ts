import z from "zod";

const MAX_NAME_SIZE = 64;

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name is required." })
  .max(MAX_NAME_SIZE, {
    message: `Name must not exceed ${MAX_NAME_SIZE} characters.`,
  });
