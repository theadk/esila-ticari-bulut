import { createConnection } from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

const envStr = fs.readFileSync(".env", "utf-8");
const envConfig = dotenv.parse(envStr);
const dbUrl = envConfig.DATABASE_URL;

async function check() {
  console.log("DB URL from file:", dbUrl ? "Found" : "Not Found");
  try {
    const conn = await createConnection(dbUrl);
    await conn.query("SELECT 1");
    console.log("Connection SUCCESS!");
    conn.end();
  } catch (e: any) {
    console.error("Connection FAILED:", e.message);
  }
}
check();
