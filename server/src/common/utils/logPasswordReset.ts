import PasswordResetLogModel, {
  Location,
} from "@/database/models/resetPasswordLog.model";
import mongoose, { Schema } from "mongoose";
import useragent from "express-useragent";

const logPasswordReset = async ({
  userId,
  status,
  reason,
  ip,
  userAgent,
  location,
  session,
}: {
  userId: mongoose.Types.ObjectId;
  status: "success" | "failed";
  reason: string;
  ip: string | undefined;
  userAgent: string | undefined;
  location: Location;
  session?: mongoose.mongo.ClientSession;
}) => {
  const parsedUA = useragent.parse(userAgent ?? "unknown");

  const ipValue = ip || "unknown";
  await PasswordResetLogModel.create(
    {
      userId,
      status,
      reason,
      ip: ipValue,
      userAgent: {
        browser: parsedUA.browser || "unknown",
        version: parsedUA.version || "unknown",
        os: parsedUA.os || "unknown",
        platform: parsedUA.platform || "unknown",
      },
      location,
      method: "email",
    },
    { session }
  );
};

export default logPasswordReset;
