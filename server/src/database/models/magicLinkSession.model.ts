import { fiveMinutesFromNow } from "@/common/utils/date-time";
import { Document, Schema } from "mongoose";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface MagicLinkSessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  tokenJTI: string;
  userId: string;
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
  userId: {
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

MagicLinkSessionSchema.plugin(executionTimePlugin);

export const MagicLinkModel = mongoose.model<MagicLinkSessionDocument>(
  "MagicLinkSession",
  MagicLinkSessionSchema
);
