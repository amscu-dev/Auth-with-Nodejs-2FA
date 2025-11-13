import crypto from "crypto";

const algorithm = "aes-256-gcm";

export function encrypt(text: string, userId: string, key: string) {
  const plaintext = Buffer.from(text, "utf-8");
  const secretKey = crypto.createHash("sha256").update(key).digest();
  const iv = crypto.randomBytes(12);
  const aad = Buffer.from(userId, "utf-8");

  // Create cipherText
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return
  return [
    iv.toString("hex"),
    ciphertext.toString("hex"),
    tag.toString("hex"),
  ].join(":");
}

export function decrypt(encryptedText: string, userId: string, key: string) {
  const [ivHex, ctHex, tagHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const ciphertext = Buffer.from(ctHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const secretKey = crypto.createHash("sha256").update(key).digest();
  const aad = Buffer.from(userId, "utf-8");

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString("utf-8");
  } catch (error) {
    throw new Error("Decryption failed: data may have been tampered with");
  }
}
