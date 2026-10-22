// =====================================================
// barra.js — Barra de ação (teclas 1 a 9)
//
// Cada espaço guarda uma REFERÊNCIA, não o item em si:
//   { tipo: 'item', id: 'pocao' }     → usa a primeira poção da mochila
//   { tipo: 'magia', id: 'vita_lux' } → lança a magia
// =====================================================

const barraAcao = new Array(CONFIG.ESPACOS_BARRA).fill(null);

// Barra padrão: as magias da classe na ordem (curas primeiro, depois por level),
// e nos dois últimos espaços a poção de vida e a de mana.
// As magias que ainda não liberaram ficam lá, apagadas, esperando o level.
const VERSAO_BARRA = 2; // personagens salvos com barra mais antiga recebem a padrão uma vez
function montarBarraPadrao() {
  barraAcao.fill(null);
  const ids = magiasDaClasse().sort((a, b) => MAGIAS[a].level - MAGIAS[b].level);
  const vagas = CONFIG.ESPACOS_BARRA - 2;
  ids.slice(0, vagas).forEach((id, i) => { barraAcao[i] = { tipo: 'magia', id }; });
  barraAcao[CONFIG.ESPACOS_BARRA - 2] = { tipo: 'item', id: 'pocao' };
  barraAcao[CONFIG.ESPACOS_BARRA - 1] = { tipo: 'item', id: 'pocao_mana' };
}

function usarBarra(indice, agora) {
  const atalho = barraAcao[indice];
  if (!atalho) return;

  if (atalho.tipo === 'item') {
    const i = mochila.espacos.findIndex(e => e && e.id === atalho.id);
    if (i === -1) { mostrarMensagem('Você não tem mais ' + ITENS[atalho.id].nome.toLowerCase() + '.'); return; }
    usarItem(i, agora);
  } else if (atalho.tipo === 'magia') {
    lancarMagia(atalho.id, agora);
  }
}

// Arrastou um item da mochila para a barra
function colocarNaBarra(indice, idItem) {
  const item = ITENS[idItem];
  if (!item.cura && !item.mana && !item.fome) {
    mostrarMensagem('Na barra só vão comidas, poções e magias.');
    return;
  }
  barraAcao[indice] = { tipo: 'item', id: idItem };
}

// Arrastou uma magia do painel de magias para a barra
function colocarMagiaNaBarra(indice, idMagia) {
  if (!magiaAprendida(idMagia)) { mostrarMensagem('Você ainda não aprendeu ' + MAGIAS[idMagia].nome + '.'); return; }
  barraAcao[indice] = { tipo: 'magia', id: idMagia };
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

function atualizarBarra(agora) {
  // Redesenha quando muda o atalho, a quantidade, a espera ou se dá pra pagar a mana
  const assinatura = barraAcao.map(a => {
    if (!a) return '-';
    if (a.tipo === 'magia') return a.id + ':' + Math.ceil(esperaRestante(a.id, agora) / 1000) + ':' + (jogador.mana >= MAGIAS[a.id].mana) + ':' + magiaAprendida(a.id);
    return a.id + ':' + contarNaMochila(a.id);
  }).join('|');
  if (assinatura === assinaturaBarra) return;
  assinaturaBarra = assinatura;

  document.querySelectorAll('#barra-acao .espaco-barra').forEach((el, i) => {
    const a = barraAcao[i];
    const tecla = '<span class="tecla">' + (i + 1) + '</span>';
    el.classList.remove('esgotado', 'esperando');
    if (!a) {
      el.classList.add('vazio');
      el.innerHTML = tecla;
      el.title = 'Arraste uma comida, poção ou magia para cá';
      delete el.dataset.dica;
      return;
    }
    el.classList.remove('vazio');
    if (a.tipo === 'magia') {
      const m = MAGIAS[a.id];
      const falta = esperaRestante(a.id, agora);
      el.classList.toggle('esgotado', jogador.mana < m.mana || !magiaAprendida(a.id));
      el.classList.toggle('esperando', falta > 0);
      el.innerHTML = tecla + htmlIcone('magia_' + a.id) +
        (falta > 0 ? '<span class="espera">' + Math.ceil(falta / 1000) + '</span>' : '');
      el.removeAttribute('title'); el.dataset.dica = 'magia:' + a.id;
      return;
    }
    const qtd = contarNaMochila(a.id);
    el.classList.toggle('esgotado', qtd === 0);
    el.innerHTML = tecla + htmlIcone(a.id) + '<span class="qtd">' + qtd + '</span>';
    el.removeAttribute('title'); el.dataset.dica = 'item:' + a.id;
  });
}
