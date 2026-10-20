// =====================================================
// arrastar.js — Arrastar e soltar itens
//
// Usa "pointer events" (funcionam com mouse E com toque no celular).
// Qualquer elemento com data-origem pode ser arrastado;
// qualquer elemento com data-destino pode receber.
//   data-origem / data-destino: 'mochila' | 'equip' | 'barra' | 'corpo'
//   data-indice: posição na mochila/barra/corpo
//   data-espaco: espaço de equipamento ('arma', 'capacete'...)
// =====================================================

const arrasto = {
  origem: null,     // elemento onde começou
  inicioX: 0, inicioY: 0,
  ativo: false,     // só vira "arrasto" depois de mexer alguns pixels
  fantasma: null,   // ícone que segue o ponteiro
  ignorarClique: false,
};

function configurarArrastar() {
  document.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return; // só botão esquerdo
    const el = ev.target.closest('[data-origem]');
    if (!el || el.classList.contains('vazio')) return;
    arrasto.origem = el;
    arrasto.inicioX = ev.clientX;
    arrasto.inicioY = ev.clientY;
    arrasto.ativo = false;
  });

  document.addEventListener('pointermove', (ev) => {
    if (!arrasto.origem) return;
    if (!arrasto.ativo) {
      const andou = Math.hypot(ev.clientX - arrasto.inicioX, ev.clientY - arrasto.inicioY);
      if (andou < 6) return; // mexeu pouco: ainda pode ser um clique
      comecarArrasto();
    }
    moverFantasma(ev.clientX, ev.clientY);
  });

  document.addEventListener('pointerup', (ev) => {
    if (!arrasto.origem) return;
    if (arrasto.ativo) {
      // Descobre o que está embaixo do ponteiro (escondendo o fantasma antes)
      arrasto.fantasma.style.display = 'none';
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY);
      const destino = alvo && alvo.closest('[data-destino]');
      soltar(arrasto.origem.dataset, destino ? destino.dataset : null);
      terminarArrasto();
      arrasto.ignorarClique = true; // o navegador dispara um "click" logo depois
    }
    arrasto.origem = null;
  });

  // Engole o clique que vem logo depois de um arrasto
  document.addEventListener('click', (ev) => {
    if (arrasto.ignorarClique) {
      ev.stopPropagation();
      ev.preventDefault();
      arrasto.ignorarClique = false;
    }
  }, true);
}

function comecarArrasto() {
  arrasto.ativo = true;
  const icone = arrasto.origem.querySelector('.icone');
  const f = document.createElement('div');
  f.className = 'fantasma';
  f.textContent = icone ? icone.textContent : '?';
  document.body.appendChild(f);
  arrasto.fantasma = f;
  document.body.classList.add('arrastando');
  arrasto.origem.classList.add('origem-arrasto');
}

function moverFantasma(x, y) {
  arrasto.fantasma.style.left = x + 'px';
  arrasto.fantasma.style.top = y + 'px';
}

function terminarArrasto() {
  arrasto.fantasma.remove();
  arrasto.fantasma = null;
  arrasto.ativo = false;
  document.body.classList.remove('arrastando');
  arrasto.origem.classList.remove('origem-arrasto');
}

// ---------- As regras: o que acontece em cada combinação ----------

function soltar(de, para) {
  const i = Number(de.indice);

  // Soltou fora de qualquer espaço
  if (!para) {
    if (de.origem === 'barra') limparBarra(i); // tirar atalho da barra
    return;
  }
  const j = Number(para.indice);

  if (de.origem === 'mochila') {
    const item = mochila.espacos[i];
    if (!item) return;
    if (para.destino === 'mochila') moverNaMochila(i, j);
    else if (para.destino === 'barra') colocarNaBarra(j, item.id);
    else if (para.destino === 'equip') {
      if (espacoDoItem(ITENS[item.id]) === para.espaco) equipar(i);
      else mostrarMensagem(ITENS[item.id].nome + ' não vai em ' + ESPACOS_EQUIP[para.espaco].nome.toLowerCase() + '.');
    }
  }

  else if (de.origem === 'equip') {
    if (para.destino === 'mochila') desequiparPara(de.espaco, j);
  }

  else if (de.origem === 'barra') {
    if (para.destino === 'barra') trocarNaBarra(i, j);
  }

  else if (de.origem === 'corpo') {
    if (para.destino === 'mochila' || para.destino === 'equip') pegarDoCorpo(i);
  }
}
