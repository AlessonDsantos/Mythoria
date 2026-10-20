// =====================================================
// config.js — Configurações gerais do jogo
// Mexa aqui para mudar o "jeito" do jogo sem caçar
// números espalhados pelo código.
// =====================================================

const CONFIG = {
  TAMANHO_TILE: 32,      // tamanho de cada quadrado em pixels
  VISAO_COLUNAS: 15,     // quantos quadrados aparecem na largura (Tibia usa 15)
  VISAO_LINHAS: 11,      // quantos quadrados aparecem na altura (Tibia usa 11)

  LARGURA_MAPA: 96,      // tamanho do mundo em quadrados
  ALTURA_MAPA: 96,
  SEMENTE_MAPA: 12345,   // mude este número e o mapa gerado muda inteiro

  DURACAO_PASSO: 220,    // milissegundos para andar 1 quadrado (menor = mais rápido)

  // ---------- Combate ----------
  INTERVALO_ATAQUE: 2000, // tempo entre ataques (jogador e monstros), como no Tibia
  // vida/mana inicial e por level ficam em classes.js
  REGEN_VIDA: 2,          // vida recuperada a cada REGEN_INTERVALO
  REGEN_MANA: 2,          // mana recuperada a cada REGEN_INTERVALO
  REGEN_INTERVALO: 3000,
  RAIO_SAIR: 7,           // não dá pra sair do jogo com monstro a essa distância
  PERDA_XP_MORTE: 0.10,   // ao morrer perde 10% do XP (sem perder level)

  // ---------- Monstros ----------
  MAX_MONSTROS: 90,       // quantos monstros vivos no mapa ao mesmo tempo
  TEMPO_RESPAWN: 30000,   // quanto tempo até nascer outro depois de uma morte
  TEMPO_CORPO: 60000,     // quanto tempo o corpo fica no chão (dá tempo de saquear)

  // ---------- Inventário e lojas ----------
  ESPACOS_MOCHILA: 20,    // quantos espaços tem a mochila
  MAX_PILHA: 100,         // máximo de itens iguais num espaço só
  INTERVALO_USO: 1000,    // tempo mínimo entre usar comida/poção
  ALCANCE_NPC: 2,         // de quantos quadrados dá pra negociar com um NPC
  OURO_INICIAL: 50,
  ESPACOS_BARRA: 8,       // espaços da barra de ação (teclas 1 a 8)

  // ---------- Save ----------
  CHAVE_SAVE: 'mythoria.personagens', // "gaveta" no localStorage com todos os personagens
  CHAVE_INTERFACE: 'mythoria.interface', // painéis minimizados etc.
  INTERVALO_SAVE: 10000,              // salva sozinho a cada 10 segundos
  VERSAO: 'v0.7',
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
};

// As duas skills de combate.
//   melee:    espadas, machados e clavas (e soco)
//   distance: shurikens, lanças e arcos
const SKILLS = {
  melee:    { nome: 'Melee' },
  distance: { nome: 'Distance' },
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
