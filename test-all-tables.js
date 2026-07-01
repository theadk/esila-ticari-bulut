fetch("http://localhost:3000/api/users", { headers: { "x-tenant-id": "1111111111" } })
.then(r => console.log(r.status))
.catch(console.error);
