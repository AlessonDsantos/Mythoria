// =====================================================
// loja.js — Negociar com os NPCs (janela de compra e venda)
// =====================================================

let lojaAberta = null;   // NPC com quem está negociando
let npcPendente = null;  // NPC até onde o jogador está andando
let abaLoja = 'comprar';

// Clique no NPC: abre se estiver perto, senão anda até o balcão
function clicarNoNpc(npc) {
  if (distancia(npc, jogador) <= CONFIG.ALCANCE_NPC) { abrirLoja(npc); return; }
  if (irAte(npc.atendimento.x, npc.atendimento.y)) npcPendente = npc;
}

function abrirLoja(npc) {
  if (npc.bau) { abrirBau(npc); return; } // Guardião do Baú abre o baú, não uma loja
  if (npc.tasks) { abrirTasks(npc); return; } // Capitão: janela de tasks
  lojaAberta = npc;
  npcPendente = null;
  abaLoja = npc.vende.length ? 'comprar' : 'vender';
  limparAlvo();
  desenharLoja();
}

function fecharLoja() {
  lojaAberta = null;
  desenharLoja();
}

function trocarAba(aba) {
  abaLoja = aba;
  desenharLoja();
}

function comprar(id, qtd) {
  const item = ITENS[id];
  qtd = Math.max(1, Math.floor(qtd) || 1);
  const total = item.preco * qtd;
  if (jogador.ouro < total) { mostrarMensagem('Ouro insuficiente: custa ' + total + '.'); return; }
  if (quantoCabe(id) < qtd) { mostrarMensagem('Não cabe na mochila.'); return; }
  jogador.ouro -= total;
  guardarNaMochila(id, qtd);
  registrar('Comprou ' + nomeComQuantidade(id, qtd) + ' por ' + total + ' de ouro.', 'loot');
  desenharLoja();
}

function vender(id, qtd) {
  const tem = contarNaMochila(id);
  qtd = Math.min(tem, Math.max(1, Math.floor(qtd) || 1));
  if (qtd <= 0) return;
  const total = ITENS[id].valor * qtd;
  removerDaMochila(id, qtd);
  jogador.ouro += total;
  registrar('Vendeu ' + nomeComQuantidade(id, qtd) + ' por ' + total + ' de ouro.', 'loot');
  desenharLoja();
}

// Chamado a cada quadro: abre ao chegar no balcão, fecha se afastar
function atualizarLoja(agora) {
  if (npcPendente && !estaAndando(agora)) {
    if (distancia(npcPendente, jogador) <= CONFIG.ALCANCE_NPC) abrirLoja(npcPendente);
    else if (jogador.caminho.length === 0) npcPendente = null;
  }
  if (lojaAberta && distancia(lojaAberta, jogador) > CONFIG.ALCANCE_NPC + 1) fecharLoja();
}

// ---------- Desenho da janela (HTML) ----------

function desenharLoja() {
  const janela = document.getElementById('janela-loja');
  if (!lojaAberta) { janela.classList.add('escondido'); return; }
  janela.classList.remove('escondido');

  const npc = lojaAberta;
  document.getElementById('loja-titulo').textContent = npc.titulo + ' ' + npc.nome;
  document.getElementById('loja-fala').textContent = '"' + npc.saudacao + '"';
  document.getElementById('loja-ouro').textContent = jogador.ouro;

  // Abas (some a aba que o NPC não usa)
  const abaComprar = document.getElementById('aba-comprar');
  const abaVender = document.getElementById('aba-vender');
  abaComprar.classList.toggle('escondido', npc.vende.length === 0);
  abaVender.classList.toggle('escondido', npc.compra.length === 0);
  abaComprar.classList.toggle('ativa', abaLoja === 'comprar');
  abaVender.classList.toggle('ativa', abaLoja === 'vender');

  const lista = document.getElementById('loja-lista');
  lista.innerHTML = '';

  const ids = abaLoja === 'comprar' ? npc.vende : npc.compra.filter(id => contarNaMochila(id) > 0);
  if (ids.length === 0) {
    lista.innerHTML = '<p class="vazio-txt">Você não tem nada que ' + npc.nome + ' queira comprar.</p>';
    return;
  }

  for (const id of ids) {
    const item = ITENS[id];
    const linha = document.createElement('div');
    linha.className = 'loja-linha';

    const tem = contarNaMochila(id);
    const preco = abaLoja === 'comprar' ? item.preco : item.valor;
    const maximo = abaLoja === 'comprar' ? (item.empilha ? 100 : 1) : tem;

    linha.innerHTML =
      htmlIcone(id, 'loja-icone') +
      '<span class="loja-info"><b>' + item.nome + '</b>' +
      '<small>' + descreverItem(id) + (tem ? ' · você tem ' + tem : '') + '</small></span>' +
      '<span class="loja-preco">' + preco + ' ' + htmlIcone('ouro', 'icone-pequeno') + '</span>' +
      '<input type="number" class="loja-qtd" min="1" max="' + maximo + '" value="1"' + (maximo <= 1 ? ' disabled' : '') + '>' +
      '<button class="btn">' + (abaLoja === 'comprar' ? 'Comprar' : 'Vender') + '</button>';

    const campo = linha.querySelector('input');
    linha.querySelector('button').addEventListener('click', () => {
      const qtd = Number(campo.value);
      if (abaLoja === 'comprar') comprar(id, qtd);
      else vender(id, qtd);
    });
    lista.appendChild(linha);
  }
}
