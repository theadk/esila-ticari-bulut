const fs = require('fs');
let code = fs.readFileSync('server2.ts', 'utf8');

if (!code.includes("import { sendMail }")) {
    code = code.replace("import { getFallbackTable, insertFallbackRow, updateFallbackRow, deleteFallbackRow } from './server/fallbackDb.js';", "import { getFallbackTable, insertFallbackRow, updateFallbackRow, deleteFallbackRow } from './server/fallbackDb.js';\nimport { sendMail } from './server/mailer.js';\nimport { startMailScheduler } from './server/mailScheduler.js';");
}

const emailEndpoint = `
    app.post('/api/send-email', async (req, res) => {
      try {
        const { to, subject, html } = req.body;
        const vkn = req.headers['x-tenant-id'] || '1111111111';
        if (!to || !subject || !html) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await sendMail(to, subject, html, true, undefined, vkn);
        if (result.success) {
          res.json({ success: true });
        } else {
          res.status(500).json({ error: result.error });
        }
      } catch(e) {
        res.status(500).json({ error: String(e) });
      }
    });
`;

if (!code.includes("/api/send-email")) {
    code = code.replace("    app.post('/api/auth/reset-password', async (req, res) => {", emailEndpoint + "\n    app.post('/api/auth/reset-password', async (req, res) => {");
}

fs.writeFileSync('server2.ts', code);
