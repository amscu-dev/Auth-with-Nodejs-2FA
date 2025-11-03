import { Document, Schema, model } from "mongoose";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface OIDCSessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  OIDCProvider: "google" | "github";
  consumed: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const OIDCSessionSchema = new Schema<OIDCSessionDocument>({
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

OIDCSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 });
OIDCSessionSchema.plugin(executionTimePlugin);

export const OIDCSessionModel = model<OIDCSessionDocument>(
  "OIDCSession",
  OIDCSessionSchema
);
