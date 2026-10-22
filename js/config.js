// =====================================================
// config.js — Configurações gerais do jogo
// Mexa aqui para mudar o "jeito" do jogo sem caçar
// números espalhados pelo código.
// =====================================================

const CONFIG = {
  TAMANHO_TILE: 32,      // tamanho de cada quadrado em pixels
  VISAO_COLUNAS: 15,     // quantos quadrados aparecem na largura (Tibia usa 15)
  VISAO_LINHAS: 11,      // quantos quadrados aparecem na altura (Tibia usa 11)

  // O tamanho e o desenho do mundo vêm do mapa feito no Tiled (mapas/mundo.tmj)

  DURACAO_PASSO: 300,    // milissegundos para andar 1 quadrado no level 1 (menor = mais rápido)
  VELOCIDADE_POR_LEVEL: 0.0068, // cada level deixa o passo 0,68% mais curto...
  VELOCIDADE_MAXIMA: 0.40,      // ...até no máximo 40% mais rápido (por volta do level 60)

  // ---------- Combate ----------
  INTERVALO_ATAQUE: 2000, // tempo entre ataques (jogador e monstros), como no Tibia
  // vida/mana inicial e por level ficam em classes.js
  // Regeneração: só acontece se você NÃO estiver com fome (coma algo!)
  REGEN_VIDA: 3,          // vida recuperada a cada REGEN_INTERVALO
  REGEN_MANA: 2,          // mana recuperada a cada REGEN_INTERVALO
  REGEN_INTERVALO: 10000, // 10 segundos
  FOME_MAX_MIN: 15,       // comer acumula no máximo 15 minutos sem fome
  FOME_INICIAL_MIN: 5,    // personagem novo começa alimentado por 5 minutos
  RAIO_SAIR: 7,           // não dá pra sair do jogo com monstro a essa distância
  PERDA_XP_MORTE: 0.20,   // ao morrer perde 20% da XP que o level pede (sem cair de level)

  // ---------- Monstros ----------
  // Quantos e quais monstros: nas áreas de caça do mapa (Tiled)
  TEMPO_RESPAWN: 30000,   // quanto tempo até nascer outro depois de uma morte (chefes: no mapa)
  TEMPO_CORPO: 60000,     // quanto tempo o corpo fica no chão (dá tempo de saquear)

  // ---------- Inventário e lojas ----------
  ESPACOS_MOCHILA: 20,    // quantos espaços tem a mochila
  MAX_PILHA: 100,         // máximo de itens iguais num espaço só
  INTERVALO_USO: 1000,    // tempo mínimo entre usar comida/poção
  ALCANCE_NPC: 2,         // de quantos quadrados dá pra negociar com um NPC
  OURO_INICIAL: 50,
  ESPACOS_BARRA: 9,       // espaços da barra de ação (teclas 1 a 9)

  // ---------- Baú (Guardião do Baú) ----------
  BAU_INICIAL: 30,        // espaços que todo mundo já tem
  BAU_MAXIMO: 60,         // limite comprando mais
  BAU_PACOTE: 5,          // quantos espaços cada compra adiciona
  BAU_PRECO_BASE: 200,    // 1ª compra custa 200, a 2ª 400, a 3ª 600...

  // ---------- Save ----------
  CHAVE_SAVE: 'mythoria.personagens', // "gaveta" no localStorage com todos os personagens
  CHAVE_INTERFACE: 'mythoria.interface', // painéis minimizados etc.
  INTERVALO_SAVE: 10000,              // salva sozinho a cada 10 segundos
  VERSAO: 'v0.18',
};

