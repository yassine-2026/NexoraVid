fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: 'https://vt.tiktok.com/ZS23uJ89c/'})
}).then(r => r.json()).then(console.log).catch(console.error);
