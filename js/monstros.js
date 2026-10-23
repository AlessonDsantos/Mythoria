// =====================================================
// monstros.js — Tipos de monstro, onde nascem e como pensam
//
// ONDE cada monstro nasce não fica aqui: fica no mapa (Tiled),
// nos retângulos "area" (com a lista de monstros e a quantidade)
// e nos pontos "chefe".
// =====================================================

// Para criar um monstro novo, copie um bloco e mude os valores.
// A imagem fica em img/monstros/<sprite>.png (folha 3x4, igual à dos personagens)
// e precisa estar listada em IMAGENS (sprites.js).
//   vida, ataqueMax (dano máximo), defesa (reduz seu dano), xp
//   ouro: [mínimo, máximo]    passo: ms por quadrado (menor = mais rápido)
//   visao: de quantos quadrados ele te enxerga e começa a perseguir
//   alcance: > 1 = ataca de longe (arqueiro, mago)
//     projetil: o que voa até você ('flecha', 'orbe', 'fogo'...)  impacto: efeito quando chega
//     magiaNoAlvo: efeitos que caem direto em você (sorteia um): ['veneno', 'raio']
//     (os nomes dos efeitos estão em EFEITOS, efeitos.js)
//   chefe: true = nome laranja e renasce mais devagar
//   loot: lista de { item, chance (0.5 = 50%), qtd: [mínimo, máximo] } (itens em itens.js)
// ---------- Folhas animadas novas (pântano e montanha) ----------
// Formato diferente da folha 3x4 dos personagens: cada quadro é um quadrado de "tam" px,
//   linhas 0–3 = parado/andando (baixo, esquerda, direita, cima), em loop
//   linhas 4–7 = ataque (mesma ordem), toca uma vez quando o monstro bate
//   quadros: quantos quadros no loop · ataque: quantos no ataque (0 = não tem)
//   pe: altura (px, dentro do quadro) onde fica o "chão" do monstro
//   altura: do pé até o topo da cabeça (pra pôr o nome em cima)
// Os chefes da folha "Boss 01" só olham pra frente: as 4 linhas são iguais.
const ANIM = {
  cobra_pantano:    { tam: 48, quadros: 8, ataque: 8, pe: 32, altura: 25 },
  planta_carnivora: { tam: 48, quadros: 8, ataque: 8, pe: 37, altura: 32 },
  cogumelo:         { tam: 48, quadros: 8, ataque: 8, pe: 29, altura: 25 },
  morcego:          { tam: 48, quadros: 6, ataque: 8, pe: 31, altura: 29 },
  aranha:           { tam: 48, quadros: 8, ataque: 8, pe: 31, altura: 20 },
  verme_rocha:      { tam: 48, quadros: 8, ataque: 8, pe: 35, altura: 32 },
  olho_vigia:       { tam: 48, quadros: 8, ataque: 8, pe: 36, altura: 26 },
  fogo_gelado:      { tam: 48, quadros: 8, ataque: 8, pe: 36, altura: 31 },
  filhote_dragao:   { tam: 48, quadros: 6, ataque: 9, pe: 34, altura: 32 },
  dragao_rubro:     { tam: 48, quadros: 6, ataque: 9, pe: 34, altura: 32 },
  ceifador:         { tam: 56, quadros: 3, ataque: 0, pe: 55, altura: 54, lento: true },
  demonio_alado:    { tam: 56, quadros: 3, ataque: 0, pe: 55, altura: 53, lento: true },
  feiticeira_gelo:  { tam: 96, quadros: 3, ataque: 0, pe: 79, altura: 64, lento: true },
};

