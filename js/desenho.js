// =====================================================
// desenho.js — Tudo que aparece no canvas do jogo
// A "câmera" segue o jogador: ela diz qual pedaço do
// mapa está visível.
// =====================================================

let ctx = null;
const camera = { x: 0, y: 0 }; // canto superior esquerdo visível, em pixels do mundo

function prepararDesenho(canvas) {
  canvas.width = CONFIG.VISAO_COLUNAS * CONFIG.TAMANHO_TILE;
  canvas.height = CONFIG.VISAO_LINHAS * CONFIG.TAMANHO_TILE;
  ctx = canvas.getContext('2d');
}

// Converte um ponto do canvas para o quadrado do mapa
function pixelParaTile(px, py) {
  const T = CONFIG.TAMANHO_TILE;
  return { x: Math.floor((px + camera.x) / T), y: Math.floor((py + camera.y) / T) };
}

// Número "aleatório" fixo por quadrado, para variar detalhes sem piscar
function ruido(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// =====================================================
// Terreno
// =====================================================

// Terreno que fica "por baixo" de objetos (árvore em cima de grama etc.)
const FUNDO_DO_TERRENO = { arvore: 'grama', pedra: 'grama', flor: 'grama', cerca: 'grama', balcao: 'piso', altar: 'piso_templo' };

function desenharTile(tipo, x, y, sx, sy, agora) {
  const T = CONFIG.TAMANHO_TILE;
  const r = ruido(x, y);

  const base = FUNDO_DO_TERRENO[tipo] || tipo;
  ctx.fillStyle = TERRENOS[base].cor;
  ctx.fillRect(sx, sy, T, T);

  // Leve variação de cor por quadrado (menos em pisos lisos)
  if (base !== 'piso_templo') {
    ctx.fillStyle = r < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(sx, sy, T, T);
  }

  switch (tipo) {
    case 'grama':
      ctx.fillStyle = 'rgba(30,70,20,0.5)';
      for (let i = 0; i < 3; i++) {
        const gx = sx + ruido(x + i, y * 3) * (T - 4);
        const gy = sy + ruido(x * 5, y + i) * (T - 6);
        ctx.fillRect(gx, gy, 2, 5);
      }
      break;

    case 'flor': {
      const cores = ['#f2e35b', '#e86a6a', '#e9e9f5', '#c58ae8'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = cores[Math.floor(ruido(x + i, y) * cores.length)];
        const fx = sx + 5 + ruido(x * 2 + i, y) * (T - 10);
        const fy = sy + 5 + ruido(x, y * 2 + i) * (T - 10);
        ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }

    case 'terra':
      ctx.fillStyle = 'rgba(70,50,25,0.35)';
      ctx.fillRect(sx + r * 20, sy + 6, 4, 3);
      ctx.fillRect(sx + 6, sy + ruido(y, x) * 22, 3, 3);
      break;

    case 'areia':
      ctx.fillStyle = 'rgba(150,120,60,0.35)';
      ctx.fillRect(sx + r * 24, sy + ruido(y, x) * 24, 2, 2);
      break;

    case 'agua': {
      // Ondinhas que se mexem com o tempo
      const onda = Math.sin(agora / 600 + x * 0.9 + y * 0.6) * 3;
      ctx.strokeStyle = 'rgba(200,230,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 6 + onda, sy + 12);
      ctx.lineTo(sx + 16 + onda, sy + 12);
      ctx.moveTo(sx + 14 - onda, sy + 22);
      ctx.lineTo(sx + 24 - onda, sy + 22);
      ctx.stroke();
      break;
    }

    case 'ponte':
      ctx.fillStyle = '#5c3b1e';
      for (let i = 0; i < 4; i++) ctx.fillRect(sx, sy + i * 8 + 6, T, 1.5);
      break;

    case 'calcada':
      // Pedras do calçamento, desencontradas por linha
      ctx.strokeStyle = 'rgba(40,40,40,0.35)';
      ctx.lineWidth = 1;
      for (let linha = 0; linha < 4; linha++) {
        const yy = sy + linha * 8;
        ctx.beginPath(); ctx.moveTo(sx, yy + 0.5); ctx.lineTo(sx + T, yy + 0.5); ctx.stroke();
        const desloc = (linha + y) % 2 === 0 ? 0 : 8;
        for (let xx = desloc; xx < T; xx += 16) {
          ctx.beginPath(); ctx.moveTo(sx + xx + 0.5, yy); ctx.lineTo(sx + xx + 0.5, yy + 8); ctx.stroke();
        }
      }
      break;

    case 'piso':
    case 'balcao':
      // Tábuas de madeira
      ctx.strokeStyle = 'rgba(60,35,15,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(sx, sy + i * 8 + 0.5); ctx.lineTo(sx + T, sy + i * 8 + 0.5); ctx.stroke();
      }
      if (tipo === 'balcao') {
        ctx.fillStyle = '#5a3a1c';
        ctx.fillRect(sx, sy + 6, T, 20);
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(sx, sy + 6, T, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(sx, sy + 26, T, 3);
      }
      break;

    case 'piso_templo':
    case 'altar':
      ctx.strokeStyle = 'rgba(120,110,90,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, T / 2, T / 2);
      ctx.strokeRect(sx + T / 2 + 0.5, sy + T / 2 + 0.5, T / 2 - 1, T / 2 - 1);
      if (tipo === 'altar') {
        ctx.fillStyle = '#b8b0a0';
        ctx.fillRect(sx + 4, sy + 10, T - 8, 18);
        ctx.fillStyle = '#efe9dc';
        ctx.fillRect(sx + 2, sy + 8, T - 4, 6);
        // chama
        const f = Math.sin(agora / 120) * 1.5;
        ctx.fillStyle = '#ffb030';
        ctx.beginPath(); ctx.ellipse(sx + T / 2, sy + 4, 3 + f * 0.3, 5 + f, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3a0';
        ctx.beginPath(); ctx.ellipse(sx + T / 2, sy + 5, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      break;

    case 'parede':
      // Tijolos com um "topo" mais claro para dar volume
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = '#6e6e6e';
      for (let linha = 0; linha < 4; linha++) {
        const desloc = linha % 2 === 0 ? 0 : 8;
        for (let xx = -desloc; xx < T; xx += 16) {
          ctx.fillRect(sx + Math.max(0, xx) + 1, sy + linha * 8 + 1, Math.min(14, T - Math.max(0, xx) - 1), 6);
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(sx, sy, T, 3);
      break;

    case 'cerca':
      // Paliçada: estacas de madeira pontudas
      for (let i = 0; i < 4; i++) {
        const ex = sx + i * 8 + 1;
        ctx.fillStyle = i % 2 ? '#6b4a2a' : '#7a5632';
        ctx.fillRect(ex, sy + 8, 6, T - 10);
        ctx.beginPath(); ctx.moveTo(ex, sy + 8); ctx.lineTo(ex + 3, sy + 2); ctx.lineTo(ex + 6, sy + 8); ctx.fill();
      }
      ctx.fillStyle = '#4a3020';
      ctx.fillRect(sx, sy + 14, T, 3);
      ctx.fillRect(sx, sy + 24, T, 3);
      break;

    case 'pedra':
      ctx.fillStyle = '#7d7d7d';
      ctx.beginPath(); ctx.ellipse(sx + T / 2, sy + T / 2 + 3, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a3a3a3';
      ctx.beginPath(); ctx.ellipse(sx + T / 2 - 3, sy + T / 2, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      break;

    case 'arvore':
      // sombra, tronco e copa
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(sx + T / 2, sy + T - 4, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(sx + T / 2 - 3, sy + T / 2, 6, T / 2 - 4);
      ctx.fillStyle = r < 0.5 ? '#2d5e25' : '#356b2a';
      ctx.beginPath(); ctx.arc(sx + T / 2, sy + T / 2 - 2, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.arc(sx + T / 2 - 4, sy + T / 2 - 6, 6, 0, Math.PI * 2); ctx.fill();
      break;
  }
}

// =====================================================
// Coisas em cima das criaturas
// =====================================================

// Barra de vida estilo Tibia: verde → amarelo → vermelho
function corDaVida(pct) {
  if (pct > 0.6) return '#3fcf3f';
  if (pct > 0.3) return '#e0c53a';
  return '#e04040';
}

function desenharNome(nome, cor, cx, y) {
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  ctx.strokeText(nome, cx, y);
  ctx.fillStyle = cor;
  ctx.fillText(nome, cx, y);
}

function desenharNomeEVida(nome, corNome, vida, vidaMax, cx, topo) {
  desenharNome(nome, corNome, cx, topo - 6);
  const pct = Math.max(0, vida / vidaMax);
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - 14, topo - 3, 28, 4);
  ctx.fillStyle = corDaVida(pct);
  ctx.fillRect(cx - 13, topo - 2, 26 * pct, 2);
}

// Pisca em branco logo depois de levar dano
function piscando(ultimoDano, agora) {
  return agora - ultimoDano >= 0 && agora - ultimoDano < 150;
}

// =====================================================
// Pessoas (jogador e NPCs usam o mesmo boneco)
//   cores: { tunica, calca, botas, cabelo, chapeu, capacete, avental }
// =====================================================

function desenharHumano(cx, base, direcao, cores, flash) {
  const pele = flash ? '#ffffff' : '#f1c9a0';

  // pernas (calça) e pés (botas)
  ctx.fillStyle = cores.calca || '#3d2b1a';
  ctx.fillRect(cx - 6, base - 3, 4, 3);
  ctx.fillRect(cx + 2, base - 3, 4, 3);
  ctx.fillStyle = cores.botas || '#2a1d12';
  ctx.fillRect(cx - 6, base, 4, 2);
  ctx.fillRect(cx + 2, base, 4, 2);

  // corpo
  ctx.fillStyle = flash ? '#ffffff' : (cores.tunica || '#2e5aa8');
  ctx.fillRect(cx - 7, base - 15, 14, 12);
  if (cores.avental) {
    ctx.fillStyle = cores.avental;
    ctx.fillRect(cx - 4, base - 12, 8, 9);
  }
  // cinto
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(cx - 7, base - 8, 14, 2);

  // cabeça
  ctx.fillStyle = pele;
  ctx.beginPath(); ctx.arc(cx, base - 20, 6, 0, Math.PI * 2); ctx.fill();

  // cabelo, chapéu ou capacete
  if (cores.capacete) {
    ctx.fillStyle = cores.capacete;
    ctx.beginPath(); ctx.arc(cx, base - 21, 7, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 7, base - 22, 14, 3);
  } else if (cores.chapeu) {
    ctx.fillStyle = cores.chapeu;
    ctx.beginPath(); ctx.moveTo(cx - 9, base - 23); ctx.lineTo(cx, base - 36); ctx.lineTo(cx + 9, base - 23); ctx.fill();
  } else {
    ctx.fillStyle = cores.cabelo || '#5a3a1c';
    ctx.beginPath(); ctx.arc(cx, base - 22, 6, Math.PI, 0); ctx.fill();
  }

  // olhos indicam a direção
  ctx.fillStyle = '#222';
  if (direcao === 'baixo') { ctx.fillRect(cx - 3, base - 20, 2, 2); ctx.fillRect(cx + 1, base - 20, 2, 2); }
  if (direcao === 'esquerda') ctx.fillRect(cx - 4, base - 20, 2, 2);
  if (direcao === 'direita') ctx.fillRect(cx + 2, base - 20, 2, 2);
  // 'cima': de costas, sem olhos
}

function desenharJogador(px, py, progresso, agora) {
  const T = CONFIG.TAMANHO_TILE;
  const cx = px + T / 2;
  // "Pulinho" enquanto anda
  const pulo = progresso < 1 ? Math.sin(progresso * Math.PI) * 3 : 0;
  const base = py + T - 5 - pulo;

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx, py + T - 3, 9, 3, 0, 0, Math.PI * 2); ctx.fill();

  // As cores mudam conforme o equipamento vestido
  const eq = jogador.equip;
  const cor = espaco => eq[espaco] ? ITENS[eq[espaco].id].cor : null;
  desenharHumano(cx, base, jogador.direcao, {
    tunica: cor('armadura') || CLASSES[jogador.classe].corTunica,
    calca: cor('calca') || '#3d2b1a',
    botas: cor('botas') || '#2a1d12',
    capacete: cor('capacete'),
  }, piscando(jogador.ultimoDano, agora));

  desenharArmaNaMao(cx, base, jogador.direcao, armaAtual());
  desenharNomeEVida(jogador.nome, '#5ce65c', jogador.vida, jogador.vidaMax, cx, base - 28);
}

// Desenho simples da arma equipada ao lado do corpo
function desenharArmaNaMao(cx, base, direcao, arma) {
  if (arma.categoria === 'punho') return;
  const lado = direcao === 'esquerda' ? -1 : 1;
  const metal = arma.cor || '#c9ced6';
  ctx.save();
  ctx.translate(cx + 9 * lado, base - 11);
  ctx.scale(lado, 1);

  switch (arma.categoria) {
    case 'espada':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-1, -2, 2, 6);
      ctx.fillStyle = metal; ctx.fillRect(-1, -14, 2, 12);
      ctx.fillStyle = '#b08d3c'; ctx.fillRect(-3, -3, 6, 2);
      break;
    case 'machado':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-1, -13, 2, 17);
      ctx.fillStyle = metal;
      ctx.beginPath(); ctx.moveTo(1, -13); ctx.lineTo(7, -15); ctx.lineTo(7, -6); ctx.lineTo(1, -8); ctx.fill();
      break;
    case 'clava':
      ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-1, -4, 2, 8);
      ctx.fillStyle = metal;
      ctx.beginPath(); ctx.ellipse(0, -9, 3.5, 6, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'arremesso':
      if (arma.id === 'lanca') {
        ctx.fillStyle = '#7a5230'; ctx.fillRect(-1, -18, 2, 24);
        ctx.fillStyle = '#c9ced6';
        ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(0, -25); ctx.lineTo(3, -18); ctx.fill();
      } else {
        desenharEstrela(0, -2, 4, '#b9bec6');
      }
      break;
    case 'arco':
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-4, -4, 9, -Math.PI / 2.4, Math.PI / 2.4); ctx.stroke();
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(-1, 4); ctx.stroke();
      break;
  }
  ctx.restore();
}

function desenharEstrela(x, y, raio, cor, rotacao = 0) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? raio : raio * 0.35;
    const ang = rotacao + (i / 8) * Math.PI * 2;
    ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
  }
  ctx.fill();
}

function desenharNpc(n, sx, sy) {
  const T = CONFIG.TAMANHO_TILE;
  const cx = sx + T / 2;
  const base = sy + T - 5;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(cx, sy + T - 3, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  // NPC do norte olha pra baixo, do sul olha pra cima
  const direcao = n.atendimento.y > n.y ? 'baixo' : 'cima';
  desenharHumano(cx, base, direcao, n.cores, false);
  desenharNome(n.nome, '#6ec6ff', cx, base - 31);
}

// =====================================================
// Monstros
// =====================================================

function desenharCorpoMonstro(tipo, cx, base, direcao, flash, morto) {
  const lado = direcao === 'esquerda' ? -1 : 1;
  ctx.save();
  ctx.translate(cx, base);
  ctx.scale(lado, 1);
  if (morto) { ctx.globalAlpha = 0.75; ctx.scale(1, 0.6); }
  const pinta = (vivo, corMorto) => flash ? '#fff' : (morto ? corMorto : vivo);

  if (tipo === 'rato') {
    ctx.strokeStyle = '#d98c9a'; ctx.lineWidth = 1.5; // rabo
    ctx.beginPath(); ctx.moveTo(-7, -4); ctx.quadraticCurveTo(-14, -2, -13, -9); ctx.stroke();
    ctx.fillStyle = pinta('#8a8a8a', '#5e5e5e');
    ctx.beginPath(); ctx.ellipse(0, -5, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -7, 4, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d98c9a';
    ctx.beginPath(); ctx.arc(6, -11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillRect(8, -8, 1.5, 1.5);

  } else if (tipo === 'cobra') {
    ctx.strokeStyle = pinta('#5ea83a', '#3c5a2a');
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -3);
    ctx.quadraticCurveTo(-6, -11, -1, -4);
    ctx.quadraticCurveTo(4, 3, 8, -6);
    ctx.stroke();
    ctx.fillStyle = pinta('#4c8f2c', '#3c5a2a');
    ctx.beginPath(); ctx.ellipse(9, -9, 4.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffdd33'; ctx.fillRect(10, -10, 1.5, 1.5);
    ctx.strokeStyle = '#d33'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(16, -9); ctx.stroke();

  } else if (tipo === 'lobo') {
    ctx.fillStyle = pinta('#7a6b5a', '#4d443a');
    ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(-16, -15); ctx.lineTo(-11, -7); ctx.fill(); // rabo
    ctx.beginPath(); ctx.ellipse(-1, -8, 11, 6, 0, 0, Math.PI * 2); ctx.fill();          // corpo
    ctx.fillRect(-8, -4, 3, 6); ctx.fillRect(5, -4, 3, 6);                                // patas
    ctx.beginPath(); ctx.ellipse(10, -13, 5, 4.5, 0, 0, Math.PI * 2); ctx.fill();        // cabeça
    ctx.beginPath(); ctx.moveTo(13, -14); ctx.lineTo(18, -11); ctx.lineTo(13, -10); ctx.fill(); // focinho
    ctx.beginPath(); ctx.moveTo(7, -16); ctx.lineTo(9, -22); ctx.lineTo(11, -16); ctx.fill();   // orelha
    ctx.fillStyle = '#ffcc33'; ctx.fillRect(12, -15, 1.5, 1.5);

  } else if (tipo === 'urso') {
    ctx.fillStyle = pinta('#6b4428', '#43301f');
    ctx.beginPath(); ctx.ellipse(-2, -11, 14, 10, 0, 0, Math.PI * 2); ctx.fill();         // corpo grande
    ctx.fillRect(-12, -5, 5, 7); ctx.fillRect(4, -5, 5, 7);                              // patas
    ctx.beginPath(); ctx.arc(11, -16, 7, 0, Math.PI * 2); ctx.fill();                    // cabeça
    ctx.beginPath(); ctx.arc(8, -23, 2.8, 0, Math.PI * 2); ctx.fill();                   // orelhas
    ctx.beginPath(); ctx.arc(14, -23, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#a07850';                                          // focinho
    ctx.beginPath(); ctx.ellipse(16, -14, 3.5, 2.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillRect(18, -15, 2, 2); ctx.fillRect(12, -18, 2, 2);

  } else if (tipo === 'tigre') {
    const cor = pinta('#e08a2c', '#8a5a2a');
    ctx.fillStyle = cor;
    ctx.strokeStyle = cor; ctx.lineWidth = 2.5;                                          // rabo
    ctx.beginPath(); ctx.moveTo(-11, -9); ctx.quadraticCurveTo(-18, -10, -16, -18); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-1, -9, 12, 6, 0, 0, Math.PI * 2); ctx.fill();          // corpo
    ctx.fillRect(-9, -5, 3, 7); ctx.fillRect(5, -5, 3, 7);                               // patas
    ctx.beginPath(); ctx.arc(11, -13, 5.5, 0, Math.PI * 2); ctx.fill();                  // cabeça
    ctx.beginPath(); ctx.moveTo(7, -16); ctx.lineTo(8, -21); ctx.lineTo(11, -17); ctx.fill(); // orelha
    if (!flash) {
      ctx.fillStyle = '#1a1a1a';                                                         // listras
      for (const lx of [-8, -3, 2, 7]) ctx.fillRect(lx, -14, 2, 7);
      ctx.fillRect(10, -18, 1.5, 3); ctx.fillRect(13, -18, 1.5, 3);
      ctx.fillStyle = '#f5ead8';
      ctx.beginPath(); ctx.ellipse(14, -11, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7cff4a'; ctx.fillRect(13, -15, 1.5, 1.5);
    }
  }

  ctx.restore();

  if (morto) {
    ctx.fillStyle = 'rgba(150,0,0,0.45)'; // mancha de sangue
    ctx.beginPath(); ctx.ellipse(cx + 2, base - 1, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// Estrelinha piscando em cima de corpo que ainda tem loot
function desenharBrilhoLoot(x, y, agora) {
  const a = 0.5 + Math.sin(agora / 200) * 0.5;
  desenharEstrela(x + 8, y - 6, 5, 'rgba(255,230,120,' + a + ')', -Math.PI / 2);
}

function desenharMonstro(m, sx, sy, agora) {
  const T = CONFIG.TAMANHO_TILE;
  const cx = sx + T / 2;
  const base = sy + T - 4;

  if (!m.morto) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, sy + T - 3, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  desenharCorpoMonstro(m.tipo, cx, base, m.direcao, piscando(m.ultimoDano, agora), m.morto);
  if (m.morto && !corpoVazio(m)) desenharBrilhoLoot(cx, base - 10, agora);
  if (m === corpoAberto) {
    ctx.strokeStyle = 'rgba(240,198,116,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
  }
  if (!m.morto) {
    const grande = m.tipo === 'urso';
    desenharNomeEVida(TIPOS_MONSTRO[m.tipo].nome, '#e6e6e6', m.vida, m.vidaMax, cx, sy - 2 - (grande ? 6 : 0));
  }
}

// =====================================================
// Marcas, projéteis e textos
// =====================================================

// Quadrado vermelho em volta do alvo, como no Tibia
function desenharMarcaAlvo(sx, sy) {
  const T = CONFIG.TAMANHO_TILE;
  ctx.strokeStyle = '#ff2b2b';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
}

function desenharMarcaDestino(agora) {
  if (!jogador.destino) return;
  const T = CONFIG.TAMANHO_TILE;
  const sx = jogador.destino.x * T - camera.x;
  const sy = jogador.destino.y * T - camera.y;
  const pulso = 2 + Math.sin(agora / 150) * 2;
  ctx.strokeStyle = 'rgba(255,230,120,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + pulso, sy + pulso, T - pulso * 2, T - pulso * 2);
}

function desenharProjeteis(agora) {
  const T = CONFIG.TAMANHO_TILE;
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    const t = (agora - p.inicio) / p.duracao;
    if (t >= 1) { projeteis.splice(i, 1); continue; }
    const x = (p.de.x + (p.para.x - p.de.x) * t) * T + T / 2 - camera.x;
    const y = (p.de.y + (p.para.y - p.de.y) * t) * T + T / 2 - camera.y - 8;
    const angulo = Math.atan2(p.para.y - p.de.y, p.para.x - p.de.x);

    if (p.tipo === 'shuriken') {
      desenharEstrela(x, y, 5, '#d0d4da', agora / 40);
    } else {
      // lança e flechas: um risco apontado para o alvo
      const comp = p.tipo === 'lanca' ? 16 : 11;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angulo);
      ctx.fillStyle = p.tipo === 'lanca' ? '#7a5230' : '#c8a060';
      ctx.fillRect(-comp, -1, comp, 2);
      ctx.fillStyle = '#d8dde4';
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(5, 0); ctx.lineTo(0, 3); ctx.fill();
      ctx.restore();
    }
  }
}

function desenharTextosFlutuantes(agora) {
  const T = CONFIG.TAMANHO_TILE;
  const DURACAO = 1000;
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  for (let i = textosFlutuantes.length - 1; i >= 0; i--) {
    const t = textosFlutuantes[i];
    const idade = agora - t.inicio;
    if (idade < 0) continue;              // ainda vai aparecer
    if (idade > DURACAO) { textosFlutuantes.splice(i, 1); continue; }
    const subida = (idade / DURACAO) * 20;
    const x = t.x * T + T / 2 - camera.x;
    const y = t.y * T - camera.y - 10 - subida;
    ctx.globalAlpha = 1 - idade / DURACAO;
    ctx.strokeStyle = '#000';
    ctx.strokeText(t.texto, x, y);
    ctx.fillStyle = t.cor;
    ctx.fillText(t.texto, x, y);
  }
  ctx.globalAlpha = 1;
}

function desenharTelaDeMorte(agora) {
  const idade = agora - jogador.morreuEm;
  if (idade > 2500) return;
  const canvas = ctx.canvas;
  ctx.fillStyle = 'rgba(120,0,0,' + (0.5 * (1 - idade / 2500)) + ')';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1 - idade / 2500;
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000';
  ctx.strokeText('Você morreu', canvas.width / 2, canvas.height / 2 - 40);
  ctx.fillStyle = '#ff6060';
  ctx.fillText('Você morreu', canvas.width / 2, canvas.height / 2 - 40);
  ctx.globalAlpha = 1;
}

// =====================================================
// Quadro completo
// =====================================================

function desenhar(agora) {
  const T = CONFIG.TAMANHO_TILE;
  const canvas = ctx.canvas;
  const vis = posicaoVisual(agora);

  // Câmera centralizada no jogador
  camera.x = Math.round(vis.x * T + T / 2 - canvas.width / 2);
  camera.y = Math.round(vis.y * T + T / 2 - canvas.height / 2);

  // 1) Chão: só os quadrados que aparecem (+1 de margem pela animação)
  const x0 = Math.floor(camera.x / T);
  const y0 = Math.floor(camera.y / T);
  for (let y = y0; y <= y0 + CONFIG.VISAO_LINHAS; y++) {
    for (let x = x0; x <= x0 + CONFIG.VISAO_COLUNAS; x++) {
      desenharTile(pegarTerreno(x, y), x, y, x * T - camera.x, y * T - camera.y, agora);
    }
  }

  const naTela = (x, y) => Math.abs(x - vis.x) <= 9 && Math.abs(y - vis.y) <= 7;

  // 2) Corpos ficam no chão, embaixo de todo mundo
  for (const m of monstros) {
    if (m.morto && naTela(m.x, m.y)) desenharMonstro(m, m.x * T - camera.x, m.y * T - camera.y, agora);
  }

  desenharMarcaDestino(agora);

  // 3) Criaturas e pessoas, de cima pra baixo (quem está mais embaixo aparece na frente)
  const lista = [{ ehJogador: true, x: vis.x, y: vis.y }];
  for (const n of npcs) if (naTela(n.x, n.y)) lista.push({ npc: n, x: n.x, y: n.y });
  for (const m of monstros) {
    if (m.morto) continue;
    const p = posicaoVisualMonstro(m, agora);
    if (naTela(p.x, p.y)) lista.push({ monstro: m, x: p.x, y: p.y });
  }
  lista.sort((a, b) => a.y - b.y);

  for (const c of lista) {
    const sx = c.x * T - camera.x;
    const sy = c.y * T - camera.y;
    if (c.ehJogador) desenharJogador(sx, sy, vis.progresso, agora);
    else if (c.npc) desenharNpc(c.npc, sx, sy);
    else {
      if (c.monstro === jogador.alvo) desenharMarcaAlvo(sx, sy);
      desenharMonstro(c.monstro, sx, sy, agora);
    }
  }

  // 4) Efeitos por cima de tudo
  desenharProjeteis(agora);
  desenharTextosFlutuantes(agora);
  desenharTelaDeMorte(agora);
}
