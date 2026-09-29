import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'referral_reward' | 'withdrawal';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['referral_reward', 'withdrawal'], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
  },
  { timestamps: true }
);

const WalletTransaction: Model<IWalletTransaction> = mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
export default WalletTransaction;
