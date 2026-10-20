// =====================================================
// entrada.js — Teclado, mouse e toque
// =====================================================

const TECLAS = {
  ArrowUp: 'cima', w: 'cima', W: 'cima',
  ArrowDown: 'baixo', s: 'baixo', S: 'baixo',
  ArrowLeft: 'esquerda', a: 'esquerda', A: 'esquerda',
  ArrowRight: 'direita', d: 'direita', D: 'direita',
};

// Lista das direções seguradas; a última apertada vence
const direcoesApertadas = [];

function direcaoDoTeclado() {
  return direcoesApertadas.length ? direcoesApertadas[direcoesApertadas.length - 1] : null;
}

function configurarEntrada(canvas) {
  window.addEventListener('keydown', (e) => {
    // Digitando num campo (quantidade na loja)? Não mexe o boneco.
    if (e.target.tagName === 'INPUT') return;
    // Janela de confirmação aberta: Esc fecha, o resto fica parado
    if (modalAberto()) { if (e.key === 'Escape') fecharModal(); return; }

    // Barra de ação: teclas 1 a 8
    const numero = Number(e.key);
    if (numero >= 1 && numero <= CONFIG.ESPACOS_BARRA) { usarBarra(numero - 1, performance.now()); return; }

    // Teclas de ação
    if (e.key === ' ') { e.preventDefault(); mirarMaisProximo(); return; }
    if (e.key === 'Escape') { limparAlvo(); fecharCorpo(); fecharLoja(); return; }
    if (e.key === 'e' || e.key === 'E') { abrirCorpoProximo(); return; }
    if (e.key === 'h' || e.key === 'H') { usarCuraRapida(performance.now()); return; }

    // Movimento
    const dir = TECLAS[e.key];
    if (!dir) return;
    e.preventDefault(); // impede as setas de rolarem a página
    if (!direcoesApertadas.includes(dir)) direcoesApertadas.push(dir);
  });

  window.addEventListener('keyup', (e) => {
    const dir = TECLAS[e.key];
    if (!dir) return;
    const i = direcoesApertadas.indexOf(dir);
    if (i >= 0) direcoesApertadas.splice(i, 1);
  });

  // Se a janela perder o foco, solta tudo (senão o boneco anda sozinho)
  window.addEventListener('blur', () => { direcoesApertadas.length = 0; });

  // Clique ou toque: NPC = negociar; monstro = atacar; corpo = saquear; chão = andar
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    // O canvas pode estar esticado pelo CSS, então convertemos a escala
    const escala = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * escala;
    const py = (e.clientY - rect.top) * escala;
    const tile = pixelParaTile(px, py);

    const npc = npcEm(tile.x, tile.y);
    const m = monstroEm(tile.x, tile.y);
    const corpo = corpoEm(tile.x, tile.y);
    if (npc) clicarNoNpc(npc);
    else if (m) definirAlvo(m);
    else if (corpo) clicarNoCorpo(corpo);
    else irAte(tile.x, tile.y);
  });
}