// ---------- Loot dos monstros de level 15+ ----------
// Armas e armaduras raras (katana, sabre, mangual, armadura de aço...) e materiais.
// chance: 0.02 = 2% · qtd: [mínimo, máximo]
const item = (id, chance, min = 1, max = 1) => ({ item: id, chance, qtd: [min, max] });
const LOOT_SOMBRA            = [item('tecido', 0.2, 1, 2), item('manto', 0.01)];
const LOOT_ESQUELETO_PEQUENO = [item('adaga_larga', 0.03), item('moeda_antiga', 0.05)];
const LOOT_ESQUELETO         = [item('sabre', 0.02), item('capacete_ferro', 0.02), item('moeda_antiga', 0.08)];
const LOOT_ESQUELETO_NEGRO   = [item('sabre', 0.03), item('elmo_cruzado', 0.01), item('cota_malha', 0.015), item('moeda_antiga', 0.1)];
const LOOT_ZUMBI             = [item('tecido', 0.3, 1, 3), item('calca_malha', 0.02), item('carne', 0.2), item('maca_espinhos', 0.01)];
const LOOT_XAMA              = [item('manto', 0.4), item('elmo_cruzado', 0.3), item('gema', 0.5, 1, 2), item('machado_lua', 0.15), item('maca_espinhos', 0.12)];
const LOOT_FANTASMA          = [item('tecido', 0.25, 1, 2), item('tunica_azul', 0.02)];
const LOOT_FANTASMA_CINZA    = [item('tunica_verde', 0.02), item('moeda_antiga', 0.1)];
const LOOT_FANTASMA_AZUL     = [item('manto', 0.02), item('pergaminho', 0.04)];
const LOOT_FANTASMA_ROSA     = [item('chapeu_cacador', 0.03), item('gema', 0.03)];
const LOOT_ABOBORA           = [item('erva', 0.3, 1, 2)];
const LOOT_DIABINHO          = [item('adaga_larga', 0.03), item('rubi', 0.01)];
const LOOT_DIABO             = [item('rubi', 0.02), item('armadura_placas', 0.005), item('machado_lua', 0.02)];
const LOOT_MAGO_SOMBRIO      = [item('pergaminho', 0.1), item('manto', 0.04), item('gema', 0.03)];
const LOOT_ENCAPUZADO        = [item('armadura_aco', 0.25), item('elmo_cruzado', 0.4), item('rubi', 0.6, 1, 2), item('machado_runico', 0.15)];
const LOOT_MORCEGO           = [item('pena', 0.3, 1, 3)];
const LOOT_ARANHA            = [item('tecido', 0.25, 1, 3), item('pocao_mana', 0.04)];
const LOOT_LOBO_NEVE         = [item('pele_lobo', 0.3), item('presa_lobo', 0.25), item('chapeu_cacador', 0.02)];
const LOOT_VERME             = [item('minerio', 0.4, 1, 3), item('gema', 0.04)];
const LOOT_ESQUELETO_GELO    = [item('sabre', 0.04), item('elmo_cruzado', 0.02), item('botas_ferro', 0.02), item('moeda_antiga', 0.12), item('maca_espinhos', 0.02)];
const LOOT_OLHO              = [item('gema', 0.05), item('pergaminho', 0.05)];
const LOOT_FOGO_GELADO       = [item('gema', 0.06), item('pocao_mana', 0.08)];
const LOOT_MAGO_GELO         = [item('pergaminho', 0.1), item('manto', 0.05), item('pocao_mana', 0.1)];
const LOOT_FILHOTE           = [item('rubi', 0.05), item('carne', 0.3, 1, 2)];
const LOOT_CEIFADOR          = [item('armadura_aco', 0.01), item('moeda_antiga', 0.2, 1, 3), item('machado_lua', 0.02)];
const LOOT_DRAGAO_RUBRO      = [item('rubi', 0.08), item('armadura_aco', 0.015), item('pocao_grande', 0.05)];
const LOOT_DEMONIO           = [item('armadura_aco', 0.02), item('rubi', 0.1), item('machado_runico', 0.02)];
const LOOT_FEITICEIRA        = [item('armadura_aco', 0.5), item('katana', 0.4), item('elmo_cruzado', 0.4), item('gema', 1, 2, 4), item('machado_runico', 0.2), item('mangual', 0.4)];

