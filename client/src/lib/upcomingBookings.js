/** Pickup as local Date from DD/MM/YYYY + HH:MM */
export function pickupDateTime(dateStr, timeStr) {
  const [d, m, y] = dateStr.split("/").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  if ([d, m, y, hh, mm].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, hh, mm);
}

function sameLocalCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Unassigned bookings whose pickup is today and between now and now + 2 hours
 * (matches the old PHP: today + time window).
 */
export function filterUpcomingUnassigned(rows) {
  const now = new Date();
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return rows.filter((row) => {
    if (row.status !== "unassigned") return false;
    const pickup = pickupDateTime(row.date, row.time);
    if (!pickup) return false;
    if (!sameLocalCalendarDay(pickup, now)) return false;
    return pickup >= now && pickup <= end;
  });
}
