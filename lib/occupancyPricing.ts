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
 * Returns whether a room supports single occupancy (1 guest).
 */
export function isSingleOccupancyAvailable(room: any): boolean {
  if (!room) return false;
  const pSingle = Number(room.priceSingle);
  if (!isNaN(pSingle) && pSingle > 0) return true;
  // If priceSingle was not explicitly set, but priceDouble is positive, single guest can stay at double rate
  const pDouble = Number(room.priceDouble);
  if (!isNaN(pDouble) && pDouble > 0) return true;
  const pTriple = Number(room.priceTriple);
  if (!isNaN(pTriple) && pTriple > 0) return true;
  // Legacy room fallback
  const legacyPrice = Number(room.price || room.clientPrice || room.b2bPrice);
  return !isNaN(legacyPrice) && legacyPrice > 0;
}

/**
 * Returns whether a room supports double occupancy (2 guests).
 * STRICT BUSINESS RULE:
 * If partner only configured single price (priceSingle > 0) and left priceDouble empty/0,
 * double occupancy CANNOT be booked under any circumstances.
 */
export function isDoubleOccupancyAvailable(room: any): boolean {
  if (!room) return false;
  const pDouble = Number(room.priceDouble);
  if (!isNaN(pDouble) && pDouble > 0) return true;

  // If partner explicitly provided priceSingle or priceTriple, but left priceDouble empty/0 -> NOT ALLOWED!
  const pSingle = Number(room.priceSingle);
  const pTriple = Number(room.priceTriple);
  const hasExplicitSingle = !isNaN(pSingle) && pSingle > 0;
  const hasExplicitTriple = !isNaN(pTriple) && pTriple > 0;
  if (hasExplicitSingle || hasExplicitTriple) {
    return false;
  }

  // Legacy room fallback only when modern pricing fields were never used at all
  const legacyPrice = Number(room.price || room.clientPrice || room.b2bPrice);
  return !isNaN(legacyPrice) && legacyPrice > 0;
}

/**
 * Returns whether a room supports triple occupancy (3 guests).
 * Strictly requires the partner to have provided a positive priceTriple.
 */
export function isTripleOccupancyAvailable(room: any): boolean {
  if (!room) return false;
  const pTriple = Number(room.priceTriple);
  return !isNaN(pTriple) && pTriple > 0;
}

/**
 * Returns whether a room supports a specific occupancy count (1, 2, or 3 guests).
 */
export function isOccupancySupportedForRoom(room: any, occCount: number): boolean {
  if (!room) return false;
  if (occCount === 1) return isSingleOccupancyAvailable(room);
  if (occCount === 2) return isDoubleOccupancyAvailable(room);
  if (occCount === 3) return isTripleOccupancyAvailable(room);
  return false;
}

/**
 * Returns the maximum guests allowed for a room based on partner's active occupancy rates.
 * - If partner configured priceTriple > 0 -> 3 guests max.
 * - If partner configured priceDouble > 0 -> 2 guests max.
 * - If partner ONLY configured priceSingle > 0 -> 1 guest max (Single occupancy only).
 */
export function getRoomMaxOccupancy(room: any): number {
  if (!room) return 2;
  if (isTripleOccupancyAvailable(room)) return 3;
  if (isDoubleOccupancyAvailable(room)) return 2;
  if (isSingleOccupancyAvailable(room)) return 1;
  return 2;
}

/**
 * Returns a human-friendly bed label that matches actual priced room occupancy,
 * ensuring single-only rooms never show misleading "Double" labels.
 */
export function getRoomBedLabel(room: any): string {
  if (!room) return 'Double Bed';
  const maxCap = getRoomMaxOccupancy(room);
  if (maxCap === 1) return 'Single Bed';
  if (maxCap === 3) return 'Double + Extra Bed';
  return room.bedType || 'Double Bed';
}

/**
 * Applies the hotel's configured admin margin percentage (e.g. 15%)
 * on top of the partner's B2B prices for single, double, and triple occupancy respectively.
 * Preserves exact zeroes/empty states so occupancies not priced by partner remain disabled.
 */
