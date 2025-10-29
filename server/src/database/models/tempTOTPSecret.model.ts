import { tenMinutesFromNow } from "@/common/utils/date-time";
import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";

export interface TempTOTPSecretDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  secret: string;
  expiredAt: Date;
  createdAt: Date;
}

const tempTOTPSecretSchema = new Schema<TempTOTPSecretDocument>({
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

tempTOTPSecretSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const TempTOTPSecretModel = mongoose.model<TempTOTPSecretDocument>(
  "TempTOTPSecret",
  tempTOTPSecretSchema
);

export default TempTOTPSecretModel;
