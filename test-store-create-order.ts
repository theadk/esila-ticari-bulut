import { config } from "dotenv";
config({ override: true });

async function run() {
  const url = "http://localhost:3000/api/orders";
  const nextOrderId = `SIP-1002-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  
  const newOrder = {
    id: nextOrderId,
    customerId: 'CUS-1782415367930', // Test customer
    customerName: 'Test',
    date: new Date().toISOString(),
    subTotal: 100,
    taxTotal: 20,
    total: 120,
    currency: 'TRY',
    exchangeRate: 1,
    status: 'Bekliyor', // OrderStatus.PENDING
    items: [{ productId: 'URN-1001', name: 'Test Product', quantity: 1, price: 100, taxRate: 20, discount: 0 }],
    notes: 'Test note'
  };

  try {
      const res = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': '1111111111'
          },
          body: JSON.stringify(newOrder)
      });
      const text = await res.text();
      console.log("Response:", res.status, text);
  } catch(e) {
      console.error("Error:", e);
  }
}
run();
