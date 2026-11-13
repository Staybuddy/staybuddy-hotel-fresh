import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email, basePrice = 0 } = body;

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Please enter a coupon code.' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    // Flat 5% First Booking Coupon
    if (cleanCode === 'FIRST5' || cleanCode === 'STAYBUDDY5' || cleanCode === 'STAYBUDDY20') {
      const discountPercent = cleanCode === 'STAYBUDDY20' ? 20 : 5;

      if (cleanEmail) {
        // Check if customer already has any confirmed or completed bookings with this email
        const existingSnap = await db.collection('bookings')
          .where('guestEmail', '==', cleanEmail)
          .where('status', 'in', ['confirmed', 'completed'])
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          return NextResponse.json({
            valid: false,
            code: cleanCode,
            error: `Coupon ${cleanCode} is exclusively valid on your 1st booking. You already have a confirmed stay with this email (${cleanEmail}).`
          });
        }
      }

      const numBase = Math.max(0, Number(basePrice) || 0);
      const discountAmount = Math.round(numBase * (discountPercent / 100));

      return NextResponse.json({
        valid: true,
        code: cleanCode,
        discountPercentage: discountPercent,
        discountAmount,
        fundedBy: 'StayBuddy Margin',
        message: `🎉 Flat ${discountPercent}% First Booking Discount Applied! (Funded directly from StayBuddy margin)`
      });
    }

    return NextResponse.json({
      valid: false,
      code: cleanCode,
      error: `Coupon code "${cleanCode}" is invalid or expired.`
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon code' }, { status: 500 });
  }
}