export function applyMarginToRoom(room: any, marginPercentage: number = 0) {
  if (!room) return room;
  const margin = Number(marginPercentage) || 0;

  // Partner B2B base rates (strictly preserve what was configured)
  const rawSingle = Number(room.b2bPriceSingle !== undefined ? room.b2bPriceSingle : room.priceSingle) || 0;
  const rawDouble = Number(room.b2bPriceDouble !== undefined ? room.b2bPriceDouble : room.priceDouble) || 0;
  const rawTriple = Number(room.b2bPriceTriple !== undefined ? room.b2bPriceTriple : room.priceTriple) || 0;
  const isLegacy = rawSingle === 0 && rawDouble === 0 && rawTriple === 0;
  const rawFallback = isLegacy ? (Number(room.b2bPrice !== undefined ? room.b2bPrice : (room.price || room.clientPrice)) || 0) : 0;

  if (margin <= 0) {
    return {
      ...room,
      b2bPriceSingle: rawSingle,
      b2bPriceDouble: rawDouble,
      b2bPriceTriple: rawTriple,
      b2bPrice: rawFallback,
      priceSingle: rawSingle,
      priceDouble: rawDouble,
      priceTriple: rawTriple,
      price: rawDouble || rawSingle || rawTriple || rawFallback,
      clientPrice: rawDouble || rawSingle || rawTriple || rawFallback,
    };
  }

  const mult = 1 + margin / 100;
  const newSingle = rawSingle > 0 ? Math.round(rawSingle * mult) : 0;
  const newDouble = rawDouble > 0 ? Math.round(rawDouble * mult) : 0;
  const newTriple = rawTriple > 0 ? Math.round(rawTriple * mult) : 0;
  const newFallback = rawFallback > 0 ? Math.round(rawFallback * mult) : (newDouble || newSingle || newTriple);

  return {
    ...room,
    b2bPriceSingle: rawSingle,
    b2bPriceDouble: rawDouble,
    b2bPriceTriple: rawTriple,
    b2bPrice: rawFallback,
    priceSingle: newSingle,
    priceDouble: newDouble,
    priceTriple: newTriple,
    price: newDouble || newSingle || newTriple || newFallback,
    clientPrice: newDouble || newSingle || newTriple || newFallback,
  };
}

/**
 * Returns the unit price for a given room for a specific occupancy (1, 2, or 3 adults).
 * If the occupancy is NOT supported (e.g. 2 guests when only single price was entered, or 3 guests when triple was not entered), returns 0.
 */
