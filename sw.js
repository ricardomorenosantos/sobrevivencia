// Service worker: guarda todos os arquivos do app no aparelho para funcionar sem internet.
//
// IMPORTANTE: sempre que você mudar qualquer arquivo do app, aumente este número
// (v1 -> v2 -> v3...). É assim que o iPhone percebe que existe versão nova.
const VERSAO = "v1";
const CACHE = "sobrevivencia-" + VERSAO;

// Lista de tudo que o app precisa. Arquivo novo? Adicione aqui.
const ARQUIVOS = [
  "./",
  "index.html",
  "style.css",
  "manual.js",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

// Instalação: baixa e guarda todos os arquivos.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      // cache: "reload" ignora o cache comum do navegador e pega a versão nova de verdade
      .then((cache) => cache.addAll(ARQUIVOS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// Ativação: apaga os caches de versões antigas.
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Pedidos: responde sempre com o que está guardado. O app nunca depende da rede.
self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET" || new URL(pedido.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(pedido, { ignoreSearch: true }).then((guardado) => {
      if (guardado) return guardado;
      // Navegação para um endereço não guardado: devolve a página principal.
      if (pedido.mode === "navigate") return caches.match("index.html");
      return fetch(pedido);
    })
  );
});
