// =====================================================
// monstros.js — Tipos de monstro, onde nascem e como pensam
// =====================================================

// Para criar um monstro novo, copie um bloco e mude os valores.
// Depois ensine o desenho.js a desenhar ele (desenharCorpoMonstro).
//   vida: pontos de vida      ataqueMax: dano máximo por ataque
//   defesa: reduz seu dano    xp: experiência ao matar
//   ouro: [mínimo, máximo]    passo: ms por quadrado (menor = mais rápido)
//   visao: de quantos quadrados ele te enxerga e começa a perseguir
//   loot: lista de { item, chance (0.5 = 50%), qtd: [mínimo, máximo] }
//         os nomes dos itens ficam em itens.js
const TIPOS_MONSTRO = {
  rato: {
    nome: 'Rato', vida: 20, ataqueMax: 3, defesa: 1, xp: 5, ouro: [1, 4], passo: 500, visao: 4,
    loot: [
      { item: 'queijo',    chance: 0.40, qtd: [1, 2] },
      { item: 'rabo_rato', chance: 0.50, qtd: [1, 1] },
      { item: 'pocao',     chance: 0.02, qtd: [1, 1] },
    ],
  },
  cobra: {
    nome: 'Cobra', feminino: true, vida: 30, ataqueMax: 6, defesa: 2, xp: 10, ouro: [2, 6], passo: 450, visao: 4,
    loot: [
      { item: 'pele_cobra', chance: 0.35, qtd: [1, 1] },
      { item: 'pocao',      chance: 0.04, qtd: [1, 1] },
    ],
  },
  lobo: {
    nome: 'Lobo', vida: 55, ataqueMax: 12, defesa: 4, xp: 20, ouro: [5, 12], passo: 330, visao: 6,
    loot: [
      { item: 'carne',       chance: 0.60, qtd: [1, 3] },
      { item: 'presa_lobo',  chance: 0.25, qtd: [1, 2] },
      { item: 'pele_lobo',   chance: 0.15, qtd: [1, 1] },
      { item: 'pocao',       chance: 0.08, qtd: [1, 1] },
      { item: 'calca_couro', chance: 0.03, qtd: [1, 1] },
    ],
  },
  urso: {
    nome: 'Urso', vida: 150, ataqueMax: 25, defesa: 8, xp: 70, ouro: [10, 30], passo: 520, visao: 5,
    loot: [
      { item: 'carne',          chance: 0.70, qtd: [1, 4] },
      { item: 'garra_urso',     chance: 0.30, qtd: [1, 2] },
      { item: 'pele_urso',      chance: 0.25, qtd: [1, 1] },
      { item: 'pocao',          chance: 0.10, qtd: [1, 2] },
      { item: 'capacete_ferro', chance: 0.03, qtd: [1, 1] },
      { item: 'maca',           chance: 0.03, qtd: [1, 1] },
    ],
  },
  tigre: {
    nome: 'Tigre', vida: 110, ataqueMax: 34, defesa: 6, xp: 80, ouro: [10, 35], passo: 280, visao: 7,
    loot: [
      { item: 'carne',       chance: 0.50, qtd: [1, 3] },
      { item: 'presa_tigre', chance: 0.30, qtd: [1, 2] },
      { item: 'pele_tigre',  chance: 0.20, qtd: [1, 1] },
      { item: 'pocao',       chance: 0.10, qtd: [1, 2] },
      { item: 'machado',     chance: 0.03, qtd: [1, 1] },
      { item: 'cota_malha',  chance: 0.02, qtd: [1, 1] },
    ],
  },
};

const monstros = [];          // todos os monstros (vivos e corpos)
const respawnsPendentes = []; // momentos em que um novo monstro deve nascer
let proximoIdMonstro = 1;

// ---------- Perguntas sobre o mapa ----------

function monstroEm(x, y) {
  return monstros.find(m => !m.morto && m.x === x && m.y === y) || null;
}

// Livre = dá pra pisar E não tem ninguém em cima
function ehLivre(x, y) {
  if (!ehPassavel(x, y)) return false;
  if (monstroEm(x, y) || npcEm(x, y)) return false;
  if (jogador.x === x && jogador.y === y) return false;
  return true;
}

// A vila inteira é zona segura: monstro não entra e não ataca
function naZonaSegura(x, y) {
  return dentroDaVila(x, y);
}

// ---------- Nascimento ----------

// Quanto mais longe da vila, mais perigoso
function escolherTipo(x, y) {
  const d = distancia({ x, y }, mapa.centro);
  const r = Math.random();
  if (d < 24) return r < 0.6 ? 'rato' : 'cobra';
  if (d < 34) return r < 0.45 ? 'cobra' : 'lobo';
  if (r < 0.2) return 'lobo';
  return r < 0.6 ? 'urso' : 'tigre';
}

function sortearLoot(tipo) {
  const t = TIPOS_MONSTRO[tipo];
  const loot = [];
  const ouro = aleatorioInt(t.ouro[0], t.ouro[1]);
  if (ouro > 0) loot.push({ id: ITEM_OURO, qtd: ouro });
  for (const l of t.loot) {
    if (Math.random() < l.chance) loot.push({ id: l.item, qtd: aleatorioInt(l.qtd[0], l.qtd[1]) });
  }
  return loot;
}

