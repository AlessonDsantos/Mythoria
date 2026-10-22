// =====================================================
// minimapa.js — Mapa pequeno no canto, estilo Tibia
// Começa todo preto e vai sendo "descoberto" por onde
// você passa. O que já foi descoberto entra no save.
// Clique num lugar descoberto do minimapa para andar até lá.
// =====================================================

const minimapa = {
  escala: 2,          // cada quadrado do mundo vira 2x2 pixels
  canvas: null,
  ctx: null,
  fundo: null,        // canvas invisível com o mapa já descoberto
  fundoCtx: null,
  explorado: null,    // 1 = descoberto, 0 = não (um número por quadrado)
  ultimaPos: '',
};

const RAIO_DESCOBERTA = { x: 8, y: 6 }; // um pouco mais que a tela

function configurarMinimapa() {
  const L = mapa.largura, A = mapa.altura, e = minimapa.escala;
  minimapa.canvas = document.getElementById('minimapa');
  minimapa.canvas.width = L * e;
  minimapa.canvas.height = A * e;
  minimapa.ctx = minimapa.canvas.getContext('2d');

  minimapa.fundo = document.createElement('canvas');
  minimapa.fundo.width = L * e;
  minimapa.fundo.height = A * e;
  minimapa.fundoCtx = minimapa.fundo.getContext('2d');
  minimapa.fundoCtx.fillStyle = '#000';
  minimapa.fundoCtx.fillRect(0, 0, L * e, A * e);

  minimapa.explorado = new Uint8Array(L * A);

  minimapa.canvas.addEventListener('pointerdown', (ev) => {
    const r = minimapa.canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / r.width * L);
    const y = Math.floor((ev.clientY - r.top) / r.height * A);
    if (!minimapa.explorado[y * L + x]) { mostrarMensagem('Você ainda não conhece esse lugar.'); return; }
    irAte(x, y, 60000); // limite maior: o caminho pode ser longo
  });
}

// Pinta no fundo os quadrados do retângulo que ainda não foram descobertos
function revelar(x0, y0, x1, y1) {
  const L = mapa.largura, e = minimapa.escala, c = minimapa.fundoCtx;
  for (let y = Math.max(0, y0); y <= Math.min(mapa.altura - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(L - 1, x1); x++) {
      if (minimapa.explorado[y * L + x]) continue;
      minimapa.explorado[y * L + x] = 1;
      c.fillStyle = TERRENOS[pegarTerreno(x, y)].mini;
      c.fillRect(x * e, y * e, e, e);
    }
  }
}

// Personagem novo já conhece a vila (as zonas seguras)
function revelarVila() {
  for (const v of mapa.zonasSeguras) revelar(v.x0 - 2, v.y0 - 2, v.x1 + 2, v.y1 + 2);
}

function atualizarMinimapa(agora) {
  const pos = jogador.x + ',' + jogador.y;
  if (pos !== minimapa.ultimaPos) {
    minimapa.ultimaPos = pos;
    revelar(jogador.x - RAIO_DESCOBERTA.x, jogador.y - RAIO_DESCOBERTA.y,
            jogador.x + RAIO_DESCOBERTA.x, jogador.y + RAIO_DESCOBERTA.y);
  }

  const c = minimapa.ctx, e = minimapa.escala;
  c.drawImage(minimapa.fundo, 0, 0);

  // NPCs: pontinhos azuis
  c.fillStyle = '#6ec6ff';
  for (const n of npcs) c.fillRect(n.x * e - 1, n.y * e - 1, e + 2, e + 2);

  // Destino do clique
  if (jogador.destino) {
    c.strokeStyle = '#ffe680';
    c.lineWidth = 1;
    c.strokeRect(jogador.destino.x * e - 2, jogador.destino.y * e - 2, e + 4, e + 4);
  }

  // Jogador: cruz branca piscando
  if (Math.floor(agora / 400) % 2 === 0) {
    c.fillStyle = '#ffffff';
    c.fillRect(jogador.x * e - 3, jogador.y * e, e + 6, e);
    c.fillRect(jogador.x * e, jogador.y * e - 3, e, e + 6);
  }
}

// ---------- Para o save ----------
// Transforma a lista de 0/1 num texto curto: cada letra guarda 6 quadrados
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function exploradoParaTexto() {
  let texto = '';
  const ex = minimapa.explorado;
  for (let i = 0; i < ex.length; i += 6) {
    let n = 0;
    for (let b = 0; b < 6; b++) n = (n << 1) | (ex[i + b] || 0);
    texto += LETRAS[n];
  }
  return texto;
}

function textoParaExplorado(texto) {
  const L = mapa.largura;
  for (let i = 0; i < texto.length; i++) {
    const n = LETRAS.indexOf(texto[i]);
    for (let b = 0; b < 6; b++) {
      const indice = i * 6 + b;
      if (indice >= minimapa.explorado.length) break;
      if ((n >> (5 - b)) & 1) revelar(indice % L, Math.floor(indice / L), indice % L, Math.floor(indice / L));
    }
  }
}
