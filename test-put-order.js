import http from 'http';
const updateOrder = {
  status: 'İptal Edildi',
  items: [{productId: '1', quantity: 1, price: 10, unit: 'Adet', taxRate: 20}]
};

const req = http.request('http://localhost:3000/api/orders/04726bb1-ceb0-4a1c-ac6a-85eb25a59749', {
  method: 'PUT',
  headers: {
    'x-tenant-id': '5770426720',
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('PUT order:', res.statusCode, data));
});
req.write(JSON.stringify(updateOrder));
req.end();