export function getRoomPriceForOccupancy(room: any, occCount: number): number {
  if (!room) return 0;
  if (!isOccupancySupportedForRoom(room, occCount)) {
    return 0;
  }

  const pSingle = Number(room.priceSingle) || 0;
  const pDouble = Number(room.priceDouble) || 0;
  const pTriple = Number(room.priceTriple) || 0;
  const legacyPrice = Number(room.price) || Number(room.clientPrice) || Number(room.b2bPrice) || 0;

  if (occCount === 1) {
    return pSingle || pDouble || legacyPrice || 0;
  }
  if (occCount === 2) {
    return pDouble || legacyPrice || 0;
  }
  if (occCount === 3) {
    return pTriple;
  }
  return 0;
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
    if (maxPerRoom === 1) {
      return {
        allowed: false,
        maxCapacity: totalMaxCapacity,
        errorMessage: safeRooms === 1
          ? 'This room only accommodates 1 guest (Single occupancy only). Double and Triple occupancies are not offered by the hotel.'
          : `These ${safeRooms} rooms only accommodate up to ${totalMaxCapacity} guest${totalMaxCapacity > 1 ? 's' : ''} (Single occupancy only). Please add more rooms.`,
      };
    }
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

  // Check distribution to ensure each individual room's occupancy is supported
  const distributions = distributeAdultsAcrossRooms(safeAdults, safeRooms);
  for (const occ of distributions) {
    if (!isOccupancySupportedForRoom(room, occ)) {
      if (occ === 3) {
        return {
          allowed: false,
          maxCapacity: totalMaxCapacity,
          errorMessage: 'This room category does not offer 3-occupancy (No triple price configured). Maximum 2 guests allowed per room.',
        };
      }
      if (occ === 2) {
        return {
          allowed: false,
          maxCapacity: totalMaxCapacity,
          errorMessage: 'This room category does not offer Double occupancy (No double price configured). Only single occupancy is available.',
        };
      }
      if (occ === 1) {
        return {
          allowed: false,
          maxCapacity: totalMaxCapacity,
          errorMessage: 'This room category does not offer Single occupancy.',
        };
      }
    }
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

  const distributions = distributeAdultsAcrossRooms(safeAdults, roomInstances.length);
  for (let idx = 0; idx < distributions.length; idx++) {
    const occ = distributions[idx];
    const r = roomInstances[idx];
    if (!isOccupancySupportedForRoom(r, occ)) {
      if (occ === 3) {
        return {
          allowed: false,
          maxCapacity: totalCapacity,
          errorMessage: `${r?.type || 'A selected room'} does not offer 3-occupancy (No triple price configured).`,
        };
      }
      if (occ === 2) {
        return {
          allowed: false,
          maxCapacity: totalCapacity,
          errorMessage: `${r?.type || 'A selected room'} does not offer Double occupancy (No double price configured).`,
        };
      }
    }
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
  const rooms = Math.max(1, totalRooms || 1);
  const adults = Math.max(1, totalAdults || 1);

  const dist = new Array(rooms).fill(1);
  let extra = adults - rooms;

  for (let i = 0; i < rooms && extra > 0; i++) {
    dist[i] += 1;
    extra -= 1;
  }

  for (let i = 0; i < rooms && extra > 0; i++) {
    if (dist[i] < MAX_ADULTS_PER_ROOM) {
      dist[i] += 1;
      extra -= 1;
    }
  }

  return dist;
}

/**
 * Calculates complete pricing breakdown for a single selected room type with quantity.
 */
export function calculateBookingPricing(
  room: any,
  adults: number,
  roomsCount: number,
  nights: number
): BookingPricingResult {
  const safeAdults = Math.max(1, adults || 1);
  const safeRooms = Math.max(1, roomsCount || 1);
  const safeNights = Math.max(1, nights || 1);

  const maxOccupancyPerRoom = getRoomMaxOccupancy(room);
  const totalMaxCapacity = safeRooms * maxOccupancyPerRoom;
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
    : hasMissingPrice && doubleCount > 0
    ? 'This room does not offer Double occupancy (No double price configured by hotel). Only single occupancy is available.'
    : hasMissingPrice
    ? 'Price not configured for requested occupancy.'
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
    summaryParts.push(
      pDouble > 0
        ? `${doubleCount} Double (${doubleCount * 2} Adults @ ₹${pDouble.toLocaleString()})`
        : `${doubleCount} Double (Not Available)`
    );
  }
  if (singleCount > 0) {
    const pSingle = getRoomPriceForOccupancy(room, 1);
    summaryParts.push(
      pSingle > 0
        ? `${singleCount} Single (${singleCount * 1} Adult${singleCount > 1 ? 's' : ''} @ ₹${pSingle.toLocaleString()})`
        : `${singleCount} Single (Not Available)`
    );
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
    if (!isOccupancySupportedForRoom(r, occ)) {
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
      roomType: r?.type || 'Room',
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
      ? 'One or more selected rooms cannot accommodate the assigned guests (Rate not configured by hotel for this occupancy). Please check room limits or add more rooms.'
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
      const p = getRoomPriceForOccupancy(roomInstances[0], 3);
      summaryParts.push(p > 0 ? `${tripleCount} Triple @ ₹${p.toLocaleString()}` : `${tripleCount} Triple (Not Available)`);
    }
    if (doubleCount > 0) {
      const p = getRoomPriceForOccupancy(roomInstances[0], 2);
      summaryParts.push(p > 0 ? `${doubleCount} Double @ ₹${p.toLocaleString()}` : `${doubleCount} Double (Not Available)`);
    }
    if (singleCount > 0) {
      const p = getRoomPriceForOccupancy(roomInstances[0], 1);
      summaryParts.push(p > 0 ? `${singleCount} Single @ ₹${p.toLocaleString()}` : `${singleCount} Single (Not Available)`);
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
 * Safely adjusts requested rooms & adults:
 * Standard signature used across GuestSelector, HomeClient, and Hotel Details:
 *   adjustRoomsAndAdults(rooms, adults, field, targetValue)
 * 
 * Strict Invariants:
 * 1. 1 Adult can NEVER be assigned 2 or more rooms (rooms <= adults).
 * 2. Each room holds at most MAX_ADULTS_PER_ROOM (3) adults (minRooms = ceil(adults / 3)).
 * 3. When adults increase, rooms auto-scale if adults > rooms * 3.
 * 4. When adults decrease, rooms auto-scale down so rooms never exceed adults.
 */
export function adjustRoomsAndAdults(
  currentRooms: number,
  currentAdults: number,
  field: 'rooms' | 'adults' | string,
  targetValue?: number
): { rooms: number; adults: number } {
  let rooms = Math.max(1, Number(currentRooms) || 1);
  let adults = Math.max(1, Number(currentAdults) || 1);
  const target = targetValue !== undefined ? Math.max(1, Number(targetValue) || 1) : (field === 'rooms' ? rooms : adults);

  if (field === 'rooms') {
    rooms = Math.min(10, Math.max(1, target));
    // Each room must have at least 1 adult
    if (adults < rooms) {
      adults = rooms;
    }
    // Cannot exceed 3 adults per room
    const maxCapacity = rooms * MAX_ADULTS_PER_ROOM;
    if (adults > maxCapacity) {
      adults = maxCapacity;
    }
  } else if (field === 'adults') {
    adults = Math.min(30, Math.max(1, target));
    // Each room can accommodate up to 3 adults
    const minRoomsNeeded = Math.ceil(adults / MAX_ADULTS_PER_ROOM);
    if (rooms < minRoomsNeeded) {
      rooms = minRoomsNeeded;
    }
    // STRICT FIX: You cannot have more rooms than adults (e.g. 1 adult with 2 rooms is prohibited)
    if (rooms > adults) {
      rooms = adults;
    }
  }

  return { rooms, adults };
}
