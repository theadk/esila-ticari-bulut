import http from 'http';
const data = JSON.stringify({
       id: "1111111111-SIP-HS-TEST-001",
       customerId: "CUS-1782415367930",
       customerName: "DEMKA",
       date: new Date().toISOString(),
       status: "Tamamlandı",
       items: [{
         productId: "9qsdlyfix",
         productName: "Test Ürün",
         quantity: 1,
         price: 1700,
         taxRate: 20,
         discount: 0
       }],
       total: 1700
});
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': '1111111111'
  }
};
const req = http.request(options, res => {
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => console.log('Response:', resData));
});
req.write(data);
req.end();
