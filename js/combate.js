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
// Quanto treino falta pro próximo nível. O Magic Level tem curva própria,
// mais suave (7% por nível), pra o mago conseguir passar de 100 com muito treino.
const CURVA_SKILL = 1.12;
const CURVA_MAGIA = 1.07;
function treinoNecessario(nivelSkill, nomeSkill) {
  const curva = nomeSkill === 'magia' ? CURVA_MAGIA : CURVA_SKILL;
  return Math.max(1, Math.floor(15 * Math.pow(curva, nivelSkill - 10)));
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

// ---------- Modo de ataque: 'seguir' (anda atrás do alvo) ou 'parado' ----------
let modoAtaque = 'seguir';

function configurarModoAtaque() {
  try { modoAtaque = localStorage.getItem('mythoria.modoAtaque') || 'seguir'; } catch (e) { /* sem storage */ }
  document.getElementById('btn-seguir').addEventListener('click', () => trocarModoAtaque('seguir'));
  document.getElementById('btn-parado').addEventListener('click', () => trocarModoAtaque('parado'));
  trocarModoAtaque(modoAtaque);
}

function trocarModoAtaque(modo) {
  modoAtaque = modo;
  document.getElementById('btn-seguir').classList.toggle('ativa', modo === 'seguir');
  document.getElementById('btn-parado').classList.toggle('ativa', modo === 'parado');
  try { localStorage.setItem('mythoria.modoAtaque', modo); } catch (e) { /* sem storage */ }
}

// O alvo ainda aparece na sua tela?
function alvoNaTela(alvo) {
  return Math.abs(alvo.x - jogador.x) <= Math.floor(CONFIG.VISAO_COLUNAS / 2) &&
         Math.abs(alvo.y - jogador.y) <= Math.floor(CONFIG.VISAO_LINHAS / 2);
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
  if (!alvoNaTela(alvo)) { limparAlvo(); mostrarMensagem('O alvo saiu da sua vista.'); return; }
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
    gastarDoEspaco('arma', m); // (a lança/shuriken pode cair no corpo desse monstro)
  }

  // O dano aparece quando o projétil chega
  let atraso = 0;
  if (arma.tiro) {
    // cajado: um efeito animado voa até o monstro (bola de fogo, vento, faísca)
    atraso = 80 + d * 60;
    const tiros = arma.tiros || 1;           // alaúde: 3 notas em fila, o dano vem com a última
    for (let k = 0; k < tiros; k++) criarProjetilEfeito(arma.tiro, jogador, m, agora, atraso, k * 90);
    if (arma.volta) criarProjetilEfeito(arma.tiro, m, jogador, agora, atraso, atraso); // violino: bumerangue volta
    atraso += (tiros - 1) * 90;
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
  let dano = Math.max(0, aleatorioInt(danoMin, danoMax) - aleatorioInt(0, defesaMonstro(m, agora)));
  if (arma.elemento) dano = Math.round(dano * multiplicadorElemento(m.tipo, arma.elemento)); // fraqueza/resistência

  if (dano === 0) {
    adicionarTexto(m.x, m.y, 'bloqueou', '#cccccc', agora + atraso);
    tentarPassivaArma(agora);
    return;
  }

  // 3) Crítico (+50%): machado com a passiva ativa, ou a passiva do arqueiro (passivas.js)
  const critico = rolarCritico(agora, true);
  if (critico) { dano = Math.round(dano * DANO_CRITICO); mostrarCritico(m, agora, atraso); }

  m.vida -= dano;
  m.ultimoDano = agora + atraso;
  adicionarTexto(m.x, m.y, critico ? dano + '!' : String(dano), critico ? '#ffd23f' : '#ff4d4d', agora + atraso);
  aplicarPassivaNoDano(dano, agora, atraso); // roubo de vida (espada) / mana (cajado)
  tentarPassivaArma(agora);                  // 5% de chance de ativar a passiva da arma
  if (armaAtiva('instrumento', agora)) ressonancia(m, dano, agora, atraso); // bardo: a nota pula pra outros

  // Fantoche de treino: leva o dano, mas nunca morre
  if (TIPOS_MONSTRO[m.tipo].fantoche) { m.vida = m.vidaMax; return; }

  if (m.vida <= 0) matarMonstro(m, agora);
}

// Gasta munição/arma arremessada.
//   flecha: 1 por tiro
//   shuriken e lança: cada unidade aguenta um número sorteado de ataques
//   (quebraEntre) e só então é perdida
// alvo: monstro em quem a arma foi jogada. Quando uma lança/shuriken "acaba",
// tem 50% de chance de não quebrar e cair no monstro: aparece no loot do corpo.
const CHANCE_ARMA_CAIR = 0.5;
function gastarDoEspaco(espaco, alvo = null) {
  const e = jogador.equip[espaco];
  const item = ITENS[e.id];
  if (item.infinita) return;               // shuriken do aprendiz: nunca acaba
  if (item.quebraEntre) {
    if (!e.usos) e.usos = aleatorioInt(item.quebraEntre[0], item.quebraEntre[1]);
    e.usos--;
    if (e.usos > 0) return;                // ainda não quebrou
    e.usos = aleatorioInt(item.quebraEntre[0], item.quebraEntre[1]); // a próxima unidade
    if (alvo && item.arremesso && Math.random() < CHANCE_ARMA_CAIR) {
      alvo.armasCaidas = alvo.armasCaidas || {};
      alvo.armasCaidas[e.id] = (alvo.armasCaidas[e.id] || 0) + 1;
      adicionarTexto(alvo.x, alvo.y, item.nome + ' caiu', '#e8dcc4', performance.now());
    } else {
      adicionarTexto(jogador.x, jogador.y, item.nome + ' quebrou', '#bbbbbb', performance.now());
    }
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
  while (jogador.treinoSkills[nomeSkill] >= treinoNecessario(jogador.skills[nomeSkill], nomeSkill)) {
    jogador.treinoSkills[nomeSkill] -= treinoNecessario(jogador.skills[nomeSkill], nomeSkill);
    jogador.skills[nomeSkill]++;
    registrar('Você avançou em ' + SKILLS[nomeSkill].nome + ' para ' + jogador.skills[nomeSkill] + '.', 'skill');
  }
}

// Gastar mana treina o Magic Level. Pontos por mana gasta, por classe:
// mago e bardo aprendem 10x mais rápido que o arqueiro e 25x mais que o guerreiro.
const TREINO_MAGIA = { mago: 0.5, bardo: 0.5, arqueiro: 0.05, guerreiro: 0.02 };
function treinarMagia(mana) {
  treinarSkill('magia', mana * (TREINO_MAGIA[jogador.classe] ?? 0.05));
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
  for (const id in (m.armasCaidas || {})) m.loot.push({ id, qtd: m.armasCaidas[id] }); // lanças/shurikens que caíram nele
  const descricao = m.loot.length ? m.loot.map(e => nomeComQuantidade(e.id, e.qtd)).join(', ') : 'nada';
  registrar(tipo.nome + (tipo.feminino ? ' morta' : ' morto') + ' (+' + tipo.xp + ' XP). Loot: ' + descricao + '.', 'loot');
  contarTask(m.tipo); // conta pra task do Capitão (aparece no Server Log logo depois)
  adicionarTexto(jogador.x, jogador.y, '+' + tipo.xp + ' XP', '#ffffff', agora);

  ganharXp(tipo.xp, agora);
}

function ganharXp(quantidade, agora) {
  jogador.xp += quantidade;
  while (jogador.xp >= xpParaLevel(jogador.level + 1)) {
    const classe = CLASSES[jogador.classe];
    jogador.level++;
    criarEfeito('levelup', jogador.x, jogador.y, agora); // brilho discreto
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
  // passivas: forma etérea do mago, esquiva da clava, -20% do guerreiro
  const defesa = defenderComPassivas(dano, agora);
  if (defesa.texto) { adicionarTexto(jogador.x, jogador.y, defesa.texto, '#c9b6ff', agora); return; }
  dano = defesa.dano;

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
  // Perde 20% da XP que o level atual pede (ex.: o level pede 1000 → perde 200).
  // Nunca cai de level: no máximo volta pro começo do level.
  const xpDoLevel = xpParaLevel(jogador.level + 1) - xpParaLevel(jogador.level);
  const perda = Math.floor(xpDoLevel * CONFIG.PERDA_XP_MORTE);
  const antes = jogador.xp;
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
  registrar('Você morreu! Perdeu ' + (antes - jogador.xp) + ' de XP e acordou no templo.', 'morte');
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
