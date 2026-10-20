// =====================================================
// monstros.js — Tipos de monstro, onde nascem e como pensam
//
// ONDE cada monstro nasce não fica aqui: fica no mapa (Tiled),
// nos retângulos "area" (com a lista de monstros e a quantidade)
// e nos pontos "chefe".
// =====================================================

// Para criar um monstro novo, copie um bloco e mude os valores.
// A imagem fica em img/monstros/<sprite>.png (folha 3x4, igual à dos personagens)
// e precisa estar listada em IMAGENS (sprites.js).
//   vida, ataqueMax (dano máximo), defesa (reduz seu dano), xp
//   ouro: [mínimo, máximo]    passo: ms por quadrado (menor = mais rápido)
//   visao: de quantos quadrados ele te enxerga e começa a perseguir
//   alcance: > 1 = ataca de longe (arqueiro, mago). projetil: desenho do tiro
//   chefe: true = nome laranja e renasce mais devagar
//   loot: lista de { item, chance (0.5 = 50%), qtd: [mínimo, máximo] } (itens em itens.js)
const TIPOS_MONSTRO = {
  // Fantoche do campo de treino: não anda, não ataca, não morre, não dá XP.
  fantoche: { nome: 'Fantoche', sprite: 'fantoche', imagemUnica: true, fantoche: true,
    vida: 500, ataqueMax: 0, defesa: 0, xp: 0, ouro: [0, 0], passo: 1000, visao: 0, loot: [] },

  // ---------- Campos do Leste ----------
  lobo_branco: { nome: 'Lobo branco', sprite: 'lobo_branco',
    vida: 25, ataqueMax: 7, defesa: 1, xp: 8, ouro: [0, 4], passo: 420, visao: 5, loot: [] },
  lobo_cinza: { nome: 'Lobo cinzento', sprite: 'lobo_cinza',
    vida: 45, ataqueMax: 12, defesa: 2, xp: 16, ouro: [1, 7], passo: 360, visao: 6, loot: [] },

  // ---------- Floresta Perdida ----------
  goblin: { nome: 'Goblin', sprite: 'goblin',
    vida: 60, ataqueMax: 14, defesa: 3, xp: 24, ouro: [2, 10], passo: 450, visao: 5,
    loot: [{ item: 'machado_mao', chance: 0.04, qtd: [1, 1] }, { item: 'clava', chance: 0.04, qtd: [1, 1] }] },
  goblin_arqueiro: { nome: 'Goblin arqueiro', sprite: 'goblin_arqueiro', alcance: 4, projetil: 'flecha',
    vida: 55, ataqueMax: 16, defesa: 2, xp: 32, ouro: [3, 12], passo: 450, visao: 6,
    loot: [{ item: 'flecha', chance: 0.25, qtd: [5, 15] }, { item: 'shuriken', chance: 0.12, qtd: [3, 8] }, { item: 'arco', chance: 0.02, qtd: [1, 1] }] },
  goblin_guerreiro: { nome: 'Goblin guerreiro', sprite: 'goblin_guerreiro',
    vida: 110, ataqueMax: 22, defesa: 7, xp: 48, ouro: [5, 18], passo: 480, visao: 5,
    loot: [{ item: 'espada', chance: 0.03, qtd: [1, 1] }, { item: 'machado', chance: 0.02, qtd: [1, 1] }, { item: 'maca', chance: 0.03, qtd: [1, 1] }] },
  goblin_mago: { nome: 'Goblin mago', sprite: 'goblin_mago', alcance: 4, projetil: 'magia',
    vida: 70, ataqueMax: 24, defesa: 2, xp: 52, ouro: [5, 18], passo: 480, visao: 6,
    loot: [{ item: 'lanca', chance: 0.12, qtd: [2, 5] }, { item: 'espada', chance: 0.02, qtd: [1, 1] }] },
  goblin_chefe: { nome: 'Rei Goblin', sprite: 'goblin_chefe', chefe: true,
    vida: 600, ataqueMax: 42, defesa: 12, xp: 450, ouro: [80, 160], passo: 420, visao: 6,
    loot: [{ item: 'espada_longa', chance: 0.35, qtd: [1, 1] }, { item: 'machado_guerra', chance: 0.25, qtd: [1, 1] },
           { item: 'martelo_guerra', chance: 0.25, qtd: [1, 1] }, { item: 'arco', chance: 0.30, qtd: [1, 1] }] },

  // ---------- Floresta Negra ----------
  sombra: { nome: 'Sombra', sprite: 'sombra',
    vida: 70, ataqueMax: 18, defesa: 2, xp: 30, ouro: [3, 12], passo: 400, visao: 6, loot: [] },
  esqueleto_pequeno: { nome: 'Esqueleto pequeno', sprite: 'esqueleto_pequeno',
    vida: 90, ataqueMax: 20, defesa: 5, xp: 40, ouro: [4, 14], passo: 430, visao: 5, loot: [] },
  esqueleto: { nome: 'Esqueleto', sprite: 'esqueleto',
    vida: 150, ataqueMax: 28, defesa: 9, xp: 70, ouro: [6, 20], passo: 460, visao: 6, loot: [] },
  esqueleto_negro: { nome: 'Esqueleto negro', sprite: 'esqueleto_negro',
    vida: 220, ataqueMax: 34, defesa: 13, xp: 105, ouro: [10, 28], passo: 460, visao: 6, loot: [] },
  zumbi: { nome: 'Zumbi', sprite: 'zumbi',
    vida: 280, ataqueMax: 38, defesa: 6, xp: 120, ouro: [10, 30], passo: 650, visao: 5, loot: [] },
  senhor_mortos: { nome: 'Senhor dos Mortos', sprite: 'senhor_mortos', chefe: true,
    vida: 1800, ataqueMax: 65, defesa: 18, xp: 1800, ouro: [250, 450], passo: 500, visao: 7, loot: [] },

  // ---------- Vila Desolada ----------
  fantasma: { nome: 'Fantasma', sprite: 'fantasma',
    vida: 180, ataqueMax: 34, defesa: 8, xp: 100, ouro: [10, 30], passo: 420, visao: 6, loot: [] },
  fantasma_cinza: { nome: 'Fantasma cinzento', sprite: 'fantasma_cinza',
    vida: 210, ataqueMax: 38, defesa: 10, xp: 120, ouro: [12, 34], passo: 420, visao: 6, loot: [] },
  fantasma_azul: { nome: 'Fantasma azul', sprite: 'fantasma_azul',
    vida: 250, ataqueMax: 42, defesa: 12, xp: 145, ouro: [15, 38], passo: 400, visao: 6, loot: [] },
  fantasma_rosa: { nome: 'Fantasma rosa', sprite: 'fantasma_rosa',
    vida: 280, ataqueMax: 46, defesa: 12, xp: 165, ouro: [15, 42], passo: 400, visao: 6, loot: [] },
  abobora: { nome: 'Abóbora maldita', sprite: 'abobora', feminino: true,
    vida: 260, ataqueMax: 40, defesa: 14, xp: 140, ouro: [14, 40], passo: 520, visao: 5, loot: [] },
  diabinho_pequeno: { nome: 'Diabinho', sprite: 'diabinho_pequeno',
    vida: 160, ataqueMax: 36, defesa: 6, xp: 110, ouro: [10, 32], passo: 300, visao: 7, loot: [] },
  diabinho: { nome: 'Diabo', sprite: 'diabinho',
    vida: 300, ataqueMax: 48, defesa: 12, xp: 180, ouro: [18, 46], passo: 360, visao: 7, loot: [] },
  mago_sombrio: { nome: 'Mago sombrio', sprite: 'mago_sombrio', alcance: 4, projetil: 'magia',
    vida: 240, ataqueMax: 50, defesa: 8, xp: 190, ouro: [20, 50], passo: 480, visao: 7, loot: [] },
  encapuzado: { nome: 'Encapuzado Carmesim', sprite: 'encapuzado', chefe: true,
    vida: 3000, ataqueMax: 80, defesa: 20, xp: 3500, ouro: [500, 900], passo: 420, visao: 7, loot: [] },
};

