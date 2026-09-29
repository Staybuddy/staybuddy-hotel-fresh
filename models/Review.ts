import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  customerId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  reply?: string;
  repliedAt?: Date;
  cleanliness: number;
  service: number;
  location: number;
  value: number;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    reply: { type: String },
    repliedAt: { type: Date },
    cleanliness: { type: Number, min: 1, max: 5, default: 5 },
    service: { type: Number, min: 1, max: 5, default: 5 },
    location: { type: Number, min: 1, max: 5, default: 5 },
    value: { type: Number, min: 1, max: 5, default: 5 },
  },
  { timestamps: true }
);

ReviewSchema.index({ hotelId: 1 });
ReviewSchema.index({ customerId: 1 });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
