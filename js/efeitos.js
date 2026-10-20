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
function desenharQuadroEfeito(ef, indice, cx, cy, angulo = 0) {
  const im = img[ef.img];
  if (!im) return;
  const tam = ef.quadro * ef.escala;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (angulo) ctx.rotate(angulo);
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
