// =====================================================
// combate.js — Ataques, dano, XP, level, skills e morte
// =====================================================

// Textos que sobem e somem (dano, XP...)
const textosFlutuantes = [];
// Projéteis voando (shuriken, lança, flecha) — só visual
const projeteis = [];

// "Arma" usada quando não tem nada equipado
const PUNHOS = { id: 'punhos', nome: 'Punhos', tipo: 'arma', categoria: 'punho', skill: 'melee', ataque: 5, acerto: 0.9, alcance: 1 };

function adicionarTexto(x, y, texto, cor, agora) {
  textosFlutuantes.push({ x, y, texto, cor, inicio: agora });
}

// XP total necessário para chegar num level (mesma fórmula do Tibia)
// level 2 = 100 XP, level 3 = 200, level 4 = 400, level 5 = 700...
function xpParaLevel(level) {
  return Math.round((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12));
}

// Quantos ataques são necessários para subir uma skill
function treinoNecessario(nivelSkill) {
  return Math.floor(15 * Math.pow(1.12, nivelSkill - 10));
}

// ---------- Equipamento usado no combate ----------

function armaAtual() {
  return jogador.equip.arma ? ITENS[jogador.equip.arma.id] : PUNHOS;
}

function defesaTotal() {
  let total = 0;
  for (const espaco of ['capacete', 'armadura', 'calca', 'botas']) {
    const e = jogador.equip[espaco];
    if (e) total += ITENS[e.id].defesa || 0;
  }
  return total;
}

// Munição certa equipada para esta arma? (ex.: flechas para o arco)
function municaoParaArma(arma) {
  const m = jogador.equip.municao;
  if (!arma.municao || !m) return null;
  return ITENS[m.id].municaoDe === arma.municao ? m : null;
}

// ---------- Linha de visão ----------
// Traça uma reta de quadrado em quadrado (algoritmo de Bresenham).
// Se algum quadrado no meio "bloqueia tiro" (árvore, parede...), não dá.
function linhaDeVisao(a, b) {
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - a.x), dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1;
  let erro = dx + dy;
  while (true) {
    if (x === b.x && y === b.y) return true;
    if (!(x === a.x && y === a.y) && TERRENOS[pegarTerreno(x, y)].bloqueiaTiro) return false;
    const e2 = 2 * erro;
    if (e2 >= dy) { erro += dy; x += sx; }
    if (e2 <= dx) { erro += dx; y += sy; }
  }
}

// Dá pra atacar o alvo de onde o jogador está agora?
function podeAtacarDe(alvo) {
  const arma = armaAtual();
  const d = distancia(alvo, jogador);
  if (d > arma.alcance) return false;
  if (d > 1) return linhaDeVisao(jogador, alvo);
  return true;
}

// ---------- Alvo ----------

function definirAlvo(monstro) {
  if (jogador.alvo === monstro) { limparAlvo(); return; } // clicar de novo desmarca
  jogador.alvo = monstro;
  jogador.caminho = [];
  jogador.destino = null;
}

function limparAlvo() {
  jogador.alvo = null;
}

// Mira no monstro vivo mais perto (tecla Espaço)
function mirarMaisProximo() {
  let melhor = null;
  for (const m of monstros) {
    if (m.morto) continue;
    const d = distancia(m, jogador);
    if (d <= 7 && (!melhor || d < distancia(melhor, jogador))) melhor = m;
  }
  if (melhor) { jogador.alvo = melhor; jogador.caminho = []; jogador.destino = null; }
  else mostrarMensagem('Nenhum monstro por perto.');
}

// ---------- Jogador ataca ----------

function atualizarAtaqueJogador(agora) {
  const alvo = jogador.alvo;
  if (!alvo) return;
  if (alvo.morto) { limparAlvo(); return; }
  if (agora < jogador.proximoAtaque) return;
  if (!podeAtacarDe(alvo)) return; // longe: o jogador.js cuida de chegar perto

  const arma = armaAtual();
  if (arma.municao && !municaoParaArma(arma)) {
    mostrarMensagem('Você precisa equipar flechas para usar o arco.');
    jogador.proximoAtaque = agora + 1500; // não repete a mensagem toda hora
    return;
  }

  atacarMonstro(alvo, agora);
  jogador.proximoAtaque = agora + CONFIG.INTERVALO_ATAQUE;
}

