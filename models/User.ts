import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email?: string;
  password?: string;
  googleId?: string;
  role: 'customer' | 'partner' | 'admin';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  partnerStatus: 'none' | 'pending' | 'approved' | 'rejected';
  walletBalance: number;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  referralRewardClaimed: boolean;
  referralCount: number;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['customer', 'partner', 'admin'], default: 'customer' },
    phone: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    partnerStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    walletBalance: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referralRewardClaimed: { type: Boolean, default: false },
    referralCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (!this.referralCode) {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referralCode = `STAY-${randomChars}`;
  }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
