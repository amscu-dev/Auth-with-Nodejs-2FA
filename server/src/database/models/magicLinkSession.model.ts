import { fiveMinutesFromNow } from "@/common/utils/date-time";
import mongoose, { Document, Schema } from "mongoose";

export interface MagicLinkSessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  tokenJTI: string;
  userEmail: string;
  consumed: boolean;
  createdAt: Date;
  expiresAt: Date;
  sessionPurpose: "signin" | "signup";
}

const MagicLinkSessionSchema = new Schema<MagicLinkSessionDocument>({
  tokenJTI: {
    type: String,
    required: true,
    unique: true,
  },
  userEmail: {
    type: String,
    index: true,
  },
  consumed: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: fiveMinutesFromNow,
  },
  sessionPurpose: {
    type: String,
    enum: ["signin", "signup"],
    required: true,
  },
});

MagicLinkSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MagicLinkModel = mongoose.model<MagicLinkSessionDocument>(
  "MagicLinkSession",
  MagicLinkSessionSchema
);
