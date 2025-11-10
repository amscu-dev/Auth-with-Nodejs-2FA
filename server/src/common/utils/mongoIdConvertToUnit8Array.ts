import mongoose from "mongoose";

export function objectIdToUint8Array(
  id: mongoose.Types.ObjectId
): Uint8Array<ArrayBuffer> {
  const uint8 = new Uint8Array(
    Uint8Array.from(id.id).buffer
  ) as Uint8Array<ArrayBuffer>;
  return uint8;
}

export function base64UrlToObjectId(userHandle: string): string {
  const decodedBase64URL = Buffer.from(userHandle, "base64url");
  const reconstructedMongoId = new mongoose.Types.ObjectId(decodedBase64URL);
  return reconstructedMongoId.toString();
}
