fetch("http://localhost:3000/api/orders", {
  method: 'POST',
  headers: { "Content-Type": "application/json", "x-tenant-id": "1111111111" },
  body: JSON.stringify({
    "id": "SIP-1004-XYZ",
    "customerId": "CAR-PRK-1782419914070",
    "customerName": "Perakende Müşteri",
    "date": "2026-07-01T10:40:00.000Z",
    "subTotal": 100,
    "taxTotal": 20,
    "total": 120,
    "currency": "TRY",
    "exchangeRate": 1,
    "status": "Bekliyor",
    "items": [
      {
        "productId": "URN-1001",
        "productName": "Ürün 1",
        "price": 100,
        "quantity": 1,
        "taxRate": 20
      }
    ],
    "notes": ""
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
