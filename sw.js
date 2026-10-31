const VERSION="v26";
const CACHE=`musica-gratis-${VERSION}`;
const ASSETS=["./","./index.html","./style.css","./app.js?v=26","./manifest.json"];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);

  // Never cache external music/catalog requests: they must stay fresh.
  if(url.origin!==self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached) return cached;
      return fetch(event.request).then(response=>{
        if(!response || !response.ok) return response;
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        return response;
      }).catch(()=>cached || Response.error());
    })
  );
});
