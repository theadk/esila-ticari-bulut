import { config } from "dotenv";
config({ override: true });
import { getPool } from "./server/db.js";

async function run() {
  const url = "http://localhost:3000/api/orders";
  const nextOrderId = `SIP-1002-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  
  const newOrder = {
    id: nextOrderId,
    customerId: 'CAR-PRK-1782419914070',
    customerName: 'Perakende Müşteri',
    date: new Date().toISOString(),
    status: 'Bekliyor',
    subTotal: 100,
    taxTotal: 20,
    total: 120,
    currency: 'TRY',
    exchangeRate: 1,
    items: [{ productId: '1', quantity: 1, price: 100 }]
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
      const data = await res.json();
      console.log("Response:", res.status, data);
  } catch(e) {
      console.error("Error:", e);
  }
}
run();
