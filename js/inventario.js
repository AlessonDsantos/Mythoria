// =====================================================
// inventario.js — Mochila, equipamento e janela do corpo
//
// A mochila é uma lista de "espaços". Cada espaço é
// null (vazio) ou { id: 'queijo', qtd: 3 }.
// O corpo de um monstro e o equipamento usam o mesmo formato.
// =====================================================

const mochila = {
  espacos: new Array(CONFIG.ESPACOS_MOCHILA).fill(null),
  selecionado: -1,     // índice do espaço clicado (-1 = nenhum)
};

let corpoAberto = null;   // corpo cuja janela está aberta
let corpoPendente = null; // corpo que o jogador está indo abrir
let proximoUso = 0;       // evita usar 10 itens no mesmo segundo

// ---------- Mochila: guardar, contar e tirar ----------

// Quantos desse item ainda cabem na mochila
function quantoCabe(id) {
  const item = ITENS[id];
  let cabe = 0;
  for (const e of mochila.espacos) {
    if (e === null) cabe += item.empilha ? CONFIG.MAX_PILHA : 1;
    else if (item.empilha && e.id === id) cabe += CONFIG.MAX_PILHA - e.qtd;
  }
  return cabe;
}

// Tenta guardar. Devolve quantos couberam (pode ser menos que qtd).
function guardarNaMochila(id, qtd) {
  if (id === ITEM_OURO) { jogador.ouro += qtd; return qtd; }

  let restante = qtd;
  const item = ITENS[id];

  // 1) Completa pilhas que já existem
  if (item.empilha) {
    for (const e of mochila.espacos) {
      if (restante === 0) break;
      if (e && e.id === id && e.qtd < CONFIG.MAX_PILHA) {
        const cabe = Math.min(restante, CONFIG.MAX_PILHA - e.qtd);
        e.qtd += cabe;
        restante -= cabe;
      }
    }
  }

  // 2) Usa espaços vazios
  for (let i = 0; i < mochila.espacos.length && restante > 0; i++) {
    if (mochila.espacos[i] === null) {
      const cabe = item.empilha ? Math.min(restante, CONFIG.MAX_PILHA) : 1;
      mochila.espacos[i] = { id, qtd: cabe };
      restante -= cabe;
    }
  }

  return qtd - restante;
}

function contarNaMochila(id) {
  return mochila.espacos.reduce((soma, e) => soma + (e && e.id === id ? e.qtd : 0), 0);
}

function tirarDoEspaco(indice, qtd) {
  const e = mochila.espacos[indice];
  if (!e) return;
  e.qtd -= qtd;
  if (e.qtd <= 0) {
    mochila.espacos[indice] = null;
    if (mochila.selecionado === indice) mochila.selecionado = -1;
  }
}

// Tira qtd de um item, de quantos espaços precisar (usado na venda)
function removerDaMochila(id, qtd) {
  for (let i = mochila.espacos.length - 1; i >= 0 && qtd > 0; i--) {
    const e = mochila.espacos[i];
    if (e && e.id === id) {
      const tira = Math.min(qtd, e.qtd);
      tirarDoEspaco(i, tira);
      qtd -= tira;
    }
  }
}

// ---------- Mochila: usar e jogar fora ----------

function usarItem(indice, agora) {
  const e = mochila.espacos[indice];
  if (!e) return;
  const item = ITENS[e.id];

  if (!item.cura && !item.mana && !item.fome) {
    mostrarMensagem(item.nome + ': ' + descreverItem(e.id));
    return;
  }
  if (agora < proximoUso) return;

  if (item.fome) {
    // Comida: não cura na hora, só mata a fome
    if (comer(item, agora)) { tirarDoEspaco(indice, 1); proximoUso = agora + CONFIG.INTERVALO_USO; }
    return;
  }

  if (item.mana) {
    // Poção de mana
    if (jogador.mana >= jogador.manaMax) { mostrarMensagem('Sua mana já está cheia.'); return; }
    const antes = jogador.mana;
    jogador.mana = Math.min(jogador.manaMax, jogador.mana + item.mana);
    adicionarTexto(jogador.x, jogador.y, '+' + (jogador.mana - antes), '#7aa8ff', agora);
  } else {
    if (jogador.vida >= jogador.vidaMax) { mostrarMensagem('Sua vida já está cheia.'); return; }
    const antes = jogador.vida;
    jogador.vida = Math.min(jogador.vidaMax, jogador.vida + item.cura);
    adicionarTexto(jogador.x, jogador.y, '+' + (jogador.vida - antes), '#5ce65c', agora);
  }
  tirarDoEspaco(indice, 1);
  proximoUso = agora + CONFIG.INTERVALO_USO;
}

function jogarFora(indice) {
  const e = mochila.espacos[indice];
  if (!e) return;
  registrar('Você jogou fora ' + nomeComQuantidade(e.id, e.qtd) + '.', 'info');
  mochila.espacos[indice] = null;
  mochila.selecionado = -1;
}

// Usa o item de cura mais fraco que tiver (tecla H)
function usarCuraRapida(agora) {
  let melhor = -1;
  mochila.espacos.forEach((e, i) => {
    if (!e || !ITENS[e.id].cura) return;
    if (melhor === -1 || ITENS[e.id].cura < ITENS[mochila.espacos[melhor].id].cura) melhor = i;
  });
  if (melhor === -1) mostrarMensagem('Você não tem nada para se curar.');
  else usarItem(melhor, agora);
}

