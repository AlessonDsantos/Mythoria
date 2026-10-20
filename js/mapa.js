// =====================================================
// mapa.js — Lê o mundo feito no Tiled (mapas/mundo.js)
//
// COMO EDITAR O MAPA:
//   1) Abra mapas/mundo.tmj no Tiled (mapeditor.org, grátis)
//   2) Pinte na camada "terreno" usando a paleta "terrenos"
//   3) Na camada "areas": retângulos de caça, chefes e zona segura
//      Na camada "pontos": templo, NPCs, placas e fantoches
//   4) Salve (Ctrl+S) e exporte como JavaScript: Arquivo > Exportar como >
//      "JavaScript map files (*.js)" com o nome mundo.js na pasta mapas
//      (das próximas vezes, Ctrl+E repete a exportação)
//
// O mapa na memória é uma grade de nomes de terreno: mapa.tiles[y][x]
// =====================================================

// Aumente quando o mapa mudar muito: personagens salvos voltam pro templo
const VERSAO_MAPA = 3;

const mapa = {
  largura: 0,
  altura: 0,
  tiles: [],
  zonasSeguras: [],   // retângulos onde monstro não entra
  areas: [],          // áreas de caça: { nome, x0, y0, x1, y1, monstros: [{tipo, peso}], quantidade }
  chefes: [],         // { nome, x, y, monstro, respawn (ms) }
  rotulos: [],        // nomes de regiões sem monstros (ex.: Montanha do Norte)
  pontos: { templo: null, npcs: [], placas: [], fantoches: [] },
  alcancavel: null,   // 1 = dá pra chegar a pé a partir do templo
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
  const t = TERRENOS[pegarTerreno(x, y)];
  return !!(t && t.passavel);
}

function dentroDe(r, x, y, margem = 0) {
  return x >= r.x0 - margem && x <= r.x1 + margem && y >= r.y0 - margem && y <= r.y1 + margem;
}

// Dentro (ou perto, com margem) de alguma zona segura?
function naZonaSegura(x, y, margem = 0) {
  return mapa.zonasSeguras.some(z => dentroDe(z, x, y, margem));
}

// ---------- Leitura do arquivo do Tiled ----------

// Propriedades do Tiled vêm como lista [{name, value}]: vira um objeto simples
function propriedades(o) {
  const p = {};
  for (const item of o.properties || []) p[item.name] = item.value;
  return p;
}

// Tipo do objeto: o Tiled grava como "type" (ou "class" em algumas versões)
function tipoObjeto(o) {
  return (o.type || o.class || '').toLowerCase();
}

// Retângulo do objeto em quadrados do mapa
function retangulo(o) {
  const x0 = Math.floor(o.x / 32), y0 = Math.floor(o.y / 32);
  return { x0, y0, x1: x0 + Math.max(1, Math.round(o.width / 32)) - 1, y1: y0 + Math.max(1, Math.round(o.height / 32)) - 1 };
}

// "goblin:3, goblin_arqueiro:1" → [{tipo:'goblin', peso:3}, {tipo:'goblin_arqueiro', peso:1}]
function lerListaMonstros(texto) {
  return String(texto || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const [tipo, peso] = s.split(':').map(p => p.trim());
    return { tipo, peso: Number(peso) || 1 };
  }).filter(m => {
    if (!TIPOS_MONSTRO[m.tipo]) { console.warn('Monstro desconhecido no mapa:', m.tipo); return false; }
    return true;
  });
}

function carregarMundo() {
  if (typeof TileMaps === 'undefined' || !TileMaps.mundo) {
    alert('Não encontrei mapas/mundo.js. Exporte o mapa no Tiled como JavaScript.');
    return null;
  }
  const dados = TileMaps.mundo;
  mapa.largura = dados.width;
  mapa.altura = dados.height;

  // Número do tile (gid) → nome do terreno, pela propriedade "tipo" de cada peça da paleta
  const tipoDoGid = {};
  for (const ts of dados.tilesets) {
    for (const t of ts.tiles || []) {
      const p = propriedades(t);
      if (p.tipo) tipoDoGid[ts.firstgid + t.id] = p.tipo;
    }
  }

  const camada = dados.layers.find(l => l.type === 'tilelayer' && l.name === 'terreno') || dados.layers.find(l => l.type === 'tilelayer');
  mapa.tiles = [];
  for (let y = 0; y < mapa.altura; y++) {
    const linha = [];
    for (let x = 0; x < mapa.largura; x++) {
      const gid = camada.data[y * mapa.largura + x] & 0x1fffffff; // tira as marcas de "espelhado" do Tiled
      linha.push(tipoDoGid[gid] || 'grama');
    }
    mapa.tiles.push(linha);
  }

  // Objetos das camadas "areas" e "pontos" (o nome da camada não importa, só o tipo do objeto)
  for (const l of dados.layers) {
    if (l.type !== 'objectgroup') continue;
    for (const o of l.objects) {
      const tipo = tipoObjeto(o);
      const p = propriedades(o);
      const r = retangulo(o);
      const ponto = { x: Math.floor(o.x / 32), y: Math.floor(o.y / 32) };

      if (tipo === 'zona_segura') mapa.zonasSeguras.push(r);
      else if (tipo === 'area') mapa.areas.push({ nome: o.name, ...r, monstros: lerListaMonstros(p.monstros), quantidade: Number(p.quantidade) || 5 });
      else if (tipo === 'chefe' && TIPOS_MONSTRO[p.monstro]) mapa.chefes.push({ nome: o.name, ...ponto, monstro: p.monstro, respawn: (Number(p.respawn) || 300) * 1000 });
      else if (tipo === 'rotulo') mapa.rotulos.push({ nome: o.name, ...r });
      else if (tipo === 'templo') mapa.pontos.templo = ponto;
      else if (tipo === 'npc') mapa.pontos.npcs.push({ ...ponto, loja: p.loja, nome: o.name });
      else if (tipo === 'placa') mapa.pontos.placas.push({ ...ponto, peca: Number(p.peca) });
      else if (tipo === 'fantoche') mapa.pontos.fantoches.push(ponto);
    }
  }

  if (!mapa.pontos.templo) {
    console.warn('O mapa não tem um ponto "templo". Usando o centro.');
    mapa.pontos.templo = { x: Math.floor(mapa.largura / 2), y: Math.floor(mapa.altura / 2) };
  }
  calcularAlcancavel();
  return mapa.pontos.templo;
}

// Marca todos os quadrados aonde dá pra chegar andando a partir do templo.
// Monstro só nasce em lugar alcançável (senão nasceria preso no meio das árvores).
function calcularAlcancavel() {
  const L = mapa.largura;
  const vis = new Uint8Array(L * mapa.altura);
  const t = mapa.pontos.templo;
  const fila = [t.x + t.y * L];
  vis[fila[0]] = 1;
  for (let i = 0; i < fila.length; i++) {
    const x = fila[i] % L, y = Math.floor(fila[i] / L);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ny * L;
      if (ehPassavel(nx, ny) && !vis[k]) { vis[k] = 1; fila.push(k); }
    }
  }
  mapa.alcancavel = vis;
}

function ehAlcancavel(x, y) {
  return !!mapa.alcancavel[x + y * mapa.largura];
}

// Fonte 3x3: acha o canto de cima à esquerda da fonte que contém (x, y)
function origemFonte(x, y) {
  while (pegarTerreno(x - 1, y) === 'fonte') x--;
  while (pegarTerreno(x, y - 1) === 'fonte') y--;
  return { x, y };
}
