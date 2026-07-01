fetch("http://localhost:3000/api/orders", {
  headers: { "x-tenant-id": "1111111111" }
})
.then(r => r.json())
.then(d => {
  console.log("Total orders:", d.length);
  if (d.length > 0) {
    console.log("Last 2 orders:", d.slice(-2));
  }
});
