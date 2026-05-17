fetch('http://localhost:3000/').then(r => r.text()).then(t => console.log(t.substring(0, 200))).catch(console.error);
