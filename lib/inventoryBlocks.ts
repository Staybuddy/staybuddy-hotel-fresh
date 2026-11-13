/**
 * Shared utilities for evaluating Partner Extranet inventory & property date blocks.
 */

export function getDateStr(d: Date | string | number): string {
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const isoDatePart = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoDatePart) {
      return isoDatePart[1];
    }
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStayNights(checkIn?: string | null, checkOut?: string | null): string[] {
  const nights: string[] = [];
  if (checkIn && checkOut) {
    const startStr = getDateStr(checkIn);
    const endStr = getDateStr(checkOut);
    if (startStr === endStr) {
      return [startStr];
    }
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    const curr = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    let safety = 0;
    while (curr < end && safety < 365) {
      nights.push(getDateStr(curr));
      curr.setDate(curr.getDate() + 1);
      safety++;
    }
    if (nights.length > 0) return nights;
    return [startStr];
  }
  if (checkIn) {
    return [getDateStr(checkIn)];
  }
  return [getDateStr(new Date())];
}

export function isEntirePropertyBlock(blk: any): boolean {
  return blk?.roomId === 'all' || blk?.blockType === 'property';
}

export function isBlockCoveringNight(blk: any, nightStr: string): boolean {
  if (!blk?.startDate || !blk?.endDate) return false;
  const bStart = getDateStr(blk.startDate);
  const bEnd = getDateStr(blk.endDate);
  return bStart <= nightStr && bEnd >= nightStr;
}

export function isHotelBlockedForDates(
  hotel: any,
  hotelBlocks: any[],
  stayNights: string[],
  hasExplicitDates: boolean
): { blocked: boolean; reason: string } {
  const blocks = Array.isArray(hotelBlocks) ? hotelBlocks : [];
  const entirePropertyBlocks = blocks.filter(isEntirePropertyBlock);

  // 1. Check if any entire-property date block covers any requested night
  for (const nightStr of stayNights) {
    const match = entirePropertyBlocks.find((blk) => isBlockCoveringNight(blk, nightStr));
    if (match) {
      return {
        blocked: true,
        reason: match.reason || 'Property blocked by partner for selected dates',
      };
    }
  }

  // 2. Check hotel-level complete block flag (`isBlocked === true`)
  if (hotel?.isBlocked === true) {
    if (!hasExplicitDates) {
      return {
        blocked: true,
        reason: 'Property is currently blocked by partner',
      };
    }

    // If explicit dates were provided, check whether `isBlocked` came solely from a date block active today
    const todayStr = getDateStr(new Date());
    const hasTodayDateBlock = entirePropertyBlocks.some((blk) => isBlockCoveringNight(blk, todayStr));
    if (!hasTodayDateBlock) {
      // Permanently / completely blocked without an active today-only date block
      return {
        blocked: true,
        reason: 'Property is completely blocked',
      };
    }
  }

  return { blocked: false, reason: '' };
}

export function getRoomBlockedCountForNight(
  roomId: string,
  nightStr: string,
  hotelBlocks: any[],
  nightCapacity: number
): number {
  if (!Array.isArray(hotelBlocks) || hotelBlocks.length === 0) return 0;
  let blockedCount = 0;

  for (const blk of hotelBlocks) {
    if (!isBlockCoveringNight(blk, nightStr)) continue;
    if (isEntirePropertyBlock(blk)) {
      return nightCapacity;
    }
    if (blk.roomId === roomId) {
      if (blk.roomsCount === 'all') {
        return nightCapacity;
      }
      blockedCount += Math.max(1, Number(blk.roomsCount) || 1);
    }
  }

  return Math.min(nightCapacity, blockedCount);
}

