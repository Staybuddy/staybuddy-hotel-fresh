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
  // Validation fields:
  isAllowed: boolean;
  canBook: boolean;
  maxAllowedGuests: number;
  validationError?: string;
}

export interface MultiRoomItem {
  room: any;
  quantity: number;
}

export interface MultiRoomPricingResult extends BookingPricingResult {
  roomSummaryText: string;
}

/**
 * Returns whether a room supports triple occupancy (3 guests).
 * Strictly requires the partner to have provided a positive priceTriple.
 */
export function isTripleOccupancyAvailable(room: any): boolean {
  if (!room) return false;
  const pTriple = Number(room.priceTriple) || 0;
  return pTriple > 0;
}

/**
 * Returns the maximum guests allowed for a room.
 * - If partner configured a triple price > 0 -> 3 guests max.
 * - If partner did NOT provide a triple price -> 2 guests max (Double/Single only).
 */
export function getRoomMaxOccupancy(room: any): number {
  if (!room) return 2;
  return isTripleOccupancyAvailable(room) ? 3 : 2;
}

/**
 * Returns the unit price for a given room for a specific occupancy (1, 2, or 3 adults).
 * If 3-occupancy is requested but partner has NOT provided priceTriple, returns 0.
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
  if (occCount === 2) {
    return pDouble || pSingle || fallback || 0;
  }
  if (occCount === 3) {
    // Strictly requires partner to have provided priceTriple
    if (pTriple > 0) return pTriple;
    // NOT AVAILABLE - partner did not configure 3-occupancy!
    return 0;
  }
  return fallback || 0;
}

/**
 * Validates whether the requested adults can be accommodated in the specified room(s).
 */
export function validateRoomOccupancy(
  room: any,
  adults: number,
  roomsCount: number
): { allowed: boolean; maxCapacity: number; errorMessage?: string } {
  const safeRooms = Math.max(1, roomsCount || 1);
  const safeAdults = Math.max(1, adults || 1);
  const maxPerRoom = getRoomMaxOccupancy(room);
  const totalMaxCapacity = safeRooms * maxPerRoom;

  if (safeAdults > totalMaxCapacity) {
    if (maxPerRoom === 2) {
      return {
        allowed: false,
        maxCapacity: totalMaxCapacity,
        errorMessage: safeRooms === 1
          ? 'This room only accommodates up to 2 guests (Triple occupancy is not offered by the hotel). Please select 2 rooms.'
          : `These ${safeRooms} rooms can only accommodate up to ${totalMaxCapacity} guests (Max 2 guests per room). Please add more rooms.`,
      };
    }
    return {
      allowed: false,
      maxCapacity: totalMaxCapacity,
      errorMessage: `Exceeds room capacity: ${safeRooms} room${safeRooms > 1 ? 's' : ''} can accommodate up to ${totalMaxCapacity} guests.`,
    };
  }

  // Check distribution to ensure no individual room exceeds its maxPerRoom
  const distributions = distributeAdultsAcrossRooms(safeAdults, safeRooms);
  const hasTriple = distributions.some((occ) => occ > 2);
  if (hasTriple && maxPerRoom < 3) {
    return {
      allowed: false,
      maxCapacity: totalMaxCapacity,
      errorMessage: 'This room category does not offer 3-occupancy. Maximum 2 guests allowed per room.',
    };
  }

  return { allowed: true, maxCapacity: totalMaxCapacity };
}

/**
 * Validates whether a combination of multi-room items can accommodate the requested adults.
 */
export function validateMultiRoomOccupancy(
  selectedRooms: MultiRoomItem[],
  adults: number
): { allowed: boolean; maxCapacity: number; errorMessage?: string } {
  const safeAdults = Math.max(1, adults || 1);
  const roomInstances: any[] = [];
  selectedRooms.forEach((item) => {
    const qty = Math.max(0, item.quantity || 0);
    for (let i = 0; i < qty; i++) {
      roomInstances.push(item.room);
    }
  });

  if (roomInstances.length === 0) {
    return { allowed: false, maxCapacity: 0, errorMessage: 'No rooms selected.' };
  }

  let totalCapacity = 0;
  roomInstances.forEach((r) => {
    totalCapacity += getRoomMaxOccupancy(r);
  });

  if (safeAdults > totalCapacity) {
    return {
      allowed: false,
      maxCapacity: totalCapacity,
      errorMessage: `Selected ${roomInstances.length} room(s) can accommodate at most ${totalCapacity} guests. Please select additional rooms.`,
    };
  }

  return { allowed: true, maxCapacity: totalCapacity };
}