// Tipos de terreno.
//   passavel:    dá pra andar por cima?
//   bloqueiaTiro: flechas/lanças não atravessam?
//   mini:        cor no minimapa
const TERRENOS = {
  grama:        { nome: 'Grama',            cor: '#4f8a3c', mini: '#3f7a2f', passavel: true },
  flor:         { nome: 'Flores',           cor: '#4f8a3c', mini: '#3f7a2f', passavel: true },
  terra:        { nome: 'Estrada de terra', cor: '#9b7a4c', mini: '#8a6a3a', passavel: true },
  areia:        { nome: 'Areia',            cor: '#d8c38a', mini: '#c9b47a', passavel: true },
  ponte:        { nome: 'Ponte',            cor: '#7a5230', mini: '#7a5230', passavel: true },
  calcada:      { nome: 'Calçada',          cor: '#8d8d86', mini: '#a3a39c', passavel: true },
  piso:         { nome: 'Piso de madeira',  cor: '#8a6440', mini: '#9a7450', passavel: true },
  piso_templo:  { nome: 'Piso do templo',   cor: '#d8d4c8', mini: '#e8e4d8', passavel: true },
  agua:         { nome: 'Água',             cor: '#2f6fa8', mini: '#2a5f95', passavel: false },
  arvore:       { nome: 'Árvore',           cor: '#3f7530', mini: '#1f4a1a', passavel: false, bloqueiaTiro: true },
  pedra:        { nome: 'Pedra',            cor: '#4f8a3c', mini: '#777777', passavel: false, bloqueiaTiro: true },
  parede:       { nome: 'Parede',           cor: '#5c5c5c', mini: '#3c3c3c', passavel: false, bloqueiaTiro: true },
  cerca:        { nome: 'Paliçada',         cor: '#4f8a3c', mini: '#5a3c20', passavel: false, bloqueiaTiro: true },
  balcao:       { nome: 'Balcão',           cor: '#8a6440', mini: '#5a3c20', passavel: false },
  altar:        { nome: 'Altar',            cor: '#d8d4c8', mini: '#ffffff', passavel: false },
  fonte:        { nome: 'Fonte',            cor: '#8d8d86', mini: '#4a8fd0', passavel: false },
  grama_escura: { nome: 'Grama escura',     cor: '#2f5a24', mini: '#2f5a24', passavel: true },
  arvore_escura:{ nome: 'Árvore',           cor: '#173a14', mini: '#173a14', passavel: false, bloqueiaTiro: true },
  arvore_morta: { nome: 'Árvore morta',     cor: '#5a4a3a', mini: '#5a4a3a', passavel: false, bloqueiaTiro: true },
  tumulo:       { nome: 'Túmulo',           cor: '#888888', mini: '#9a9a9a', passavel: false },
  piso_ruina:   { nome: 'Calçada quebrada', cor: '#6e6a62', mini: '#6e6a62', passavel: true },
  parede_ruina: { nome: 'Ruína',            cor: '#4a4a48', mini: '#4a4a48', passavel: false, bloqueiaTiro: true },
  rocha:        { nome: 'Rocha',            cor: '#6b6b6b', mini: '#5a5a5c', passavel: false, bloqueiaTiro: true },
  // ---------- Pântano e Montanha do Norte ----------
  lama:         { nome: 'Lama',             cor: '#60502f', mini: '#604e30', passavel: true },
  agua_pantano: { nome: 'Água parada',      cor: '#3a5c34', mini: '#3a5c34', passavel: false },
  chao_rocha:   { nome: 'Chão de pedra',    cor: '#969891', mini: '#969891', passavel: true },
  pinheiro:     { nome: 'Pinheiro',         cor: '#1e4628', mini: '#1e4628', passavel: false, bloqueiaTiro: true },
  // ---------- v0.15: Forest Pack ----------
  arbusto:      { nome: 'Arbusto',          cor: '#4f8a3c', mini: '#34642a', passavel: false },
  toco:         { nome: 'Toco de árvore',   cor: '#4f8a3c', mini: '#6e5032', passavel: false },
};

// As duas skills de combate.
//   melee:    espadas, machados e clavas (e soco)
//   distance: shurikens, lanças e arcos
const SKILLS = {
  melee:    { nome: 'Melee' },
  distance: { nome: 'Distance' },
  magia:    { nome: 'Magic Level' },  // sobe gastando mana e atacando com cajado; aumenta o dano das magias do mago
};

// Direções: quanto muda em x e y para cada lado.
const DIRECOES = {
  cima:     { dx: 0,  dy: -1 },
  baixo:    { dx: 0,  dy: 1 },
  esquerda: { dx: -1, dy: 0 },
  direita:  { dx: 1,  dy: 0 },
};

// Distância "estilo Tibia": diagonal também conta como 1
function distancia(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function aleatorioInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
