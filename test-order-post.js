import http from 'http';
const newOrder = {
        id: crypto.randomUUID(),
        customerId: crypto.randomUUID(),
        customerName: 'Test Name',
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        items: [{productId: '1', quantity: 1, price: 10, unit: 'Adet', taxRate: 20}],
        subTotal: 10,
        taxTotal: 2,
        total: 12,
        status: 'Bekliyor',
        notes: '',
      };

const req = http.request('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'x-tenant-id': '1111111111',
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('POST order:', res.statusCode, data));
});
req.write(JSON.stringify(newOrder));
req.end();
