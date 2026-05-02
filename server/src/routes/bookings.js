import { Router } from "express";
import { pool } from "../db.js";
import {
  isDateFormatValid,
  isPickupInFuture,
  validateBookingPayload,
} from "../validation.js";

export const bookingsRouter = Router();

async function generateBookingNumber(connection) {
  const [rows] = await connection.query(
    "SELECT MAX(booking_id) AS max_id FROM bookings"
  );
  const max = rows[0]?.max_id;
  const nextNum = max == null ? 1 : Number(max) + 1;
  let digit = String(nextNum);
  while (digit.length < 5) digit = "0" + digit;
  return `BRN${digit}`;
}

bookingsRouter.post("/", async (req, res) => {
  const body = req.body ?? {};
  const err = validateBookingPayload(body);
  if (err) {
    return res.status(400).json({ success: false, message: err });
  }

  const {
    cname,
    phone,
    unumber,
    snumber,
    stname,
    sbname,
    dsbname,
    date,
    time,
  } = body;

  if (!isDateFormatValid(date)) {
    return res
      .status(400)
      .json({ success: false, message: "Please follow the date format DD/MM/YYYY" });
  }
  if (!isPickupInFuture(date, time)) {
    return res.status(400).json({
      success: false,
      message: "Pickup date and time cannot be in the past",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const bookingNumber = await generateBookingNumber(connection);
    await connection.query(
      `INSERT INTO bookings (
        booking_number, customer_name, phone, unit_number, street_number, street_name,
        pickup_suburb, destination_suburb, pickup_date, pickup_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingNumber,
        cname.trim(),
        phone.trim(),
        unumber?.trim() ?? "",
        snumber.trim(),
        stname.trim(),
        sbname?.trim() ?? "",
        dsbname?.trim() ?? "",
        date.trim(),
        time.trim(),
      ]
    );
    await connection.commit();
    return res.json({
      success: true,
      bookingNumber,
      pickupDate: date.trim(),
      pickupTime: time.trim(),
    });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Could not create booking",
    });
  } finally {
    connection.release();
  }
});
