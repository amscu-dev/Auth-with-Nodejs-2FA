import UserModel from "@/database/models/user.model";
import { Schema } from "mongoose";

export class UserService {
  public async findUserById(userId: string | Schema.Types.ObjectId) {
    const user = await UserModel.findById(userId, {
      password: false,
    });
    return user || null;
  }
}
