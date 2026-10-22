// =====================================================
// passivas.js — Passivas de classe e de arma
//
// CLASSE (ativam sozinhas quando a vida fica abaixo de 20%, espera de 60 s):
//   Guerreiro: sempre toma 20% menos dano + regenera 10 de vida a cada 2 s por 10 s
//   Arqueiro:  20% de chance de crítico por 8 s
//   Mago:      intangível (não toma dano) por 3 s
//   Bardo:     os monstros em volta (2 quadrados) ficam confusos por 3 s (boss: fica lento)
//
// ARMA (cada ataque com a arma tem 5% de chance de ativar, dura 6 s):
//   Espadas:  roubo de vida — cura 25% do dano de cada golpe
//   Machados: crítico — todo golpe é crítico (+50% de dano)
//   Clavas:   esquiva — desvia de todos os ataques
//   Arcos e arremesso: precisão — Distance +40%
//   Cajados:  fonte de mana — o dano do cajado vira mana (100%)
//   Instrumentos: ressonância — o ataque pula pra até 2 monstros perto do alvo, com o mesmo dano
// Enquanto a passiva da arma está ativa, aparece uma aura colorida no personagem.
// =====================================================

const LIMITE_VIDA_PASSIVA = 0.2;   // 20% da vida
const ESPERA_PASSIVA_CLASSE = 60000;
const DANO_CRITICO = 1.5;          // crítico = +50%
const REDUCAO_GUERREIRO = 0.8;     // guerreiro toma 80% do dano (20% a menos)

const PASSIVAS_ARMA = {
  espada:    { nome: 'Roubo de vida',  chance: 0.05, duracao: 6000, roubo: 0.25, filtro: 'hue-rotate(240deg) saturate(1.6)',  // vermelho
               descricao: 'cada golpe cura 25% do dano causado' },
  machado:   { nome: 'Fúria crítica',  chance: 0.05, duracao: 6000, filtro: 'hue-rotate(270deg) saturate(1.8)',               // laranja
               descricao: 'todo golpe é crítico (+50% de dano)' },
  clava:     { nome: 'Esquiva',        chance: 0.05, duracao: 6000, filtro: 'hue-rotate(100deg) saturate(1.4)',               // azul
               descricao: 'desvia de todos os ataques dos monstros' },
  distancia: { nome: 'Precisão',       chance: 0.05, duracao: 6000, bonusSkill: 0.4, filtro: 'hue-rotate(-60deg) saturate(1.6)', // amarelo
               descricao: 'Distance +40% (mais dano e mais acerto)' },
  cajado:    { nome: 'Fonte de mana',  chance: 0.05, duracao: 6000, filtro: 'hue-rotate(150deg) saturate(1.6)',               // roxo
               descricao: 'o dano do cajado vira mana (100%)' },
  instrumento: { nome: 'Ressonância', chance: 0.05, duracao: 6000, pulos: 2, raio: 2, parte: 1, filtro: 'hue-rotate(200deg) saturate(1.8)', // rosa
               descricao: 'cada ataque pula pra até 2 monstros perto do alvo, com o mesmo dano' },
};

// Texto das passivas de classe (aparecem no painel de magias)
const PASSIVAS_CLASSE = {
  guerreiro: { nome: 'Vontade de ferro', icone: 'passiva_guerreiro',
    descricao: 'Sempre toma 20% menos dano. Quando a vida fica abaixo de 20%, regenera 10 de vida a cada 2 segundos, por 10 segundos.' },
  arqueiro:  { nome: 'Instinto do caçador', icone: 'passiva_arqueiro',
    descricao: 'Quando a vida fica abaixo de 20%, ganha 20% de chance de crítico (+50% de dano) por 8 segundos, em ataques e magias.' },
  mago:      { nome: 'Forma etérea', icone: 'passiva_mago',
    descricao: 'Quando a vida fica abaixo de 20%, fica intangível (não toma dano) por 3 segundos.' },
  bardo:     { nome: 'Canção caótica', icone: 'passiva_bardo',
    descricao: 'Quando a vida fica abaixo de 20%, os monstros a até 2 quadrados ficam confusos (não atacam) por 3 segundos. Bosses só ficam lentos.' },
};

// Qual passiva a arma equipada tem (punhos: nenhuma)
function tipoPassivaArma(arma) {
  if (arma.categoria === 'arco' || arma.categoria === 'arremesso') return 'distancia';
  return PASSIVAS_ARMA[arma.categoria] ? arma.categoria : null;
}

// A passiva da arma está ativa agora? (e é da arma que está na mão)
function armaAtiva(tipo, agora = performance.now()) {
  const p = jogador.passivaArma;
  return !!p && p.tipo === tipo && agora < p.ate && tipoPassivaArma(armaAtual()) === tipo;
}

// Depois de cada ataque com a arma: 5% de chance de ativar a passiva dela
function tentarPassivaArma(agora) {
  const tipo = tipoPassivaArma(armaAtual());
  if (!tipo) return;
  const p = PASSIVAS_ARMA[tipo];
  if (armaAtiva(tipo, agora) || Math.random() >= p.chance) return;
  jogador.passivaArma = { tipo, ate: agora + p.duracao };
  registrar('Passiva da arma: ' + p.nome + ' por ' + (p.duracao / 1000) + ' segundos!', 'skill');
  adicionarTexto(jogador.x, jogador.y, p.nome + '!', '#ffe08a', agora);
}

