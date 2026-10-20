// =====================================================
// itens.js — Catálogo de todos os itens do jogo
//
// Campos comuns:
//   nome, descricao  (o ícone vem de img/itens.png — veja ORDEM_ICONES em sprites.js)
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
//            infinita: true → nunca quebra nem acaba
//            municao: 'flecha' → precisa de flechas equipadas (arco)
// Munição:   municaoDe ('flecha'), ataque (somado ao do arco)
// Armaduras: defesa (reduz o dano que você leva), cor (no desenho)
// =====================================================

const ITENS = {
  // ---------- Consumíveis ----------
  queijo:       { nome: 'Queijo', tipo: 'consumivel', cura: 15, valor: 2, empilha: true,
                  descricao: 'Recupera 15 de vida.' },
  carne:        { nome: 'Carne', tipo: 'consumivel', cura: 30, valor: 4, empilha: true,
                  descricao: 'Recupera 30 de vida.' },
  pocao:        { nome: 'Poção de vida', tipo: 'consumivel', cura: 60, preco: 40, valor: 10, empilha: true,
                  descricao: 'Recupera 60 de vida.' },
  pocao_grande: { nome: 'Poção grande', tipo: 'consumivel', cura: 130, preco: 100, valor: 25, empilha: true,
                  descricao: 'Recupera 130 de vida.' },

  // ---------- Materiais (vendem nos NPCs) ----------
  rabo_rato:   { nome: 'Rabo de rato', tipo: 'material', valor: 1, empilha: true,
                 descricao: 'Nojento, mas a coureira compra.' },
  pele_cobra:  { nome: 'Pele de cobra', tipo: 'material', valor: 6, empilha: true,
                 descricao: 'Escamas resistentes.' },
  presa_lobo:  { nome: 'Presa de lobo', tipo: 'material', valor: 8, empilha: true,
                 descricao: 'Afiada como uma adaga.' },
  pele_lobo:   { nome: 'Pele de lobo', tipo: 'material', valor: 12, empilha: true,
                 descricao: 'Quente e macia.' },
  garra_urso:  { nome: 'Garra de urso', tipo: 'material', valor: 18, empilha: true,
                 descricao: 'Grande e curvada.' },
  pele_urso:   { nome: 'Pele de urso', tipo: 'material', valor: 30, empilha: true,
                 descricao: 'Pesada e muito valiosa.' },
  presa_tigre: { nome: 'Presa de lobisomem', tipo: 'material', valor: 22, empilha: true,
                 descricao: 'Um troféu de caçador corajoso.' },
  pele_tigre:  { nome: 'Pele de lobisomem', tipo: 'material', valor: 40, empilha: true,
                 descricao: 'Pelagem escura e raríssima.' },

  // ---------- Armas de melee ----------
  // Espadas: equilibradas | Machados: fortes, erram mais | Clavas: fracas, quase não erram
  espada_curta:   { nome: 'Espada curta', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 10, acerto: 0.85, alcance: 1, preco: 60, valor: 20, cor: '#c9ced6' },
  espada:         { nome: 'Espada', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 16, acerto: 0.85, alcance: 1, preco: 250, valor: 80, cor: '#dfe3ea' },
  espada_longa:   { nome: 'Espada longa', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 22, acerto: 0.85, alcance: 1, preco: 700, valor: 220, cor: '#f2f4f8' },
  machado_mao:    { nome: 'Machadinha', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 12, acerto: 0.75, alcance: 1, preco: 60, valor: 20, cor: '#b9bec6' },
  machado:        { nome: 'Machado', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 19, acerto: 0.75, alcance: 1, preco: 260, valor: 85, cor: '#d0d5dd' },
  machado_guerra: { nome: 'Machado de guerra', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 26, acerto: 0.75, alcance: 1, preco: 750, valor: 240, cor: '#eef0f4' },
  clava:          { nome: 'Clava', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 9, acerto: 0.95, alcance: 1, preco: 40, valor: 12, cor: '#8a5a2b' },
  maca:           { nome: 'Maça', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 15, acerto: 0.95, alcance: 1, preco: 240, valor: 75, cor: '#9aa0a8' },
  martelo_guerra: { nome: 'Martelo de guerra', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 21, acerto: 0.95, alcance: 1, preco: 680, valor: 210, cor: '#c0c5cc' },

  // ---------- Armas de distância ----------
  shuriken: { nome: 'Shuriken', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 13, acerto: 0.85, alcance: 4, arremesso: true, quebraEntre: [3, 10], preco: 3, valor: 1, empilha: true,
              descricao: 'Estrela de arremesso. Cada uma quebra depois de 3 a 10 ataques.' },
  shuriken_aprendiz: { nome: 'Shuriken do aprendiz', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 10, acerto: 0.85, alcance: 4, arremesso: true, infinita: true, valor: 0,
              descricao: 'Presente para iniciantes. Mais fraca, mas nunca quebra.' },
  lanca:    { nome: 'Lança', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 20, acerto: 0.75, alcance: 3, arremesso: true, quebraEntre: [3, 10], preco: 8, valor: 3, empilha: true,
              descricao: 'Forte, mas alcança menos. Cada uma quebra depois de 3 a 10 ataques.' },
  arco:     { nome: 'Arco', tipo: 'arma', categoria: 'arco', skill: 'distance',
              ataque: 0, acerto: 0.90, alcance: 5, municao: 'flecha', preco: 300, valor: 90,
              descricao: 'Alcança longe. Precisa de flechas no espaço de munição.' },

  // ---------- Munição ----------
  flecha:       { nome: 'Flecha', tipo: 'municao', municaoDe: 'flecha', ataque: 12,
                  preco: 2, valor: 1, empilha: true, descricao: 'Munição para arco.' },
  flecha_ferro: { nome: 'Flecha de ferro', tipo: 'municao', municaoDe: 'flecha', ataque: 18,
                  preco: 5, valor: 2, empilha: true, descricao: 'Ponta de ferro: mais dano.' },

  // ---------- Capacetes ----------
  capuz_couro:    { nome: 'Capuz de couro', tipo: 'capacete', defesa: 1, preco: 30, valor: 10, cor: '#7a5230' },
  capacete_ferro: { nome: 'Capacete de ferro', tipo: 'capacete', defesa: 3, preco: 180, valor: 60, cor: '#a9afb8' },

  // ---------- Armaduras ----------
  armadura_couro:  { nome: 'Armadura de couro', tipo: 'armadura', defesa: 3, preco: 80, valor: 25, cor: '#8a5a2b' },
  cota_malha:      { nome: 'Cota de malha', tipo: 'armadura', defesa: 6, preco: 400, valor: 130, cor: '#8f959e' },
  armadura_placas: { nome: 'Armadura de placas', tipo: 'armadura', defesa: 9, preco: 1200, valor: 380, cor: '#c8ced6' },

  // ---------- Calças ----------
  calca_couro: { nome: 'Calça de couro', tipo: 'calca', defesa: 1, preco: 40, valor: 12, cor: '#6b4a2a' },
  calca_malha: { nome: 'Calça de malha', tipo: 'calca', defesa: 3, preco: 250, valor: 80, cor: '#80868f' },

  // ---------- Botas ----------
  botas_couro: { nome: 'Botas de couro', tipo: 'botas', defesa: 1, preco: 30, valor: 10, cor: '#4a3020' },
  botas_ferro: { nome: 'Botas de ferro', tipo: 'botas', defesa: 2, preco: 200, valor: 60, cor: '#8f959e' },

  // ===================================================================
  // ITENS EXTRAS — já existem e têm ícone, mas AINDA NÃO APARECEM no jogo:
  // nenhum monstro dropa e nenhuma loja vende (não têm "preco").
  // Para usar: coloque no "loot" de um monstro em monstros.js, ex.:
  //   loot: [{ item: 'katana', chance: 0.02, qtd: [1, 1] }]
  // Para vender numa loja: dê um "preco" (o NPC certo passa a vender sozinho).
  // Os números são sugestões — ajuste à vontade.
  // ===================================================================
  katana:      { nome: 'Katana', tipo: 'arma', categoria: 'espada', skill: 'melee', ataque: 25, acerto: 0.88, alcance: 1, valor: 300 },
  sabre:       { nome: 'Sabre', tipo: 'arma', categoria: 'espada', skill: 'melee', ataque: 19, acerto: 0.86, alcance: 1, valor: 140 },
  adaga_larga: { nome: 'Adaga larga', tipo: 'arma', categoria: 'espada', skill: 'melee', ataque: 13, acerto: 0.92, alcance: 1, valor: 45 },
  mangual:     { nome: 'Mangual', tipo: 'arma', categoria: 'clava', skill: 'melee', ataque: 18, acerto: 0.93, alcance: 1, valor: 120 },

  chapeu_cacador: { nome: 'Chapéu de caçador', tipo: 'capacete', defesa: 2, valor: 40 },
  elmo_cruzado:   { nome: 'Elmo cruzado', tipo: 'capacete', defesa: 5, valor: 150 },
  armadura_aco:   { nome: 'Armadura de aço', tipo: 'armadura', defesa: 12, valor: 600 },
  tunica_azul:    { nome: 'Túnica azul', tipo: 'armadura', defesa: 2, valor: 20 },
  tunica_verde:   { nome: 'Túnica verde', tipo: 'armadura', defesa: 2, valor: 20 },
  manto:          { nome: 'Manto', tipo: 'armadura', defesa: 4, valor: 60 },

  maca_fruta: { nome: 'Maçã', tipo: 'consumivel', cura: 10, valor: 1, empilha: true, descricao: 'Recupera 10 de vida.' },
  pao:        { nome: 'Pão', tipo: 'consumivel', cura: 20, valor: 2, empilha: true, descricao: 'Recupera 20 de vida.' },
  peixe:      { nome: 'Peixe assado', tipo: 'consumivel', cura: 25, valor: 3, empilha: true, descricao: 'Recupera 25 de vida.' },
  frango:     { nome: 'Frango assado', tipo: 'consumivel', cura: 45, valor: 6, empilha: true, descricao: 'Recupera 45 de vida.' },
  pocao_mana: { nome: 'Poção de mana', tipo: 'consumivel', mana: 60, valor: 10, empilha: true, descricao: 'Recupera 60 de mana.' },

  tecido:       { nome: 'Pedaço de tecido', tipo: 'material', valor: 3, empilha: true, descricao: 'Pano velho e rasgado.' },
  pena:         { nome: 'Pena', tipo: 'material', valor: 2, empilha: true, descricao: 'Leve como o vento.' },
  minerio:      { nome: 'Minério de ferro', tipo: 'material', valor: 8, empilha: true, descricao: 'Um ferreiro saberia usar.' },
  gema:         { nome: 'Gema', tipo: 'material', valor: 60, empilha: true, descricao: 'Brilha mesmo no escuro.' },
  rubi:         { nome: 'Rubi', tipo: 'material', valor: 120, empilha: true, descricao: 'Vermelho como fogo.' },
  moeda_antiga: { nome: 'Moeda antiga', tipo: 'material', valor: 25, empilha: true, descricao: 'De um reino esquecido.' },
  erva:         { nome: 'Erva medicinal', tipo: 'material', valor: 4, empilha: true, descricao: 'A alquimista gostaria disto.' },
  pergaminho:   { nome: 'Pergaminho antigo', tipo: 'material', valor: 40, empilha: true, descricao: 'Escrito numa língua estranha.' },
};

// Ouro é especial: aparece no corpo, mas ao pegar vai direto
// para a bolsa de moedas e não ocupa espaço na mochila.
const ITEM_OURO = 'ouro';
ITENS[ITEM_OURO] = { nome: 'Moedas de ouro', tipo: 'ouro', valor: 1, empilha: true, descricao: 'Dinheiro.' };

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
