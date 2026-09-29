import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoom extends Document {
  hotelId: mongoose.Types.ObjectId;
  type: string;
  description: string;
  priceSingle: number;
  priceDouble: number;
  priceTriple: number;
  b2bPrice: number;
  ratePlan: string;
  maxGuests: number;
  bedType: string;
  size?: number;
  images: string[];
  amenities: string[];
  totalRooms: number;
  staybuddyAllocation: number;
  availableRooms: number;
  blockedDates: Date[];
  isActive: boolean;
}

const RoomSchema = new Schema<IRoom>(
  {
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    priceSingle: { type: Number, required: true, min: 0 },
    priceDouble: { type: Number, required: true, min: 0 },
    priceTriple: { type: Number, required: true, min: 0 },
    b2bPrice: { type: Number, required: true, min: 0 },
    ratePlan: { type: String, enum: ['EP', 'CP', 'MAP', 'AP'], default: 'EP' },
    maxGuests: { type: Number, required: true, min: 1 },
    bedType: { type: String, required: true },
    size: { type: Number },
    images: [{ type: String }],
    amenities: [{ type: String }],
    totalRooms: { type: Number, required: true, default: 1 },
    staybuddyAllocation: { type: Number, required: true, default: 1 },
    availableRooms: { type: Number, required: true, default: 1 },
    blockedDates: [{ type: Date }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RoomSchema.index({ hotelId: 1 });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
export default Room;
