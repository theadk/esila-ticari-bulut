import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config();

async function check() {
  console.log("URL:", process.env.DATABASE_URL);
  try {
    const conn = await createConnection(process.env.DATABASE_URL!);
    await conn.query("SELECT 1");
    console.log("Connection SUCCESS!");
    conn.end();
  } catch (e: any) {
    console.error("Connection FAILED:", e.message);
  }
}
check();
