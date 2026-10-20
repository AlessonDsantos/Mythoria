// =====================================================
// mapa.js — Cria e guarda o mundo
// O mapa é uma grade (tabela) de terrenos: mapa.tiles[y][x]
// No centro fica a vila; em volta, a natureza gerada por sorteio.
// =====================================================

// Gerador de números aleatórios com "semente".
// Mesma semente = mesmo mapa toda vez (Math.random() mudaria sempre).
function criarAleatorio(semente) {
  let s = semente >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mapa = {
  largura: CONFIG.LARGURA_MAPA,
  altura: CONFIG.ALTURA_MAPA,
  tiles: [],
  centro: { x: 0, y: 0 },
  vila: null,     // retângulo da vila (zona segura)
  pontos: {},     // onde ficam templo e NPCs (preenchido ao gerar)
};

// Devolve o nome do terreno em (x, y). Fora do mapa conta como árvore (bloqueado).
function pegarTerreno(x, y) {
  if (x < 0 || y < 0 || x >= mapa.largura || y >= mapa.altura) return 'arvore';
  return mapa.tiles[y][x];
}

function definirTerreno(x, y, tipo) {
  if (x < 0 || y < 0 || x >= mapa.largura || y >= mapa.altura) return;
  mapa.tiles[y][x] = tipo;
}

function ehPassavel(x, y) {
  return TERRENOS[pegarTerreno(x, y)].passavel;
}

function dentroDaVila(x, y, margem = 0) {
  const v = mapa.vila;
  return x >= v.x0 - margem && x <= v.x1 + margem && y >= v.y0 - margem && y <= v.y1 + margem;
}

// Preenche um retângulo inteiro com um terreno
function preencher(x0, y0, x1, y1, tipo) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) definirTerreno(x, y, tipo);
}

// Casa: paredes em volta, piso dentro e um buraco para a porta
function construirCasa(x0, y0, x1, y1, porta, piso) {
  preencher(x0, y0, x1, y1, 'parede');
  preencher(x0 + 1, y0 + 1, x1 - 1, y1 - 1, piso);
  definirTerreno(porta.x, porta.y, piso);
}

function gerarMapa() {
  const aleatorio = criarAleatorio(CONFIG.SEMENTE_MAPA);
  const L = mapa.largura;
  const A = mapa.altura;
  const cx = Math.floor(L / 2);
  const cy = Math.floor(A / 2);
  mapa.centro = { x: cx, y: cy };
  // A vila é mais comprida para baixo: lá fica o campo de treinamento
  mapa.vila = { x0: cx - 12, y0: cy - 12, x1: cx + 13, y1: cy + 20 };

  // 1) Tudo começa como grama
  mapa.tiles = [];
  for (let y = 0; y < A; y++) mapa.tiles.push(new Array(L).fill('grama'));

  // 2) Lagos (longe da vila)
  const qtdLagos = Math.round(L * A / 1000);
  for (let i = 0; i < qtdLagos; i++) {
    const lx = Math.floor(8 + aleatorio() * (L - 16));
    const ly = Math.floor(8 + aleatorio() * (A - 16));
    const rx = 3 + aleatorio() * 4;
    const ry = 2 + aleatorio() * 3;
    if (dentroDaVila(lx, ly, 8)) continue;
    for (let y = Math.floor(ly - ry); y <= ly + ry; y++) {
      for (let x = Math.floor(lx - rx); x <= lx + rx; x++) {
        const dx = (x - lx) / rx;
        const dy = (y - ly) / ry;
        if (dx * dx + dy * dy <= 1 && !dentroDaVila(x, y, 3)) definirTerreno(x, y, 'agua');
      }
    }
  }

  // 3) Areia em volta da água (praia)
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      if (mapa.tiles[y][x] !== 'grama') continue;
      const vizinhoAgua =
        pegarTerreno(x + 1, y) === 'agua' || pegarTerreno(x - 1, y) === 'agua' ||
        pegarTerreno(x, y + 1) === 'agua' || pegarTerreno(x, y - 1) === 'agua';
      if (vizinhoAgua) mapa.tiles[y][x] = 'areia';
    }
  }

  // 4) Bosques: grupos de árvores
  const qtdBosques = Math.round(L * A / 90);
  for (let i = 0; i < qtdBosques; i++) {
    const bx = Math.floor(aleatorio() * L);
    const by = Math.floor(aleatorio() * A);
    const raio = 1 + Math.floor(aleatorio() * 3);
    for (let y = by - raio; y <= by + raio; y++) {
      for (let x = bx - raio; x <= bx + raio; x++) {
        if (pegarTerreno(x, y) === 'grama' && !dentroDaVila(x, y, 3) && aleatorio() < 0.6) definirTerreno(x, y, 'arvore');
      }
    }
  }

  // 5) Pedras e flores soltas
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      if (mapa.tiles[y][x] !== 'grama') continue;
      const r = aleatorio();
      if (r < 0.02 && !dentroDaVila(x, y, 3)) mapa.tiles[y][x] = 'pedra';
      else if (r < 0.08) mapa.tiles[y][x] = 'flor';
    }
  }

  // 6) Estradas saindo dos portões da vila até a borda (ponte em cima da água)
  for (let i = 2; i < Math.max(L, A) - 2; i++) {
    for (const k of [0, 1]) {
      for (const [x, y] of [[i, cy + k], [cx + k, i]]) {
        if (dentroDaVila(x, y)) continue;
        definirTerreno(x, y, pegarTerreno(x, y) === 'agua' ? 'ponte' : 'terra');
      }
    }
  }

  // 7) A vila
  construirVila(cx, cy);

  // 8) Borda de árvores para ninguém sair do mundo
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      if (x < 2 || y < 2 || x >= L - 2 || y >= A - 2) mapa.tiles[y][x] = 'arvore';
    }
  }

  return mapa.pontos.templo;
}

