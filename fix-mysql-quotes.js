import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace "columnName" with `columnName`
content = content.replace(/"purchasePrice"/g, '\`purchasePrice\`');
content = content.replace(/"warehouseStocks"/g, '\`warehouseStocks\`');
content = content.replace(/"taxRate"/g, '\`taxRate\`');
content = content.replace(/"customerId"/g, '\`customerId\`');
content = content.replace(/"customerName"/g, '\`customerName\`');
content = content.replace(/"balanceType"/g, '\`balanceType\`');
content = content.replace(/"emailSentAt"/g, '\`emailSentAt\`');
content = content.replace(/"respondedAt"/g, '\`respondedAt\`');
content = content.replace(/"responseNotes"/g, '\`responseNotes\`');

fs.writeFileSync('server.ts', content);
