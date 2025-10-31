import {
  PROVIDER_IDS,
  PROVIDER_NAMES,
  ProviderId,
  ProviderName,
} from "@/common/utils/getPasskeyProvider";
import { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { Schema } from "mongoose";
import { Document } from "mongoose";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface PasskeyDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userID: mongoose.Types.ObjectId;
  credentialID: string;
  credentialPublicKey: string;
  credentialType: string;
  publicKeyAlgorithm: COSEAlgorithmIdentifier;
  counter: number;
  transports: AuthenticatorTransportFuture[];
  authenticatorAttachment: "platform" | "cross-platform";
  aaguid: {
    aaguid: ProviderId;
    name: ProviderName;
  };
  createdAt: Date;
  lastUsed: Date;
}

const AaguidSchema = new Schema(
  {
    aaguid: { type: String, required: true, enum: [...PROVIDER_IDS] },
    name: { type: String, required: true, enum: [...PROVIDER_NAMES] },
  },
  { _id: false }
);

const PasskeySchema = new Schema<PasskeyDocument>({
  userID: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  credentialID: {
    type: String,
    unique: true,
    required: true,
  },
  credentialPublicKey: {
    type: String,
    required: true,
  },
  publicKeyAlgorithm: {
    type: Number,
    required: true,
  },
  counter: {
    type: Number,
    required: true,
  },
  credentialType: {
    type: String,
    default: "public-key",
  },
  authenticatorAttachment: {
    type: String,
    required: true,
    enum: ["platform", "cross-platform"],
  },
  transports: {
    type: [
      {
        type: String,
        enum: [
          "ble",
          "cable",
          "hybrid",
          "internal",
          "nfc",
          "smart-card",
          "usb",
        ],
      },
    ],
    default: [],
    required: true,
  },
  aaguid: {
    type: AaguidSchema,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  lastUsed: {
    type: Date,
    default: new Date(),
  },
});

PasskeySchema.plugin(executionTimePlugin);

export const PasskeyModel = mongoose.model<PasskeyDocument>(
  "Passkey",
  PasskeySchema
);
