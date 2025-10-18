import mongoose, { Document, Schema } from "mongoose";

export interface Location {
  city?: string | undefined;
  region?: string | undefined;
  country?: string | undefined;
}

export interface PasswordResetLogDocument extends Document {
  userId: Schema.Types.ObjectId;
  timestamp: Date;
  ip?: string | undefined;
  userAgent?: string;
  method?: "email";
  status: "success" | "failed";
  reason?: string;
  location?: Location;
}

const passwordResetLogSchema = new Schema<PasswordResetLogDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String },
  method: { type: String, enum: ["email"], default: "email" },
  status: { type: String, enum: ["success", "failed"], required: true },
  reason: { type: String },
  location: {
    city: { type: String },
    region: { type: String },
    country: { type: String },
  },
});

const PasswordResetLogModel = mongoose.model<PasswordResetLogDocument>(
  "PasswordResetLogDocument",
  passwordResetLogSchema
);

export default PasswordResetLogModel;
