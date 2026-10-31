const VERSION="v40";
const CACHE=`musica-gratis-${VERSION}`;
const ASSETS=["./","./index.html","./style.css?v=40","./app.js?v=40","./manifest.json"];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING") self.skipWaiting();
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
  if(url.origin!==self.location.origin) return;

  // HTML navigations must always prefer the network. This prevents an old
  // GitHub Pages index.html from keeping the app stuck on an older version.
  if(event.request.mode==="navigate" || event.request.destination==="document"){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put("./index.html",copy)).catch(()=>{});
          return response;
        })
        .catch(()=>caches.match("./index.html").then(r=>r||Response.error()))
    );
    return;
  }

  // App assets are network-first so a deployment is picked up immediately;
  // cached copies remain available offline.
  event.respondWith(
    fetch(event.request,{cache:"no-store"})
      .then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then(r=>r||Response.error()))
  );
});
