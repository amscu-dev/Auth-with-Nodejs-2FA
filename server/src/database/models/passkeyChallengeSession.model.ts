import { fiveMinutesFromNow } from "@/common/utils/date-time";
import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";

type PasskeyChallengeSessionPurpose =
  | "signup"
  | "signin"
  | "add-new-key"
  | "delete-key";
export interface PasskeyChallengeSessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  challenge: string;
  consumed: boolean;
  passkeyChallengeSessionPurpose: PasskeyChallengeSessionPurpose;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userName?: string;
  createdAt: Date;
  expiresAt: Date;
}

const PasskeyChallengeSessionSchema =
  new Schema<PasskeyChallengeSessionDocument>({
    challenge: {
      type: String,
      unique: true,
      required: true,
    },
    consumed: {
      type: Boolean,
      required: true,
      default: false,
    },
    passkeyChallengeSessionPurpose: {
      type: String,
      enum: ["signin", "signup", "add-new-key", "delete-key"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: {
      type: String,
    },
    userName: {
      type: String,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: fiveMinutesFromNow,
    },
  });
PasskeyChallengeSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const PasskeyChallengeSessionModel =
  mongoose.model<PasskeyChallengeSessionDocument>(
    "PasskeyChallengeSession",
    PasskeyChallengeSessionSchema
  );
