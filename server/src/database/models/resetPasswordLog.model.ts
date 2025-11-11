import { Document, Schema } from "mongoose";
import { UserAgent } from "./session.model";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface Location {
  city: string;
  region: string;
  country: string;
  ip: string;
  timezone: string;
}

export interface PasswordResetLogDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  ip?: string | undefined;
  userAgent: UserAgent;
  method?: "email";
  status: "success" | "failed";
  reason?: string;
  location?: Location;
}

const PasswordResetLogSchema = new Schema<PasswordResetLogDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: {
    type: {
      browser: { type: String },
      version: { type: String },
      os: { type: String },
      platform: { type: String },
    },
    required: true,
    _id: false,
  },
  method: { type: String, enum: ["email"], default: "email" },
  status: { type: String, enum: ["success", "failed"], required: true },
  reason: { type: String },
  location: {
    city: { type: String },
    region: { type: String },
    country: { type: String },
  },
});

PasswordResetLogSchema.plugin(executionTimePlugin);

const PasswordResetLogModel = mongoose.model<PasswordResetLogDocument>(
  "PasswordResetLogDocument",
  PasswordResetLogSchema
);

export default PasswordResetLogModel;
