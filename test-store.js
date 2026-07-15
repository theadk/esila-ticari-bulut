import http from 'http';
http.get('http://localhost:3000/api/tables/orders', { headers: { 'x-tenant-id': '1111111111' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('orders', data.substring(0, 500)));
});
http.get('http://localhost:3000/api/tables/personnel', { headers: { 'x-tenant-id': '1111111111' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('personnel', data.substring(0, 500)));
});
