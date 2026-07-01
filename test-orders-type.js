fetch("http://localhost:3000/api/orders", {
  headers: { "x-tenant-id": "1111111111" }
})
.then(r => r.json())
.then(d => {
  const last = d[d.length - 1];
  console.log("items type:", typeof last.items);
  console.log("items is array:", Array.isArray(last.items));
});
