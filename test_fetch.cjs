fetch('https://v19-webapp-prime.tiktok.com/video/tos/alisg/tos-alisg-pv-0037/oUuoPAAAOAD0KUfECFLIAWG5IAAjEeAARDeKo3/media-video-hvc1/?a=1988&bti=ODszNWYuMDE6&&bt=792&eid=8192&ft=Bich7VgAwUxRfK1DUyBO5_3MIUWD6~uRGG1GlN0fvLN03-I&mime_type=video_mp4&rc=Zzk2aDZpPGQ0Zzg1ZzozZEBpM2R4aGs5cnF1djMzODczNEBgLy41NGEuXzIxYS8uNV8zYSMtXnE1MmQ0aS1gLS1kMTFzcw%3D%3D&expire=1783069872&l=20260701090815FFDBBD6CBAC8484D76B5&ply_type=2&policy=2&signature=7a2f84de6f51615fd0eae26d1d76d765&tk=tt_chain_token&btag=e00090000', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Range': 'bytes=0-1000'
  }
}).then(async r => {
  console.log(r.status, r.headers);
  console.log(await r.arrayBuffer());
}).catch(console.error);
