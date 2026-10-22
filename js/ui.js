// =====================================================
// ui.js — Painéis HTML fora do canvas:
// barras, skills, equipamento, mochila, corpo, log, janelas
// =====================================================

let tempoMensagem = null;

// Mensagem rápida que some sozinha (ex.: "não dá pra passar")
function mostrarMensagem(texto) {
  const el = document.getElementById('mensagem');
  el.textContent = texto;
  clearTimeout(tempoMensagem);
  tempoMensagem = setTimeout(() => { el.textContent = ''; }, 2500);
}

// Registro de eventos importantes (mortes, level, loot)
function registrar(texto, tipo = 'info') {
  const log = document.getElementById('log');
  const li = document.createElement('li');
  li.textContent = texto;
  li.className = 'log-' + tipo;
  log.prepend(li);
  while (log.children.length > 30) log.lastChild.remove();
}

// ---------- Janela de confirmação (modal) ----------
// Uso: abrirModal('Título', 'Texto', [{ texto: 'Sim', acao: fn, perigo: true }, { texto: 'Não' }])
function abrirModal(titulo, texto, botoes) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-texto').textContent = texto;
  const caixa = document.getElementById('modal-botoes');
  caixa.innerHTML = '';
  for (const b of botoes) {
    const el = document.createElement('button');
    el.className = 'btn' + (b.perigo ? ' btn-perigo' : '') + (b.secundario ? ' btn-secundario' : '');
    el.textContent = b.texto;
    el.addEventListener('click', () => { fecharModal(); if (b.acao) b.acao(); });
    caixa.appendChild(el);
  }
  document.getElementById('modal').classList.remove('escondido');
}

function fecharModal() {
  document.getElementById('modal').classList.add('escondido');
}

function modalAberto() {
  return !document.getElementById('modal').classList.contains('escondido');
}

// ---------- Sair do jogo ----------

// Trocar de personagem sem sair do jogo: salva e volta pra escolha de personagem
function pedirParaTrocar() {
  if (monstroPorPerto()) {
    abrirModal('Não dá pra trocar agora', 'Tem monstros por perto. Afaste-se deles (ou vá para a vila) antes de trocar.', [{ texto: 'Entendi' }]);
    return;
  }
  abrirModal('Trocar de personagem?', 'Seu progresso será salvo e você vai para a escolha de personagem.', [
    { texto: 'Cancelar', secundario: true },
    { texto: 'Trocar', acao: () => {
      salvarJogo(); enviarPendenteJa(); jogoRodando = false;
      try { sessionStorage.setItem('mythoria.trocar', '1'); } catch (e) { /* sem storage */ }
      location.reload();
    } },
  ]);
}

function pedirParaSair() {
  if (monstroPorPerto()) {
    abrirModal('Não dá pra sair agora', 'Tem monstros por perto. Afaste-se deles (ou vá para a vila) antes de sair.',
      [{ texto: 'Entendi' }]);
    return;
  }
  abrirModal('Sair do jogo?', 'Seu progresso será salvo e você voltará para a tela inicial.', [
    { texto: 'Cancelar', secundario: true },
    { texto: 'Sair', perigo: true, acao: () => { salvarJogo(); jogoRodando = false; location.reload(); } },
  ]);
}

// ---------- Tamanho da tela do jogo ----------
// Em tela grande, o canvas cresce até onde der sem a página precisar rolar:
// cabe na largura da coluna e na altura que sobra (topo, barra de ação e log).
//
// Dois arranjos, e o jogo escolhe o que deixa a tela do jogo MAIOR:
//   "largo": lateral com 2 colunas (mapa/battle/status | equipamento/magias/mochila), log embaixo do jogo
//   "alto":  (janela mais estreita e alta) 1 coluna lateral (equipamento/magias/mochila/log)
//            e mapa, status e battle list numa faixa embaixo do jogo
const ALTURA_MINIMA_LOG = 96;
const LARGURA_COLUNA = 258;
const ALTURA_FAIXA = 236;  // faixa de baixo no modo alto (mapa/status/battle list)
let modoTela = null;

function escalaPara(largura, altura) {
  return Math.min(largura / (CONFIG.VISAO_COLUNAS * CONFIG.TAMANHO_TILE), altura / (CONFIG.VISAO_LINHAS * CONFIG.TAMANHO_TILE));
}