// ---------- Passivas de classe ----------

function atualizarPassivas(agora) {
  const pc = jogador.passivaClasse;
  // regeneração do guerreiro: 10 de vida a cada 2 s
  if (pc && pc.tipo === 'regen' && agora < pc.ate && agora >= pc.proximo) {
    pc.proximo += 2000;
    const antes = jogador.vida;
    jogador.vida = Math.min(jogador.vidaMax, jogador.vida + 10);
    if (jogador.vida > antes) adicionarTexto(jogador.x, jogador.y, '+' + (jogador.vida - antes), '#5ce65c', agora);
  }
  if (jogador.vida <= 0 || jogador.vida >= jogador.vidaMax * LIMITE_VIDA_PASSIVA) return;
  if (agora < (jogador.esperaPassivaClasse || 0)) return;
  jogador.esperaPassivaClasse = agora + ESPERA_PASSIVA_CLASSE;
  if (jogador.classe === 'guerreiro') {
    jogador.passivaClasse = { tipo: 'regen', ate: agora + 10000, proximo: agora + 2000 };
    registrar('Passiva: Vontade de ferro! Regenerando vida por 10 segundos.', 'skill');
  } else if (jogador.classe === 'arqueiro') {
    jogador.passivaClasse = { tipo: 'critico', ate: agora + 8000 };
    registrar('Passiva: Instinto do caçador! 20% de chance de crítico por 8 segundos.', 'skill');
  } else if (jogador.classe === 'mago') {
    jogador.passivaClasse = { tipo: 'intangivel', ate: agora + 3000 };
    registrar('Passiva: Forma etérea! Intangível por 3 segundos.', 'skill');
  } else if (jogador.classe === 'bardo') {
    jogador.passivaClasse = { tipo: 'confusao', ate: agora + 3000 };
    criarEfeito('dissonancia', jogador.x, jogador.y, agora);
    for (const m of monstrosNaArea(jogador, 2)) if (!TIPOS_MONSTRO[m.tipo].fantoche) confundir(m, agora, 3000);
    registrar('Passiva: Canção caótica! Os monstros em volta ficaram confusos.', 'skill');
  }
}

function classeAtiva(tipo, agora = performance.now()) {
  const pc = jogador.passivaClasse;
  return !!pc && pc.tipo === tipo && agora < pc.ate;
}

// ---------- Usado no combate ----------

// Crítico? deArma = ataque normal com a arma (o machado só vale aí)
function rolarCritico(agora, deArma) {
  if (deArma && armaAtiva('machado', agora)) return true;
  return classeAtiva('critico', agora) && Math.random() < 0.2;
}

function mostrarCritico(m, agora, atraso) {
  criarEfeito('critico', m.x, m.y, agora, atraso);
}

// Depois que o golpe da arma acertou: roubo de vida (espada) e mana (cajado)
function aplicarPassivaNoDano(dano, agora, atraso) {
  if (dano <= 0) return;
  if (armaAtiva('espada', agora)) {
    const cura = Math.max(1, Math.round(dano * PASSIVAS_ARMA.espada.roubo));
    jogador.vida = Math.min(jogador.vidaMax, jogador.vida + cura);
    adicionarTexto(jogador.x, jogador.y, '+' + cura, '#5ce65c', agora + atraso);
  }
  if (armaAtiva('cajado', agora)) {
    const antes = jogador.mana;
    jogador.mana = Math.min(jogador.manaMax, jogador.mana + dano);
    if (jogador.mana > antes) adicionarTexto(jogador.x, jogador.y, '+' + (jogador.mana - antes), '#7ec8ff', agora + atraso);
  }
}

// Ressonância (instrumentos): a nota pula do alvo pra até 2 monstros perto dele, com o mesmo dano
function ressonancia(alvo, dano, agora, atraso) {
  const p = PASSIVAS_ARMA.instrumento;
  const parte = Math.max(1, Math.round(dano * p.parte));
  const outros = monstrosNaArea(alvo, p.raio)
    .filter(m => m !== alvo && !TIPOS_MONSTRO[m.tipo].fantoche)
    .sort((a, b) => distancia(a, alvo) - distancia(b, alvo))
    .slice(0, p.pulos);
  outros.forEach((m, k) => {
    const voo = 60 + distancia(m, alvo) * 50, quando = atraso + 60 + k * 90;
    criarProjetilEfeito(armaAtual().tiro || 'nota', alvo, m, agora, voo, quando);
    danificarComMagia(m, parte, agora, quando + voo, null, true);
  });
}

// Monstro acertou o jogador: devolve o dano depois das passivas, ou null se nada passou
function defenderComPassivas(dano, agora) {
  if (classeAtiva('intangivel', agora)) return { texto: 'intangível', dano: 0 };
  if (armaAtiva('clava', agora)) return { texto: 'esquivou', dano: 0 };
  if (jogador.classe === 'guerreiro') dano = Math.floor(dano * REDUCAO_GUERREIRO);
  return { dano };
}

// ---------- Desenho: aura da arma e forma etérea do mago ----------

function desenharAuraArma(cx, cy, agora) {
  const p = jogador.passivaArma;
  if (!p || !armaAtiva(p.tipo, agora)) return;
  const ef = EFEITOS.cura;
  const quadro = Math.floor(agora / 90) % ef.quadros;
  comFiltro(PASSIVAS_ARMA[p.tipo].filtro, () => desenharQuadroEfeito(ef, quadro, cx, cy));
}
