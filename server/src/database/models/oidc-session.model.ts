import { Document, Schema, model } from "mongoose";

export interface OIDCSession extends Document {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  OIDCProvider: "google" | "github";
  consumed: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const OIDCSessionSchema = new Schema<OIDCSession>({
  state: {
    type: String,
    required: true,
    unique: true,
  },
  codeVerifier: {
    type: String,
    required: true,
  },
  codeChallenge: {
    type: String,
    required: true,
  },
  OIDCProvider: {
    type: String,
    enum: ["google", "github"],
    required: true,
  },
  consumed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

OIDCSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OIDCSessionModel = model<OIDCSession>(
  "OIDCSession",
  OIDCSessionSchema
);
