export function validateBookingForm(values) {
  const {
    cname,
    phone,
    snumber,
    stname,
    date,
    time,
  } = values;

  if (!cname?.trim()) return "Please fill in your name";
  if (!phone?.trim()) return "Please fill in your phone number";
  if (!/^\d{10,12}$/.test(phone.trim()))
    return "Phone number must be 10-12 digits";
  if (!snumber?.trim()) return "Please fill in your street number";
  if (!stname?.trim()) return "Please fill in your street name";
  if (!isDateFormatValid(date?.trim() ?? ""))
    return "Please follow the date format DD/MM/YYYY";
  if (!isPickupInFuture(date?.trim() ?? "", time?.trim() ?? ""))
    return "Pickup date and time cannot be in the past";
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

function isPickupInFuture(dateString, timeString) {
  const [day, month, year] = dateString.split("/").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  const pickup = new Date(year, month - 1, day, hour, minute);
  return pickup >= new Date();
}

export function defaultDateTimeStrings() {
  const now = new Date();
  let day = now.getDate();
  let month = now.getMonth() + 1;
  const year = now.getFullYear();
  let hour = now.getHours();
  let minute = now.getMinutes();
  if (day < 10) day = "0" + day;
  if (month < 10) month = "0" + month;
  if (hour < 10) hour = "0" + hour;
  if (minute < 10) minute = "0" + minute;
  return {
    date: `${day}/${month}/${year}`,
    time: `${hour}:${minute}`,
  };
}
