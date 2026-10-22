// =====================================================
// sw.js — "Service worker": deixa o Mythoria abrir até sem internet
// (e é o que permite instalar como app na tela inicial).
//
// Estratégia "rede primeiro": com internet, sempre pega a versão nova
// do servidor e guarda uma cópia; sem internet, usa a cópia guardada.
// Mude o nome do CACHE quando quiser apagar as cópias antigas.
// =====================================================
const CACHE = 'mythoria-v0.19';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  // Só arquivos do próprio jogo (o Firebase e o Google cuidam do resto)
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE).then(cache => cache.put(pedido, copia));
        return resposta;
      })
      .catch(() => caches.match(pedido))
  );
});
