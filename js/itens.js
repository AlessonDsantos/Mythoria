// =====================================================
// itens.js — Catálogo de todos os itens do jogo
//
// Campos comuns:
//   nome, icone (emoji), descricao
//   tipo:    'consumivel' | 'material' | 'arma' | 'municao' |
//            'capacete' | 'armadura' | 'calca' | 'botas'
//   preco:   quanto custa comprar do NPC (sem preco = NPC não vende)
//   valor:   quanto o NPC paga quando você vende
//   empilha: vários iguais ocupam um espaço só
//
// Armas:     skill ('melee' ou 'distance'), ataque, acerto (0 a 1),
//            alcance (1 = corpo a corpo), categoria (usada no desenho)
//            arremesso: true → é arremessada (shuriken, lança)
//            quebraEntre: [3, 10] → cada unidade quebra depois de 3 a 10 ataques
//            municao: 'flecha' → precisa de flechas equipadas (arco)
// Munição:   municaoDe ('flecha'), ataque (somado ao do arco)
// Armaduras: defesa (reduz o dano que você leva), cor (no desenho)
// =====================================================

const ITENS = {
  // ---------- Consumíveis ----------
  queijo:       { nome: 'Queijo', icone: '🧀', tipo: 'consumivel', cura: 15, valor: 2, empilha: true,
                  descricao: 'Recupera 15 de vida.' },
  carne:        { nome: 'Carne', icone: '🍖', tipo: 'consumivel', cura: 30, valor: 4, empilha: true,
                  descricao: 'Recupera 30 de vida.' },
  pocao:        { nome: 'Poção de vida', icone: '🧪', tipo: 'consumivel', cura: 60, preco: 40, valor: 10, empilha: true,
                  descricao: 'Recupera 60 de vida.' },
  pocao_grande: { nome: 'Poção grande', icone: '⚗️', tipo: 'consumivel', cura: 130, preco: 100, valor: 25, empilha: true,
                  descricao: 'Recupera 130 de vida.' },

  // ---------- Materiais (vendem nos NPCs) ----------
  rabo_rato:   { nome: 'Rabo de rato', icone: '🐀', tipo: 'material', valor: 1, empilha: true,
                 descricao: 'Nojento, mas a coureira compra.' },
  pele_cobra:  { nome: 'Pele de cobra', icone: '🐍', tipo: 'material', valor: 6, empilha: true,
                 descricao: 'Escamas resistentes.' },
  presa_lobo:  { nome: 'Presa de lobo', icone: '🦷', tipo: 'material', valor: 8, empilha: true,
                 descricao: 'Afiada como uma adaga.' },
  pele_lobo:   { nome: 'Pele de lobo', icone: '🐺', tipo: 'material', valor: 12, empilha: true,
                 descricao: 'Quente e macia.' },
  garra_urso:  { nome: 'Garra de urso', icone: '🐾', tipo: 'material', valor: 18, empilha: true,
                 descricao: 'Grande e curvada.' },
  pele_urso:   { nome: 'Pele de urso', icone: '🐻', tipo: 'material', valor: 30, empilha: true,
                 descricao: 'Pesada e muito valiosa.' },
  presa_tigre: { nome: 'Presa de tigre', icone: '🦴', tipo: 'material', valor: 22, empilha: true,
                 descricao: 'Um troféu de caçador.' },
  pele_tigre:  { nome: 'Pele de tigre', icone: '🐯', tipo: 'material', valor: 40, empilha: true,
                 descricao: 'Listrada e raríssima.' },

  // ---------- Armas de melee ----------
  // Espadas: equilibradas | Machados: fortes, erram mais | Clavas: fracas, quase não erram
  espada_curta:   { nome: 'Espada curta', icone: '🗡️', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 10, acerto: 0.85, alcance: 1, preco: 60, valor: 20, cor: '#c9ced6' },
  espada:         { nome: 'Espada', icone: '🗡️', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 16, acerto: 0.85, alcance: 1, preco: 250, valor: 80, cor: '#dfe3ea' },
  espada_longa:   { nome: 'Espada longa', icone: '⚔️', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 22, acerto: 0.85, alcance: 1, preco: 700, valor: 220, cor: '#f2f4f8' },
  machado_mao:    { nome: 'Machadinha', icone: '🪓', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 12, acerto: 0.75, alcance: 1, preco: 60, valor: 20, cor: '#b9bec6' },
  machado:        { nome: 'Machado', icone: '🪓', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 19, acerto: 0.75, alcance: 1, preco: 260, valor: 85, cor: '#d0d5dd' },
  machado_guerra: { nome: 'Machado de guerra', icone: '🪓', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 26, acerto: 0.75, alcance: 1, preco: 750, valor: 240, cor: '#eef0f4' },
  clava:          { nome: 'Clava', icone: '🏏', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 9, acerto: 0.95, alcance: 1, preco: 40, valor: 12, cor: '#8a5a2b' },
  maca:           { nome: 'Maça', icone: '🔨', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 15, acerto: 0.95, alcance: 1, preco: 240, valor: 75, cor: '#9aa0a8' },
  martelo_guerra: { nome: 'Martelo de guerra', icone: '🔨', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 21, acerto: 0.95, alcance: 1, preco: 680, valor: 210, cor: '#c0c5cc' },

  // ---------- Armas de distância ----------
  shuriken: { nome: 'Shuriken', icone: '✴️', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 13, acerto: 0.85, alcance: 4, arremesso: true, quebraEntre: [3, 10], preco: 3, valor: 1, empilha: true,
              descricao: 'Estrela de arremesso. Cada uma quebra depois de 3 a 10 ataques.' },
  lanca:    { nome: 'Lança', icone: '🔱', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 20, acerto: 0.75, alcance: 3, arremesso: true, quebraEntre: [3, 10], preco: 8, valor: 3, empilha: true,
              descricao: 'Forte, mas alcança menos. Cada uma quebra depois de 3 a 10 ataques.' },
  arco:     { nome: 'Arco', icone: '🏹', tipo: 'arma', categoria: 'arco', skill: 'distance',
              ataque: 0, acerto: 0.90, alcance: 5, municao: 'flecha', preco: 300, valor: 90,
              descricao: 'Alcança longe. Precisa de flechas no espaço de munição.' },

  // ---------- Munição ----------
  flecha:       { nome: 'Flecha', icone: '➶', tipo: 'municao', municaoDe: 'flecha', ataque: 12,
                  preco: 2, valor: 1, empilha: true, descricao: 'Munição para arco.' },
  flecha_ferro: { nome: 'Flecha de ferro', icone: '➶', tipo: 'municao', municaoDe: 'flecha', ataque: 18,
                  preco: 5, valor: 2, empilha: true, descricao: 'Ponta de ferro: mais dano.' },

  // ---------- Capacetes ----------
  capuz_couro:    { nome: 'Capuz de couro', icone: '🎓', tipo: 'capacete', defesa: 1, preco: 30, valor: 10, cor: '#7a5230' },
  capacete_ferro: { nome: 'Capacete de ferro', icone: '⛑️', tipo: 'capacete', defesa: 3, preco: 180, valor: 60, cor: '#a9afb8' },

  // ---------- Armaduras ----------
  armadura_couro:  { nome: 'Armadura de couro', icone: '🦺', tipo: 'armadura', defesa: 3, preco: 80, valor: 25, cor: '#8a5a2b' },
  cota_malha:      { nome: 'Cota de malha', icone: '🥋', tipo: 'armadura', defesa: 6, preco: 400, valor: 130, cor: '#8f959e' },
  armadura_placas: { nome: 'Armadura de placas', icone: '🛡️', tipo: 'armadura', defesa: 9, preco: 1200, valor: 380, cor: '#c8ced6' },

  // ---------- Calças ----------
  calca_couro: { nome: 'Calça de couro', icone: '👖', tipo: 'calca', defesa: 1, preco: 40, valor: 12, cor: '#6b4a2a' },
  calca_malha: { nome: 'Calça de malha', icone: '👖', tipo: 'calca', defesa: 3, preco: 250, valor: 80, cor: '#80868f' },

  // ---------- Botas ----------
  botas_couro: { nome: 'Botas de couro', icone: '🥾', tipo: 'botas', defesa: 1, preco: 30, valor: 10, cor: '#4a3020' },
  botas_ferro: { nome: 'Botas de ferro', icone: '👢', tipo: 'botas', defesa: 2, preco: 200, valor: 60, cor: '#8f959e' },
};

