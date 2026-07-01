const { execFile } = require('child_process');
const path = require('path');
const YTDLP_PATH = path.resolve(process.cwd(), 'yt-dlp');
const url = 'https://vt.tiktok.com/ZS23uJ89c/';

// 1. Get info
const infoProc = require('child_process').spawnSync(YTDLP_PATH, ['-j', '--no-warnings', url]);
const info = JSON.parse(infoProc.stdout.toString());

// 2. Stream
const cmdArgs = ['-f', 'best[ext=mp4]/best', '-g', '--no-warnings', url];
execFile(YTDLP_PATH, cmdArgs, (error, stdout, stderr) => {
  if (error) return console.error("error", error);
  const streamUrl = stdout.trim().split('\n')[0];
  console.log("STREAM URL:", streamUrl);
  
  const headers = info.http_headers || {};
  fetch(streamUrl, { headers }).then(r => {
    console.log("FETCH STATUS:", r.status);
  }).catch(e => {
    console.error("FETCH ERROR:", e);
  });
});
