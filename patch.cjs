const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  `const range = req.headers.range;\n       const headers: any = {\n           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',\n       };`,
  `const range = req.headers.range;\n       const headers: any = cachedData.info.http_headers ? { ...cachedData.info.http_headers } : {\n           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',\n       };`
);
fs.writeFileSync('server.ts', code);
