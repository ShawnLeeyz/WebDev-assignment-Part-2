import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Directory containing package.json and `.env` (always correct even if npm runs from repo root). */
export const SERVER_ROOT = path.resolve(__dirname, "..");