function atacarMonstro(m, agora) {
  const arma = armaAtual();
  const skill = jogador.skills[arma.skill];
  const d = distancia(m, jogador);
  treinarSkill(arma.skill);

  // Ataque total = arma + munição (se for arco)
  let ataque = arma.ataque;
  let projetil = null;
  if (arma.municao) {
    const mun = municaoParaArma(arma);
    ataque += ITENS[mun.id].ataque;
    projetil = mun.id;
    gastarDoEspaco('municao');
  } else if (arma.arremesso) {
    projetil = arma.id;
    gastarDoEspaco('arma');
  }

  // O dano aparece quando o projétil chega
  let atraso = 0;
  if (projetil) {
    atraso = 80 + d * 60;
    projeteis.push({ tipo: projetil, de: { x: jogador.x, y: jogador.y }, para: { x: m.x, y: m.y }, inicio: agora, duracao: atraso });
  }

  // 1) Acertou? Na distância a skill ajuda e cada quadrado a mais atrapalha um pouco
  let acerto = arma.acerto;
  if (arma.skill === 'distance') acerto = Math.min(0.95, acerto + (skill - 10) * 0.01 - (d - 1) * 0.03);
  if (Math.random() > acerto) {
    adicionarTexto(m.x, m.y, 'errou', '#9fc5ff', agora + atraso);
    return;
  }

  // 2) Quanto de dano? Ataque + skill + level, menos a defesa do monstro
  const danoMax = Math.round(ataque * (0.5 + skill / 20) + jogador.level / 2);
  const danoMin = Math.ceil(danoMax * 0.3);
  const dano = Math.max(0, aleatorioInt(danoMin, danoMax) - aleatorioInt(0, TIPOS_MONSTRO[m.tipo].defesa));

  if (dano === 0) {
    adicionarTexto(m.x, m.y, 'bloqueou', '#cccccc', agora + atraso);
    return;
  }

  m.vida -= dano;
  m.ultimoDano = agora + atraso;
  adicionarTexto(m.x, m.y, String(dano), '#ff4d4d', agora + atraso);

  // Fantoche de treino: leva o dano, mas nunca morre
  if (TIPOS_MONSTRO[m.tipo].fantoche) { m.vida = m.vidaMax; return; }

  if (m.vida <= 0) matarMonstro(m, agora);
}

// Gasta munição/arma arremessada.
//   flecha: 1 por tiro
//   shuriken e lança: cada unidade aguenta um número sorteado de ataques
//   (quebraEntre) e só então é perdida
function gastarDoEspaco(espaco) {
  const e = jogador.equip[espaco];
  const item = ITENS[e.id];
  if (item.infinita) return;               // shuriken do aprendiz: nunca acaba
  if (item.quebraEntre) {
    if (!e.usos) e.usos = aleatorioInt(item.quebraEntre[0], item.quebraEntre[1]);
    e.usos--;
    if (e.usos > 0) return;                // ainda não quebrou
    e.usos = aleatorioInt(item.quebraEntre[0], item.quebraEntre[1]); // a próxima unidade
    adicionarTexto(jogador.x, jogador.y, item.nome + ' quebrou', '#bbbbbb', performance.now());
  }
  e.qtd--;
  if (e.qtd <= 0) {
    jogador.equip[espaco] = null;
    registrar('Acabou: ' + ITENS[e.id].nome.toLowerCase() + '. Equipe mais na mochila.', 'morte');
  }
}

function treinarSkill(nomeSkill) {
  jogador.treinoSkills[nomeSkill]++;
  const nivel = jogador.skills[nomeSkill];
  if (jogador.treinoSkills[nomeSkill] >= treinoNecessario(nivel)) {
    jogador.skills[nomeSkill]++;
    jogador.treinoSkills[nomeSkill] = 0;
    registrar('Você avançou em ' + SKILLS[nomeSkill].nome + ' para ' + jogador.skills[nomeSkill] + '.', 'skill');
  }
}

