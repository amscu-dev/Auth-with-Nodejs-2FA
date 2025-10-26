import { fiveMinutesFromNow } from "@/common/utils/date-time";
import { MFAPurpose } from "@/common/utils/jwt";
import mongoose, { Document, Schema } from "mongoose";

export interface MFASession extends Document {
  tokenJTI: string;
  userId: Schema.Types.ObjectId;
  consumed: boolean;
  mfaSessionPurpose: MFAPurpose;
  requestIP: string;
  createdAt: Date;
  expiresAt: Date;
}

const MFASessionSchema = new Schema<MFASession>({
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

export const MFASessionModel = mongoose.model<MFASession>(
  "MFASession",
  MFASessionSchema
);
