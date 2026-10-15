export const MAX_ADULTS_PER_ROOM = 3;

export interface RoomOccupancyBreakdown {
  roomIndex: number;
  occupancy: 'single' | 'double' | 'triple';
  adults: number;
  pricePerNight: number;
}

export interface BookingPricingResult {
  distributions: number[];
  singleCount: number;
  doubleCount: number;
  tripleCount: number;
  basePricePerNight: number;
  originalPriceBeforeDiscount: number;
  discountAmount: number;
  priceAfterDiscount: number;
  gstAmount: number;
  totalAmount: number;
  savingsAmount: number;
  summaryText: string;
  roomBreakdowns: RoomOccupancyBreakdown[];
}

/**
 * Returns the unit price for a given room for a specific occupancy (1, 2, or 3 adults).
 */
export function getRoomPriceForOccupancy(room: any, occCount: number): number {
  if (!room) return 0;
  const pSingle = Number(room.priceSingle) || 0;
  const pDouble = Number(room.priceDouble) || 0;
  const pTriple = Number(room.priceTriple) || 0;
  const fallback = Number(room.price) || Number(room.clientPrice) || 0;

  if (occCount === 1) {
    return pSingle || pDouble || fallback || 0;
  }
  if (occCount === 3) {
    if (pTriple) return pTriple;
    if (pDouble) return Math.round(pDouble * 1.3);
    return fallback || 0;
  }
  // occCount === 2 (Double)
  return pDouble || pSingle || fallback || 0;
}

/**
 * Distributes adults across rooms ensuring max 3 adults per room.
 * For example, 4 adults in 2 rooms -> Room 1: 3 adults (triple), Room 2: 1 adult (single).
 */
export function distributeAdultsAcrossRooms(totalAdults: number, totalRooms: number): number[] {
  const roomsCount = Math.max(1, totalRooms || 1);
  const adultsCount = Math.max(1, totalAdults || 1);

  const distributions: number[] = [];
  if (adultsCount <= roomsCount) {
    for (let i = 0; i < roomsCount; i++) {
      distributions.push(1); // each room gets minimum single occupancy
    }
  } else {
    for (let i = 0; i < roomsCount; i++) {
      distributions.push(1);
    }
    let rem = adultsCount - roomsCount;
    for (let i = 0; i < roomsCount; i++) {
      const add = Math.min(2, rem); // max 1 + 2 = 3 adults per room
      distributions[i] += add;
      rem -= add;
      if (rem <= 0) break;
    }
  }

  return distributions;
}

/**
 * Calculates total booking pricing for multiple rooms, occupancy distributions, and nights.
 */
export function calculateBookingPricing(
  room: any,
  adults: number,
  roomsCount: number,
  nights: number
): BookingPricingResult {
  const safeRooms = Math.max(1, roomsCount || 1);
  const safeAdults = Math.max(1, adults || 1);
  const safeNights = Math.max(1, nights || 1);

  if (!room) {
    return {
      distributions: [1],
      singleCount: 0,
      doubleCount: 0,
      tripleCount: 0,
      basePricePerNight: 0,
      originalPriceBeforeDiscount: 0,
      discountAmount: 0,
      priceAfterDiscount: 0,
      gstAmount: 0,
      totalAmount: 0,
      savingsAmount: 0,
      summaryText: '',
      roomBreakdowns: []
    };
  }

  const distributions = distributeAdultsAcrossRooms(safeAdults, safeRooms);

  let singleCount = 0;
  let doubleCount = 0;
  let tripleCount = 0;
  let basePricePerNight = 0;
  const roomBreakdowns: RoomOccupancyBreakdown[] = [];

  distributions.forEach((occ, idx) => {
    const price = getRoomPriceForOccupancy(room, occ);
    basePricePerNight += price;

    let occType: 'single' | 'double' | 'triple' = 'double';
    if (occ === 1) {
      singleCount++;
      occType = 'single';
    } else if (occ === 3) {
      tripleCount++;
      occType = 'triple';
    } else {
      doubleCount++;
      occType = 'double';
    }

    roomBreakdowns.push({
      roomIndex: idx + 1,
      occupancy: occType,
      adults: occ,
      pricePerNight: price
    });
  });

  const priceAfterDiscount = basePricePerNight * safeNights;
  const originalPriceBeforeDiscount = Math.round(priceAfterDiscount / 0.85);
  const discountAmount = originalPriceBeforeDiscount - priceAfterDiscount;
  const gstAmount = Math.round(priceAfterDiscount * 0.05);
  const totalAmount = priceAfterDiscount + gstAmount;
  const savingsAmount = discountAmount;

  const summaryParts: string[] = [];
  if (tripleCount > 0) {
    const pTriple = getRoomPriceForOccupancy(room, 3);
    summaryParts.push(`${tripleCount} Triple (${tripleCount * 3} Adults @ ₹${pTriple.toLocaleString()})`);
  }
  if (doubleCount > 0) {
    const pDouble = getRoomPriceForOccupancy(room, 2);
    summaryParts.push(`${doubleCount} Double (${doubleCount * 2} Adults @ ₹${pDouble.toLocaleString()})`);
  }
  if (singleCount > 0) {
    const pSingle = getRoomPriceForOccupancy(room, 1);
    summaryParts.push(`${singleCount} Single (${singleCount * 1} Adult @ ₹${pSingle.toLocaleString()})`);
  }

  return {
    distributions,
    singleCount,
    doubleCount,
    tripleCount,
    basePricePerNight,
    originalPriceBeforeDiscount,
    discountAmount,
    priceAfterDiscount,
    gstAmount,
    totalAmount,
    savingsAmount,
    summaryText: summaryParts.join(' + '),
    roomBreakdowns
  };
}

/**
 * Validates and adjusts room and adult counts ensuring max 3 adults per room constraint.
 */
export function adjustRoomsAndAdults(
  currentRooms: number,
  currentAdults: number,
  fieldChanged: 'rooms' | 'adults',
  newValue: number
): { rooms: number; adults: number } {
  let r = Math.max(1, currentRooms);
  let a = Math.max(1, currentAdults);

  if (fieldChanged === 'rooms') {
    r = Math.max(1, newValue);
    // If rooms decreased, cap adults at r * MAX_ADULTS_PER_ROOM
    if (a > r * MAX_ADULTS_PER_ROOM) {
      a = r * MAX_ADULTS_PER_ROOM;
    }
  } else if (fieldChanged === 'adults') {
    a = Math.max(1, newValue);
    // If adults increased, ensure at least Math.ceil(a / MAX_ADULTS_PER_ROOM) rooms
    const minRequiredRooms = Math.ceil(a / MAX_ADULTS_PER_ROOM);
    if (r < minRequiredRooms) {
      r = minRequiredRooms;
    }
  }

  return { rooms: r, adults: a };
}
