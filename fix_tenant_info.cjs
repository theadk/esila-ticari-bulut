const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  app.get("/api/tenant-info", async (req, res) => {
    try {
      
      if (`;

const replaceStr = `  app.get("/api/tenant-info", async (req, res) => {
    try {
      const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";
      if (`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('server.ts', code);
console.log('Fixed');
