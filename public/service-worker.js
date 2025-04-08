
// Redirect to the main service worker
if ('serviceWorker' in navigator) {
  // This is a redirector service worker
  // All functionality has been moved to sw.js
  
  self.addEventListener('install', event => {
    console.log('Redirector service worker installed - delegating to sw.js');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', event => {
    console.log('Redirector service worker activated - delegating to sw.js');
    // Immediately claim clients so they use sw.js
    event.waitUntil(self.clients.claim());
    
    // Notify clients to register the main service worker
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'REGISTER_MAIN_SW',
          swUrl: '/sw.js'
        });
      });
    });
  });
}
