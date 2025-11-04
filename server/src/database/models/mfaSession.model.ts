import { fiveMinutesFromNow } from "@/common/utils/date-time";
import { Document, Schema } from "mongoose";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface MFASessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  tokenJTI: string;
  userId: mongoose.Types.ObjectId;
  consumed: boolean;
  mfaSessionPurpose: "login" | "forgot_password";
  requestIP: string;
  createdAt: Date;
  expiresAt: Date;
}

const MFASessionSchema = new Schema<MFASessionDocument>({
  tokenJTI: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  consumed: {
    type: Boolean,
    required: true,
    default: false,
  },
  mfaSessionPurpose: {
    type: String,
    enum: ["login", "forgot_password"],
    required: true,
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
});

MFASessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
MFASessionSchema.plugin(executionTimePlugin);

export const MFASessionModel = mongoose.model<MFASessionDocument>(
  "MFASession",
  MFASessionSchema
);
