export function uint8ArrayToBase64(u8: Uint8Array): string {
  return Buffer.from(u8).toString("base64");
}
