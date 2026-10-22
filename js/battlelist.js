// =====================================================
// battlelist.js — Lista das criaturas que estão na tela
// Clique (botão esquerdo) numa linha para atacar. Clicar de
// novo na mesma criatura solta o alvo.
// =====================================================

let assinaturaBattle = '';

function configurarBattleList() {
  // Um único "ouvinte" na lista inteira, em vez de um por linha.
  // "pointerdown" (e não "click") porque a lista é redesenhada quando a vida
  // muda — um clique poderia começar numa linha e terminar numa linha nova.
  document.getElementById('battle-list').addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    const linha = ev.target.closest('[data-id-monstro]');
    if (!linha) return;
    const m = monstros.find(x => x.id === Number(linha.dataset.idMonstro));
    if (m && !m.morto) definirAlvo(m);
  });
}

// Criaturas vivas dentro da área visível, da mais perto para a mais longe
function criaturasNaTela() {
  const meiaL = Math.floor(CONFIG.VISAO_COLUNAS / 2);
  const meiaA = Math.floor(CONFIG.VISAO_LINHAS / 2);
  return monstros
    .filter(m => !m.morto && Math.abs(m.x - jogador.x) <= meiaL && Math.abs(m.y - jogador.y) <= meiaA)
    .sort((a, b) => distancia(a, jogador) - distancia(b, jogador));
}

function atualizarBattleList() {
  const lista = criaturasNaTela();

  // Só redesenha se mudou alguém, a vida de alguém ou o alvo
  const assinatura = lista.map(m => m.id + ':' + m.vida).join('|') + '#' + (jogador.alvo ? jogador.alvo.id : '');
  if (assinatura === assinaturaBattle) return;
  assinaturaBattle = assinatura;

  const caixa = document.getElementById('battle-list');
  if (lista.length === 0) {
    caixa.innerHTML = '<p class="vazio-txt">Nenhuma criatura por perto.</p>';
    return;
  }

  caixa.innerHTML = '';
  for (const m of lista) {
    const pct = Math.max(0, m.vida / m.vidaMax);
    const linha = document.createElement('button');
    linha.className = 'battle-linha' + (m === jogador.alvo ? ' alvo' : '');
    linha.dataset.idMonstro = m.id;
    linha.innerHTML =
      '<span class="battle-nome">' + TIPOS_MONSTRO[m.tipo].nome +
        '<small class="battle-vida">' + Math.max(0, m.vida) + ' / ' + m.vidaMax + '</small></span>' +
      '<span class="battle-barra"><span style="width:' + (pct * 100) + '%; background:' + corDaVida(pct) + '"></span></span>';
    caixa.appendChild(linha);
  }
}