/**
 * Distributes adults across rooms ensuring max 3 adults per room.
 * Priority:
 * 1. Each room gets at least 1 adult (single occupancy).
 * 2. Extra adults are distributed 1 per room to fill rooms to Double occupancy (2 adults per room).
 * 3. Any remaining extra adults beyond all double rooms are distributed 1 per room up to Triple occupancy (3 adults per room).
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
 * Enforces strict validation if 3-occupancy is not provided by the partner.
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

  const maxPerRoom = getRoomMaxOccupancy(room);
  const totalMaxCapacity = safeRooms * maxPerRoom;
  const validation = validateRoomOccupancy(room, safeAdults, safeRooms);

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
      roomBreakdowns: [],
      isAllowed: false,
      canBook: false,
      maxAllowedGuests: 0,
      validationError: 'No room specified',
    };
  }

  const distributions = distributeAdultsAcrossRooms(safeAdults, safeRooms);

  let singleCount = 0;
  let doubleCount = 0;
  let tripleCount = 0;
  let basePricePerNight = 0;
  let hasMissingPrice = false;
  const roomBreakdowns: RoomOccupancyBreakdown[] = [];

  distributions.forEach((occ, idx) => {
    const price = getRoomPriceForOccupancy(room, occ);
    if (price <= 0) {
      hasMissingPrice = true;
    }
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
      pricePerNight: price,
    });
  });

  const canBook = validation.allowed && !hasMissingPrice;
  const validationError = !validation.allowed
    ? validation.errorMessage
    : hasMissingPrice && tripleCount > 0
    ? 'This room does not offer 3-occupancy (No triple price configured by hotel). Max 2 guests allowed per room.'
    : undefined;

  const priceAfterDiscount = basePricePerNight * safeNights;
  const originalPriceBeforeDiscount = priceAfterDiscount;
  const discountAmount = 0;
  const gstAmount = Math.round(priceAfterDiscount * 0.05);
  const totalAmount = priceAfterDiscount + gstAmount;
  const savingsAmount = 0;

  const summaryParts: string[] = [];
  if (tripleCount > 0) {
    const pTriple = getRoomPriceForOccupancy(room, 3);
    summaryParts.push(
      pTriple > 0
        ? `${tripleCount} Triple (${tripleCount * 3} Adults @ ₹${pTriple.toLocaleString()})`
        : `${tripleCount} Triple (Not Available)`
    );
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
    roomBreakdowns,
    isAllowed: canBook,
    canBook,
    maxAllowedGuests: totalMaxCapacity,
    validationError,
  };
}

/**
 * Calculates pricing for multiple rooms across different or same room types.
 * Enforces room-by-room occupancy limits.
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
      isAllowed: false,
      canBook: false,
      maxAllowedGuests: 0,
      validationError: 'No rooms selected',
    };
  }

  let totalMaxCapacity = 0;
  roomInstances.forEach((r) => {
    totalMaxCapacity += getRoomMaxOccupancy(r);
  });

  const distributions = distributeAdultsAcrossRooms(safeAdults, totalRooms);

  let singleCount = 0;
  let doubleCount = 0;
  let tripleCount = 0;
  let basePricePerNight = 0;
  let hasMissingPrice = false;
  let exceedsIndividualRoom = false;
  const roomBreakdowns: RoomOccupancyBreakdown[] = [];

  distributions.forEach((occ, idx) => {
    const r = roomInstances[idx];
    const maxForThisRoom = getRoomMaxOccupancy(r);
    if (occ > maxForThisRoom) {
      exceedsIndividualRoom = true;
    }

    const price = getRoomPriceForOccupancy(r, occ);
    if (price <= 0) {
      hasMissingPrice = true;
    }
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

  const canBook = safeAdults <= totalMaxCapacity && !exceedsIndividualRoom && !hasMissingPrice;
  const validationError =
    safeAdults > totalMaxCapacity
      ? `Selected ${totalRooms} room(s) can accommodate at most ${totalMaxCapacity} guests. Please select additional rooms.`
      : exceedsIndividualRoom || hasMissingPrice
      ? 'One or more selected rooms do not offer 3-occupancy (No triple price configured). Please select rooms that accommodate 3 guests, or add more rooms.'
      : undefined;

  const priceAfterDiscount = basePricePerNight * safeNights;
  const originalPriceBeforeDiscount = priceAfterDiscount;
  const discountAmount = 0;
  const gstAmount = Math.round(priceAfterDiscount * 0.05);
  const totalAmount = priceAfterDiscount + gstAmount;
  const savingsAmount = 0;

  // Build roomSummaryText
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
    roomBreakdowns.forEach((rb) => {
      summaryParts.push(
        `${rb.roomType}: ${rb.adults} Adult${rb.adults > 1 ? 's' : ''} (${rb.occupancy.toUpperCase()} @ ₹${rb.pricePerNight.toLocaleString()})`
      );
    });
  } else {
    if (tripleCount > 0) {
      const pTriple = getRoomPriceForOccupancy(roomInstances[0], 3);
      summaryParts.push(
        pTriple > 0
          ? `${tripleCount} Triple (${tripleCount * 3} Adults @ ₹${pTriple.toLocaleString()})`
          : `${tripleCount} Triple (Not Available)`
      );
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
    isAllowed: canBook,
    canBook,
    maxAllowedGuests: totalMaxCapacity,
    validationError,
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
