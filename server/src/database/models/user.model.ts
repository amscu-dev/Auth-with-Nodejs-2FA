import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "@/common/utils/bcrypt";

// ! User Types
interface UserPreference {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  userPreference: UserPreference;
  comparePassword(value: string): Promise<boolean>;
}

// ! User Schemas
const userPreferencesSchema = new Schema<UserPreference>({
  enable2FA: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFactorSecret: { type: String, default: false },
});

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, required: true },
    userPreference: { type: userPreferencesSchema, default: {} },
  },
  {
    timestamps: true,
    toJSON: {},
  }
);

// ! User Document Middleware ~ Runs on Doc before .save()
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hashValue(this.password);
  }
});

// ! Adding a method on User Doc
userSchema.methods.comparePassword = async function (value: string) {
  return compareValue(value, this.password);
};

// ! Exclude some prop when convert to JSON
userSchema.set("toJSON", {
  transform: function (doc, ret: Record<string, any>) {
    delete ret.userPreference.twoFactorSecret;
    delete ret.password;
    return ret;
  },
});

// ! User Model
const UserModel = mongoose.model<UserDocument>("User", userSchema);
