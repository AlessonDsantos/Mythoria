// =====================================================
// efeitos.js — Animações de magia e impacto (só visual)
//
// Cada efeito é uma "tira" de quadros lado a lado em img/efeitos.
// Arte: SpritePilot (CC0), Foozle (CC0) e Pipoya (pilar de luz).
// =====================================================

//   quadro:  tamanho de cada quadro na imagem (px)
//   quadros: quantos quadros a tira tem
//   duracao: quanto tempo a animação inteira leva (ms)
//   escala:  tamanho na tela (1 = original)
//   base:    true = "em pé" no chão do quadrado (pilar, raio); senão, centralizado
const EFEITOS = {
  cura:       { img: 'fx_cura',       quadro: 32, quadros: 8,  duracao: 700, escala: 1.6 },
  pilar:      { img: 'fx_pilar',      quadro: 96, quadros: 10, duracao: 1000, escala: 1, base: true },
  impacto:    { img: 'fx_impacto',    quadro: 32, quadros: 8,  duracao: 420, escala: 1.6 },
  gelo:       { img: 'fx_gelo',       quadro: 32, quadros: 8,  duracao: 400, escala: 1.4 },
  corte:      { img: 'fx_corte',      quadro: 32, quadros: 7,  duracao: 350, escala: 1.7 },
  onda:       { img: 'fx_onda',       quadro: 32, quadros: 8,  duracao: 500, escala: 3.2 },
  orbe:       { img: 'fx_orbe',       quadro: 32, quadros: 8,  duracao: 400, escala: 1 },
  veneno:     { img: 'fx_veneno',     quadro: 32, quadros: 8,  duracao: 800, escala: 2.2 },
  raio:       { img: 'fx_raio',       quadro: 32, quadros: 8,  duracao: 500, escala: 2, base: true },
  flecha:     { img: 'fx_flecha',     quadro: 32, quadros: 4,  duracao: 300, escala: 1 },
  fogo:       { img: 'fx_fogo',       quadro: 64, quadros: 10, duracao: 500, escala: 0.7 },
  explosao:   { img: 'fx_explosao',   quadro: 64, quadros: 7,  duracao: 450, escala: 0.9 },
  lanca_fogo: { img: 'fx_lanca_fogo', quadro: 64, quadros: 12, duracao: 800, escala: 1.1, base: true },
  escudo:     { img: 'fx_escudo',     quadro: 32, quadros: 12, duracao: 1000, escala: 1.5 }, // fúria do Attractio (repete)
  // ---------- v0.11 ----------
  flecha_grande: { img: 'fx_flecha',  quadro: 32, quadros: 4,  duracao: 300, escala: 2.2 },  // a mesma flecha, maior
  agua:       { img: 'fx_agua',       quadro: 64, quadros: 10, duracao: 450, escala: 0.8 },
  tornado:    { img: 'fx_tornado',    quadro: 64, quadros: 9,  duracao: 900, escala: 1.2, base: true },
  espinhos:   { img: 'fx_espinhos',   quadro: 64, quadros: 9,  duracao: 650, escala: 0.9, base: true },
  pedras:     { img: 'fx_pedras',     quadro: 64, quadros: 10, duracao: 600, escala: 0.8 },
  impacto_chao: { img: 'fx_impacto_chao', quadro: 32, quadros: 9, duracao: 500, escala: 2.4, base: true },
  garra:      { img: 'fx_garra',      quadro: 32, quadros: 8,  duracao: 300, escala: 1.6 },
  vento:      { img: 'fx_vento',      quadro: 64, quadros: 10, duracao: 400, escala: 0.6 },
  faisca:     { img: 'fx_faisca',     quadro: 32, quadros: 6,  duracao: 300, escala: 1.2 },
  bola_fogo:  { img: 'fx_bola_fogo',  quadro: 32, quadros: 8,  duracao: 400, escala: 1.1 },
  pilar_azul: { img: 'fx_pilar_azul', quadro: 96, quadros: 10, duracao: 1000, escala: 1, base: true },
  critico:    { img: 'fx_impacto',    quadro: 32, quadros: 8,  duracao: 450, escala: 2.6 },  // golpe crítico (mesma arte do impacto, maior)
  levelup:    { img: 'fx_pilar',      quadro: 96, quadros: 10, duracao: 900, escala: 0.45, base: true }, // brilho discreto ao subir de level
  cuspe:      { img: 'fx_cuspe',      quadro: 32, quadros: 8,  duracao: 400, escala: 0.9 },  // cuspe venenoso (pântano)
  pilar_roxo: { img: 'fx_pilar_roxo', quadro: 96, quadros: 10, duracao: 1000, escala: 1, base: true },
  // ---------- v0.17: bardo (notas desenhadas para o Mythoria) ----------
  // semGiro: o projétil não vira pra direção do tiro (nota de cabeça pra baixo fica estranho)
  nota:        { img: 'fx_nota',        quadro: 32, quadros: 8, duracao: 400, escala: 1, semGiro: true },   // magias do bardo
  nota_grande: { img: 'fx_nota',        quadro: 32, quadros: 8, duracao: 400, escala: 1.6, semGiro: true }, // tiro da flauta
  nota_roxa:   { img: 'fx_nota_roxa',   quadro: 32, quadros: 8, duracao: 400, escala: 1.1, semGiro: true }, // tiro do alaúde (3 em fila)
  bumerangue:  { img: 'fx_bumerangue',  quadro: 32, quadros: 8, duracao: 400, escala: 1.3, semGiro: true }, // (não usado: era o tiro do violino)
  // espelhar: aponta pra onde vai, mas pra esquerda é espelhado (a nota não fica de cabeça pra baixo)
  cordas:      { img: 'fx_cordas',      quadro: 32, quadros: 8, duracao: 400, escala: 1.3, espelhar: true }, // tiro do violino
  onda_som:    { img: 'fx_onda_som',    quadro: 32, quadros: 8, duracao: 500, escala: 3.2 },  // Unda Sonora
  nota_debuff: { img: 'fx_nota_debuff', quadro: 32, quadros: 8, duracao: 800, escala: 1 },    // em cima do monstro enfraquecido
  nota_buff:   { img: 'fx_nota_buff',   quadro: 32, quadros: 8, duracao: 900, escala: 1.3 },  // Cantus Vitae
  dissonancia: { img: 'fx_dissonancia', quadro: 64, quadros: 10, duracao: 750, escala: 2.5 }, // Dissonantia e passiva do bardo (5x5)
  espada_voo:     { img: 'fx_espada_voo',     quadro: 64, quadros: 6, duracao: 300, escala: 0.8 },
  espada_impacto: { img: 'fx_espada_impacto', quadro: 64, quadros: 8, duracao: 400, escala: 1 },
  chuva_espadas: { img: 'fx_chuva_espadas', quadro: 96, quadros: 16, duracao: 1100, escala: 1, base: true },
  // v0.20: cuspe da planta carnívora (desenho do autor): voando (aponta pro alvo) e espirrando no alvo
  cuspe_planta:     { img: 'fx_cuspe_planta',     quadro: 48, quadros: 9, duracao: 630, escala: 0.9 },
  cuspe_planta_fim: { img: 'fx_cuspe_planta_fim', quadro: 48, quadros: 3, duracao: 300, escala: 0.9 },
  espada_giro: { img: 'fx_espada_giro', quadro: 96, quadros: 12, duracao: 600, escala: 1 },
};

