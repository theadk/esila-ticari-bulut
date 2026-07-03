import http from 'http';
const data = JSON.stringify({
  id: 'test-1234',
  customerId: 'test',
  customerName: 'test',
  date: new Date().toISOString(),
  status: 'Tamamlandı',
  total: 100,
  items: JSON.stringify([])
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
