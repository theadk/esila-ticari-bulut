const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
  app.post('/api/upload-image', async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image required' });
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 string' });
      }

      const ext = matches[1].split('/')[1] || 'jpg';
      const data = Buffer.from(matches[2], 'base64');
      
      const tenantDir = path.join(process.cwd(), 'resimler', vkn);
      if (!fs.existsSync(tenantDir)) {
        fs.mkdirSync(tenantDir, { recursive: true });
      }

      const fileName = \`\${Date.now()}-\${Math.floor(Math.random()*1000)}.\${ext}\`;
      const filePath = path.join(tenantDir, fileName);
      
      fs.writeFileSync(filePath, data);
      
      const url = \`/resimler/\${vkn}/\${fileName}\`;
      res.json({ url });
    } catch (err) {
      console.error('Image upload error', err);
      res.status(500).json({ error: 'Image upload failed' });
    }
  });
`;

if (!code.includes('/api/upload-image')) {
  code = code.replace(
    'app.get("/api/system-status"',
    routeCode + '\n  app.get("/api/system-status"'
  );
  fs.writeFileSync('server.ts', code);
  console.log('Added upload route');
}