function arrumarPaineis(modo) {
  if (modo === modoTela) return;
  modoTela = modo;
  const $ = id => document.getElementById(id);
  document.body.classList.toggle('modo-alto', modo === 'alto');
  if (modo === 'alto') {
    for (const id of ['painel-mapa', 'painel-status', 'painel-battle']) $('faixa-baixo').appendChild($(id));
    $('col-b').appendChild($('abaixo'));
  } else {
    for (const id of ['painel-mapa', 'painel-battle', 'painel-status']) $('col-a').appendChild($(id));
    document.querySelector('.coluna-jogo').appendChild($('abaixo'));
  }
}

function ajustarTela() {
  const canvas = document.getElementById('tela');
  const coluna = document.querySelector('.coluna-jogo');
  if (!canvas || !coluna || document.getElementById('tela-jogo').classList.contains('escondido')) return;
  if (modoCelular) { ajustarTelaCelular(canvas); return; } // celular.js
  if (window.innerWidth < 1000) { arrumarPaineis('largo'); canvas.style.width = ''; canvas.style.height = ''; return; } // janela pequena: CSS normal

  // Qual arranjo deixa o jogo maior? (conta aproximada, sem mexer na página)
  const topo = document.querySelector('#tela-jogo .topo').offsetHeight + 22;
  const barra = document.getElementById('barra-acao').offsetHeight + 30;
  const largura = window.innerWidth - 36;
  const altura = window.innerHeight - topo - barra;
  const largo = escalaPara(largura - 2 * LARGURA_COLUNA - 12, altura - ALTURA_MINIMA_LOG);
  const alto = escalaPara(largura - LARGURA_COLUNA - 12, altura - ALTURA_FAIXA);
  arrumarPaineis(alto > largo * 1.08 ? 'alto' : 'largo');

  // Agora o tamanho de verdade, medindo o que sobrou na coluna do jogo
  const embaixo = modoTela === 'alto' ? document.getElementById('faixa-baixo').offsetHeight : ALTURA_MINIMA_LOG;
  const outros = document.getElementById('barra-acao').offsetHeight + document.querySelector('.coluna-jogo > .status').offsetHeight + 24;
  const escala = Math.max(0.5, escalaPara(coluna.clientWidth - 6, coluna.clientHeight - outros - embaixo));
  canvas.style.width = Math.floor(canvas.width * escala) + 'px';
  canvas.style.height = Math.floor(canvas.height * escala) + 'px';
}

function configurarTela() {
  window.addEventListener('resize', ajustarTela);
  if (window.ResizeObserver) new ResizeObserver(ajustarTela).observe(document.querySelector('.coluna-jogo'));
  const ajuda = document.getElementById('painel-ajuda');
  document.getElementById('btn-ajuda').addEventListener('click', () => ajuda.classList.toggle('escondido'));
  document.getElementById('btn-fechar-ajuda').addEventListener('click', () => ajuda.classList.add('escondido'));
}

// ---------- Painéis minimizáveis (lembra a escolha no navegador) ----------

function configurarMinimizar() {
  let estado = {};
  try { estado = JSON.parse(localStorage.getItem(CONFIG.CHAVE_INTERFACE)) || {}; } catch (e) { /* sem storage */ }

  document.querySelectorAll('[data-minimizar]').forEach(botao => {
    const painel = document.getElementById(botao.dataset.minimizar);
    const aplicar = (minimizado) => {
      painel.classList.toggle('minimizado', minimizado);
      botao.textContent = minimizado ? '+' : '–';
      botao.title = minimizado ? 'Mostrar' : 'Minimizar';
    };
    aplicar(!!estado[painel.id]);
    botao.addEventListener('click', () => {
      estado[painel.id] = !painel.classList.contains('minimizado');
      aplicar(estado[painel.id]);
      try { localStorage.setItem(CONFIG.CHAVE_INTERFACE, JSON.stringify(estado)); } catch (e) { /* sem storage */ }
    });
  });
}

// Números grandes abreviados pra caber no painel: 15695510 → "15,7M", 47666 → "47,7k"
function numeroCurto(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1e5) return Math.round(n / 1e3) + 'k';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.', ',') + 'k';
  return String(n);
}

