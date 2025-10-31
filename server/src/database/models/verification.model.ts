import { Document, Schema } from "mongoose";
import { VerificationEnum } from "@/common/enums/verification-code.enum";
import { generateUniqueCode } from "@/common/utils/uuid";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface VerificationCodeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  code: string;
  type: VerificationEnum;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<VerificationCodeDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  used: {
    type: Boolean,
    required: true,
    default: false,
  },
  code: {
    type: String,
    unique: true,
    required: true,
    default: generateUniqueCode,
  },
  type: {
    type: String,
    required: true,
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

VerificationCodeSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 600 });

VerificationCodeSchema.plugin(executionTimePlugin);

const VerificationCodeModel = mongoose.model<VerificationCodeDocument>(
  "VerificationCode",
  VerificationCodeSchema
);

export default VerificationCodeModel;
