import express from "express";
import cors from "cors";
import path from "path";
import {
  ensureSchema,
  formatDbStartupError,
  pool,
} from "./db.js";
import { SERVER_ROOT } from "./paths.js";
import { bookingsRouter } from "./routes/bookings.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: true });
  } catch {
    res.status(503).json({
      ok: false,
      database: false,
      message: "Database unreachable — fix server/.env and ensure MySQL is running.",
    });
  }
});

async function main() {
  try {
    await ensureSchema();
  } catch (err) {
    console.error(formatDbStartupError(err));
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`CabsOnline API listening on http://127.0.0.1:${PORT}`);
    console.log(`  Env file: ${path.join(SERVER_ROOT, ".env")}`);
    console.log(`  DB check: GET http://127.0.0.1:${PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
