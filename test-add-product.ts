import { config } from "dotenv";
config();
import { getPool } from "./server/db.js";

async function run() {
  const pool = getPool();
  try {
    const res = await pool.query(
      "INSERT INTO products (vkn, id, code, name, taxRate) VALUES (?, ?, ?, ?, ?)",
      ["1111111111", "test-123", "TEST-CODE", "Test Product", 20]
    );
    console.log("Insert result:", res);

    const [rows] = await pool.query("SELECT taxRate FROM products WHERE id = 'test-123'");
    console.log("Fetched taxRate:", rows[0].taxRate);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
