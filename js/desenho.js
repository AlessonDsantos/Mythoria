// =====================================================
// desenho.js — Tudo que aparece no canvas do jogo (pixel art)
// A "câmera" segue o jogador: ela diz qual pedaço do mapa
// está visível. As imagens vêm de sprites.js.
// =====================================================

let ctx = null;
const camera = { x: 0, y: 0 }; // canto superior esquerdo visível, em pixels do mundo

function prepararDesenho(canvas) {
  canvas.width = CONFIG.VISAO_COLUNAS * CONFIG.TAMANHO_TILE;
  canvas.height = CONFIG.VISAO_LINHAS * CONFIG.TAMANHO_TILE;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // pixel art nítida
  ctx.lineJoin = 'round';            // contorno dos nomes sem "pontas" (o M ficava com espinhos)
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

// Alguns navegadores (Safari antigo) não têm ctx.filter. Sem ele,
// o efeito (piscar branco, corpo cinza) só não aparece.
const TEM_FILTRO = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
function comFiltro(filtro, desenho) {
  if (TEM_FILTRO && filtro) { ctx.filter = filtro; desenho(); ctx.filter = 'none'; }
  else desenho();
}

// =====================================================
// Terreno
// =====================================================

// Números das peças na folha principal (img/tiles/base.png).
// Para trocar uma peça, ache o número dela na folha e mude aqui.
const PECA = {
  calcada: 290, piso: 288, piso_templo: 307,
  paredeLoja: 457, paredeTemplo: 425,
  balcaoEsq: 688, balcaoMeio: 690, balcaoDir: 689,
  altar: 830, ponte: 276,
  arvores: [40, 41], pedras: [64, 65], flores: [52, 53, 55], tufos: [48, 49, 50, 51],
  fonte: [928, 929, 930, 936, 937, 938, 944, 945, 946], // 3x3
};

// Cerca: qual peça usar conforme os vizinhos que também são cerca.
// Soma: cima=1, direita=2, baixo=4, esquerda=8
const PECA_CERCA = { 0: 191, 1: 185, 2: 188, 3: 186, 4: 177, 5: 176, 6: 178, 7: 189,
                     8: 180, 9: 187, 10: 184, 11: 183, 12: 179, 13: 190, 14: 182, 15: 181 };

const ehTipo = (...tipos) => (x, y) => tipos.includes(pegarTerreno(x, y));
const ladoAgua = ehTipo('agua', 'ponte');
const ladoAreia = ehTipo('areia', 'agua', 'ponte');
const ladoTerra = ehTipo('terra', 'ponte');
const ladoParede = ehTipo('parede');

function desenharGrama(sx, sy) {
  ctx.drawImage(img.grama, 0, 128, 32, 32, sx, sy, 32, 32); // peça 4 = grama cheia
}
function desenharGramaEscura(sx, sy) {
  ctx.drawImage(img.grama_escura, 0, 128, 32, 32, sx, sy, 32, 32);
}

function desenharTile(tipo, x, y, sx, sy, agora) {
  const r = ruido(x, y);
  const escolher = lista => lista[Math.floor(r * lista.length)];

  switch (tipo) {
    case 'grama':
      desenharGrama(sx, sy);
      if (r < 0.07) desenharPeca(PECA.tufos[Math.floor(r / 0.07 * 4)], sx, sy);
      break;
    case 'flor':
      desenharGrama(sx, sy);
      desenharPeca(escolher(PECA.flores), sx, sy);
      break;
    case 'arvore':
      desenharGrama(sx, sy);
      desenharPeca(escolher(PECA.arvores), sx, sy);
      break;
    case 'pedra':
      desenharGrama(sx, sy);
      desenharPeca(escolher(PECA.pedras), sx, sy);
      break;
    case 'terra':
      desenharGrama(sx, sy);
      desenharAutotile(img.terra, 0, x, y, sx, sy, ladoTerra);
      break;
    case 'areia':
      desenharGrama(sx, sy);
      desenharAutotile(img.areia, 0, x, y, sx, sy, ladoAreia);
      break;
    case 'agua':
    case 'ponte': {
      // água animada: 8 quadros, troca a cada 250 ms
      desenharGrama(sx, sy);
      desenharAutotile(img.areia, 0, x, y, sx, sy, ladoAreia);
      desenharAutotile(img.agua, Math.floor(agora / 250) % 8, x, y, sx, sy, ladoAgua);
      if (tipo === 'ponte') desenharPeca(PECA.ponte, sx, sy);
      break;
    }
    case 'cerca': {
      desenharGrama(sx, sy);
      const c = (x2, y2) => pegarTerreno(x2, y2) === 'cerca';
      const soma = (c(x, y - 1) ? 1 : 0) + (c(x + 1, y) ? 2 : 0) + (c(x, y + 1) ? 4 : 0) + (c(x - 1, y) ? 8 : 0);
      desenharPeca(PECA_CERCA[soma], sx, sy);
      break;
    }
    case 'calcada':
      desenharPeca(PECA.calcada, sx, sy);
      break;
    case 'fonte': {
      desenharPeca(PECA.calcada, sx, sy);
      const f = origemFonte(x, y);
      desenharPeca(PECA.fonte[Math.min(2, y - f.y) * 3 + Math.min(2, x - f.x)], sx, sy);
      break;
    }
    // ---------- Floresta Negra e Vila Desolada ----------
    case 'grama_escura':
      desenharGramaEscura(sx, sy);
      if (r < 0.06) desenharPeca(PECA.tufos[Math.floor(r / 0.06 * 4)], sx, sy);
      break;
    case 'arvore_escura':
      desenharGramaEscura(sx, sy);
      desenharPeca(r < 0.8 ? 41 : 40, sx, sy);
      break;
    case 'arvore_morta':
      desenharGramaEscura(sx, sy);
      desenharPeca(43, sx, sy);
      break;
    case 'tumulo':
      desenharGramaEscura(sx, sy);
      desenharPeca(r < 0.5 ? 67 : 68, sx, sy);
      break;
    case 'piso_ruina':
      desenharPeca(322, sx, sy);
      if (r < 0.15) desenharPeca(PECA.tufos[Math.floor(r / 0.15 * 4)], sx, sy);
      break;
    case 'parede_ruina':
      desenharPeca(322, sx, sy);
      if (pegarTerreno(x, y + 1) !== 'parede_ruina') desenharPeca(449, sx, sy);
      else desenharAutotile(img.parede_topo, 0, x, y, sx, sy, ehTipo('parede_ruina'));
      break;
    case 'rocha':
      ctx.drawImage(img.terra, 0, 128, 32, 32, sx, sy, 32, 32);
      desenharPeca(r < 0.7 ? 65 : 64, sx, sy);
      break;
    case 'piso':
      desenharPeca(PECA.piso, sx, sy);
      break;
    case 'piso_templo':
      desenharPeca(PECA.piso_templo, sx, sy);
      break;
    case 'balcao': {
      desenharPeca(PECA.piso, sx, sy);
      const esq = pegarTerreno(x - 1, y) === 'balcao';
      const dir = pegarTerreno(x + 1, y) === 'balcao';
      desenharPeca(!esq ? PECA.balcaoEsq : !dir ? PECA.balcaoDir : PECA.balcaoMeio, sx, sy);
      break;
    }
    case 'altar':
      desenharPeca(PECA.piso_templo, sx, sy);
      desenharPeca(PECA.altar, sx, sy);
      break;
    case 'parede': {
      // Visto de cima, estilo RPG: se embaixo não tem parede, aparece a
      // "frente" (tijolos); se tem, aparece o "topo" escuro da parede.
      if (pegarTerreno(x, y + 1) !== 'parede') {
        const templo = pegarTerreno(x, y - 1) === 'piso_templo' || pegarTerreno(x, y + 1) === 'piso_templo';
        desenharPeca(templo ? PECA.paredeTemplo : PECA.paredeLoja, sx, sy);
      } else {
        desenharAutotile(img.parede_topo, 0, x, y, sx, sy, ladoParede);
      }
      break;
    }
    default:
      desenharGrama(sx, sy);
  }
}

// =====================================================
// Nome e barra de vida (estilo Tibia)
// =====================================================

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

function desenharSombra(cx, y, largura) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(cx, y, largura, 3, 0, 0, Math.PI * 2); ctx.fill();
}