function matarMonstro(m, agora) {
  const tipo = TIPOS_MONSTRO[m.tipo];
  m.vida = 0;
  m.morto = true;
  m.morreuEm = agora;
  limparAlvo();
  respawnsPendentes.push({ quando: agora + tempoRespawn(m), casa: m.casa });

  // O loot fica dentro do corpo; o jogador precisa abrir e pegar
  m.loot = sortearLoot(m.tipo);
  const descricao = m.loot.length ? m.loot.map(e => nomeComQuantidade(e.id, e.qtd)).join(', ') : 'nada';
  registrar(tipo.nome + (tipo.feminino ? ' morta' : ' morto') + ' (+' + tipo.xp + ' XP). Loot: ' + descricao + '.', 'loot');
  adicionarTexto(jogador.x, jogador.y, '+' + tipo.xp + ' XP', '#ffffff', agora);

  ganharXp(tipo.xp, agora);
}

function ganharXp(quantidade, agora) {
  jogador.xp += quantidade;
  while (jogador.xp >= xpParaLevel(jogador.level + 1)) {
    const classe = CLASSES[jogador.classe];
    jogador.level++;
    jogador.vidaMax += classe.vidaPorLevel;
    jogador.manaMax += classe.manaPorLevel;
    jogador.vida = jogador.vidaMax;
    jogador.mana = jogador.manaMax;
    registrar('Você subiu para o level ' + jogador.level + '!', 'level');
    adicionarTexto(jogador.x, jogador.y, 'LEVEL UP!', '#f0c674', agora + 300);
    salvarJogo();
  }
}

// ---------- Monstro ataca ----------

function monstroAtaca(m, agora) {
  const tipo = TIPOS_MONSTRO[m.tipo];
  const bruto = aleatorioInt(0, tipo.ataqueMax);

  // Ataque de longe: mostra o tiro voando (flecha ou bola de magia)
  if (tipo.projetil && distancia(m, jogador) > 1) {
    projeteis.push({ tipo: tipo.projetil, de: { x: m.x, y: m.y }, para: { x: jogador.x, y: jogador.y }, inicio: agora, duracao: 80 + distancia(m, jogador) * 60 });
  }
  // A armadura absorve entre metade e o total da sua defesa
  const def = defesaTotal();
  const absorvido = def > 0 ? aleatorioInt(Math.floor(def / 2), def) : 0;
  const dano = Math.max(0, bruto - absorvido);

  if (dano === 0) {
    adicionarTexto(jogador.x, jogador.y, bruto === 0 ? 'errou' : 'bloqueou', '#9fc5ff', agora);
    return;
  }
  jogador.vida -= dano;
  jogador.ultimoDano = agora;
  adicionarTexto(jogador.x, jogador.y, String(dano), '#ff4d4d', agora);
  if (jogador.vida <= 0) morrerJogador(agora);
}

function morrerJogador(agora) {
  const perda = Math.floor(jogador.xp * CONFIG.PERDA_XP_MORTE);
  // não deixa cair de level
  jogador.xp = Math.max(xpParaLevel(jogador.level), jogador.xp - perda);
  jogador.vida = jogador.vidaMax;
  jogador.morreuEm = agora;
  limparAlvo();
  jogador.caminho = [];
  jogador.destino = null;
  fecharCorpo();
  fecharLoja();
  posicionarJogador(jogador.templo.x, jogador.templo.y);
  registrar('Você morreu! Perdeu um pouco de XP e acordou no templo.', 'morte');
  salvarJogo();
}

// ---------- Regeneração ----------

function atualizarRegeneracao(agora) {
  if (agora < jogador.proximaRegen) return;
  jogador.proximaRegen = agora + CONFIG.REGEN_INTERVALO;
  // Dentro da vila regenera 3x mais rápido
  const bonus = naZonaSegura(jogador.x, jogador.y) ? 3 : 1;
  jogador.vida = Math.min(jogador.vidaMax, jogador.vida + CONFIG.REGEN_VIDA * bonus);
  jogador.mana = Math.min(jogador.manaMax, jogador.mana + CONFIG.REGEN_MANA * bonus);
}

// Tem monstro vivo por perto? (usado para bloquear o botão Sair)
function monstroPorPerto() {
  return monstros.some(m => !m.morto && !TIPOS_MONSTRO[m.tipo].fantoche && distancia(m, jogador) <= CONFIG.RAIO_SAIR);
}
