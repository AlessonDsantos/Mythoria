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

  document.getElementById('txt-classe').textContent = CLASSES[jogador.classe].nome;

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
  document.getElementById('txt-xp').textContent = j.xp + ' / ' + xpProx;
  document.getElementById('barra-xp').style.width = (100 * (j.xp - xpAtual) / (xpProx - xpAtual)) + '%';

  document.getElementById('txt-level').textContent = j.level;
  document.getElementById('txt-ouro').textContent = j.ouro;
  document.getElementById('txt-defesa').textContent = defesaTotal();

  for (const nome in SKILLS) {
    document.getElementById('skill-' + nome).textContent = j.skills[nome];
    const pct = 100 * j.treinoSkills[nome] / treinoNecessario(j.skills[nome]);
    document.getElementById('treino-' + nome).style.width = pct + '%';
  }

  const assinatura = JSON.stringify(mochila.espacos) + JSON.stringify(j.equip) + mochila.selecionado + '|' + j.ouro;
  if (assinatura !== assinaturaItens) {
    assinaturaItens = assinatura;
    desenharMochila();
    desenharEquipamento();
    if (lojaAberta) desenharLoja(); // contagens e ouro da loja mudam junto
  }
  atualizarBarra();
}

// ---------- Itens ----------

// Preenche o quadradinho de um item (mochila, corpo e equipamento)
function preencherEspaco(el, espaco, rotuloVazio) {
  el.classList.toggle('vazio', !espaco);
  if (!espaco) {
    el.title = rotuloVazio || '';
    el.innerHTML = rotuloVazio ? '<span class="rotulo-vazio">' + rotuloVazio + '</span>' : '';
    return;
  }
  const item = ITENS[espaco.id];
  el.title = item.nome + ' — ' + descreverItem(espaco.id);
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
  else if (espacoDoItem(item)) dica = ' Arraste para o equipamento.';
  document.getElementById('detalhe-desc').textContent = descreverItem(sel.id) + ' Vende por ' + item.valor + ' de ouro.' + dica;
  // "Usar" fica para quem joga no celular (lá não tem botão direito)
  document.getElementById('btn-usar').style.display = item.cura || item.mana ? '' : 'none';
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