const TIPOS_MONSTRO = {
  // Fantoche do campo de treino: não anda, não ataca, não morre, não dá XP.
  fantoche: { nome: 'Fantoche', sprite: 'fantoche', imagemUnica: true, fantoche: true,
    vida: 500, ataqueMax: 0, defesa: 0, xp: 0, ouro: [0, 0], passo: 1000, visao: 0, loot: [] },

  // ---------- Campos do Leste (level 1–5) ----------
  lobo_branco: { nome: 'Lobo branco', sprite: 'lobo_branco',
    vida: 50, ataqueMax: 10, defesa: 1, xp: 18, ouro: [2, 4], passo: 420, visao: 5,
    loot: [{ item: 'presa_lobo', chance: 0.08, qtd: [1, 1] }] },
  lobo_cinza: { nome: 'Lobo cinzento', sprite: 'lobo_cinza',
    vida: 65, ataqueMax: 14, defesa: 2, xp: 32, ouro: [3, 8], passo: 360, visao: 6,
    loot: [{ item: 'presa_lobo', chance: 0.12, qtd: [1, 1] }, { item: 'pele_lobo', chance: 0.08, qtd: [1, 1] }] },

  // ---------- Pântano (level 5–10) ----------
  // "anim": folha animada nova (veja o topo do arquivo). "parado": fica de tocaia, não anda.
  // De tocaia, mas cospem veneno de até 6 quadrados (e mordem de perto)
  cobra_pantano: { nome: 'Cobra do pântano', sprite: 'cobra_pantano', feminino: true, anim: ANIM.cobra_pantano, parado: true,
    alcance: 5, projetil: 'cuspe', impacto: 'veneno',
    vida: 130, ataqueMax: 25, defesa: 4, xp: 31, ouro: [4, 12], passo: 400, visao: 5,
    loot: [{ item: 'pele_cobra', chance: 0.2, qtd: [1, 1] }] },
  cogumelo: { nome: 'Cogumelo venenoso', sprite: 'cogumelo', anim: ANIM.cogumelo,
    vida: 140, ataqueMax: 25, defesa: 4, xp: 31, ouro: [4, 12], passo: 600, visao: 5,
    loot: [{ item: 'erva', chance: 0.3, qtd: [1, 2] }] },
  lodo: { nome: 'Lodo', sprite: 'lodo',
    vida: 170, ataqueMax: 30, defesa: 4, xp: 50, ouro: [5, 14], passo: 620, visao: 5, loot: [] },
  planta_carnivora: { nome: 'Planta carnívora', sprite: 'planta_carnivora', feminino: true, anim: ANIM.planta_carnivora, parado: true,
    alcance: 5, projetil: 'cuspe', impacto: 'veneno',
    vida: 200, ataqueMax: 34, defesa: 5, xp: 61, ouro: [4, 16], passo: 400, visao: 5,
    loot: [{ item: 'erva', chance: 0.4, qtd: [1, 3] }] },
  bruxa_pantano: { nome: 'Bruxa do pântano', sprite: 'bruxa_pantano', feminino: true, alcance: 4, magiaNoAlvo: ['veneno'],
    vida: 230, ataqueMax: 40, defesa: 5, xp: 73, ouro: [7, 18], passo: 480, visao: 6,
    loot: [{ item: 'erva', chance: 0.25, qtd: [1, 2] }, { item: 'pocao', chance: 0.05, qtd: [1, 1] }] },

  // ---------- Floresta Perdida (level 10–15) ----------
  goblin: { nome: 'Goblin', sprite: 'goblin',
    vida: 255, ataqueMax: 35, defesa: 6, xp: 76, ouro: [6, 20], passo: 450, visao: 5,
    loot: [{ item: 'machado_mao', chance: 0.04, qtd: [1, 1] }, { item: 'clava', chance: 0.04, qtd: [1, 1] }] },
  goblin_arqueiro: { nome: 'Goblin arqueiro', sprite: 'goblin_arqueiro', alcance: 4, projetil: 'flecha',
    vida: 270, ataqueMax: 31, defesa: 7, xp: 91, ouro: [8, 22], passo: 450, visao: 6,
    loot: [{ item: 'flecha', chance: 0.25, qtd: [5, 15] }, { item: 'shuriken', chance: 0.12, qtd: [3, 8] }, { item: 'arco', chance: 0.02, qtd: [1, 1] }] },
  goblin_guerreiro: { nome: 'Goblin guerreiro', sprite: 'goblin_guerreiro',
    vida: 325, ataqueMax: 40, defesa: 8, xp: 124, ouro: [9, 26], passo: 480, visao: 5,
    loot: [{ item: 'espada', chance: 0.03, qtd: [1, 1] }, { item: 'machado', chance: 0.02, qtd: [1, 1] }, { item: 'maca', chance: 0.03, qtd: [1, 1] }] },
  goblin_mago: { nome: 'Goblin mago', sprite: 'goblin_mago', alcance: 4, projetil: 'orbe', impacto: 'impacto',
    vida: 385, ataqueMax: 36, defesa: 8, xp: 150, ouro: [10, 26], passo: 480, visao: 6,
    loot: [{ item: 'lanca', chance: 0.12, qtd: [2, 5] }, { item: 'espada', chance: 0.02, qtd: [1, 1] }] },
  goblin_chefe: { nome: 'Rei Goblin', sprite: 'goblin_chefe', chefe: true,
    vida: 2500, ataqueMax: 83, defesa: 10, xp: 2200, ouro: [120, 320], passo: 420, visao: 6,
    loot: [{ item: 'espada_longa', chance: 0.35, qtd: [1, 1] }, { item: 'machado_guerra', chance: 0.25, qtd: [1, 1] },
           { item: 'martelo_guerra', chance: 0.25, qtd: [1, 1] }, { item: 'arco', chance: 0.30, qtd: [1, 1] }] },

  // ---------- Floresta Negra (level 15–20) ----------
  sombra: { nome: 'Sombra', sprite: 'sombra', feminino: true,
    vida: 450, ataqueMax: 44, defesa: 9, xp: 164, ouro: [8, 30], passo: 400, visao: 6,
    loot: LOOT_SOMBRA },
  esqueleto_pequeno: { nome: 'Esqueleto pequeno', sprite: 'esqueleto_pequeno',
    vida: 570, ataqueMax: 54, defesa: 9, xp: 164, ouro: [8, 30], passo: 430, visao: 5,
    loot: LOOT_ESQUELETO_PEQUENO },
  esqueleto: { nome: 'Esqueleto', sprite: 'esqueleto',
    vida: 635, ataqueMax: 67, defesa: 10, xp: 208, ouro: [8, 34], passo: 460, visao: 6,
    loot: LOOT_ESQUELETO },
  esqueleto_negro: { nome: 'Esqueleto negro', sprite: 'esqueleto_negro',
    vida: 670, ataqueMax: 81, defesa: 11, xp: 259, ouro: [10, 38], passo: 460, visao: 6,
    loot: LOOT_ESQUELETO_NEGRO },
  zumbi: { nome: 'Zumbi', sprite: 'zumbi',
    vida: 715, ataqueMax: 96, defesa: 11, xp: 259, ouro: [10, 38], passo: 650, visao: 5,
    loot: LOOT_ZUMBI },
  xama_sombrio: { nome: 'Xamã das Sombras', sprite: 'xama_sombrio', chefe: true, alcance: 4, magiaNoAlvo: ['veneno', 'raio'],
    vida: 5000, ataqueMax: 150, defesa: 13, xp: 4100, ouro: [165, 440], passo: 500, visao: 7,
    loot: LOOT_XAMA },

  // ---------- Vila Desolada (level 20–25) ----------
  fantasma: { nome: 'Fantasma', sprite: 'fantasma',
    vida: 760, ataqueMax: 93, defesa: 12, xp: 286, ouro: [10, 40], passo: 420, visao: 6, loot: LOOT_FANTASMA },
  fantasma_cinza: { nome: 'Fantasma cinzento', sprite: 'fantasma_cinza',
    vida: 795, ataqueMax: 95, defesa: 13, xp: 315, ouro: [10, 42], passo: 420, visao: 6, loot: LOOT_FANTASMA_CINZA },
  fantasma_azul: { nome: 'Fantasma azul', sprite: 'fantasma_azul',
    vida: 820, ataqueMax: 100, defesa: 13, xp: 345, ouro: [11, 44], passo: 400, visao: 6, loot: LOOT_FANTASMA_AZUL },
  fantasma_rosa: { nome: 'Fantasma rosa', sprite: 'fantasma_rosa',
    vida: 860, ataqueMax: 105, defesa: 14, xp: 376, ouro: [12, 46], passo: 400, visao: 6, loot: LOOT_FANTASMA_ROSA },
  abobora: { nome: 'Abóbora maldita', sprite: 'abobora', feminino: true,
    vida: 915, ataqueMax: 108, defesa: 13, xp: 315, ouro: [10, 42], passo: 520, visao: 5, loot: LOOT_ABOBORA },
  diabinho_pequeno: { nome: 'Diabinho', sprite: 'diabinho_pequeno',
    vida: 925, ataqueMax: 110, defesa: 13, xp: 315, ouro: [10, 42], passo: 300, visao: 7, loot: LOOT_DIABINHO },
  diabinho: { nome: 'Diabo', sprite: 'diabinho',
    vida: 955, ataqueMax: 115, defesa: 14, xp: 409, ouro: [12, 48], passo: 360, visao: 7, loot: LOOT_DIABO },
  mago_sombrio: { nome: 'Mago sombrio', sprite: 'mago_sombrio', alcance: 4, projetil: 'fogo', impacto: 'explosao',
    vida: 1040, ataqueMax: 120, defesa: 14, xp: 409, ouro: [12, 48], passo: 480, visao: 7, loot: LOOT_MAGO_SOMBRIO },
  encapuzado: { nome: 'Encapuzado Carmesim', sprite: 'encapuzado', chefe: true, alcance: 3, magiaNoAlvo: ['lanca_fogo'],
    vida: 7600, ataqueMax: 200, defesa: 16, xp: 7200, ouro: [210, 540], passo: 420, visao: 7, loot: LOOT_ENCAPUZADO },

  // ---------- Montanha do Norte (level 25+) ----------
  // base (25–30)
  morcego: { nome: 'Morcego das cavernas', sprite: 'morcego', anim: ANIM.morcego,
    vida: 145, ataqueMax: 62, defesa: 15, xp: 444, ouro: [12, 50], passo: 300, visao: 7, loot: LOOT_MORCEGO },
  aranha: { nome: 'Aranha das rochas', sprite: 'aranha', feminino: true, anim: ANIM.aranha,
    vida: 180, ataqueMax: 63, defesa: 16, xp: 479, ouro: [13, 52], passo: 340, visao: 6, loot: LOOT_ARANHA },
  lobo_neve: { nome: 'Lobo das neves', sprite: 'lobo_neve',
    vida: 190, ataqueMax: 65, defesa: 16, xp: 516, ouro: [14, 54], passo: 340, visao: 7, loot: LOOT_LOBO_NEVE },
  verme_rocha: { nome: 'Verme da rocha', sprite: 'verme_rocha', anim: ANIM.verme_rocha, parado: true,
    vida: 265, ataqueMax: 87, defesa: 17, xp: 666, ouro: [14, 56], passo: 400, visao: 4, loot: LOOT_VERME },
  esqueleto_gelo: { nome: 'Esqueleto congelado', sprite: 'esqueleto_gelo',
    vida: 215, ataqueMax: 69, defesa: 17, xp: 595, ouro: [14, 58], passo: 460, visao: 6, loot: LOOT_ESQUELETO_GELO },
  // meio (30–35)
  olho_vigia: { nome: 'Olho vigia', sprite: 'olho_vigia', anim: ANIM.olho_vigia, alcance: 4, projetil: 'orbe', impacto: 'impacto',
    vida: 160, ataqueMax: 60, defesa: 18, xp: 636, ouro: [15, 60], passo: 520, visao: 7, loot: LOOT_OLHO },
  fogo_gelado: { nome: 'Fogo-fátuo gelado', sprite: 'fogo_gelado', anim: ANIM.fogo_gelado, alcance: 3, projetil: 'gelo', impacto: 'impacto',
    vida: 160, ataqueMax: 64, defesa: 19, xp: 679, ouro: [16, 62], passo: 380, visao: 7, loot: LOOT_FOGO_GELADO },
  mago_gelo: { nome: 'Mago do gelo', sprite: 'mago_gelo', alcance: 4, projetil: 'gelo', impacto: 'impacto',
    vida: 165, ataqueMax: 65, defesa: 19, xp: 723, ouro: [16, 64], passo: 480, visao: 7, loot: LOOT_MAGO_GELO },
  filhote_dragao: { nome: 'Filhote de dragão', sprite: 'filhote_dragao', anim: ANIM.filhote_dragao,
    vida: 250, ataqueMax: 73, defesa: 20, xp: 768, ouro: [16, 66], passo: 420, visao: 6, loot: LOOT_FILHOTE },
  // topo (35+)
  ceifador: { nome: 'Ceifador', sprite: 'ceifador', anim: ANIM.ceifador,
    vida: 240, ataqueMax: 76, defesa: 22, xp: 913, ouro: [18, 72], passo: 440, visao: 7, loot: LOOT_CEIFADOR },
  dragao_rubro: { nome: 'Dragão rubro jovem', sprite: 'dragao_rubro', anim: ANIM.dragao_rubro, alcance: 3, projetil: 'fogo', impacto: 'explosao',
    vida: 270, ataqueMax: 73, defesa: 22, xp: 964, ouro: [18, 74], passo: 440, visao: 7, loot: LOOT_DRAGAO_RUBRO },
  demonio_alado: { nome: 'Demônio alado', sprite: 'demonio_alado', anim: ANIM.demonio_alado,
    vida: 305, ataqueMax: 86, defesa: 23, xp: 1071, ouro: [20, 78], passo: 400, visao: 7, loot: LOOT_DEMONIO },
  feiticeira_gelo: { nome: 'Feiticeira de Gelo', sprite: 'feiticeira_gelo', feminino: true, chefe: true, anim: ANIM.feiticeira_gelo,
    alcance: 4, magiaNoAlvo: ['gelo', 'raio'],
    vida: 3400, ataqueMax: 122, defesa: 25, xp: 17000, ouro: [315, 840], passo: 480, visao: 8, loot: LOOT_FEITICEIRA },
};

