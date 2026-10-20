// =====================================================
// npcs.js — Os moradores da vila
// Cada NPC fica atrás do balcão da sua loja.
//   vende:  itens que você pode comprar dele
//   compra: itens que ele aceita comprar de você
// =====================================================

const npcs = [];

// Listas montadas a partir do catálogo de itens (itens.js):
// assim, um item novo com "preco" já aparece na loja certa sozinho.
function itensOnde(filtro) {
  return Object.keys(ITENS).filter(id => filtro(ITENS[id]));
}

function criarNpcs() {
  const p = mapa.pontos;
  const ehArma = it => it.tipo === 'arma' || it.tipo === 'municao';
  const ehRoupa = it => ['capacete', 'armadura', 'calca', 'botas'].includes(it.tipo);

  npcs.push({
    nome: 'Mirela', titulo: 'Alquimista',
    ...p.pocoes.npc, atendimento: p.pocoes.atendimento,
    sprite: 'npc_mirela',
    saudacao: 'Olá, aventureiro! Minhas poções já salvaram muita gente.',
    vende: ['pocao', 'pocao_grande'],
    compra: [],
  });

  npcs.push({
    nome: 'Bruno', titulo: 'Ferreiro',
    ...p.armas.npc, atendimento: p.armas.atendimento,
    sprite: 'npc_bruno',
    saudacao: 'Precisa de aço? Também compro armas, presas e garras.',
    vende: itensOnde(it => ehArma(it) && it.preco),
    compra: itensOnde(it => (ehArma(it) && !it.infinita) || ['presa_lobo', 'garra_urso', 'presa_tigre'].includes(it.id)),
  });

  npcs.push({
    nome: 'Helga', titulo: 'Coureira',
    ...p.armaduras.npc, atendimento: p.armaduras.atendimento,
    sprite: 'npc_helga',
    saudacao: 'Armaduras sob medida! Pago bem por peles.',
    vende: itensOnde(it => ehRoupa(it) && it.preco),
    compra: itensOnde(it => ehRoupa(it) || ['rabo_rato', 'pele_cobra', 'pele_lobo', 'pele_urso', 'pele_tigre'].includes(it.id)),
  });
}

function npcEm(x, y) {
  return npcs.find(n => n.x === x && n.y === y) || null;
}
