// =====================================================
// bau.js — Baú pessoal (Guardião do Baú, na vila)
//
// O baú é uma lista de espaços igual à mochila. Começa com 30
// espaços e dá pra comprar mais, de 5 em 5, até 60.
// Arraste itens entre a mochila e o baú com a janela aberta.
// =====================================================

const bau = {
  espacos: new Array(CONFIG.BAU_INICIAL).fill(null),
};

let bauAberto = null; // NPC Guardião com quem você está falando

// ---------- Mover itens entre listas (mochila e baú) ----------

// Move o item do espaço i da lista A para o espaço j da lista B.
// Itens iguais empilháveis se juntam; senão, os dois trocam de lugar.
function moverEntreListas(listaA, i, listaB, j) {
  if (listaA === listaB && i === j) return;
  const a = listaA[i];
  const b = listaB[j];
  if (!a) return;
  if (b && a.id === b.id && ITENS[a.id].empilha) {
    const cabe = Math.min(a.qtd, CONFIG.MAX_PILHA - b.qtd);
    b.qtd += cabe;
    a.qtd -= cabe;
    if (a.qtd <= 0) listaA[i] = null;
  } else {
    listaB[j] = { id: a.id, qtd: a.qtd };
    listaA[i] = b ? { id: b.id, qtd: b.qtd } : null;
  }
  mochila.selecionado = -1;
}

// Clique num item do baú: manda pra mochila (onde couber)
function retirarDoBau(j) {
  const e = bau.espacos[j];
  if (!e) return;
  const guardou = guardarNaMochila(e.id, e.qtd);
  e.qtd -= guardou;
  if (e.qtd <= 0) bau.espacos[j] = null;
  else mostrarMensagem('Sua mochila está cheia.');
}

// Arrastou do equipamento direto pro baú
function equipParaBau(espaco, j) {
  const e = jogador.equip[espaco];
  if (!e) return;
  if (bau.espacos[j]) { mostrarMensagem('Solte num espaço vazio do baú.'); return; }
  bau.espacos[j] = { id: e.id, qtd: e.qtd };
  jogador.equip[espaco] = null;
}

// ---------- Comprar espaço ----------

function precoProximosEspacos() {
  const comprados = (bau.espacos.length - CONFIG.BAU_INICIAL) / CONFIG.BAU_PACOTE;
  return CONFIG.BAU_PRECO_BASE * (comprados + 1);
}

function comprarEspacosBau() {
  if (bau.espacos.length >= CONFIG.BAU_MAXIMO) { mostrarMensagem('Seu baú já está no tamanho máximo.'); return; }
  const preco = precoProximosEspacos();
  if (jogador.ouro < preco) { mostrarMensagem('Ouro insuficiente: custa ' + preco + '.'); return; }
  jogador.ouro -= preco;
  for (let k = 0; k < CONFIG.BAU_PACOTE; k++) bau.espacos.push(null);
  registrar('Você comprou mais ' + CONFIG.BAU_PACOTE + ' espaços no baú por ' + preco + ' de ouro.', 'loot');
  salvarJogo();
}

// ---------- Abrir e fechar ----------

function abrirBau(npc) {
  bauAberto = npc;
  npcPendente = null;
  limparAlvo();
  desenharBau();
}

function fecharBau() {
  if (bauAberto) salvarJogo(); // guarda o que mudou no baú na hora
  bauAberto = null;
  desenharBau();
}

// Chamado a cada quadro: fecha se você se afastar
function atualizarBau() {
  if (bauAberto && distancia(bauAberto, jogador) > CONFIG.ALCANCE_NPC + 1) fecharBau();
}

// ---------- Desenho (HTML) ----------

function configurarBau() {
  document.getElementById('btn-fechar-bau').addEventListener('click', fecharBau);
  document.getElementById('btn-comprar-bau').addEventListener('click', comprarEspacosBau);
}

function desenharBau() {
  const janela = document.getElementById('janela-bau');
  if (!bauAberto) { janela.classList.add('escondido'); return; }
  janela.classList.remove('escondido');

  const ocupados = bau.espacos.filter(e => e).length;
  document.getElementById('bau-info').textContent = ocupados + ' / ' + bau.espacos.length + ' espaços';

  const botao = document.getElementById('btn-comprar-bau');
  if (bau.espacos.length >= CONFIG.BAU_MAXIMO) {
    botao.disabled = true;
    botao.textContent = 'Tamanho máximo';
  } else {
    botao.disabled = false;
    botao.innerHTML = '+' + CONFIG.BAU_PACOTE + ' espaços por ' + precoProximosEspacos() + ' ' + htmlIcone('ouro', 'icone-pequeno');
  }

  const grade = document.getElementById('grade-bau');
  grade.innerHTML = '';
  bau.espacos.forEach((e, j) => {
    const el = document.createElement('button');
    el.className = 'espaco';
    el.dataset.origem = 'bau';
    el.dataset.destino = 'bau';
    el.dataset.indice = j;
    preencherEspaco(el, e);
    el.addEventListener('click', () => retirarDoBau(j));
    grade.appendChild(el);
  });
}
