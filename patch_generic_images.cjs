const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const imageProcessingSnippet = `
        for (const key of Object.keys(req.body)) {
          if (typeof req.body[key] === 'string' && req.body[key].startsWith('data:image/')) {
            req.body[key] = processAndSaveImage(req.body[key], vkn);
          }
        }
`;

code = code.replace(
  'app.post(`/api/${table}`, async (req, res) => {\n      try {\n        const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";',
  'app.post(`/api/${table}`, async (req, res) => {\n      try {\n        const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";\n' + imageProcessingSnippet
);

code = code.replace(
  'app.put(`/api/${table}/:id`, async (req, res) => {\n      try {\n        const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";',
  'app.put(`/api/${table}/:id`, async (req, res) => {\n      try {\n        const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";\n' + imageProcessingSnippet
);

fs.writeFileSync('server.ts', code);