// ---------- Equipamento ----------

// Veste o item da mochila. O que estava no lugar volta pra mochila.
function equipar(indice) {
  const e = mochila.espacos[indice];
  if (!e) return;
  const item = ITENS[e.id];
  const espaco = espacoDoItem(item);
  if (!espaco) { mostrarMensagem('Isso não dá pra equipar.'); return; }

  const atual = jogador.equip[espaco];

  // Mesmo item empilhável (ex.: mais flechas): junta na pilha equipada
  if (atual && atual.id === e.id && item.empilha) {
    const cabe = Math.min(e.qtd, CONFIG.MAX_PILHA - atual.qtd);
    atual.qtd += cabe;
    tirarDoEspaco(indice, cabe);
    return;
  }

  // Troca: o item vai pro corpo, o antigo ocupa o lugar dele na mochila
  jogador.equip[espaco] = e;
  mochila.espacos[indice] = atual;
  mochila.selecionado = -1;
  registrar('Você equipou: ' + item.nome + '.', 'info');
  avisarCombinacao(item);
}

// Dicas para quem equipa arco sem flecha ou flecha sem arco
function avisarCombinacao(item) {
  if (item.municao && !municaoParaArma(item)) mostrarMensagem('Agora equipe flechas para atirar.');
  if (item.tipo === 'municao' && !armaAtual().municao) mostrarMensagem('Flechas só servem com um arco equipado.');
}

// Arrastar dentro da mochila: junta pilhas iguais ou troca de lugar
function moverNaMochila(de, para) {
  if (de === para) return;
  const a = mochila.espacos[de];
  const b = mochila.espacos[para];
  if (a && b && a.id === b.id && ITENS[a.id].empilha) {
    const cabe = Math.min(a.qtd, CONFIG.MAX_PILHA - b.qtd);
    b.qtd += cabe;
    tirarDoEspaco(de, cabe);
  } else {
    mochila.espacos[para] = a;
    mochila.espacos[de] = b;
  }
  mochila.selecionado = -1;
}

// Arrastar do equipamento para um espaço específico da mochila
function desequiparPara(espaco, indice) {
  const e = jogador.equip[espaco];
  if (!e) return;
  const alvo = mochila.espacos[indice];
  if (alvo === null) {
    mochila.espacos[indice] = { id: e.id, qtd: e.qtd };
    jogador.equip[espaco] = null;
  } else if (espacoDoItem(ITENS[alvo.id]) === espaco) {
    equipar(indice);           // soltou em cima de um item do mesmo tipo: troca
  } else {
    desequipar(espaco);        // espaço ocupado por outra coisa: guarda onde couber
  }
}

function desequipar(espaco) {
  const e = jogador.equip[espaco];
  if (!e) return;
  const guardou = guardarNaMochila(e.id, e.qtd);
  e.qtd -= guardou;
  if (e.qtd <= 0) jogador.equip[espaco] = null;
  else mostrarMensagem('Sua mochila está cheia.');
}

// ---------- Corpos ----------

// Corpo mais recente naquele quadrado (pode ter vários empilhados)
function corpoEm(x, y) {
  for (let i = monstros.length - 1; i >= 0; i--) {
    const m = monstros[i];
    if (m.morto && m.x === x && m.y === y) return m;
  }
  return null;
}

function corpoVazio(m) {
  return m.loot.every(e => e === null);
}

// Clique num corpo: abre se estiver perto, senão vai até ele
function clicarNoCorpo(m) {
  if (distancia(m, jogador) <= 1) { abrirCorpo(m); return; }
  irAte(m.x, m.y);
  corpoPendente = m;
}

function abrirCorpo(m) {
  corpoAberto = m;
  corpoPendente = null;
  desenharJanelaCorpo();
}

function fecharCorpo() {
  corpoAberto = null;
  desenharJanelaCorpo();
}

// Abre o corpo com loot que esteja colado no jogador (tecla E)
function abrirCorpoProximo() {
  const achou = monstros.find(m => m.morto && distancia(m, jogador) <= 1 && !corpoVazio(m));
  if (achou) abrirCorpo(achou);
  else mostrarMensagem('Nenhum corpo com loot do seu lado.');
}

function pegarDoCorpo(indice) {
  const m = corpoAberto;
  if (!m) return;
  const e = m.loot[indice];
  if (!e) return;

  const guardou = guardarNaMochila(e.id, e.qtd);
  if (guardou > 0) registrar('Você pegou ' + nomeComQuantidade(e.id, guardou) + '.', 'loot');
  e.qtd -= guardou;
  if (e.qtd <= 0) m.loot[indice] = null;
  else mostrarMensagem('Sua mochila está cheia.');

  desenharJanelaCorpo();
}

function pegarTudo() {
  if (!corpoAberto) return;
  corpoAberto.loot.forEach((e, i) => { if (e) pegarDoCorpo(i); });
}

// Chamado a cada quadro: abre o corpo ao chegar, fecha se afastar
function atualizarCorpos(agora) {
  if (corpoPendente) {
    if (corpoPendente.removido) corpoPendente = null;
    else if (!estaAndando(agora) && distancia(corpoPendente, jogador) <= 1) abrirCorpo(corpoPendente);
    else if (jogador.caminho.length === 0 && !estaAndando(agora)) corpoPendente = null;
  }
  if (corpoAberto && (corpoAberto.removido || distancia(corpoAberto, jogador) > 1)) fecharCorpo();
}
