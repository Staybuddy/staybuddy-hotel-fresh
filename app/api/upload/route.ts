import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const secret = process.env.CLOUDINARY_API_SECRET || '';
  
  if (!secret) {
    return NextResponse.json({ error: 'Cloudinary secret not configured' }, { status: 500 });
  }

  // Generate signature for unsigned/signed upload
  // signature string format: timestamp=1234567890
  const signature = crypto
    .createHash('sha1')
    .update(`timestamp=${timestamp}${secret}`)
    .digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  });
}