// Ouro é especial: aparece no corpo, mas ao pegar vai direto
// para a bolsa de moedas e não ocupa espaço na mochila.
const ITEM_OURO = 'ouro';
ITENS[ITEM_OURO] = { nome: 'Moedas de ouro', icone: '💰', tipo: 'ouro', valor: 1, empilha: true, descricao: 'Dinheiro.' };

// Cada item guarda o próprio nome-chave (ITENS.queijo.id === 'queijo')
for (const id in ITENS) ITENS[id].id = id;

// Espaços de equipamento e qual tipo de item vai em cada um
const ESPACOS_EQUIP = {
  capacete: { nome: 'Cabeça' },
  armadura: { nome: 'Corpo' },
  calca:    { nome: 'Pernas' },
  botas:    { nome: 'Pés' },
  arma:     { nome: 'Arma' },
  municao:  { nome: 'Munição' },
};

function espacoDoItem(item) {
  return ESPACOS_EQUIP[item.tipo] ? item.tipo : null;
}

// Monta a descrição automaticamente a partir dos números do item
function descreverItem(id) {
  const it = ITENS[id];
  const partes = [];
  if (it.tipo === 'arma') {
    partes.push('Ataque ' + it.ataque + (it.municao ? ' + flecha' : ''));
    partes.push('acerto ' + Math.round(it.acerto * 100) + '%');
    if (it.alcance > 1) partes.push('alcance ' + it.alcance);
    partes.push('skill ' + SKILLS[it.skill].nome);
  }
  if (it.tipo === 'municao') partes.push('Ataque +' + it.ataque);
  if (it.defesa) partes.push('Defesa ' + it.defesa);
  let texto = partes.length ? partes.join(', ') + '.' : '';
  if (it.descricao) texto += (texto ? ' ' : '') + it.descricao;
  return texto;
}

// Nome com quantidade, para as mensagens ("3 queijos")
function nomeComQuantidade(id, qtd) {
  const nome = ITENS[id].nome.toLowerCase();
  if (qtd === 1) return '1 ' + nome;
  if (id === ITEM_OURO) return qtd + ' moedas de ouro';
  // pluraliza só a primeira palavra: "pele de lobo" → "peles de lobo"
  const partes = nome.split(' ');
  const p = partes[0];
  if (p.endsWith('ão')) partes[0] = p.slice(0, -2) + 'ões';
  else if (/[aeiou]$/.test(p)) partes[0] = p + 's';
  else if (!p.endsWith('s')) partes[0] = p + 'es';
  return qtd + ' ' + partes.join(' ');
}
