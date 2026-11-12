// Stockage hors ligne réservé aux ressources publiques (jamais aux données Supabase).
const CACHE = "adkoul-public-v2";
const ASSETS = ["./index.html","./vehicule.html","./mission.html","./ordre-mission.html","./manifest.json","./logo.webp"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("adkoul-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const publicPaths=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin||url.search||!publicPaths.has(url.pathname))return;
 event.respondWith(fetch(req).then(response=>{
  if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}
  return response;
 }).catch(()=>caches.match(req)));
});