// ---------- Montagem inicial ----------

function configurarHUD() {
  // Skills
  const caixa = document.getElementById('skills');
  caixa.innerHTML = '';
  for (const nome in SKILLS) {
    const div = document.createElement('div');
    div.className = 'skill';
    div.innerHTML =
      '<span>' + SKILLS[nome].nome + '</span>' +
      '<b id="skill-' + nome + '"></b>' +
      '<span class="skill-progresso"><span id="treino-' + nome + '"></span></span>';
    caixa.appendChild(div);
  }

  // Espaços de equipamento: recebem e soltam itens arrastados
  for (const espaco in ESPACOS_EQUIP) {
    const el = document.getElementById('equip-' + espaco);
    el.dataset.origem = 'equip';
    el.dataset.destino = 'equip';
    el.dataset.espaco = espaco;
  }

  // Botões
  document.getElementById('btn-usar').addEventListener('click', () => {
    if (mochila.selecionado >= 0) usarItem(mochila.selecionado, performance.now());
  });
  document.getElementById('btn-jogar').addEventListener('click', () => {
    if (mochila.selecionado >= 0) jogarFora(mochila.selecionado);
  });
  document.getElementById('btn-pegar-tudo').addEventListener('click', pegarTudo);
  document.getElementById('btn-fechar-corpo').addEventListener('click', fecharCorpo);
  document.getElementById('btn-fechar-loja').addEventListener('click', fecharLoja);
  document.getElementById('aba-comprar').addEventListener('click', () => trocarAba('comprar'));
  document.getElementById('aba-vender').addEventListener('click', () => trocarAba('vender'));
  document.getElementById('btn-sair').addEventListener('click', pedirParaSair);
  document.getElementById('btn-trocar').addEventListener('click', pedirParaTrocar);

  document.getElementById('txt-classe').textContent = CLASSES[jogador.classe].nome;

  configurarPainelMagias();
  configurarMinimizar();
  desenharJanelaCorpo();
  desenharLoja();
}

// Em vez de recriar o HTML 60 vezes por segundo, guardamos uma
// "assinatura" do conteúdo e só redesenhamos quando ela muda.
let assinaturaItens = '';

function atualizarBarraNumerica(idBarra, idTexto, atual, maximo) {
  document.getElementById(idTexto).textContent = Math.max(0, atual) + ' / ' + maximo;
  document.getElementById(idBarra).style.width = (maximo ? 100 * Math.max(0, atual) / maximo : 0) + '%';
}

