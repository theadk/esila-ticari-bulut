import http from 'http';
http.get('http://localhost:3000/api/personnel', { headers: { 'x-tenant-id': '1111111111' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('personnel:', data.substring(0, 500)));
});
