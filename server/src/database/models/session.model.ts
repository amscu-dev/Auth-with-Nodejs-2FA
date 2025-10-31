import { Document, Schema } from "mongoose";
import { thirtyDaysFromNow } from "@/common/utils/date-time";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
export interface UserAgent {
  browser: string;
  version: string;
  os: string;
  platform: string;
}

export interface SessionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userAgent: UserAgent;
  expiredAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<SessionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiredAt: {
    type: Date,
    required: true,
    // ! SAME TIME AS EXPIRATION DATE FOR REFRESH TOKEN
    default: thirtyDaysFromNow,
  },
});
SessionSchema.plugin(executionTimePlugin);

const SessionModel = mongoose.model<SessionDocument>("Session", SessionSchema);

export default SessionModel;