function atualizarHUD() {
  const j = jogador;

  atualizarBarraNumerica('barra-vida', 'txt-vida', j.vida, j.vidaMax);
  atualizarBarraNumerica('barra-mana', 'txt-mana', j.mana, j.manaMax);

  const xpAtual = xpParaLevel(j.level);
  const xpProx = xpParaLevel(j.level + 1);
  const txp = document.getElementById('txt-xp');
  txp.textContent = numeroCurto(j.xp) + ' / ' + numeroCurto(xpProx);
  txp.title = j.xp.toLocaleString('pt-BR') + ' / ' + xpProx.toLocaleString('pt-BR') + ' XP';
  const pctXp = Math.max(0, Math.min(1, (j.xp - xpAtual) / (xpProx - xpAtual)));
  document.getElementById('xp-tela-cheia').style.width = (pctXp * 100) + '%';
  document.getElementById('xp-tela-txt').textContent = 'Level ' + j.level + ' · ' + (pctXp * 100).toFixed(1).replace('.', ',') + '% · ' +
    numeroCurto(xpProx - j.xp) + ' XP pro próximo';
  document.getElementById('barra-xp').style.width = (100 * (j.xp - xpAtual) / (xpProx - xpAtual)) + '%';

  document.getElementById('txt-level').textContent = j.level;
  document.getElementById('txt-ouro').textContent = j.ouro;
  document.getElementById('txt-defesa').textContent = defesaTotal();

  for (const nome in SKILLS) {
    document.getElementById('skill-' + nome).textContent = j.skills[nome];
    const pct = 100 * j.treinoSkills[nome] / treinoNecessario(j.skills[nome]);
    document.getElementById('treino-' + nome).style.width = pct + '%';
  }

  const agora = performance.now();

  // Fome
  const fome = document.getElementById('txt-fome');
  if (comFome(agora)) { fome.textContent = 'Com fome!'; fome.className = 'fome-ruim'; }
  else { fome.textContent = 'Alimentado (' + Math.ceil(minutosSemFome(agora)) + ' min)'; fome.className = 'fome-boa'; }
  // Buffs ativos (fúria do guerreiro, imortal do arqueiro, arcano do mago, comida especial)
  const buffs = [];
  if (j.furia) buffs.push('🔥 Fúria');
  if (agora < j.imortalAte) buffs.push('🛡️ Imortal');
  if (agora < j.arcanoAte) buffs.push('✨ Arcano');
  if (j.regenBonus) buffs.push('🍲 Regen');
  if (j.passivaArma && armaAtiva(j.passivaArma.tipo, agora)) buffs.push('⚡ ' + PASSIVAS_ARMA[j.passivaArma.tipo].nome);
  if (classeAtiva('regen', agora)) buffs.push('💚 Vontade de ferro');
  if (classeAtiva('critico', agora)) buffs.push('🎯 Instinto');
  if (classeAtiva('intangivel', agora)) buffs.push('👻 Etéreo');
  const elBuff = document.getElementById('txt-furia');
  elBuff.textContent = buffs.join(' ');
  elBuff.classList.toggle('escondido', !buffs.length);

  const assinatura = JSON.stringify(mochila.espacos) + JSON.stringify(j.equip) + mochila.selecionado + '|' + j.ouro +
    (bauAberto ? JSON.stringify(bau.espacos) : '');
  if (assinatura !== assinaturaItens) {
    assinaturaItens = assinatura;
    desenharMochila();
    desenharEquipamento();
    if (lojaAberta) desenharLoja(); // contagens e ouro da loja mudam junto
    if (bauAberto) desenharBau();
  }
  atualizarBarra(agora);
  atualizarPainelMagias(agora);
  atualizarHudCelular();
  atualizarMagiasCelular(agora);
}

// ---------- Painel de magias ----------
// Lista as magias da sua classe. Clique para lançar, arraste para a barra.

let assinaturaMagias = '';

function configurarPainelMagias() {
  document.getElementById('lista-magias').addEventListener('click', (ev) => {
    const linha = ev.target.closest('[data-magia]');
    if (linha) lancarMagia(linha.dataset.magia, performance.now());
  });
}

function atualizarPainelMagias(agora) {
  const ids = magiasDaClasse();
  const assinatura = jogador.level + '|' + ids.map(id => Math.ceil(esperaRestante(id, agora) / 1000)).join(',');
  if (assinatura === assinaturaMagias) return;
  assinaturaMagias = assinatura;

  // Uma grade de ícones (igual à mochila): passe o mouse pra ver nome, mana e espera.
  // Clique = lança · arraste = coloca na barra de ação. Bloqueada mostra o level.
  const lista = document.getElementById('lista-magias');
  lista.innerHTML = '';
  // primeiro: a passiva da classe (não se usa, só explica — passe o mouse / segure o dedo)
  const pc = PASSIVAS_CLASSE[jogador.classe];
  if (pc) {
    const el = document.createElement('span');
    el.className = 'espaco magia-icone passiva-classe';
    el.dataset.dica = 'passiva:' + jogador.classe;
    el.innerHTML = htmlIcone(pc.icone) + '<span class="selo-passiva">P</span>';
    lista.appendChild(el);
  }
  for (const id of ids) {
    const m = MAGIAS[id];
    const aprendida = magiaAprendida(id);
    const falta = esperaRestante(id, agora);
    const el = document.createElement('span');
    el.className = 'espaco magia-icone' + (aprendida ? '' : ' bloqueada');
    el.dataset.dica = 'magia:' + id; // explicação completa (dicas.js)
    if (aprendida) { el.dataset.magia = id; el.dataset.origem = 'magia'; }
    el.innerHTML = htmlIcone('magia_' + id) +
      (!aprendida ? '<span class="nivel-magia">' + m.level + '</span>' : falta > 0 ? '<span class="espera">' + Math.ceil(falta / 1000) + '</span>' : '');
    lista.appendChild(el);
  }
}

