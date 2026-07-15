import http from 'http';
http.get('http://localhost:3000/api/orders', { headers: { 'x-tenant-id': '1111111111', 'x-user-id': 'admin' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('orders admin:', data.substring(0, 200)));
});
http.get('http://localhost:3000/api/orders', { headers: { 'x-tenant-id': '1111111111', 'x-user-id': 'test' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('orders test:', data.substring(0, 200)));
});