// ---------- Fraquezas e resistências elementais (magias e cajados do mago) ----------
// Número = multiplica o dano daquele elemento: 1.5 = apanha 50% a mais (fraco),
// 0.5 = metade do dano (resiste). Elemento que não aparece = dano normal (1).
const ELEMENTOS = { fogo: 'fogo', gelo: 'gelo', vento: 'vento', raio: 'raio' };
const FRAQUEZAS = {
  lobo_branco:      { fogo: 1.2, gelo: 0.8 },
  lobo_cinza:       { fogo: 1.2 },
  cobra_pantano:    { gelo: 1.5, raio: 1.2 },
  cogumelo:         { fogo: 1.5, vento: 0.8 },
  lodo:             { raio: 1.5, fogo: 0.7 },
  planta_carnivora: { fogo: 1.6, gelo: 0.8 },
  bruxa_pantano:    { raio: 1.3, fogo: 0.8 },
  goblin:           { fogo: 1.2 },
  goblin_arqueiro:  { vento: 1.3 },
  goblin_guerreiro: { raio: 1.3, fogo: 0.8 },
  goblin_mago:      { gelo: 1.3, raio: 0.7 },
  goblin_chefe:     { raio: 1.2, fogo: 0.8 },
  sombra:           { raio: 1.5, gelo: 0.6 },
  esqueleto_pequeno:{ fogo: 1.3, gelo: 0.7 },
  esqueleto:        { fogo: 1.3, raio: 1.2, gelo: 0.6 },
  esqueleto_negro:  { raio: 1.4, gelo: 0.6 },
  zumbi:            { fogo: 1.5, gelo: 0.7 },
  xama_sombrio:     { raio: 1.2, fogo: 0.8 },
  fantasma:         { raio: 1.3, vento: 0.5 },
  fantasma_cinza:   { fogo: 1.3, vento: 0.5 },
  fantasma_azul:    { fogo: 1.5, gelo: 0.4 },
  fantasma_rosa:    { gelo: 1.3, raio: 0.7, vento: 0.5 },
  abobora:          { fogo: 1.6, raio: 0.8 },
  diabinho_pequeno: { gelo: 1.5, fogo: 0.3 },
  diabinho:         { gelo: 1.5, fogo: 0.2 },
  mago_sombrio:     { gelo: 1.3, fogo: 0.5 },
  encapuzado:       { gelo: 1.4, fogo: 0.3 },
  morcego:          { vento: 1.4 },
  aranha:           { fogo: 1.5, gelo: 0.8 },
  lobo_neve:        { fogo: 1.5, gelo: 0.3 },
  verme_rocha:      { gelo: 1.3, raio: 0.5, vento: 0.6 },
  esqueleto_gelo:   { fogo: 1.6, gelo: 0.2 },
  olho_vigia:       { vento: 1.3, raio: 0.6 },
  fogo_gelado:      { fogo: 1.6, gelo: 0.2 },
  mago_gelo:        { fogo: 1.5, gelo: 0.3 },
  filhote_dragao:   { gelo: 1.3, fogo: 0.6 },
  ceifador:         { fogo: 1.3, raio: 1.2, vento: 0.6 },
  dragao_rubro:     { gelo: 1.6, fogo: 0.2 },
  demonio_alado:    { gelo: 1.5, vento: 1.2, fogo: 0.3 },
  feiticeira_gelo:  { fogo: 1.5, raio: 1.1, gelo: 0.2 },
};