// =====================================================
// Jogador e NPCs
// =====================================================

function desenharJogador(px, py, agora) {
  const T = CONFIG.TAMANHO_TILE;
  const cx = px + T / 2;
  const imagem = img[CLASSES[jogador.classe].sprite];
  const quadro = quadroAndando(estaAndando(agora), agora);
  const arma = armaAtual();
  const d = jogador.direcao;

  // Arma equipada na mão (o ícone do item, pequeno). De costas, fica atrás do corpo.
  const desenharArma = () => {
    if (arma.categoria === 'punho') return;
    const ax = d === 'esquerda' ? px - 3 : d === 'direita' ? px + 19 : d === 'cima' ? px + 1 : px + 17;
    desenharIcone(arma.id, ax, py + 13, 16);
  };

  desenharSombra(cx, py + T - 2, 9);
  if (d === 'cima') desenharArma();
  comFiltro(piscando(jogador.ultimoDano, agora) ? 'brightness(3)' : null,
    () => desenharPersonagem(imagem, d, quadro, px, py));
  if (d !== 'cima') desenharArma();

  desenharNomeEVida(jogador.nome, '#5ce65c', jogador.vida, jogador.vidaMax, cx, py - 1);
}

function desenharNpc(n, sx, sy) {
  const T = CONFIG.TAMANHO_TILE;
  desenharSombra(sx + T / 2, sy + T - 2, 9);
  // NPC do norte olha pra baixo, do sul olha pra cima (para o cliente)
  desenharPersonagem(img[n.sprite], n.atendimento.y > n.y ? 'baixo' : 'cima', 1, sx, sy);
  desenharNome(n.nome, '#6ec6ff', sx + T / 2, sy - 3);
}