const efeitosAtivos = [];

// Toca um efeito no quadrado (x, y). "atraso" em ms (pra sincronizar com um tiro chegando).
function criarEfeito(nome, x, y, agora, atraso = 0) {
  if (!EFEITOS[nome]) return;
  efeitosAtivos.push({ nome, x, y, inicio: agora + atraso });
}

// Projétil animado (gelo, orbe, fogo, flecha da chuva) voando de um quadrado a outro.
// Usa a mesma lista de projéteis do combate; o desenho fica em desenharProjeteis.
function criarProjetilEfeito(nome, de, para, agora, duracao, atraso = 0) {
  projeteis.push({ tipo: nome, efeito: true, de: { x: de.x, y: de.y }, para: { x: para.x, y: para.y }, inicio: agora + atraso, duracao });
}

// Desenha um quadro de um efeito com o centro em (cx, cy) na tela
function desenharQuadroEfeito(ef, indice, cx, cy, angulo = 0, espelho = false) {
  const im = img[ef.img];
  if (!im) return;
  const tam = ef.quadro * ef.escala;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (angulo) ctx.rotate(angulo);
  if (espelho) ctx.scale(-1, 1);
  ctx.drawImage(im, indice * ef.quadro, 0, ef.quadro, ef.quadro, -tam / 2, ef.base ? -tam : -tam / 2, tam, tam);
  ctx.restore();
}

function desenharEfeitos(agora) {
  const T = CONFIG.TAMANHO_TILE;
  for (let i = efeitosAtivos.length - 1; i >= 0; i--) {
    const e = efeitosAtivos[i];
    const ef = EFEITOS[e.nome];
    const idade = agora - e.inicio;
    if (idade < 0) continue;                        // ainda não começou
    if (idade >= ef.duracao) { efeitosAtivos.splice(i, 1); continue; }
    const quadro = Math.min(ef.quadros - 1, Math.floor(idade / ef.duracao * ef.quadros));
    const cx = e.x * T + T / 2 - camera.x;
    const cy = ef.base ? e.y * T + T - camera.y : e.y * T + T / 2 - camera.y;
    desenharQuadroEfeito(ef, quadro, cx, cy);
  }
}
