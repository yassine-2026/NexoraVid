const { spawnSync } = require('child_process');
const path = require('path');
const YTDLP_PATH = path.resolve(process.cwd(), 'yt-dlp');
const out = spawnSync(YTDLP_PATH, ['-j', '--no-warnings', 'https://vt.tiktok.com/ZS23uJ89c/']);
const data = JSON.parse(out.stdout.toString());
console.log(data.http_headers);