// =====================================================
// Monstros
// =====================================================

// Desenha a imagem do monstro em pé no quadrado (sx, sy).
// Dois tipos de imagem:
//   padrão           → folha animada 3x4 (anda nas 4 direções)
//   imagemUnica: true → uma imagem só (o espantalho do campo de treino)
function desenharImagemMonstro(m, sx, sy, agora, morto) {
  const T = CONFIG.TAMANHO_TILE;
  const tipo = TIPOS_MONSTRO[m.tipo];
  const imagem = img[tipo.sprite];
  const andando = !morto && monstroAndando(m, agora);

  ctx.save();
  if (morto) {
    // Corpo: achatado, cinza e meio transparente
    ctx.translate(0, sy + T - 2);
    ctx.scale(1, 0.55);
    ctx.translate(0, -(sy + T - 2));
    ctx.globalAlpha = 0.85;
  }
  const filtro = morto ? 'grayscale(1) brightness(0.55)' : piscando(m.ultimoDano, agora) ? 'brightness(3)' : null;

  comFiltro(filtro, () => {
    if (!tipo.imagemUnica) {
      desenharPersonagem(imagem, m.direcao, quadroAndando(andando, agora), sx, sy);
    } else {
      const pulo = andando ? Math.abs(Math.sin(agora / 90)) * 2 : 0;
      const x = sx + T / 2 - imagem.width / 2;
      const y = sy + T - imagem.height - pulo;
      if (m.direcao === 'esquerda') {
        ctx.translate(sx + T / 2, 0); ctx.scale(-1, 1); ctx.translate(-(sx + T / 2), 0);
      }
      ctx.drawImage(imagem, Math.round(x), Math.round(y));
    }
  });
  ctx.restore();
}

function alturaMonstro(m) {
  const tipo = TIPOS_MONSTRO[m.tipo];
  return tipo.imagemUnica ? img[tipo.sprite].height : img[tipo.sprite].height / 4;
}

// Estrelinha piscando em cima de corpo que ainda tem loot
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

