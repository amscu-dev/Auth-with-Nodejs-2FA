import PasswordResetLogModel, {
  Location,
} from "@/database/models/resetPasswordLog.model";
import mongoose, { Schema } from "mongoose";

const logPasswordReset = async ({
  userId,
  status,
  reason,
  ip,
  userAgent,
  location,
  session,
}: {
  userId: Schema.Types.ObjectId;
  status: "success" | "failed";
  reason: string;
  ip: string | undefined;
  userAgent: string | undefined;
  location: Location;
  session?: mongoose.mongo.ClientSession;
}) => {
  const userAgentValue = userAgent || "unknown";
  const ipValue = ip || "unknown";
  await PasswordResetLogModel.create(
    {
      userId,
      status,
      reason,
      ip: ipValue,
      userAgent: userAgentValue,
      location,
      method: "email",
    },
    { session }
  );
};

export default logPasswordReset;