function multiplicadorElemento(tipo, elemento) {
  const f = FRAQUEZAS[tipo];
  return f && f[elemento] !== undefined ? f[elemento] : 1;
}

// Texto curto pra mostrar ao olhar o monstro: "fraco a fogo; resiste a gelo"
function descreverFraquezas(tipo) {
  const f = FRAQUEZAS[tipo] || {};
  const fracos = Object.keys(f).filter(e => f[e] > 1), fortes = Object.keys(f).filter(e => f[e] < 1);
  const partes = [];
  if (fracos.length) partes.push('fraco a ' + fracos.join(' e '));
  if (fortes.length) partes.push('resiste a ' + fortes.join(' e '));
  return partes.join('; ');
}

const monstros = [];          // todos os monstros (vivos e corpos)
const respawnsPendentes = []; // { quando, casa } — "casa" é a área ou o ponto do chefe
let proximoIdMonstro = 1;

// ---------- Perguntas sobre o mapa ----------

function monstroEm(x, y) {
  return monstros.find(m => !m.morto && m.x === x && m.y === y) || null;
}

// Livre = dá pra pisar E não tem ninguém em cima
function ehLivre(x, y) {
  if (!ehPassavel(x, y)) return false;
  if (monstroEm(x, y) || npcEm(x, y)) return false;
  if (jogador.x === x && jogador.y === y) return false;
  if (membroEm(x, y)) return false; // outro jogador do grupo (grupo.js)
  return true;
}

