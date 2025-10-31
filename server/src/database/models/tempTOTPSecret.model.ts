import { tenMinutesFromNow } from "@/common/utils/date-time";
import { Schema } from "mongoose";
import { Document } from "mongoose";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface TempTOTPSecretDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  secret: string;
  expiredAt: Date;
  createdAt: Date;
}

const TempTOTPSecretSchema = new Schema<TempTOTPSecretDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
    unique: true,
  },
  secret: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiredAt: {
    type: Date,
    required: true,
    default: tenMinutesFromNow,
  },
});

TempTOTPSecretSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
TempTOTPSecretSchema.plugin(executionTimePlugin);

const TempTOTPSecretModel = mongoose.model<TempTOTPSecretDocument>(
  "TempTOTPSecret",
  TempTOTPSecretSchema
);

export default TempTOTPSecretModel;
