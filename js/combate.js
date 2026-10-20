// =====================================================
// combate.js — Ataques, dano, XP, level, skills e morte
// =====================================================

// Textos que sobem e somem (dano, XP...)
const textosFlutuantes = [];
// Projéteis voando (shuriken, lança, flecha) — só visual
const projeteis = [];

// "Arma" usada quando não tem nada equipado
const PUNHOS = { id: 'punhos', nome: 'Punhos', tipo: 'arma', categoria: 'punho', skill: 'melee', ataque: 5, acerto: 0.9, alcance: 1 };

// Textos no mesmo quadrado e quase ao mesmo tempo sobem empilhados (não ficam um em cima do outro)
function adicionarTexto(x, y, texto, cor, agora) {
  const vizinhos = textosFlutuantes.filter(t => t.x === x && t.y === y && Math.abs(t.inicio - agora) < 450).length;
  textosFlutuantes.push({ x, y, texto, cor, inicio: agora, linha: vizinhos });
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
  const skill = valorSkill(arma.skill, agora); // Magic Level com o bônus do Mens Arcana
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
  if (arma.tiro) {
    // cajado: um efeito animado voa até o monstro (bola de fogo, vento, faísca)
    atraso = 80 + d * 60;
    criarProjetilEfeito(arma.tiro, jogador, m, agora, atraso);
  } else if (projetil) {
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
  let dano = Math.max(0, aleatorioInt(danoMin, danoMax) - aleatorioInt(0, TIPOS_MONSTRO[m.tipo].defesa));
  if (arma.elemento) dano = Math.round(dano * multiplicadorElemento(m.tipo, arma.elemento)); // fraqueza/resistência

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

// pontos: quanto treinou (1 por ataque; no Magic Level, um tanto por mana gasta)
function treinarSkill(nomeSkill, pontos = 1) {
  jogador.treinoSkills[nomeSkill] = (jogador.treinoSkills[nomeSkill] || 0) + pontos;
  while (jogador.treinoSkills[nomeSkill] >= treinoNecessario(jogador.skills[nomeSkill])) {
    jogador.treinoSkills[nomeSkill] -= treinoNecessario(jogador.skills[nomeSkill]);
    jogador.skills[nomeSkill]++;
    registrar('Você avançou em ' + SKILLS[nomeSkill].nome + ' para ' + jogador.skills[nomeSkill] + '.', 'skill');
  }
}

// Gastar mana treina o Magic Level (o mago aprende 5x mais rápido)
function treinarMagia(mana) {
  treinarSkill('magia', mana * (jogador.classe === 'mago' ? 0.5 : 0.1));
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
  virarPara(m, jogador);
  m.ultimoAtaque = agora; // toca a animação de ataque (monstros com folha animada)
  const imortal = agora < jogador.imortalAte; // buff do arqueiro: o golpe acontece, mas não machuca

  // Ataque de longe: mostra o tiro voando ou a magia caindo em você
  const longe = distancia(m, jogador) > 1;
  if (longe && tipo.magiaNoAlvo) {
    // ex.: nuvem de veneno, raio, lança de fogo (sorteia uma da lista)
    criarEfeito(tipo.magiaNoAlvo[aleatorioInt(0, tipo.magiaNoAlvo.length - 1)], jogador.x, jogador.y, agora);
  } else if (longe && tipo.projetil) {
    const voo = 80 + distancia(m, jogador) * 60;
    if (EFEITOS[tipo.projetil]) criarProjetilEfeito(tipo.projetil, m, jogador, agora, voo);
    else projeteis.push({ tipo: tipo.projetil, de: { x: m.x, y: m.y }, para: { x: jogador.x, y: jogador.y }, inicio: agora, duracao: voo });
    if (tipo.impacto) criarEfeito(tipo.impacto, jogador.x, jogador.y, agora, voo);
  }
  // A armadura absorve entre metade e o total da sua defesa
  const def = defesaTotal();
  const absorvido = def > 0 ? aleatorioInt(Math.floor(def / 2), def) : 0;
  let dano = Math.max(0, bruto - absorvido);
  if (jogador.furia) dano = Math.floor(dano * 0.85); // Attractio: 15% menos dano
  if (imortal) { adicionarTexto(jogador.x, jogador.y, 'imune', '#9fe8ff', agora); return; }

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
  terminarFuria();
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

// ---------- Fome ----------
// jogador.saciadoAte = momento em que a fome volta. Comer empurra esse momento
// pra frente (no máximo 15 minutos a partir de agora).

function comFome(agora) {
  return agora >= jogador.saciadoAte;
}

function minutosSemFome(agora) {
  return Math.max(0, (jogador.saciadoAte - agora) / 60000);
}

function comer(item, agora) {
  const limite = agora + CONFIG.FOME_MAX_MIN * 60000;
  const base = Math.max(agora, jogador.saciadoAte);
  if (base >= limite - 30000) { mostrarMensagem('Você está satisfeito, não cabe mais nada.'); return false; }
  jogador.saciadoAte = Math.min(limite, base + item.fome * 60000);
  jogador.avisouFome = false;
  if (item.regen) {
    jogador.regenBonus = { ate: agora + 30000, vida: item.regen.vida, mana: item.regen.mana, proximo: agora + 2000 };
    registrar(item.nome + ': regeneração extra por 30 segundos!', 'skill');
  }
  adicionarTexto(jogador.x, jogador.y, 'nham!', '#f0c674', agora);
  return true;
}

// ---------- Regeneração (só sem fome) ----------

function atualizarRegeneracao(agora) {
  // Comida especial: +vida e +mana a cada 2 segundos, por 30 segundos
  const b = jogador.regenBonus;
  if (b) {
    if (agora >= b.ate) jogador.regenBonus = null;
    else if (agora >= b.proximo) {
      b.proximo += 2000;
      jogador.vida = Math.min(jogador.vidaMax, jogador.vida + b.vida);
      jogador.mana = Math.min(jogador.manaMax, jogador.mana + b.mana);
    }
  }
  if (agora < jogador.proximaRegen) return;
  jogador.proximaRegen = agora + CONFIG.REGEN_INTERVALO;
  if (comFome(agora)) {
    if (!jogador.avisouFome) { registrar('Você está com fome! Coma algo para recuperar vida e mana.', 'morte'); jogador.avisouFome = true; }
    return;
  }
  jogador.vida = Math.min(jogador.vidaMax, jogador.vida + CONFIG.REGEN_VIDA);
  jogador.mana = Math.min(jogador.manaMax, jogador.mana + CONFIG.REGEN_MANA);
}

// Tem monstro vivo por perto? (usado para bloquear o botão Sair)
function monstroPorPerto() {
  return monstros.some(m => !m.morto && !TIPOS_MONSTRO[m.tipo].fantoche && distancia(m, jogador) <= CONFIG.RAIO_SAIR);
}