// ---------- Nascimento ----------

function sortearLoot(tipo) {
  const t = TIPOS_MONSTRO[tipo];
  const loot = [];
  const ouro = aleatorioInt(t.ouro[0], t.ouro[1]);
  if (ouro > 0) loot.push({ id: ITEM_OURO, qtd: ouro });
  for (const l of t.loot) {
    if (ITENS[l.item] && Math.random() < l.chance) loot.push({ id: l.item, qtd: aleatorioInt(l.qtd[0], l.qtd[1]) });
  }
  return loot;
}

function criarMonstro(tipo, x, y, casa = null) {
  const t = TIPOS_MONSTRO[tipo];
  const m = {
    id: proximoIdMonstro++,
    tipo, x, y,
    anteriorX: x, anteriorY: y,
    inicioPasso: -Infinity,
    direcao: 'baixo',
    vida: t.vida, vidaMax: t.vida,
    proximoAtaque: 0,
    proximaDecisao: 0,
    ultimoDano: -Infinity,
    morto: false, morreuEm: 0,
    loot: [],          // itens dentro do corpo depois que morre
    removido: false,   // true quando o corpo some do mapa
    casa,              // área (retângulo) ou ponto do chefe onde ele vive
  };
  monstros.push(m);
  return m;
}

// Sorteia um tipo da lista da área respeitando os pesos ("goblin:3" sai 3x mais que ":1")
function sortearTipo(lista) {
  const total = lista.reduce((s, m) => s + m.peso, 0);
  let r = Math.random() * total;
  for (const m of lista) { if ((r -= m.peso) < 0) return m.tipo; }
  return lista[lista.length - 1].tipo;
}

