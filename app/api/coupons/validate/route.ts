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

    // Flat ₹150 First Booking Coupon (FIRST150)
    if (cleanCode === 'FIRST150' || cleanCode === 'FIRST5' || cleanCode === 'STAY150' || cleanCode === 'STAYBUDDY150' || cleanCode === 'STAYBUDDY5' || cleanCode === 'STAYBUDDY20') {
      const isPercent20 = cleanCode === 'STAYBUDDY20';

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
      const discountAmount = isPercent20 ? Math.round(numBase * 0.20) : Math.min(numBase > 0 ? numBase : 150, 150);

      return NextResponse.json({
        valid: true,
        code: cleanCode === 'FIRST5' ? 'FIRST150' : cleanCode,
        discountType: isPercent20 ? 'percentage' : 'flat',
        discountPercentage: isPercent20 ? 20 : 0,
        discountAmount,
        fundedBy: 'StayBuddy Margin',
        message: isPercent20 
          ? `🎉 Flat 20% First Booking Discount Applied! (Funded from StayBuddy margin)` 
          : `🎉 Flat ₹150 Off On Your 1st Booking Applied! (Funded directly from StayBuddy margin)`
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

