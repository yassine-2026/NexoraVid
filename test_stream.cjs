const { spawn } = require('child_process');
const path = require('path');
const YTDLP_PATH = path.resolve(process.cwd(), 'yt-dlp');
const url = 'https://vt.tiktok.com/ZS23uJ89c/'; // TikTok example

const args = ['-f', 'best', '-g', '--no-warnings', url];
const proc = spawn(YTDLP_PATH, args);

proc.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

proc.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});
