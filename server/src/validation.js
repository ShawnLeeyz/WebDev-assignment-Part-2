export function validateBookingPayload(body) {
  const cname = body.cname?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const snumber = body.snumber?.trim() ?? "";
  const stname = body.stname?.trim() ?? "";
  const date = body.date?.trim() ?? "";
  const time = body.time?.trim() ?? "";

  if (!cname) return "Please fill in your name";
  if (!phone) return "Please fill in your phone number";
  if (!/^\d{10,12}$/.test(phone)) return "Phone number must be 10-12 digits";
  if (!snumber) return "Please fill in your street number";
  if (!stname) return "Please fill in your street name";
  if (!date) return "Please fill in pickup date";
  if (!time) return "Please fill in pickup time";
  return null;
}

export function isDateFormatValid(dateString) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;
  const [d, m, y] = dateString.split("/").map(Number);
  const month = m - 1;
  const testDate = new Date(y, month, d);
  return (
    testDate.getFullYear() === y &&
    testDate.getMonth() === month &&
    testDate.getDate() === d
  );
}

export function isPickupInFuture(dateString, timeString) {
  const tp = timeString.split(":");
  if (tp.length < 2) return false;
  const [day, month, year] = dateString.split("/").map(Number);
  const hour = Number(tp[0]);
  const minute = Number(tp[1]);
  if ([day, month, year, hour, minute].some((n) => Number.isNaN(n))) {
    return false;
  }
  const pickup = new Date(year, month - 1, day, hour, minute);
  return pickup >= new Date();
}