function desenharMonstro(m, sx, sy, agora) {
  const T = CONFIG.TAMANHO_TILE;
  const cx = sx + T / 2;

  if (m.morto) {
    ctx.fillStyle = 'rgba(150,0,0,0.4)'; // mancha de sangue
    ctx.beginPath(); ctx.ellipse(cx + 2, sy + T - 4, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    desenharImagemMonstro(m, sx, sy, agora, true);
    if (!corpoVazio(m)) {
      const a = 0.5 + Math.sin(agora / 200) * 0.5;
      desenharEstrela(cx + 9, sy + 10, 5, 'rgba(255,230,120,' + a + ')', -Math.PI / 2);
    }
    if (m === corpoAberto) {
      ctx.strokeStyle = 'rgba(240,198,116,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
    }
    return;
  }

  desenharSombra(cx, sy + T - 2, 11);
  desenharImagemMonstro(m, sx, sy, agora, false);
  const tipo = TIPOS_MONSTRO[m.tipo];
  desenharNomeEVida(tipo.nome, tipo.chefe ? '#ffa94d' : '#e6e6e6', m.vida, m.vidaMax, cx, sy + T - alturaMonstro(m) - 1);
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

// Projéteis usam o próprio ícone do item, voando e girando
function desenharProjeteis(agora) {
  const T = CONFIG.TAMANHO_TILE;
  for (let i = projeteis.length - 1; i >= 0; i--) {
    const p = projeteis[i];
    const t = (agora - p.inicio) / p.duracao;
    if (t < 0) continue;                                  // ainda não saiu
    if (t >= 1) { projeteis.splice(i, 1); continue; }
    const x = (p.de.x + (p.para.x - p.de.x) * t) * T + T / 2 - camera.x;
    const y = (p.de.y + (p.para.y - p.de.y) * t) * T + T / 2 - camera.y - 8;
    const angulo = Math.atan2(p.para.y - p.de.y, p.para.x - p.de.x);
    if (p.efeito) {
      // projétil animado (gelo, orbe, fogo, flecha da chuva): aponta para onde vai
      const ef = EFEITOS[p.tipo];
      const quadro = Math.floor((agora - p.inicio) / 70) % ef.quadros;
      desenharQuadroEfeito(ef, quadro, x, y, angulo);
      continue;
    }
    if (p.tipo === 'magia') {
      // bola de magia roxa com brilho
      ctx.fillStyle = 'rgba(190,120,255,0.35)';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e2c6ff';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    ctx.save();
    ctx.translate(x, y);
    // shuriken gira; lança e flecha apontam para o alvo (o ícone está "deitado" a 45°)
    ctx.rotate(p.tipo.startsWith('shuriken') ? agora / 60 : angulo + Math.PI / 4);
    desenharIcone(p.tipo, -10, -10, 20);
    ctx.restore();
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

  // 1) Chão e objetos fixos: só os quadrados que aparecem (+1 de margem)
  const x0 = Math.floor(camera.x / T);
  const y0 = Math.floor(camera.y / T);
  for (let y = y0; y <= y0 + CONFIG.VISAO_LINHAS; y++) {
    for (let x = x0; x <= x0 + CONFIG.VISAO_COLUNAS; x++) {
      desenharTile(pegarTerreno(x, y), x, y, x * T - camera.x, y * T - camera.y, agora);
    }
  }

  // Placas das lojas, penduradas na parede ao lado da porta
  for (const p of mapa.pontos.placas || []) desenharPeca(p.peca, p.x * T - camera.x, p.y * T - camera.y);

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
    const sx = Math.round(c.x * T - camera.x);
    const sy = Math.round(c.y * T - camera.y);
    if (c.ehJogador) desenharJogador(sx, sy, agora);
    else if (c.npc) desenharNpc(c.npc, sx, sy);
    else {
      if (c.monstro === jogador.alvo) desenharMarcaAlvo(sx, sy);
      desenharMonstro(c.monstro, sx, sy, agora);
    }
  }

  // 4) Efeitos por cima de tudo
  desenharEfeitos(agora);
  desenharProjeteis(agora);
  desenharTextosFlutuantes(agora);
  desenharTelaDeMorte(agora);
}
