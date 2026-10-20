// =====================================================
// npcs.js — Os moradores da vila
// A POSIÇÃO de cada NPC vem do mapa (pontos "npc" no Tiled, com a
// propriedade "loja"). Aqui fica quem ele é e o que vende/compra.
//   vende:  itens que você pode comprar dele
//   compra: itens que ele aceita comprar de você
// =====================================================

const npcs = [];

// Listas montadas a partir do catálogo de itens (itens.js):
// assim, um item novo com "preco" já aparece na loja certa sozinho.
function itensOnde(filtro) {
  return Object.keys(ITENS).filter(id => filtro(ITENS[id]));
}

const ehArma = it => it.tipo === 'arma' || it.tipo === 'municao';
const ehRoupa = it => ['capacete', 'armadura', 'calca', 'botas'].includes(it.tipo);

// Um tipo de NPC por loja (o nome da loja é a propriedade "loja" no Tiled)
const LOJAS = {
  pocoes: {
    nome: 'Mirela', titulo: 'Alquimista', sprite: 'npc_mirela',
    saudacao: 'Olá, aventureiro! Minhas poções já salvaram muita gente.',
    vende: () => ['pocao', 'pocao_grande'],
    compra: () => [],
  },
  armas: {
    nome: 'Bruno', titulo: 'Ferreiro', sprite: 'npc_bruno',
    saudacao: 'Precisa de aço? Também compro armas, presas e garras.',
    vende: () => itensOnde(it => ehArma(it) && it.preco),
    compra: () => itensOnde(it => (ehArma(it) && !it.infinita) || ['presa_lobo', 'garra_urso', 'presa_tigre'].includes(it.id)),
  },
  armaduras: {
    nome: 'Helga', titulo: 'Coureira', sprite: 'npc_helga',
    saudacao: 'Armaduras sob medida! Pago bem por peles.',
    vende: () => itensOnde(it => ehRoupa(it) && it.preco),
    compra: () => itensOnde(it => ehRoupa(it) || ['rabo_rato', 'pele_cobra', 'pele_lobo', 'pele_urso', 'pele_tigre'].includes(it.id)),
  },
};

// Onde o cliente fica: 2 quadrados na frente do NPC (do outro lado do balcão)
// Preferimos o lado em que o meio do caminho é o balcão (senão poderia ser atrás da parede).
function lugarDeAtendimento(p) {
  const lados = [[0, 2], [0, -2], [2, 0], [-2, 0]];
  for (const [dx, dy] of lados) {
    const x = p.x + dx, y = p.y + dy;
    if (pegarTerreno(p.x + dx / 2, p.y + dy / 2) === 'balcao' && ehPassavel(x, y)) return { x, y };
  }
  for (const [dx, dy] of [...lados, [0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const x = p.x + dx, y = p.y + dy;
    if (ehPassavel(x, y)) return { x, y };
  }
  return { x: p.x, y: p.y + 1 };
}

function criarNpcs() {
  for (const p of mapa.pontos.npcs) {
    const loja = LOJAS[p.loja];
    if (!loja) { console.warn('NPC com loja desconhecida no mapa:', p.loja); continue; }
    npcs.push({
      nome: loja.nome, titulo: loja.titulo, sprite: loja.sprite, saudacao: loja.saudacao,
      x: p.x, y: p.y, atendimento: lugarDeAtendimento(p),
      vende: loja.vende(), compra: loja.compra(),
    });
  }
}

function npcEm(x, y) {
  return npcs.find(n => n.x === x && n.y === y) || null;
}
