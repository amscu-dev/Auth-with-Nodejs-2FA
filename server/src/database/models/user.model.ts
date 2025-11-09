import { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "@/common/utils/bcrypt";
import { PasswordType } from "@/common/interface/auth.interface";
import mongoose from "../mongoose/mongoose";
import executionTimePlugin from "../plugins/dbLogger";
// ! User Types
interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  registerMethod: "oidc" | "regular" | "magic-link" | "passkey";
  supportedAuthMethods: ("oidc" | "regular" | "magic-link" | "passkey")[];
  passkeys: Schema.Types.ObjectId[];
}

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  oldPassword: string[];
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  userPreferences: UserPreferences;
  // ! Methods added to models must be typed here
  comparePassword(value: PasswordType): Promise<boolean>;
  validateNewPassword(newPassword: PasswordType): Promise<boolean>;
  validateBackupCode(
    code: string
  ): Promise<{ isValidBackupCode: boolean; matchedCode: string }>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    oldPassword: { type: [String], required: false, default: [] },
    isEmailVerified: { type: Boolean, default: false },
    userPreferences: {
      enable2FA: { type: Boolean, default: false },
      emailNotification: { type: Boolean, default: true },
      twoFactorSecret: { type: String },
      backupCodes: { type: [String], default: [] },
      registerMethod: {
        type: String,
        enum: ["oidc", "regular", "magic-link", "passkey"],
        default: "regular",
        required: true,
      },
      supportedAuthMethods: {
        type: [String],
        default: ["regular"],
        required: true,
      },
      passkeys: {
        type: [{ type: Schema.Types.ObjectId, ref: "Passkey" }],
        default: [],
        required: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {},
  }
);
// ! SHOULD BE FIRST MIDDLEWARE
userSchema.plugin(executionTimePlugin);
// ! User Document Middleware ~ Runs on Doc before .save()
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hashValue(this.password);
  }
  next();
});

// ! Adding a method on User Doc
userSchema.methods.comparePassword = async function (value: PasswordType) {
  return compareValue(value, this.password);
};

userSchema.methods.validateNewPassword = async function (
  newPassword: PasswordType
) {
  const oldPasswords = [this.password, ...(this.oldPassword || [])];
  for (const oldHash of oldPasswords) {
    const isMatch = await compareValue(newPassword, oldHash);
    if (isMatch) {
      return false;
    }
  }
  return true;
};

userSchema.methods.validateBackupCode = async function (backupCode: string) {
  for (const code of this.userPreferences.backupCodes) {
    const match = await compareValue(backupCode, code);
    if (match) {
      return { isValidBackupCode: true, matchedCode: code };
    }
  }
  return { isValidBackupCode: false, matchedCode: "" };
};

// ! Exclude some prop when convert to JSON
userSchema.set("toJSON", {
  transform: function (doc, ret: Record<string, any>) {
    delete ret.userPreferences.registerMethod;
    delete ret.userPreferences.passkeys;
    delete ret.userPreferences.supportedAuthMethods;
    delete ret.userPreferences.twoFactorSecret;
    delete ret.userPreferences.backupCodes;
    delete ret.password;
    delete ret.oldPassword;
    return ret;
  },
});

// ! User Model
const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