// ---------- Itens ----------

// Preenche o quadradinho de um item (mochila, corpo e equipamento)
function preencherEspaco(el, espaco, rotuloVazio) {
  el.classList.toggle('vazio', !espaco);
  if (!espaco) {
    el.title = rotuloVazio || '';
    delete el.dataset.dica;
    el.innerHTML = rotuloVazio ? '<span class="rotulo-vazio">' + rotuloVazio + '</span>' : '';
    return;
  }
  const item = ITENS[espaco.id];
  el.removeAttribute('title');
  el.dataset.dica = 'item:' + espaco.id; // explicação completa (dicas.js)
  el.innerHTML = htmlIcone(espaco.id) +
    (espaco.qtd > 1 ? '<span class="qtd">' + espaco.qtd + '</span>' : '');
}

function desenharMochila() {
  const grade = document.getElementById('grade-mochila');
  grade.innerHTML = '';
  mochila.espacos.forEach((e, i) => {
    const el = document.createElement('button');
    el.className = 'espaco' + (mochila.selecionado === i ? ' selecionado' : '');
    el.dataset.origem = 'mochila';
    el.dataset.destino = 'mochila';
    el.dataset.indice = i;
    preencherEspaco(el, e);
    // Esquerdo: seleciona e mostra detalhes. Direito: usa (comida/poção).
    el.addEventListener('click', () => { if (e) mochila.selecionado = i; });
    el.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (e) usarItem(i, performance.now());
    });
    grade.appendChild(el);
  });

  const ocupados = mochila.espacos.filter(e => e).length;
  document.getElementById('txt-espacos').textContent = ocupados + ' / ' + mochila.espacos.length;

  // Detalhe do item selecionado
  const sel = mochila.espacos[mochila.selecionado];
  const detalhe = document.getElementById('detalhe-item');
  if (!sel) { detalhe.classList.add('escondido'); return; }

  const item = ITENS[sel.id];
  detalhe.classList.remove('escondido');
  document.getElementById('detalhe-nome').innerHTML = htmlIcone(sel.id, 'icone-pequeno') + item.nome + (sel.qtd > 1 ? ' ×' + sel.qtd : '');
  let dica = '';
  if (item.cura || item.mana) dica = ' Botão direito para usar.';
  else if (item.fome) dica = ' Botão direito para comer.';
  else if (espacoDoItem(item)) dica = ' Arraste para o equipamento.';
  document.getElementById('detalhe-desc').textContent = descreverItem(sel.id) + ' Vende por ' + item.valor + ' de ouro.' + dica;
  // "Usar" fica para quem joga no celular (lá não tem botão direito)
  document.getElementById('btn-usar').style.display = item.cura || item.mana || item.fome ? '' : 'none';
}

function desenharEquipamento() {
  for (const espaco in ESPACOS_EQUIP) {
    preencherEspaco(document.getElementById('equip-' + espaco), jogador.equip[espaco], ESPACOS_EQUIP[espaco].nome);
  }
}

function desenharJanelaCorpo() {
  const janela = document.getElementById('janela-corpo');
  if (!corpoAberto) { janela.classList.add('escondido'); return; }
  janela.classList.remove('escondido');

  const tipo = TIPOS_MONSTRO[corpoAberto.tipo];
  document.getElementById('titulo-corpo').textContent = 'Corpo de ' + tipo.nome.toLowerCase();

  const grade = document.getElementById('grade-corpo');
  grade.innerHTML = '';
  const vazio = corpoVazio(corpoAberto);
  document.getElementById('btn-pegar-tudo').classList.toggle('escondido', vazio);
  if (vazio) {
    grade.innerHTML = '<p class="vazio-txt">Não tem nada aqui.</p>';
    return;
  }
  corpoAberto.loot.forEach((e, i) => {
    if (!e) return;
    const el = document.createElement('button');
    el.className = 'espaco';
    el.dataset.origem = 'corpo';
    el.dataset.indice = i;
    preencherEspaco(el, e);
    el.addEventListener('click', () => pegarDoCorpo(i));
    grade.appendChild(el);
  });
}
