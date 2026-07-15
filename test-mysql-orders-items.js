import mysql from 'mysql2/promise';
async function run() {
  const pool = mysql.createPool("mysql://esilayaz_esilaticari:q7D6%24ry84@esilayazilim.com:3306/esilayaz_esilaticari");
  const [rows] = await pool.query("SELECT id, items FROM orders WHERE vkn = '1111111111'");
  for (const r of rows) {
    let items = r.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) {}
    }
    if (!Array.isArray(items)) {
      console.log('NOT ARRAY:', r.id, items);
    }
  }
  process.exit(0);
}
run();