// Bom lugar pra nascer: livre, alcançável, fora da zona segura e fora da sua tela
function bomLugar(x, y) {
  return ehLivre(x, y) && ehAlcancavel(x, y) && !naZonaSegura(x, y, 2) && distancia({ x, y }, jogador) >= 9;
}

function nascerNaArea(area) {
  if (!area.monstros.length) return null;
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const x = aleatorioInt(area.x0, area.x1);
    const y = aleatorioInt(area.y0, area.y1);
    if (bomLugar(x, y)) return criarMonstro(sortearTipo(area.monstros), x, y, area);
  }
  return null;
}

function nascerChefe(chefe) {
  // tenta no ponto marcado; se estiver ocupado, procura em volta
  for (let raio = 0; raio <= 4; raio++) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        const x = chefe.x + dx, y = chefe.y + dy;
        if (ehLivre(x, y) && ehAlcancavel(x, y)) return criarMonstro(chefe.monstro, x, y, chefe);
      }
    }
  }
  return null;
}

function criarFantoches() {
  for (const p of mapa.pontos.fantoches) criarMonstro('fantoche', p.x, p.y);
}

function popularMonstros() {
  for (const area of mapa.areas) {
    for (let i = 0; i < area.quantidade; i++) nascerNaArea(area);
  }
  for (const chefe of mapa.chefes) nascerChefe(chefe);
}

// ---------- Movimento ----------

function monstroAndando(m, agora) {
  return agora - m.inicioPasso < (m.passoAtual || TIPOS_MONSTRO[m.tipo].passo);
}

// ---------- Debuffs do bardo ----------

// Tempo de um passo agora (lento = passo mais demorado: 50% de lentidão = 2x mais devagar)
function passoDoMonstro(m, agora) {
  const base = TIPOS_MONSTRO[m.tipo].passo;
  return agora < (m.lentoAte || 0) ? base / (1 - m.lentidao) : base;
}

function deixarLento(m, lentidao, ate) {
  if (ehMembroDoGrupo()) enviarAcaoGrupo({ t: 'lento', id: m.id, l: lentidao, ms: Math.round(ate - performance.now()) });
  m.lentidao = lentidao;
  m.lentoAte = ate;
}

// Carmen Torpor: sem defesa até "ate"
function tirarDefesa(m, ate) {
  if (ehMembroDoGrupo()) enviarAcaoGrupo({ t: 'semdef', id: m.id, ms: Math.round(ate - performance.now()) });
  m.semDefesaAte = ate;
}

// Defesa do monstro agora (Carmen Torpor zera)
function defesaMonstro(m, agora = performance.now()) {
  return agora < (m.semDefesaAte || 0) ? 0 : TIPOS_MONSTRO[m.tipo].defesa;
}

// Confuso: anda pra lados aleatórios e não ataca. Boss não fica confuso — fica 25% mais lento.
function confundir(m, agora, duracao) {
  if (TIPOS_MONSTRO[m.tipo].chefe) { deixarLento(m, 0.25, agora + duracao); return false; }
  if (ehMembroDoGrupo()) enviarAcaoGrupo({ t: 'conf', id: m.id, ms: duracao });
  m.confusoAte = Math.max(m.confusoAte || 0, agora + duracao);
  adicionarTexto(m.x, m.y, 'confuso', '#d6a8ff', agora);
  return true;
}

function monstroConfuso(m, agora) { return agora < (m.confusoAte || 0); }

// Algum debuff do bardo ativo? (mostra as notas roxas em cima dele)
function monstroComDebuff(m, agora) {
  return monstroConfuso(m, agora) || agora < (m.lentoAte || 0) || agora < (m.semDefesaAte || 0);
}

function moverMonstro(m, nomeDirecao, agora) {
  const d = DIRECOES[nomeDirecao];
  const nx = m.x + d.dx;
  const ny = m.y + d.dy;
  m.direcao = nomeDirecao;
  if (!ehLivre(nx, ny) || naZonaSegura(nx, ny)) return false;
  m.anteriorX = m.x; m.anteriorY = m.y;
  m.x = nx; m.y = ny;
  m.inicioPasso = agora;
  m.passoAtual = passoDoMonstro(m, agora);
  return true;
}

// Vira o monstro para o lado onde está o alvo
function virarPara(m, alvo) {
  const dx = alvo.x - m.x, dy = alvo.y - m.y;
  if (dx === 0 && dy === 0) return;
  m.direcao = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'direita' : 'esquerda') : (dy > 0 ? 'baixo' : 'cima');
}

