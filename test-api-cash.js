async function run() {
  const data = {
    id: "tx-test-2",
    date: "2026-07-01",
    type: "Gelir",
    category: "Satış",
    amount: 100,
    description: "Test API",
    customerId: "1"
  };
  const res = await fetch("http://localhost:3000/api/cash_transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer local_token", "x-tenant-id": "demo" },
    body: JSON.stringify(data)
  });
  console.log(res.status, await res.text());
}
run();
