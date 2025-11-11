import PasswordResetLogModel, {
  Location,
} from "@/database/models/resetPasswordLog.model";
import mongoose from "mongoose";
import { UserAgent } from "@/database/models/session.model";

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
  userAgent: UserAgent;
  location: Location;
  session?: mongoose.mongo.ClientSession;
}) => {
  await PasswordResetLogModel.create(
    [
      {
        userId,
        ip,
        location,
        userAgent,
        status,
        reason,
        method: "email",
      },
    ],
    { session }
  );
};

export default logPasswordReset;
