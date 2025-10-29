import mongoose from "mongoose";

function objectIdToUint8Array(id: mongoose.Types.ObjectId) {
  return new Uint8Array(Buffer.from(id.toHexString(), "hex"));
}

export default objectIdToUint8Array;
