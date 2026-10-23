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
  // Comidas: NÃO curam na hora. Matam a fome por "fome" minutos (acumula até 15).
  // Sem fome você regenera vida e mana devagar; com fome, nada.
  queijo:       { nome: 'Queijo', tipo: 'consumivel', fome: 4, valor: 2, empilha: true },
  carne:        { nome: 'Carne', tipo: 'consumivel', fome: 8, valor: 4, empilha: true },
  maca_fruta:   { nome: 'Maçã', tipo: 'consumivel', fome: 2, preco: 3, valor: 1, empilha: true },
  pao:          { nome: 'Pão', tipo: 'consumivel', fome: 4, preco: 5, valor: 2, empilha: true },
  peixe:        { nome: 'Peixe assado', tipo: 'consumivel', fome: 6, preco: 8, valor: 3, empilha: true },
  frango:       { nome: 'Frango assado', tipo: 'consumivel', fome: 10, preco: 15, valor: 6, empilha: true },
  // Comidas especiais: além de tirar a fome, dão regeneração extra por 30 segundos
  //   regen: { vida, mana } a cada 2 segundos
  ensopado:     { nome: 'Ensopado do caçador', tipo: 'consumivel', fome: 8, regen: { vida: 10, mana: 40 }, preco: 80, valor: 12, empilha: true },
  torta_real:   { nome: 'Torta real', tipo: 'consumivel', fome: 12, regen: { vida: 30, mana: 10 }, preco: 90, valor: 45, empilha: true },
  // Poções: curam na hora
  pocao_mana:   { nome: 'Poção de mana', tipo: 'consumivel', mana: 60, preco: 50, valor: 10, empilha: true,
                  descricao: 'Recupera 60 de mana.' },
  pocao:        { nome: 'Poção de vida', tipo: 'consumivel', cura: 110, preco: 50, valor: 10, empilha: true,
                  descricao: 'Recupera 110 de vida.' },
  pocao_grande: { nome: 'Poção grande', tipo: 'consumivel', cura: 160, preco: 100, valor: 25, empilha: true,
                  descricao: 'Recupera 160 de vida.' },
  pocao_enorme: { nome: 'Poção enorme de vida', tipo: 'consumivel', cura: 300, preco: 200, valor: 55, empilha: true,
                  descricao: 'Recupera 300 de vida.' },
  pocao_mana_enorme: { nome: 'Poção enorme de mana', tipo: 'consumivel', mana: 200, preco: 180, valor: 45, empilha: true,
                  descricao: 'Recupera 200 de mana.' },

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
                    ataque: 13, acerto: 0.95, alcance: 1, preco: 60, valor: 20, cor: '#c9ced6' },
  espada:         { nome: 'Espada', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 19, acerto: 0.95, alcance: 1, preco: 250, valor: 80, cor: '#dfe3ea' },
  espada_longa:   { nome: 'Espada longa', tipo: 'arma', categoria: 'espada', skill: 'melee',
                    ataque: 26, acerto: 0.95, alcance: 1, preco: 700, valor: 220, cor: '#f2f4f8' },
  machado_mao:    { nome: 'Machadinha', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 15, acerto: 0.95, alcance: 1, preco: 60, valor: 20, cor: '#b9bec6' },
  machado:        { nome: 'Machado', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 21, acerto: 0.95, alcance: 1, preco: 260, valor: 85, cor: '#d0d5dd' },
  machado_guerra: { nome: 'Machado de guerra', tipo: 'arma', categoria: 'machado', skill: 'melee',
                    ataque: 28, acerto: 0.95, alcance: 1, preco: 750, valor: 240, cor: '#eef0f4' },
  clava:          { nome: 'Clava', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 12, acerto: 0.95, alcance: 1, preco: 40, valor: 12, cor: '#8a5a2b' },
  maca:           { nome: 'Maça', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 16, acerto: 0.95, alcance: 1, preco: 240, valor: 75, cor: '#9aa0a8' },
  martelo_guerra: { nome: 'Martelo de guerra', tipo: 'arma', categoria: 'clava', skill: 'melee',
                    ataque: 27, acerto: 0.95, alcance: 1, preco: 680, valor: 210, cor: '#c0c5cc' },

  // ---------- Armas de distância ----------
  shuriken: { nome: 'Shuriken', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 19, acerto: 0.90, alcance: 4, arremesso: true, quebraEntre: [3, 10], preco: 3, valor: 1, empilha: true,
              descricao: 'Estrela de arremesso. Cada uma quebra depois de 3 a 10 ataques.' },
  shuriken_aprendiz: { nome: 'Shuriken do aprendiz', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 13, acerto: 0.90, alcance: 4, arremesso: true, infinita: true, valor: 0,
              descricao: 'Presente para iniciantes. Mais fraca, mas nunca quebra.' },
  lanca:    { nome: 'Lança', tipo: 'arma', categoria: 'arremesso', skill: 'distance',
              ataque: 23, acerto: 0.90, alcance: 3, arremesso: true, quebraEntre: [3, 10], preco: 8, valor: 3, empilha: true,
              descricao: 'Forte, mas alcança menos. Cada uma quebra depois de 3 a 10 ataques.' },
  arco:     { nome: 'Arco', tipo: 'arma', categoria: 'arco', skill: 'distance',
              ataque: 0, acerto: 0.90, alcance: 5, municao: 'flecha', preco: 300, valor: 90,
              descricao: 'Alcança longe. Precisa de flechas no espaço de munição.' },

  // ---------- Munição ----------
  flecha:       { nome: 'Flecha', tipo: 'municao', municaoDe: 'flecha', ataque: 15,
                  preco: 2, valor: 1, empilha: true, descricao: 'Munição para arco.' },
  flecha_ferro: { nome: 'Flecha de ferro', tipo: 'municao', municaoDe: 'flecha', ataque: 26,
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
  // ITENS RAROS — nenhuma loja vende (não têm "preco"): só caem de monstros
  // de level 15+ (veja os LOOT_... no topo de monstros.js).
  // Para vender numa loja: dê um "preco" (o NPC certo passa a vender sozinho).
  // Os números são sugestões — ajuste à vontade.
  // ===================================================================
  // Cajados (só o mago usa): atacam de longe sozinhos, com um tiro do elemento do cajado.
  //   tiro: efeito que voa até o monstro (EFEITOS)   elemento: fogo, gelo, vento ou raio (veja FRAQUEZAS)
  cajado_aprendiz: { nome: 'Cajado de fogo', tipo: 'arma', categoria: 'cajado', classe: 'mago', skill: 'magia', ataque: 13, acerto: 0.92, alcance: 5,
                     tiro: 'bola_fogo', elemento: 'fogo', preco: 80, valor: 20 },
  cajado_vento:    { nome: 'Cajado dos ventos', tipo: 'arma', categoria: 'cajado', classe: 'mago', skill: 'magia', ataque: 19, acerto: 0.92, alcance: 5,
                     tiro: 'vento', elemento: 'vento', preco: 600, valor: 200 },
  cajado_trovao:   { nome: 'Cajado de raio', tipo: 'arma', categoria: 'cajado', classe: 'mago', skill: 'magia', ataque: 28, acerto: 0.92, alcance: 5,
                     tiro: 'faisca', elemento: 'raio', valor: 700 },   // sem drop ainda: o autor decide onde cai
  cajado_gelo:     { nome: 'Cajado de gelo', tipo: 'arma', categoria: 'cajado', classe: 'mago', skill: 'magia', ataque: 24, acerto: 0.92, alcance: 5,
                     tiro: 'gelo', elemento: 'gelo', valor: 450 },     // status no chute; sem drop ainda

  // Instrumentos (só o bardo usa): atacam de longe com uma nota musical, sem elemento.
  // A flauta é a arma inicial (sem "preco": a loja não vende, mas compra de volta).
  //   tiros: quantos projéteis saem (o dano conta uma vez só)   volta: o tiro volta pra você depois de acertar
  flauta:  { nome: 'Flauta', tipo: 'arma', categoria: 'instrumento', classe: 'bardo', skill: 'magia', ataque: 16, acerto: 0.92, alcance: 5,
             tiro: 'nota_grande', valor: 20 },
  alaude:  { nome: 'Alaúde', tipo: 'arma', categoria: 'instrumento', classe: 'bardo', skill: 'magia', ataque: 22, acerto: 0.92, alcance: 5,
             tiro: 'nota_roxa', tiros: 3, preco: 300, valor: 90 },
  violino: { nome: 'Violino', tipo: 'arma', categoria: 'instrumento', classe: 'bardo', skill: 'magia', ataque: 29, acerto: 0.92, alcance: 5,
             tiro: 'cordas', preco: 700, valor: 230 },

  // v0.15 — status no chute (ajuste à vontade)
  machado_runico: { nome: 'Machado rúnico', tipo: 'arma', categoria: 'machado', skill: 'melee', ataque: 31, acerto: 0.95, alcance: 1, valor: 2900 },
  machado_lua:    { nome: 'Machado meia-lua', tipo: 'arma', categoria: 'machado', skill: 'melee', ataque: 35, acerto: 0.95, alcance: 1, valor: 2500 },
  maca_espinhos:  { nome: 'Maça de espinhos', tipo: 'arma', categoria: 'clava', skill: 'melee', ataque: 34, acerto: 0.94, alcance: 1, valor: 2520 },

  katana:      { nome: 'Katana', tipo: 'arma', categoria: 'espada', skill: 'melee', ataque: 45, acerto: 0.90, alcance: 1, valor: 2300 },
  sabre:       { nome: 'Sabre', tipo: 'arma', categoria: 'espada', skill: 'melee', ataque: 23, acerto: 0.90, alcance: 1, valor: 2140 },
  adaga_larga: { nome: 'Adaga larga', tipo: 'arma', categoria: 'espada', skill: 'melee', ataque: 25, acerto: 0.92, alcance: 1, valor: 1545 },
  mangual:     { nome: 'Mangual', tipo: 'arma', categoria: 'clava', skill: 'melee', ataque: 36, acerto: 0.93, alcance: 1, valor: 2120 },

  chapeu_cacador: { nome: 'Chapéu de caçador', tipo: 'capacete', defesa: 2, valor: 40 },
  elmo_cruzado:   { nome: 'Elmo cruzado', tipo: 'capacete', defesa: 5, valor: 150 },
  armadura_aco:   { nome: 'Armadura de aço', tipo: 'armadura', defesa: 12, valor: 600 },
  tunica_azul:    { nome: 'Túnica azul', tipo: 'armadura', defesa: 2, valor: 20 },
  tunica_verde:   { nome: 'Túnica verde', tipo: 'armadura', defesa: 2, valor: 20 },
  manto:          { nome: 'Manto', tipo: 'armadura', defesa: 4, valor: 60 },


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
  if (it.fome) partes.push('Mata a fome por ' + it.fome + ' min');
  if (it.regen) partes.push('+' + it.regen.vida + ' vida e +' + it.regen.mana + ' mana a cada 2s, por 30s');
  if (it.elemento) partes.push('elemento ' + it.elemento);
  if (it.classe) partes.push('só ' + CLASSES[it.classe].nome.toLowerCase());
  if (it.tipo === 'arma' && typeof tipoPassivaArma === 'function' && tipoPassivaArma(it)) {
    const p = PASSIVAS_ARMA[tipoPassivaArma(it)];
    partes.push('passiva: ' + p.nome + ' (' + Math.round(p.chance * 100) + '% de chance, ' + (p.duracao / 1000) + ' s: ' + p.descricao + ')');
  }
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