const monstros = [];          // todos os monstros (vivos e corpos)
const respawnsPendentes = []; // { quando, casa } — "casa" é a área ou o ponto do chefe
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

// ---------- Nascimento ----------

function sortearLoot(tipo) {
  const t = TIPOS_MONSTRO[tipo];
  const loot = [];
  const ouro = aleatorioInt(t.ouro[0], t.ouro[1]);
  if (ouro > 0) loot.push({ id: ITEM_OURO, qtd: ouro });
  for (const l of t.loot) {
    if (ITENS[l.item] && Math.random() < l.chance) loot.push({ id: l.item, qtd: aleatorioInt(l.qtd[0], l.qtd[1]) });
  }
  return loot;
}

function criarMonstro(tipo, x, y, casa = null) {
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
    casa,              // área (retângulo) ou ponto do chefe onde ele vive
  };
  monstros.push(m);
  return m;
}

// Sorteia um tipo da lista da área respeitando os pesos ("goblin:3" sai 3x mais que ":1")
function sortearTipo(lista) {
  const total = lista.reduce((s, m) => s + m.peso, 0);
  let r = Math.random() * total;
  for (const m of lista) { if ((r -= m.peso) < 0) return m.tipo; }
  return lista[lista.length - 1].tipo;
}

// Bom lugar pra nascer: livre, alcançável, fora da zona segura e fora da sua tela
function bomLugar(x, y) {
  return ehLivre(x, y) && ehAlcancavel(x, y) && !naZonaSegura(x, y, 2) && distancia({ x, y }, jogador) >= 9;
}

