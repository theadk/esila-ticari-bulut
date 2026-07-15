import http from 'http';
const vkn = "1111111111";

const testOrder = {
  id: "test-order-" + Date.now(),
  customerId: "test",
  customerName: "Test Order",
  date: new Date().toISOString(),
  status: "Bekliyor",
  subTotal: 10,
  taxTotal: 2,
  total: 12,
  items: [{ productId: "p1", quantity: 1, price: 10 }]
};

const req = http.request('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'x-tenant-id': vkn,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('POST order:', res.statusCode, data));
});
req.write(JSON.stringify(testOrder));
req.end();
