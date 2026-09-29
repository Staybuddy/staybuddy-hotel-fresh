import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  customerId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  nights: number;
  pricePerNight: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentId?: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentMethod?: string;
  specialRequests?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  gstRegistrationNo?: string;
  gstCompanyName?: string;
  gstCompanyAddress?: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    paymentId: { type: String },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentMethod: { type: String },
    specialRequests: { type: String },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, required: true },
    gstRegistrationNo: { type: String },
    gstCompanyName: { type: String },
    gstCompanyAddress: { type: String },
  },
  { timestamps: true }
);

BookingSchema.index({ customerId: 1 });
BookingSchema.index({ hotelId: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ checkOut: 1 });
BookingSchema.index({ bookingId: 1 });

// Generate unique readable booking ID before saving
BookingSchema.pre('save', async function () {
  if (!this.bookingId) {
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingId = `BKG-${randomChars}`;
  }
});

const Booking = (mongoose.models.Booking as Model<IBooking>) || mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
