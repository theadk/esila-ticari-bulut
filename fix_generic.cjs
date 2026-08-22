const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const vknDeclaration = 'const vkn = (req.headers["x-tenant-id"] as string) || "1111111111";\n';

const toReplace = [
  "app.get(`/api/${table}`, async (req, res) => {\n      try {",
  "app.post(`/api/${table}`, async (req, res) => {\n      try {",
  "app.put(`/api/${table}/:id`, async (req, res) => {\n      try {",
  "app.delete(`/api/${table}/:id`, async (req, res) => {\n      try {"
];

toReplace.forEach(t => {
  code = code.replace(t, t + '\n        ' + vknDeclaration);
});

// also /api/products
code = code.replace(
  'app.get("/api/products", async (req, res) => {\n    try {',
  'app.get("/api/products", async (req, res) => {\n    try {\n      ' + vknDeclaration
);

code = code.replace(
  'app.delete("/api/products/:id", async (req, res) => {\n    try {',
  'app.delete("/api/products/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);

// also categories and brands etc.
code = code.replace(
  'app.get("/api/categories", async (req, res) => {\n    try {',
  'app.get("/api/categories", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.post("/api/categories", async (req, res) => {\n    try {',
  'app.post("/api/categories", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.put("/api/categories/:id", async (req, res) => {\n    try {',
  'app.put("/api/categories/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.delete("/api/categories/:id", async (req, res) => {\n    try {',
  'app.delete("/api/categories/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);

code = code.replace(
  'app.get("/api/brands", async (req, res) => {\n    try {',
  'app.get("/api/brands", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.post("/api/brands", async (req, res) => {\n    try {',
  'app.post("/api/brands", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.put("/api/brands/:id", async (req, res) => {\n    try {',
  'app.put("/api/brands/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.delete("/api/brands/:id", async (req, res) => {\n    try {',
  'app.delete("/api/brands/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);

// warehouses
code = code.replace(
  'app.get("/api/warehouses", async (req, res) => {\n    try {',
  'app.get("/api/warehouses", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.post("/api/warehouses", async (req, res) => {\n    try {',
  'app.post("/api/warehouses", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.put("/api/warehouses/:id", async (req, res) => {\n    try {',
  'app.put("/api/warehouses/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.delete("/api/warehouses/:id", async (req, res) => {\n    try {',
  'app.delete("/api/warehouses/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);

// stock transfers
code = code.replace(
  'app.get("/api/stock_transfers", async (req, res) => {\n    try {',
  'app.get("/api/stock_transfers", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.post("/api/stock_transfers", async (req, res) => {\n    try {',
  'app.post("/api/stock_transfers", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.put("/api/stock_transfers/:id", async (req, res) => {\n    try {',
  'app.put("/api/stock_transfers/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);
code = code.replace(
  'app.delete("/api/stock_transfers/:id", async (req, res) => {\n    try {',
  'app.delete("/api/stock_transfers/:id", async (req, res) => {\n    try {\n      ' + vknDeclaration
);

fs.writeFileSync('server.ts', code);
