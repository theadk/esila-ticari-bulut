import fs from 'fs';

const TABLES = [
  'users',
  'settings',
  'customers',
  'customer_transactions',
  'cash_transactions',
  'personnel',
  'personnel_records',
  'orders',
  'proposals'
];

let content = fs.readFileSync('server.ts', 'utf8');

const marker = "// Vite middleware setup";
let genericCRUD = `
  // Generic CRUD API for all tables
  const tables = ${JSON.stringify(TABLES)};
  for (const table of tables) {
    app.get(\`/api/\${table}\`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json([]);
        const pool = getPool();
        const [rows] = await pool.query(\`SELECT * FROM \${table}\`);
        res.json(rows);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.post(\`/api/\${table}\`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json(req.body);
        const pool = getPool();
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
        const questionMarks = keys.map(() => '?').join(', ');
        const backtick = String.fromCharCode(96);
        const fields = keys.map(k => backtick + k + backtick).join(', ');
        const query = \`INSERT INTO \${table} (\${fields}) VALUES (\${questionMarks})\`;
        await pool.query(query, values);
        res.json(req.body);
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.put(\`/api/\${table}/:id\`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json(req.body);
        const pool = getPool();
        const data = req.body;
        if (data.id) delete data.id; // Don't update id
        const keys = Object.keys(data);
        const values = keys.map(k => typeof data[k] === 'object' && data[k] !== null ? JSON.stringify(data[k]) : data[k]);
        const backtick = String.fromCharCode(96);
        const setString = keys.map(k => backtick + k + backtick + ' = ?').join(', ');
        const query = \`UPDATE \${table} SET \${setString} WHERE id = ?\`;
        await pool.query(query, [...values, req.params.id]);
        res.json({ id: req.params.id, ...data });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });

    app.delete(\`/api/\${table}/:id\`, async (req, res) => {
      try {
        if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql")) return res.json({ success: true });
        const pool = getPool();
        await pool.query(\`DELETE FROM \${table} WHERE id = ?\`, [req.params.id]);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: String(e) });
      }
    });
  }

`;

content = content.replace(marker, genericCRUD + marker);
fs.writeFileSync('server.ts', content);
