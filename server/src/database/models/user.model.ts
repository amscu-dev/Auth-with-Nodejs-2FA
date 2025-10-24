import mongoose, { Document, Schema } from "mongoose";
import { compareValue, hashValue } from "@/common/utils/bcrypt";
import { BackupCodeType } from "@/common/validators/backup.validator";
import { PasswordType } from "@/common/interface/auth.interface";

// ! User Types
interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  registerMethod: "oidc" | "regular";
  supportedAuthMethods: ("oidc" | "regular")[];
}

export interface UserDocument extends Document {
  _id: Schema.Types.ObjectId;
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
    string: BackupCodeType
  ): Promise<{ isValidBackupCode: boolean; matchedCode: string }>;
}

// ! User Schemas
const userPreferencesSchema = new Schema<UserPreferences>({
  enable2FA: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFactorSecret: { type: String },
  backupCodes: { type: [String], required: false, default: [] },
  registerMethod: {
    type: String,
    enum: ["oidc", "regular"],
    required: true,
    default: "regular",
  },
  supportedAuthMethods: {
    type: [String],
    required: true,
    default: ["regular"],
  },
});

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    oldPassword: { type: [String], required: false, default: [] },
    isEmailVerified: { type: Boolean, default: false },
    userPreferences: { type: userPreferencesSchema, _id: false, default: {} },
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

userSchema.methods.validateBackupCode = async function (
  backupCode: BackupCodeType
) {
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
