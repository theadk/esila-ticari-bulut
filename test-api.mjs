import http from 'http';
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/tenants/1111111111/activate',
  method: 'PUT'
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
});
req.end();
