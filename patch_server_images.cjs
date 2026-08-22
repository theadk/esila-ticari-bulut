const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importCrypto = "import crypto from 'crypto';\n";
if (!code.includes("import crypto")) {
  code = code.replace('import express from "express";', 'import express from "express";\n' + importCrypto);
}

const processImageFunc = `
function processAndSaveImage(base64Image, tenantId) {
  if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith("data:image/")) {
    return base64Image;
  }
  const match = base64Image.match(/^data:image\\/([a-zA-Z+]+);base64,(.+)$/);
  if (!match) return base64Image;

  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const data = match[2];
  const buffer = Buffer.from(data, 'base64');
  
  const tenantDir = path.join(process.cwd(), 'resimler', tenantId);
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }

  const filename = \`\${crypto.randomUUID()}.\${ext}\`;
  const filePath = path.join(tenantDir, filename);
  fs.writeFileSync(filePath, buffer);

  return \`/resimler/\${tenantId}/\${filename}\`;
}
`;

code = code.replace("async function startServer() {", processImageFunc + "\nasync function startServer() {");

code = code.replace(
  "app.use(cors());", 
  "app.use(cors());\n  app.use('/resimler', express.static(path.join(process.cwd(), 'resimler')));"
);

// For PUT /api/products/:id
code = code.replace(
  /app\.put\("\/api\/products\/:id", async \(req, res\) => \{\n\s*if \([\s\S]*?\} = req\.body;/m,
  (match) => {
    return `app.put("/api/products/:id", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] || "1111111111");
    if (req.body.image) {
       req.body.image = processAndSaveImage(req.body.image, vkn);
    }
` + match.replace(/app\.put\("\/api\/products\/:id", async \(req, res\) => {/, "");
  }
);

// For POST /api/products
code = code.replace(
  /app\.post\("\/api\/products", async \(req, res\) => \{\n\s*if \([\s\S]*?\} = req\.body;/m,
  (match) => {
    return `app.post("/api/products", async (req, res) => {
    const vkn = (req.headers["x-tenant-id"] || "1111111111");
    if (req.body.image) {
       req.body.image = processAndSaveImage(req.body.image, vkn);
    }
` + match.replace(/app\.post\("\/api\/products", async \(req, res\) => {/, "");
  }
);

fs.writeFileSync('server.ts', code);
