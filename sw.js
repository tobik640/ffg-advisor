/* Versioned app shell. Never cache uploads or non-same-origin responses. */
const CACHE='ffg-advisor-v6-20261118';
const ASSETS=['./','./index.html','./advisor-v05.js','./charts-v05.js','./redesign-v06.css','./workspace-v06.js','./manifest.webmanifest','./assets/icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.all(ASSETS.map(async path=>{
      try{await cache.add(path);}catch(e){console.warn('FFG asset could not be precached:',path);}
    }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>
    key.startsWith('ffg-advisor-')&&key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  const isDocument=request.mode==='navigate'||/\/(index\.html|advisor-v05\.js|charts-v05\.js|redesign-v06\.css|workspace-v06\.js)$/.test(new URL(request.url).pathname);
  if(isDocument){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
    return response;
  })));
});

