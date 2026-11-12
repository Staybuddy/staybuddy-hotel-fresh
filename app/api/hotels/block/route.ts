import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { invalidateCache } from '@/lib/cache';
import { getDateStr } from '@/lib/inventoryBlocks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId parameter is required' }, { status: 400 });
    }

    const snap = await db.collection('inventory_blocks')
      .where('hotelId', '==', hotelId)
      .get();

    const blocks = snap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    // Sort descending by startDate
    blocks.sort((a: any, b: any) => (b.startDate || '').localeCompare(a.startDate || ''));

    return NextResponse.json({ blocks });
  } catch (error: any) {
    console.error('Inventory blocks GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, roomId, roomType, roomsCount, startDate, endDate, isEntireDay, reason, blockType } = body;

    if (!hotelId || !startDate || !endDate) {
      return NextResponse.json({ error: 'hotelId, startDate, and endDate are required' }, { status: 400 });
    }

    const cleanStart = getDateStr(startDate);
    const cleanEnd = getDateStr(endDate);
    if (cleanEnd < cleanStart) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
    }

    const blockRef = db.collection('inventory_blocks').doc();
    const newBlock = {
      _id: blockRef.id,
      hotelId,
      roomId: roomId || 'all',
      roomType: roomType || (roomId === 'all' ? 'Entire Property' : 'Selected Room'),
      roomsCount: roomId === 'all' ? 'all' : Math.max(1, Number(roomsCount) || 1),
      startDate: cleanStart,
      endDate: cleanEnd,
      isEntireDay: isEntireDay !== false,
      blockType: blockType || (roomId === 'all' ? 'property' : 'rooms'),
      reason: reason || 'Partner Extranet Block',
      createdAt: new Date().toISOString()
    };

    await blockRef.set(newBlock);

    // If entire property is blocked covering today, mark isBlocked on hotel
    const todayStr = getDateStr(new Date());
    if (newBlock.roomId === 'all' && cleanStart <= todayStr && cleanEnd >= todayStr) {
      await db.collection('hotels').doc(hotelId).update({
        isBlocked: true,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }

    invalidateCache('hotels_search_');
    invalidateCache('hotel_detail_');
    invalidateCache('approved_hotels_directory');

    return NextResponse.json({ success: true, block: newBlock }, { status: 201 });
  } catch (error: any) {
    console.error('Inventory blocks POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');
    const hotelId = searchParams.get('hotelId');

    if (!blockId) {
      return NextResponse.json({ error: 'blockId parameter is required' }, { status: 400 });
    }

    await db.collection('inventory_blocks').doc(blockId).delete();

    // Check if any other entire property block active today remains
    if (hotelId) {
      const todayStr = getDateStr(new Date());
      const remainingSnap = await db.collection('inventory_blocks')
        .where('hotelId', '==', hotelId)
        .where('roomId', '==', 'all')
        .get();

      const hasActiveToday = remainingSnap.docs.some(doc => {
        const d = doc.data();
        return d.startDate <= todayStr && d.endDate >= todayStr;
      });

      if (!hasActiveToday) {
        await db.collection('hotels').doc(hotelId).update({
          isBlocked: false,
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }
    }

    invalidateCache('hotels_search_');
    invalidateCache('hotel_detail_');
    invalidateCache('approved_hotels_directory');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Inventory blocks DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

