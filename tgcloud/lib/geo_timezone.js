/**
 * Compute the UTC offset and timezone name from geographical coordinates (latitude & longitude).
 * Handles fractional timezone regions (Iran, Afghanistan, India, Nepal, etc.)
 * and falls back to standard solar longitude zones worldwide.
 *
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {{ offsetMinutes: number, tzName: string }}
 */
export function getTimezoneFromCoords(lat, lon) {
  // Iran (UTC+3:30 = +210 min)
  if (lat >= 25.0 && lat <= 39.8 && lon >= 44.0 && lon <= 63.5) {
    if (!(lon < 56.5 && lat < 26.5)) {
      return { offsetMinutes: 210, tzName: 'UTC+3:30 (Iran)' };
    }
  }

  // Afghanistan (UTC+4:30 = +270 min)
  if (lat >= 29.3 && lat <= 38.5 && lon >= 60.5 && lon <= 74.9) {
    return { offsetMinutes: 270, tzName: 'UTC+4:30 (Afghanistan)' };
  }

  // India & Sri Lanka (UTC+5:30 = +330 min)
  if (lat >= 5.9 && lat <= 35.5 && lon >= 68.1 && lon <= 97.4) {
    return { offsetMinutes: 330, tzName: 'UTC+5:30 (India)' };
  }

  // Nepal (UTC+5:45 = +345 min)
  if (lat >= 26.3 && lat <= 30.5 && lon >= 80.0 && lon <= 88.2) {
    return { offsetMinutes: 345, tzName: 'UTC+5:45 (Nepal)' };
  }

  // Myanmar (UTC+6:30 = +390 min)
  if (lat >= 9.5 && lat <= 28.5 && lon >= 92.2 && lon <= 101.2) {
    return { offsetMinutes: 390, tzName: 'UTC+6:30 (Myanmar)' };
  }

  // Central Australia (UTC+9:30 = +570 min)
  if (lat >= -38.5 && lat <= -10.5 && lon >= 129.0 && lon <= 141.0) {
    return { offsetMinutes: 570, tzName: 'UTC+9:30 (Central Australia)' };
  }

  // Newfoundland (UTC-3:30 = -210 min)
  if (lat >= 46.5 && lat <= 52.0 && lon >= -59.5 && lon <= -52.5) {
    return { offsetMinutes: -210, tzName: 'UTC-3:30 (Newfoundland)' };
  }

  // Standard solar zone calculation based on longitude (15 degrees = 1 hour)
  let rawHours = Math.round(lon / 15);
  rawHours = Math.max(-12, Math.min(14, rawHours));
  const offsetMinutes = rawHours * 60;
  const sign = rawHours >= 0 ? '+' : '-';
  const tzName = `UTC${sign}${Math.abs(rawHours)}`;

  return { offsetMinutes, tzName };
}