function construirVila(cx, cy) {
  const v = mapa.vila;

  // Chão de grama com algumas flores
  preencher(v.x0, v.y0, v.x1, v.y1, 'grama');

  // Paliçada em volta, com 4 portões
  for (let x = v.x0; x <= v.x1; x++) { definirTerreno(x, v.y0, 'cerca'); definirTerreno(x, v.y1, 'cerca'); }
  for (let y = v.y0; y <= v.y1; y++) { definirTerreno(v.x0, y, 'cerca'); definirTerreno(v.x1, y, 'cerca'); }

  // Ruas em cruz (passam pelos portões) e a praça do centro
  preencher(cx, v.y0, cx + 1, v.y1, 'calcada');
  preencher(v.x0, cy, v.x1, cy + 1, 'calcada');
  preencher(cx - 3, cy - 3, cx + 4, cy + 4, 'calcada');

  // Quatro casas, uma em cada canto da praça
  //   norte: porta embaixo, NPC no fundo (em cima)
  //   sul:   porta em cima, NPC no fundo (embaixo)
  const casas = {
    pocoes:    { x0: cx - 9, y0: cy - 9, x1: cx - 3, y1: cy - 4, norte: true },
    armas:     { x0: cx + 4, y0: cy - 9, x1: cx + 10, y1: cy - 4, norte: true },
    armaduras: { x0: cx - 9, y0: cy + 5, x1: cx - 3, y1: cy + 10, norte: false },
    templo:    { x0: cx + 4, y0: cy + 5, x1: cx + 10, y1: cy + 10, norte: false },
  };

  // Placa pendurada ao lado da porta (número da peça na folha base.png)
  const PLACAS = { pocoes: 665, armas: 656, armaduras: 657, templo: 614 };
  mapa.pontos.placas = [];

  for (const nome in casas) {
    const c = casas[nome];
    const portaX = c.x0 + 3;
    const porta = { x: portaX, y: c.norte ? c.y1 : c.y0 };
    mapa.pontos.placas.push({ x: portaX + 1, y: porta.y, peca: PLACAS[nome] });
    const piso = nome === 'templo' ? 'piso_templo' : 'piso';
    construirCasa(c.x0, c.y0, c.x1, c.y1, porta, piso);

    // Caminho de calçada da porta até a rua
    if (c.norte) preencher(portaX, c.y1 + 1, portaX, cy - 1, 'calcada');
    else preencher(portaX, cy + 2, portaX, c.y0 - 1, 'calcada');

    const fundo = c.norte ? c.y0 + 1 : c.y1 - 1;   // linha do fundo da casa
    const passo = c.norte ? 1 : -1;                // direção do fundo para a porta

    if (nome === 'templo') {
      definirTerreno(portaX, fundo, 'altar');
      mapa.pontos.templo = { x: portaX, y: fundo + passo * 2 };
    } else {
      // NPC no fundo, balcão na frente dele, cliente do outro lado
      preencher(portaX - 1, fundo + passo, portaX + 1, fundo + passo, 'balcao');
      mapa.pontos[nome] = {
        npc: { x: portaX, y: fundo },
        atendimento: { x: portaX, y: fundo + passo * 2 },
      };
    }
  }

  // Fonte de água 3x3 bem no meio da praça (dá pra contornar por todos os lados)
  preencher(cx - 1, cy - 1, cx + 1, cy + 1, 'fonte');
  mapa.pontos.fonte = { x: cx - 1, y: cy - 1 };

  // Campo de treinamento: cercado de paliçada, chão de terra, 4 fantoches.
  // A entrada fica do lado da rua.
  const t = { x0: cx - 10, y0: cy + 12, x1: cx - 2, y1: cy + 18 };
  preencher(t.x0, t.y0, t.x1, t.y1, 'cerca');
  preencher(t.x0 + 1, t.y0 + 1, t.x1 - 1, t.y1 - 1, 'terra');
  preencher(t.x1, cy + 15, t.x1, cy + 16, 'terra');          // entrada
  preencher(t.x1 + 1, cy + 15, cx - 1, cy + 16, 'calcada');  // caminho até a rua
  mapa.pontos.fantoches = [-9, -7, -5, -3].map(dx => ({ x: cx + dx, y: cy + 14 }));
}
