import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { SERVER_ROOT } from "./paths.js";

dotenv.config({ path: path.join(SERVER_ROOT, ".env") });

function requireEnv(name) {
  const v = process.env[name];
  if (v === undefined || String(v).trim() === "") {
    return null;
  }
  return String(v).trim();
}

function validateDbEnv() {
  const user = requireEnv("DB_USER");
  const database = requireEnv("DB_NAME");
  const missing = [];
  if (!user) missing.push("DB_USER");
  if (!database) missing.push("DB_NAME");
  if (missing.length) {
    const envPath = path.join(SERVER_ROOT, ".env");
    console.error("\n[x] MySQL configuration missing.\n");
    console.error(`    Create ${envPath}`);
    console.error("    (copy .env.example) and set at least DB_USER and DB_NAME.\n");
    console.error(`    Missing: ${missing.join(", ")}\n`);
    process.exit(1);
  }
}

validateDbEnv();

const useSsl =
  String(process.env.DB_SSL || "").toLowerCase() === "true" ||
  String(process.env.DB_SSL || "").toLowerCase() === "1";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password:
    process.env.DB_PASSWORD === undefined ? "" : process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ...(useSsl ? { ssl: {} } : {}),
});

const CREATE_BOOKINGS_TABLE = `
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(12) NOT NULL,
  unit_number VARCHAR(20),
  street_number VARCHAR(20) NOT NULL,
  street_name VARCHAR(100) NOT NULL,
  pickup_suburb VARCHAR(100),
  destination_suburb VARCHAR(100),
  pickup_date VARCHAR(20) NOT NULL,
  pickup_time VARCHAR(10) NOT NULL,
  booking_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'unassigned'
)`;

export function formatDbStartupError(err) {
  const code = err?.code;
  const msg = err?.message || String(err);
  const lines = ["\n[x] Could not connect to MySQL or prepare the database.\n"];
  if (code === "ECONNREFUSED") {
    lines.push(
      "    • Is MySQL running? (XAMPP/WAMP: start MySQL; Windows Service: check MySQL service.)\n"
    );
    lines.push(
      `    • Check DB_HOST / DB_PORT in ${path.join(SERVER_ROOT, ".env")} (default port 3306).\n`
    );
  } else if (code === "ER_ACCESS_DENIED_ERROR") {
    lines.push(
      "    • Wrong DB_USER or DB_PASSWORD in server/.env.\n"
    );
  } else if (code === "ER_BAD_DB_ERROR") {
    lines.push(
      `    • Database "${process.env.DB_NAME}" does not exist. Create it, e.g.:\n`
    );
    lines.push(
      `      CREATE DATABASE \`${process.env.DB_NAME}\`;\n`
    );
  } else {
    lines.push(`    • ${msg}\n`);
  }
  lines.push(
    `    • Fix settings in ${path.join(SERVER_ROOT, ".env")} then restart the API.\n`
  );
  return lines.join("");
}

export async function ensureSchema() {
  await pool.query(CREATE_BOOKINGS_TABLE);
}

export { pool };
