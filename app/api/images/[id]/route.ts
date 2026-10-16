import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const rawParams = await context.params;
    const { id } = rawParams;
    if (!id) {
      return new NextResponse('Image ID required', { status: 400 });
    }

    const doc = await db.collection('hotel_images').doc(id).get();
    if (!doc.exists) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const data = doc.data();
    if (!data || !data.data) {
      return new NextResponse('Image content missing', { status: 404 });
    }

    let base64Content = data.data;
    let mimeType = data.contentType || 'image/jpeg';

    if (base64Content.includes(';base64,')) {
      const parts = base64Content.split(';base64,');
      mimeType = parts[0].replace('data:', '') || mimeType;
      base64Content = parts[1];
    }

    const buffer = Buffer.from(base64Content, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