function nascerNaArea(area) {
  if (!area.monstros.length) return null;
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const x = aleatorioInt(area.x0, area.x1);
    const y = aleatorioInt(area.y0, area.y1);
    if (bomLugar(x, y)) return criarMonstro(sortearTipo(area.monstros), x, y, area);
  }
  return null;
}

function nascerChefe(chefe) {
  // tenta no ponto marcado; se estiver ocupado, procura em volta
  for (let raio = 0; raio <= 4; raio++) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        const x = chefe.x + dx, y = chefe.y + dy;
        if (ehLivre(x, y) && ehAlcancavel(x, y)) return criarMonstro(chefe.monstro, x, y, chefe);
      }
    }
  }
  return null;
}

function criarFantoches() {
  for (const p of mapa.pontos.fantoches) criarMonstro('fantoche', p.x, p.y);
}

function popularMonstros() {
  for (const area of mapa.areas) {
    for (let i = 0; i < area.quantidade; i++) nascerNaArea(area);
  }
  for (const chefe of mapa.chefes) nascerChefe(chefe);
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

// Dá o passo (entre as 4 direções) que mais aproxima de um ponto
function passoEmDirecao(m, alvo, agora) {
  const opcoes = Object.keys(DIRECOES).map(nome => {
    const d = DIRECOES[nome];
    const p = { x: m.x + d.dx, y: m.y + d.dy };
    return { nome, dist: distancia(p, alvo), manhattan: Math.abs(p.x - alvo.x) + Math.abs(p.y - alvo.y) };
  });
  opcoes.sort((a, b) => a.dist - b.dist || a.manhattan - b.manhattan);
  const distAtual = distancia(m, alvo);
  for (const o of opcoes) {
    if (o.dist > distAtual) break; // não anda pra longe
    if (moverMonstro(m, o.nome, agora)) return true;
  }
  return false;
}

// Persegue de forma simples ("gulosa"). Não contorna obstáculos grandes —
// isso é de propósito, dá pra fugir passando atrás de árvores.
function perseguir(m, agora) {
  passoEmDirecao(m, jogador, agora);
}

// Anda à toa, mas sem sair de casa. Se estiver fora (perseguiu você), volta.
function vagar(m, agora) {
  if (agora < m.proximaDecisao) return;
  m.proximaDecisao = agora + 1000 + Math.random() * 2500;
  const casa = m.casa;
  if (casa) {
    const ehChefe = casa.monstro !== undefined;
    const fora = ehChefe ? distancia(m, casa) > 4 : !dentroDe(casa, m.x, m.y);
    if (fora) {
      const centro = ehChefe ? casa : { x: Math.round((casa.x0 + casa.x1) / 2), y: Math.round((casa.y0 + casa.y1) / 2) };
      passoEmDirecao(m, centro, agora);
      m.proximaDecisao = agora + 300;
      return;
    }
  }
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
    if (tipo.fantoche) continue; // fica parado no lugar
    const dist = distancia(m, jogador);
    const vendoJogador = jogador.vida > 0 && dist <= tipo.visao && !naZonaSegura(jogador.x, jogador.y);
    const alcance = tipo.alcance || 1;
    // De longe precisa enxergar sem árvore no meio; de perto, basta estar colado
    const podeAtacar = vendoJogador && dist <= alcance && (dist <= 1 || linhaDeVisao(m, jogador));

    if (podeAtacar) {
      if (agora >= m.proximoAtaque) {
        monstroAtaca(m, agora);
        m.proximoAtaque = agora + CONFIG.INTERVALO_ATAQUE;
      }
    } else if (!monstroAndando(m, agora)) {
      if (vendoJogador) perseguir(m, agora);
      else vagar(m, agora);
    }
  }

  // Nascer monstros novos no lugar dos que morreram (na mesma área)
  for (let i = respawnsPendentes.length - 1; i >= 0; i--) {
    const r = respawnsPendentes[i];
    if (agora < r.quando) continue;
    const m = r.casa && r.casa.monstro !== undefined ? nascerChefe(r.casa) : r.casa ? nascerNaArea(r.casa) : null;
    if (m || !r.casa) respawnsPendentes.splice(i, 1);
    else r.quando = agora + 5000; // lugar ocupado/você por perto: tenta de novo daqui a pouco
  }
}

// Quanto tempo até nascer outro no lugar deste
function tempoRespawn(m) {
  if (m.casa && m.casa.respawn) return m.casa.respawn;
  return CONFIG.TEMPO_RESPAWN;
}

function posicaoVisualMonstro(m, agora) {
  const t = Math.min(1, (agora - m.inicioPasso) / TIPOS_MONSTRO[m.tipo].passo);
  return {
    x: m.anteriorX + (m.x - m.anteriorX) * t,
    y: m.anteriorY + (m.y - m.anteriorY) * t,
  };
}
