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
    saudacao: 'Olá, aventureiro! Minhas poções já salvaram muita gente.',
    cores: { tunica: '#6a3d8f', calca: '#3a2450', cabelo: '#c23b22', chapeu: '#4a2a66' },
    vende: ['pocao', 'pocao_grande'],
    compra: [],
  });

  npcs.push({
    nome: 'Bruno', titulo: 'Ferreiro',
    ...p.armas.npc, atendimento: p.armas.atendimento,
    saudacao: 'Precisa de aço? Também compro armas, presas e garras.',
    cores: { tunica: '#5a5a5a', calca: '#2e2e2e', cabelo: '#222222', avental: '#6b4a2a' },
    vende: itensOnde(it => ehArma(it) && it.preco),
    compra: itensOnde(it => ehArma(it) || ['presa_lobo', 'garra_urso', 'presa_tigre'].includes(it.id)),
  });

  npcs.push({
    nome: 'Helga', titulo: 'Coureira',
    ...p.armaduras.npc, atendimento: p.armaduras.atendimento,
    saudacao: 'Armaduras sob medida! Pago bem por peles.',
    cores: { tunica: '#2f6b4a', calca: '#5a3c20', cabelo: '#e8c66a' },
    vende: itensOnde(it => ehRoupa(it) && it.preco),
    compra: itensOnde(it => ehRoupa(it) || ['rabo_rato', 'pele_cobra', 'pele_lobo', 'pele_urso', 'pele_tigre'].includes(it.id)),
  });
}

function npcEm(x, y) {
  return npcs.find(n => n.x === x && n.y === y) || null;
}