function criarMonstro(tipo, x, y) {
  const t = TIPOS_MONSTRO[tipo];
  const m = {
    id: proximoIdMonstro++,
    tipo, x, y,
    anteriorX: x, anteriorY: y,
    inicioPasso: -Infinity,
    direcao: 'baixo',
    vida: t.vida, vidaMax: t.vida,
    proximoAtaque: 0,
    proximaDecisao: 0,
    ultimoDano: -Infinity,
    morto: false, morreuEm: 0,
    loot: [],          // itens dentro do corpo depois que morre
    removido: false,   // true quando o corpo some do mapa
  };
  monstros.push(m);
  return m;
}

// Faixas de distância da vila. A faixa perto é pequena, então ela ganha
// mais chance de ser sorteada — senão quase não teria bicho fraco.
const FAIXAS_SPAWN = [
  { min: 0,  max: 23, chance: 0.40 }, // ratos e cobras
  { min: 24, max: 33, chance: 0.30 }, // cobras e lobos
  { min: 34, max: 99, chance: 0.30 }, // ursos, tigres e alguns lobos
];

function sortearFaixa() {
  let r = Math.random();
  for (const f of FAIXAS_SPAWN) { if (r < f.chance) return f; r -= f.chance; }
  return FAIXAS_SPAWN[FAIXAS_SPAWN.length - 1];
}

// Procura um lugar livre, longe da vila e fora da sua tela
function nascerMonstroAleatorio() {
  const faixa = sortearFaixa();
  for (let tentativa = 0; tentativa < 400; tentativa++) {
    const x = aleatorioInt(2, mapa.largura - 3);
    const y = aleatorioInt(2, mapa.altura - 3);
    const d = distancia({ x, y }, mapa.centro);
    if (d < faixa.min || d > faixa.max) continue;
    if (!ehLivre(x, y)) continue;
    if (dentroDaVila(x, y, 3)) continue;
    if (distancia({ x, y }, jogador) < 9) continue; // não nasce na sua cara
    return criarMonstro(escolherTipo(x, y), x, y);
  }
  return null;
}

function popularMonstros() {
  for (let i = 0; i < CONFIG.MAX_MONSTROS; i++) nascerMonstroAleatorio();
}

// ---------- Movimento ----------

function monstroAndando(m, agora) {
  return agora - m.inicioPasso < TIPOS_MONSTRO[m.tipo].passo;
}

function moverMonstro(m, nomeDirecao, agora) {
  const d = DIRECOES[nomeDirecao];
  const nx = m.x + d.dx;
  const ny = m.y + d.dy;
  m.direcao = nomeDirecao;
  if (!ehLivre(nx, ny) || naZonaSegura(nx, ny)) return false;
  m.anteriorX = m.x; m.anteriorY = m.y;
  m.x = nx; m.y = ny;
  m.inicioPasso = agora;
  return true;
}

// Persegue de forma simples ("gulosa"): tenta o passo que mais
// aproxima do jogador. Não contorna obstáculos grandes — isso é
// de propósito, dá pra fugir passando atrás de árvores.
function perseguir(m, agora) {
  const opcoes = Object.keys(DIRECOES).map(nome => {
    const d = DIRECOES[nome];
    const p = { x: m.x + d.dx, y: m.y + d.dy };
    const manhattan = Math.abs(p.x - jogador.x) + Math.abs(p.y - jogador.y);
    return { nome, dist: distancia(p, jogador), manhattan };
  });
  opcoes.sort((a, b) => a.dist - b.dist || a.manhattan - b.manhattan);
  const distAtual = distancia(m, jogador);
  for (const o of opcoes) {
    if (o.dist > distAtual) break; // não anda pra longe
    if (moverMonstro(m, o.nome, agora)) return;
  }
}

function vagar(m, agora) {
  if (agora < m.proximaDecisao) return;
  m.proximaDecisao = agora + 1000 + Math.random() * 2500;
  const nomes = Object.keys(DIRECOES);
  moverMonstro(m, nomes[aleatorioInt(0, nomes.length - 1)], agora);
}

// ---------- Cérebro do monstro (chamado a cada quadro) ----------

function atualizarMonstros(agora) {
  for (let i = monstros.length - 1; i >= 0; i--) {
    const m = monstros[i];

    if (m.morto) {
      // corpo some depois de um tempo
      if (agora - m.morreuEm > CONFIG.TEMPO_CORPO) { m.removido = true; monstros.splice(i, 1); }
      continue;
    }

    const tipo = TIPOS_MONSTRO[m.tipo];
    const dist = distancia(m, jogador);
    const vendoJogador = jogador.vida > 0 && dist <= tipo.visao && !naZonaSegura(jogador.x, jogador.y);

    if (vendoJogador && dist <= 1) {
      // Colado no jogador: ataca a cada INTERVALO_ATAQUE
      if (agora >= m.proximoAtaque) {
        monstroAtaca(m, agora);
        m.proximoAtaque = agora + CONFIG.INTERVALO_ATAQUE;
      }
    } else if (!monstroAndando(m, agora)) {
      if (vendoJogador) perseguir(m, agora);
      else vagar(m, agora);
    }
  }

  // Nascer monstros novos no lugar dos que morreram
  for (let i = respawnsPendentes.length - 1; i >= 0; i--) {
    if (agora >= respawnsPendentes[i]) {
      respawnsPendentes.splice(i, 1);
      nascerMonstroAleatorio();
    }
  }
}

function posicaoVisualMonstro(m, agora) {
  const t = Math.min(1, (agora - m.inicioPasso) / TIPOS_MONSTRO[m.tipo].passo);
  return {
    x: m.anteriorX + (m.x - m.anteriorX) * t,
    y: m.anteriorY + (m.y - m.anteriorY) * t,
  };
}
