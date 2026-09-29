import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHotel extends Document {
  hotelId: string;
  partnerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  location: string;
  city: string;
  area?: string;
  country: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  images: string[];
  amenities: string[];
  extraAmenities?: string;
  propertyType: 'Hotel' | 'Resort' | 'Villa' | 'Homestay' | 'Serviced Apartment' | 'Hostel / Backpacker';
  category: 'budget' | 'standard' | 'premium' | 'luxury';
  starRating: number;
  totalPropertyRooms?: number;
  totalFloors?: number;
  contactName?: string;
  contactDesignation?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  marginPercentage?: number;
  isExtranet?: boolean;
  checkInTime: string;
  checkOutTime: string;
  policies: string;
  avgRating: number;
  totalReviews: number;
  createdAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    hotelId: { type: String, unique: true },
    partnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String },
    country: { type: String, required: true, default: 'India' },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    images: [{ type: String }],
    amenities: [{ type: String }],
    extraAmenities: { type: String },
    propertyType: { type: String, enum: ['Hotel', 'Resort', 'Villa', 'Homestay', 'Serviced Apartment', 'Hostel / Backpacker'], default: 'Hotel' },
    category: { type: String, enum: ['budget', 'standard', 'premium', 'luxury'], default: 'standard' },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    totalPropertyRooms: { type: Number },
    totalFloors: { type: Number },
    contactName: { type: String },
    contactDesignation: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    marginPercentage: { type: Number, default: 0 },
    isExtranet: { type: Boolean, default: false },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    policies: { type: String, default: '' },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HotelSchema.index({ city: 1 });
HotelSchema.index({ area: 1 });
HotelSchema.index({ partnerId: 1 });
HotelSchema.index({ hotelId: 1 });

// Generate unique readable hotel ID before saving
HotelSchema.pre('save', async function () {
  if (!this.hotelId) {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.hotelId = `HTL-${randomChars}`;
  }
});

const Hotel = (mongoose.models.Hotel as Model<IHotel>) || mongoose.model<IHotel>('Hotel', HotelSchema);
export default Hotel;
