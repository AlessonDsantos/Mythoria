// =====================================================
// barra.js — Barra de ação (teclas 1 a 8)
//
// Cada espaço guarda uma REFERÊNCIA, não o item em si:
//   { tipo: 'item', id: 'pocao' } → usa a primeira poção da mochila
// No futuro: { tipo: 'magia', id: 'cura_leve' }
// =====================================================

const barraAcao = new Array(CONFIG.ESPACOS_BARRA).fill(null);

function usarBarra(indice, agora) {
  const atalho = barraAcao[indice];
  if (!atalho) return;

  if (atalho.tipo === 'item') {
    const i = mochila.espacos.findIndex(e => e && e.id === atalho.id);
    if (i === -1) { mostrarMensagem('Você não tem mais ' + ITENS[atalho.id].nome.toLowerCase() + '.'); return; }
    usarItem(i, agora);
  }
  // tipo 'magia' entra aqui quando existirem magias
}

// Arrastou um item da mochila para a barra
function colocarNaBarra(indice, idItem) {
  const item = ITENS[idItem];
  if (!item.cura) {
    mostrarMensagem('Na barra só vão comidas e poções (magias no futuro).');
    return;
  }
  barraAcao[indice] = { tipo: 'item', id: idItem };
}

function trocarNaBarra(de, para) {
  [barraAcao[de], barraAcao[para]] = [barraAcao[para], barraAcao[de]];
}

function limparBarra(indice) {
  barraAcao[indice] = null;
}

// ---------- Desenho (HTML) ----------

let assinaturaBarra = '';

function configurarBarra() {
  const caixa = document.getElementById('barra-acao');
  caixa.innerHTML = '';
  for (let i = 0; i < CONFIG.ESPACOS_BARRA; i++) {
    const el = document.createElement('button');
    el.className = 'espaco espaco-barra';
    el.dataset.origem = 'barra';
    el.dataset.destino = 'barra';
    el.dataset.indice = i;
    el.addEventListener('click', () => usarBarra(i, performance.now()));
    el.addEventListener('contextmenu', (ev) => { ev.preventDefault(); limparBarra(i); });
    caixa.appendChild(el);
  }
}

function atualizarBarra() {
  // Redesenha só quando muda o atalho ou a quantidade na mochila
  const assinatura = barraAcao.map(a => a ? a.id + ':' + contarNaMochila(a.id) : '-').join('|');
  if (assinatura === assinaturaBarra) return;
  assinaturaBarra = assinatura;

  document.querySelectorAll('#barra-acao .espaco-barra').forEach((el, i) => {
    const a = barraAcao[i];
    const tecla = '<span class="tecla">' + (i + 1) + '</span>';
    if (!a) {
      el.classList.add('vazio');
      el.classList.remove('esgotado');
      el.innerHTML = tecla;
      el.title = 'Arraste uma comida ou poção para cá';
      return;
    }
    const qtd = contarNaMochila(a.id);
    el.classList.remove('vazio');
    el.classList.toggle('esgotado', qtd === 0);
    el.innerHTML = tecla + '<span class="icone">' + ITENS[a.id].icone + '</span><span class="qtd">' + qtd + '</span>';
    el.title = ITENS[a.id].nome + ' (tecla ' + (i + 1) + ') — botão direito remove';
  });
}
