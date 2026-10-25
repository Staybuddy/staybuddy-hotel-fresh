export const MAX_ADULTS_PER_ROOM = 3;

export interface RoomOccupancyBreakdown {
  roomIndex: number;
  roomId?: string;
  roomType?: string;
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
  roomSummaryText?: string;
  roomBreakdowns: RoomOccupancyBreakdown[];
}

export interface MultiRoomItem {
  room: any;
  quantity: number;
}

export interface MultiRoomPricingResult extends BookingPricingResult {
  roomSummaryText: string;
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
 * Priority:
 * 1. Each room gets at least 1 adult (single occupancy).
 * 2. Extra adults are distributed 1 per room to fill rooms to Double occupancy (2 adults per room).
 * 3. Any remaining extra adults beyond all double rooms are distributed 1 per room up to Triple occupancy (3 adults per room).
 *
 * Examples:
 * - 2 rooms, 2 adults -> [1, 1] (2 Single rooms - 1 member each)
 * - 2 rooms, 5 adults -> [3, 2] (1 Triple room, 1 Double room)
 * - 6 rooms, 8 adults -> [2, 2, 1, 1, 1, 1] (2 Double rooms, 4 Single rooms)
 */
export function distributeAdultsAcrossRooms(totalAdults: number, totalRooms: number): number[] {
  const roomsCount = Math.max(1, totalRooms || 1);
  const adultsCount = Math.max(1, totalAdults || 1);

  // Phase 1: Give 1 adult to each room (minimum single occupancy)
  const distributions: number[] = new Array(roomsCount).fill(1);
  let rem = Math.max(0, adultsCount - roomsCount);

  // Phase 2: Prioritize standard Double occupancy first (bring each room up to 2 adults)
  for (let i = 0; i < roomsCount && rem > 0; i++) {
    distributions[i] += 1;
    rem -= 1;
  }

  // Phase 3: If additional adults remain beyond all double rooms, add Triple occupancy (up to 3 adults)
  for (let i = 0; i < roomsCount && rem > 0; i++) {
    distributions[i] += 1;
    rem -= 1;
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
    summaryParts.push(`${singleCount} Single (${singleCount * 1} Adult${singleCount > 1 ? 's' : ''} @ ₹${pSingle.toLocaleString()})`);
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
    roomSummaryText: room ? `${safeRooms} × ${room.type || 'Room'}` : '',
    roomBreakdowns
  };
}

/**
 * Calculates pricing for multiple rooms across different or same room types.
 */
export function calculateMultiRoomPricing(
  selectedRooms: MultiRoomItem[],
  adults: number,
  nights: number
): MultiRoomPricingResult {
  const safeAdults = Math.max(1, adults || 1);
  const safeNights = Math.max(1, nights || 1);

  // Flatten selectedRooms by quantity
  const roomInstances: any[] = [];
  selectedRooms.forEach((item) => {
    const qty = Math.max(0, item.quantity || 0);
    for (let i = 0; i < qty; i++) {
      roomInstances.push(item.room);
    }
  });

  const totalRooms = roomInstances.length;
  if (totalRooms === 0) {
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
      roomSummaryText: '',
      roomBreakdowns: [],
    };
  }

  const distributions = distributeAdultsAcrossRooms(safeAdults, totalRooms);

  let singleCount = 0;
  let doubleCount = 0;
  let tripleCount = 0;
  let basePricePerNight = 0;
  const roomBreakdowns: RoomOccupancyBreakdown[] = [];

  distributions.forEach((occ, idx) => {
    const r = roomInstances[idx];
    const price = getRoomPriceForOccupancy(r, occ);
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
      roomId: r?._id,
      roomType: r?.type || `Room ${idx + 1}`,
      occupancy: occType,
      adults: occ,
      pricePerNight: price,
    });
  });

  const priceAfterDiscount = basePricePerNight * safeNights;
  const originalPriceBeforeDiscount = Math.round(priceAfterDiscount / 0.85);
  const discountAmount = originalPriceBeforeDiscount - priceAfterDiscount;
  const gstAmount = Math.round(priceAfterDiscount * 0.05);
  const totalAmount = priceAfterDiscount + gstAmount;
  const savingsAmount = discountAmount;

  // Build roomSummaryText (e.g. "1 × Standard Room, 1 × Deluxe Room" or "2 × Standard Room")
  const roomSummaryParts: string[] = [];
  selectedRooms
    .filter((sr) => sr.quantity > 0)
    .forEach((sr) => {
      roomSummaryParts.push(`${sr.quantity} × ${sr.room?.type || 'Room'}`);
    });
  const roomSummaryText = roomSummaryParts.join(', ');

  // Build occupancy summary
  const summaryParts: string[] = [];
  const distinctRoomTypes = new Set(roomInstances.map((r) => r?.type || 'Room'));

  if (distinctRoomTypes.size > 1) {
    // If mixed room types, format clearly per room:
    roomBreakdowns.forEach((rb) => {
      summaryParts.push(
        `${rb.roomType}: ${rb.adults} Adult${rb.adults > 1 ? 's' : ''} (${rb.occupancy.toUpperCase()} @ ₹${rb.pricePerNight.toLocaleString()})`
      );
    });
  } else {
    // Same room category across all rooms
    if (tripleCount > 0) {
      const pTriple = getRoomPriceForOccupancy(roomInstances[0], 3);
      summaryParts.push(`${tripleCount} Triple (${tripleCount * 3} Adults @ ₹${pTriple.toLocaleString()})`);
    }
    if (doubleCount > 0) {
      const pDouble = getRoomPriceForOccupancy(roomInstances[0], 2);
      summaryParts.push(`${doubleCount} Double (${doubleCount * 2} Adults @ ₹${pDouble.toLocaleString()})`);
    }
    if (singleCount > 0) {
      const pSingle = getRoomPriceForOccupancy(roomInstances[0], 1);
      summaryParts.push(`${singleCount} Single (${singleCount * 1} Adult${singleCount > 1 ? 's' : ''} @ ₹${pSingle.toLocaleString()})`);
    }
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
    roomSummaryText,
    roomBreakdowns,
  };
}

/**
 * Validates and adjusts room and adult counts ensuring max 3 adults per room constraint.
 * Also ensures that there is at least 1 adult member per room (rooms <= adults <= rooms * 3).
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
    // Each room requires at least 1 adult member
    if (a < r) {
      a = r;
    }
  } else if (fieldChanged === 'adults') {
    a = Math.max(1, newValue);
    // If adults increased, ensure at least Math.ceil(a / MAX_ADULTS_PER_ROOM) rooms
    const minRequiredRooms = Math.ceil(a / MAX_ADULTS_PER_ROOM);
    if (r < minRequiredRooms) {
      r = minRequiredRooms;
    }
    // Cannot have more rooms than adults (at least 1 adult per room)
    if (r > a) {
      r = a;
    }
  }

  return { rooms: r, adults: a };
}
