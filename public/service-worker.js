
// This is a redirector service worker that loads the main sw.js file
// This ensures backward compatibility with any code that might be referencing service-worker.js

// Immediately claim clients and load the main service worker
self.addEventListener('install', event => {
  self.skipWaiting();
  
  // Import the main service worker
  importScripts('sw.js');
});
