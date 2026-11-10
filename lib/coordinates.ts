/**
 * Smart GPS coordinate parser supporting:
 * - Direct copy-paste from Google Maps: "17.385044, 78.486671" or "17.385044,78.486671"
 * - Space/semicolon/pipe separated: "17.385044 78.486671"
 * - Google Maps URLs: https://www.google.com/maps/@17.385044,78.486671,15z or ?q=17.385044,78.486671
 * - Degree/Cardinal format: 17.3850° N, 78.4866° E
 */
export function parseCoordinates(raw: string): { lat: string; lng: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim();

  // 1. Google Maps URL pattern: /@([0-9.-]+),([0-9.-]+)/ or ?q=([0-9.-]+),([0-9.-]+)/
  const urlMatch = str.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) || str.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (urlMatch) {
    return { lat: urlMatch[1], lng: urlMatch[2] };
  }

  // 2. Degrees / Cardinal direction pattern: 17.3850° N, 78.4866° E
  const dmsMatch = str.match(/(-?\d+\.?\d*)\s*°?\s*([NSns])?[\s,;/|]+(-?\d+\.?\d*)\s*°?\s*([EWew])?/);
  if (dmsMatch && (dmsMatch[2] || dmsMatch[4])) {
    let lat = parseFloat(dmsMatch[1]);
    let lng = parseFloat(dmsMatch[3]);
    if (dmsMatch[2] && dmsMatch[2].toUpperCase() === 'S') lat = -lat;
    if (dmsMatch[4] && dmsMatch[4].toUpperCase() === 'W') lng = -lng;
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat: lat.toString(), lng: lng.toString() };
    }
  }

  // 3. Simple comma/space/semicolon/pipe separated: "17.385044, 78.486671"
  const tokens = str.split(/[,\s;/|]+/).map(t => t.trim()).filter(Boolean);
  if (tokens.length >= 2) {
    const latNum = parseFloat(tokens[0]);
    const lngNum = parseFloat(tokens[1]);
    if (!isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
      return { lat: tokens[0], lng: tokens[1] };
    }
  }

  return null;
}

