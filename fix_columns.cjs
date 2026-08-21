const mysql = require('mysql2/promise');
async function main() {
  const url = "mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari";
  const pool = mysql.createPool(url);
  try {
    await pool.query("ALTER TABLE customers CHANGE groupName customerGroup VARCHAR(255)");
    console.log("Renamed groupName to customerGroup");
  } catch(e) { console.error("Could not rename groupName", e.message); }

  try {
    await pool.query("ALTER TABLE customers ADD COLUMN isLead BOOLEAN");
    console.log("Added isLead");
  } catch(e) { console.error("Could not add isLead", e.message); }

  try {
    await pool.query("ALTER TABLE customers ADD COLUMN leadStatus VARCHAR(255)");
    console.log("Added leadStatus");
  } catch(e) { console.error("Could not add leadStatus", e.message); }

  try {
    await pool.query("ALTER TABLE customers ADD COLUMN notes TEXT");
    console.log("Added notes");
  } catch(e) { console.error("Could not add notes", e.message); }

  process.exit(0);
}
main();