// Dá o passo (entre as 4 direções) que mais aproxima de um ponto
function passoEmDirecao(m, alvo, agora) {
  const opcoes = Object.keys(DIRECOES).map(nome => {
    const d = DIRECOES[nome];
    const p = { x: m.x + d.dx, y: m.y + d.dy };
    return { nome, dist: distancia(p, alvo), manhattan: Math.abs(p.x - alvo.x) + Math.abs(p.y - alvo.y) };
  });
  opcoes.sort((a, b) => a.dist - b.dist || a.manhattan - b.manhattan);
  const distAtual = distancia(m, alvo);
  for (const o of opcoes) {
    if (o.dist > distAtual) break; // não anda pra longe
    if (moverMonstro(m, o.nome, agora)) return true;
  }
  return false;
}

// Persegue de forma simples ("gulosa"). Não contorna obstáculos grandes —
// isso é de propósito, dá pra fugir passando atrás de árvores.
function perseguir(m, agora) {
  passoEmDirecao(m, jogador, agora);
}

// Anda à toa, mas sem sair de casa. Se estiver fora (perseguiu você), volta.
function vagar(m, agora) {
  if (agora < m.proximaDecisao) return;
  m.proximaDecisao = agora + 1000 + Math.random() * 2500;
  const casa = m.casa;
  if (casa) {
    const ehChefe = casa.monstro !== undefined;
    const fora = ehChefe ? distancia(m, casa) > 4 : !dentroDe(casa, m.x, m.y);
    if (fora) {
      const centro = ehChefe ? casa : { x: Math.round((casa.x0 + casa.x1) / 2), y: Math.round((casa.y0 + casa.y1) / 2) };
      passoEmDirecao(m, centro, agora);
      m.proximaDecisao = agora + 300;
      return;
    }
  }
  const nomes = Object.keys(DIRECOES);
  moverMonstro(m, nomes[aleatorioInt(0, nomes.length - 1)], agora);
}

// ---------- Cérebro do monstro (chamado a cada quadro) ----------

function atualizarMonstros(agora) {
  for (let i = monstros.length - 1; i >= 0; i--) {
    const m = monstros[i];

    if (m.morto) {
      // corpo some depois de um tempo
      if (agora - m.morreuEm > CONFIG.TEMPO_CORPO) { m.removido = true; monstros.splice(i, 1); }
      continue;
    }

    const tipo = TIPOS_MONSTRO[m.tipo];
    if (tipo.fantoche) continue; // fica parado no lugar
    // Alvo: você ou, em grupo, o membro mais perto que ele enxerga (grupo.js)
    const alvo = alvoDoMonstro(m, tipo);
    const vendoJogador = !!alvo;
    const dist = alvo ? distancia(m, alvo) : Infinity;
    const alcance = tipo.alcance || 1;
    // De longe precisa enxergar sem árvore no meio; de perto, basta estar colado
    const podeAtacar = vendoJogador && dist <= alcance && (dist <= 1 || linhaDeVisao(m, alvo));

    if (monstroConfuso(m, agora)) {
      // confuso (bardo): anda à toa pra qualquer lado e não ataca
      if (!tipo.parado && !monstroAndando(m, agora)) {
        const nomes = Object.keys(DIRECOES);
        moverMonstro(m, nomes[aleatorioInt(0, nomes.length - 1)], agora);
      }
    } else if (podeAtacar) {
      if (agora >= m.proximoAtaque) {
        if (alvo === jogador) monstroAtaca(m, agora);
        else golpearMembro(m, alvo, agora); // o golpe é calculado no aparelho do membro
        m.proximoAtaque = agora + CONFIG.INTERVALO_ATAQUE;
      }
    } else if (tipo.parado) {
      if (vendoJogador) virarPara(m, alvo); // de tocaia: só vira pra você e espera
    } else if (!monstroAndando(m, agora)) {
      if (vendoJogador) passoEmDirecao(m, alvo, agora);
      else vagar(m, agora);
    }
  }

  // Nascer monstros novos no lugar dos que morreram (na mesma área)
  for (let i = respawnsPendentes.length - 1; i >= 0; i--) {
    const r = respawnsPendentes[i];
    if (agora < r.quando) continue;
    const m = r.casa && r.casa.monstro !== undefined ? nascerChefe(r.casa) : r.casa ? nascerNaArea(r.casa) : null;
    if (m || !r.casa) respawnsPendentes.splice(i, 1);
    else r.quando = agora + 5000; // lugar ocupado/você por perto: tenta de novo daqui a pouco
  }
}

// Quanto tempo até nascer outro no lugar deste
function tempoRespawn(m) {
  if (m.casa && m.casa.respawn) return m.casa.respawn;
  return CONFIG.TEMPO_RESPAWN;
}

function posicaoVisualMonstro(m, agora) {
  const t = Math.min(1, (agora - m.inicioPasso) / (m.passoAtual || TIPOS_MONSTRO[m.tipo].passo));
  return {
    x: m.anteriorX + (m.x - m.anteriorX) * t,
    y: m.anteriorY + (m.y - m.anteriorY) * t,
  };
}
