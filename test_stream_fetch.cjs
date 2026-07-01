fetch('http://localhost:3000/api/stream?taskId=af52a30c-d60c-482c-89db-c8c1adac1d15', {
  headers: {
    'Range': 'bytes=0-1000'
  }
}).then(async r => {
  console.log(r.status, r.statusText);
  if (r.status === 500) {
    const text = await r.text();
    console.log(text);
  }
}).catch(console.error);
