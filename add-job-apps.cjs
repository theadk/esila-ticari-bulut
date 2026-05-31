const fs = require('fs');

function addEndpoints(file) {
  let code = fs.readFileSync(file, 'utf8');
  if(!code.includes("app.get('/api/job_applications'")) {
    const endpoints = `
app.get('/api/job_applications', auth, async (req, res) => {
    try {
        if (!isMysql) {
            const items = getFallbackTable('job_applications').filter(t => t.tenant_id === req.user.tenantId);
            return res.json(items);
        }
        const [rows] = await getPool().query('SELECT * FROM job_applications WHERE tenant_id = ? ORDER BY applicationDate DESC', [req.user.tenantId]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

app.post('/api/job_applications', auth, async (req, res) => {
    try {
        const d = req.body;
        if (!isMysql) {
            const items = getFallbackTable('job_applications');
            const index = items.findIndex(t => t.id === d.id && t.tenant_id === req.user.tenantId);
            if (index > -1) {
              items[index] = { ...items[index], ...d };
            } else {
              items.push({ ...d, tenant_id: req.user.tenantId });
            }
            return res.json({ success: true, id: d.id });
        }
        await getPool().query('INSERT INTO job_applications (id, tenant_id, firstName, lastName, email, phone, positionApplied, applicationDate, status, resumeUrl, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE firstName=VALUES(firstName), lastName=VALUES(lastName), email=VALUES(email), phone=VALUES(phone), positionApplied=VALUES(positionApplied), applicationDate=VALUES(applicationDate), status=VALUES(status), resumeUrl=VALUES(resumeUrl), notes=VALUES(notes)', [d.id, req.user.tenantId, d.firstName, d.lastName, d.email, d.phone, d.positionApplied, d.applicationDate, d.status, d.resumeUrl, d.notes]);
        res.json({ success: true, id: d.id });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
`;
    // We can replace on `app.get('/api/settings'`
    code = code.replace("app.get('/api/settings'", endpoints + "\napp.get('/api/settings'");
    fs.writeFileSync(file, code);
  }
}

addEndpoints('server.ts');
console.log('Done');
