self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Intercept requests to /sw-download/
  if (url.pathname.startsWith('/sw-download/')) {
    // Construct the actual backend API URL
    const targetUrl = url.pathname.replace('/sw-download/', '/api/') + url.search;
    
    event.respondWith(
      fetch(targetUrl).then(response => {
        // Return the response directly to the browser
        // The backend already sets Content-Disposition: attachment
        // so the browser will handle the stream as a download.
        // This avoids memory limits and bypasses proxy navigation blocks.
        return response;
      }).catch(err => {
        return new Response('Download failed', { status: 500 });
      })
    );
  }
});
