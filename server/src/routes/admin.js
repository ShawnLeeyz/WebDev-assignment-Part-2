import { Router } from "express";
import { pool } from "../db.js";

export const adminRouter = Router();

const SELECT_FIELDS = `booking_number, customer_name, phone, pickup_suburb, destination_suburb,
  pickup_date, pickup_time, status`;

adminRouter.get("/booking", async (req, res) => {
  const ref = req.query.ref;
  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "Missing ref" });
  }
  const pattern = /^BRN\d{5}$/;
  if (!pattern.test(ref.trim())) {
    return res.status(400).json({
      error: "Invalid reference number format. Expected BRN followed by 5 digits.",
    });
  }
  try {
    const [rows] = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM bookings WHERE booking_number = ?`,
      [ref.trim()]
    );
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json(row);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Search failed" });
  }
});

adminRouter.get("/upcoming", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM bookings
       WHERE pickup_time BETWEEN CURTIME() AND ADDTIME(CURTIME(), '02:00:00')
         AND STR_TO_DATE(pickup_date, '%d/%m/%Y') = CURDATE()
         AND status = 'unassigned'`
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not load upcoming bookings" });
  }
});

adminRouter.post("/assign", async (req, res) => {
  const ref = req.query.ref ?? req.body?.ref;
  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ success: false, message: "Missing ref" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE bookings SET status = 'assigned' WHERE booking_number = ?",
      [ref.trim()]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `No booking found for ${ref.trim()}`,
      });
    }
    return res.json({
      success: true,
      message: `Booking ${ref.trim()} has been assigned`,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Assign failed" });
  }
});
