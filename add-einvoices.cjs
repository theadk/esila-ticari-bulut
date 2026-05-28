const fs = require('fs');

function addEInvoicesEndpoint(file) {
  let code = fs.readFileSync(file, 'utf8');
  if(!code.includes("app.get('/api/e_invoices'")) {
    const endpoints = `
app.get('/api/e_invoices', auth, async (req, res) => {
    try {
        if (!isMysql) {
            const items = getFallbackTable('e_invoices').filter(t => t.tenant_id === req.user.tenantId);
            return res.json(items);
        }
        const [rows] = await getPool().query('SELECT * FROM e_invoices WHERE tenant_id = ? ORDER BY date DESC', [req.user.tenantId]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.post('/api/e_invoices', auth, async (req, res) => {
    try {
        const d = req.body;
        if (!isMysql) {
            const items = getFallbackTable('e_invoices');
            items.push({ ...d, tenant_id: req.user.tenantId });
            return res.json({ success: true, id: d.id });
        }
        await getPool().query('INSERT INTO e_invoices (id, tenant_id, orderId, customerName, amount, type, scenario, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.id, req.user.tenantId, d.orderId, d.customerName, d.amount, d.type, d.scenario, d.date, d.status]);
        res.json({ success: true, id: d.id });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.put('/api/e_invoices/:id', auth, async (req, res) => {
    try {
        const d = req.body;
        if (!isMysql) {
            const items = getFallbackTable('e_invoices');
            const index = items.findIndex(t => t.id === req.params.id && t.tenant_id === req.user.tenantId);
            if (index > -1) items[index] = { ...items[index], ...d };
            return res.json({ success: true });
        }
        await getPool().query('UPDATE e_invoices SET status = ? WHERE id = ? AND tenant_id = ?', [d.status, req.params.id, req.user.tenantId]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
`;
    code = code.replace("app.get('/api/settings'", endpoints + "\napp.get('/api/settings'");
    fs.writeFileSync(file, code);
  }
}

addEInvoicesEndpoint('server.ts');
addEInvoicesEndpoint('server2.ts');
console.log('Done');
