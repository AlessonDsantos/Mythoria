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
const ladoLama = ehTipo('lama', 'agua_pantano');
const ladoAguaPantano = ehTipo('agua_pantano');
const ladoRocha = (x, y) => { const t = pegarTerreno(x, y); return t === 'chao_rocha' || t === 'rocha' || t === 'pinheiro'; };
// Chão de pedra da montanha; na beira com a grama a pedra "arredonda" (autotile)
function desenharChaoRocha(sx, sy, x, y) {
  desenharGrama(sx, sy);
  desenharAutotile(img.chao_rocha, 0, x, y, sx, sy, ladoRocha);
}

function desenharGrama(sx, sy) {
  ctx.drawImage(img.grama, 0, 128, 32, 32, sx, sy, 32, 32); // peça 4 = grama cheia
}
function desenharGramaEscura(sx, sy) {
  ctx.drawImage(img.grama_escura, 0, 128, 32, 32, sx, sy, 32, 32);
}

// ---------- Forest Pack (v0.15) ----------
// img/tiles/floresta.png: uma tira de peças 32x32, nesta ordem
const FLORESTA = { arbustos: [0, 1], tocos: [2, 3], pedras: [4, 5, 6, 7, 8], gramas: [9, 10, 11, 12], flores: [13, 14], arbustosEscuros: [15, 16] };
function desenharFloresta(i, sx, sy) {
  ctx.drawImage(img.floresta, i * 32, 0, 32, 32, sx, sy, 32, 32);
}
// img/tiles/arvores.png: 0 folhosa, 1 pinheiro, 2 folhosa escura, 3 pinheiro escuro, 4 pinheiro nevado, 5 folhosa de outono
const TIPOS_ARVORE_GRANDE = { arvore: true, arvore_escura: true, pinheiro: true };
function varianteArvore(tipo, x, y) {
  const r = ruido(x + 7, y + 3);
  if (tipo === 'pinheiro') return r < 0.75 ? 4 : 1;
  if (tipo === 'arvore_escura') return r < 0.6 ? 2 : 3;
  return r < 0.62 ? 0 : r < 0.92 ? 1 : 5;
}
// A árvore é desenhada "em pé" no quadrado do tronco, junto com os personagens (ordem por altura).
// Se o jogador estiver escondido atrás da copa, ela fica meio transparente.
function desenharArvoreGrande(variante, x, y, sx, sy, vis) {
  const atras = vis.y < y && vis.y > y - 2.6 && Math.abs(vis.x - x) < 1.3;
  ctx.save();
  if (atras) ctx.globalAlpha = 0.55;
  ctx.drawImage(img.arvores, variante * 64, 0, 64, 96, sx - 16, sy + 32 - 96 + 2, 64, 96);
  ctx.restore();
}

function desenharTile(tipo, x, y, sx, sy, agora) {
  const r = ruido(x, y);
  const escolher = lista => lista[Math.floor(r * lista.length)];

  switch (tipo) {
    case 'grama':
      desenharGrama(sx, sy);
      if (r < 0.05) desenharPeca(PECA.tufos[Math.floor(r / 0.05 * 4)], sx, sy);
      else if (r < 0.09) desenharFloresta(FLORESTA.gramas[Math.floor((r - 0.05) / 0.04 * 4)], sx, sy);
      break;
    case 'flor':
      desenharGrama(sx, sy);
      if (r < 0.5) desenharPeca(escolher(PECA.flores), sx, sy);
      else desenharFloresta(FLORESTA.flores[Math.floor((r - 0.5) / 0.5 * 2)], sx, sy);
      break;
    case 'arvore':
      desenharGrama(sx, sy); // a árvore grande vem depois, com os personagens
      break;
    case 'pedra':
      desenharGrama(sx, sy);
      desenharFloresta(escolher(FLORESTA.pedras), sx, sy);
      break;
    case 'arbusto':
    case 'toco': {
      const escuro = pegarTerreno(x - 1, y) === 'grama_escura' || pegarTerreno(x + 1, y) === 'grama_escura' || pegarTerreno(x, y + 1) === 'grama_escura';
      escuro ? desenharGramaEscura(sx, sy) : desenharGrama(sx, sy);
      const lista = tipo === 'toco' ? FLORESTA.tocos : escuro ? FLORESTA.arbustosEscuros : FLORESTA.arbustos;
      desenharFloresta(escolher(lista), sx, sy);
      break;
    }
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
      else if (r < 0.075 && pegarTerreno(x + 1, y) === 'agua_pantano') desenharPeca(56, sx, sy); // cogumelo na beira
      break;
    case 'arvore_escura':
      desenharGramaEscura(sx, sy); // árvore grande escura vem depois
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
    // ---------- Montanha do Norte ----------
    case 'rocha':
      desenharChaoRocha(sx, sy, x, y);
      desenharPeca(r < 0.7 ? 65 : 64, sx, sy);
      break;
    case 'chao_rocha':
      desenharChaoRocha(sx, sy, x, y);
      if (r < 0.04) desenharPeca(64, sx, sy);        // pedrinha solta
      break;
    case 'pinheiro':
      desenharChaoRocha(sx, sy, x, y); // pinheiro nevado grande vem depois
      break;
    // ---------- Pântano ----------
    case 'lama':
      desenharGramaEscura(sx, sy);
      desenharAutotile(img.lama, 0, x, y, sx, sy, ladoLama);
      if (r < 0.05) desenharPeca(61, sx, sy);         // poça
      break;
    case 'agua_pantano':
      desenharGramaEscura(sx, sy);
      desenharAutotile(img.agua_pantano, Math.floor(agora / 300) % 8, x, y, sx, sy, ladoAguaPantano);
      if (r < 0.08) desenharPeca(r < 0.04 ? 58 : 59, sx, sy); // vitória-régia
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
  const d = jogador.direcao;

  // (a arma equipada não aparece no boneco — v0.11)
  desenharSombra(cx, py + T - 2, 9);
  // Forma etérea do mago (passiva): o personagem fica meio transparente, com uma bolha roxa
  const etereo = classeAtiva('intangivel', agora);
  ctx.save();
  if (etereo) ctx.globalAlpha = 0.45 + Math.sin(agora / 120) * 0.1;
  comFiltro(piscando(jogador.ultimoDano, agora) ? 'brightness(3)' : null,
    () => desenharPersonagem(imagem, d, quadro, px, py));
  ctx.restore();
  if (etereo) {
    const escudo = EFEITOS.escudo;
    ctx.save(); ctx.globalAlpha = 0.7;
    comFiltro('hue-rotate(230deg) saturate(1.5)', () =>
      desenharQuadroEfeito(escudo, Math.floor(agora / 70) % escudo.quadros, cx, py + T / 2));
    ctx.restore();
  }
  desenharAuraArma(cx, py + T / 2, agora); // brilho colorido da passiva da arma (passivas.js)

  // Fúria do Attractio / imortal do Velox Aeternus: bolha dourada girando em volta do jogador.
  // No último segundo e meio ela pisca, avisando que vai acabar.
  const fimBolha = jogador.furia ? jogador.furia.ate : agora < jogador.imortalAte ? jogador.imortalAte : 0;
  if (fimBolha) {
    const falta = fimBolha - agora;
    const escudo = EFEITOS.escudo;
    const quadroEscudo = Math.floor(agora / escudo.duracao * escudo.quadros) % escudo.quadros;
    ctx.save();
    ctx.globalAlpha = falta < 1500 && Math.floor(agora / 120) % 2 ? 0.25 : 0.85;
    desenharQuadroEfeito(escudo, quadroEscudo, cx, py + T / 2);
    ctx.restore();
  }

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

  // Monstro com imagem própria de corpo (campo "corpo" no monstros.js), centralizada no quadrado
  const corpo = morto && tipo.corpo ? img[tipo.corpo] : null;
  if (corpo && corpo.complete && corpo.naturalWidth) {
    ctx.drawImage(corpo, Math.round(sx + T / 2 - corpo.width / 2), Math.round(sy + T / 2 + 4 - corpo.height / 2));
    return;
  }

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
    if (tipo.anim) {
      desenharFolhaAnimada(m, tipo.anim, imagem, sx, sy, agora, morto);
    } else if (!tipo.imagemUnica) {
      // vistaDeCima (crocodilo): o desenho é visto de cima, então fica centralizado no quadrado em vez de "em pé"
      const ajuste = tipo.vistaDeCima ? imagem.height / 8 - T / 2 : 0;
      desenharPersonagem(imagem, m.direcao, quadroAndando(andando, agora), sx, sy + ajuste);
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

// Folha animada nova (pântano/montanha): loop o tempo todo, e a animação
// de ataque toca quando o monstro bate. Cada monstro começa num quadro diferente
// (m.id) pra não ficarem todos "respirando" juntos.
const MS_POR_QUADRO = 83; // 12 quadros por segundo
function desenharFolhaAnimada(m, a, imagem, sx, sy, agora, morto) {
  const linha = LINHA_DIRECAO[m.direcao] || 0;
  const msQuadro = a.lento ? 200 : MS_POR_QUADRO;
  let quadro = morto ? 0 : Math.floor(agora / msQuadro + m.id * 3) % a.quadros;
  if (a.andar && !morto) quadro = quadroAndando(monstroAndando(m, agora), agora); // pernas só mexem andando
  let l = linha;
  const idadeAtaque = agora - (m.ultimoAtaque || -Infinity);
  if (!morto && a.ataque && idadeAtaque < a.ataque * MS_POR_QUADRO) {
    quadro = Math.floor(idadeAtaque / MS_POR_QUADRO);
    l = 4 + linha;
  }
  // o "pé" do desenho fica 2px acima da base do quadrado (igual aos personagens)
  ctx.drawImage(imagem, quadro * a.tam, l * a.tam, a.tam, a.tam,
    Math.round(sx + 16 - a.tam / 2), Math.round(sy + 30 - a.pe), a.tam, a.tam);
}

function alturaMonstro(m) {
  const tipo = TIPOS_MONSTRO[m.tipo];
  if (tipo.anim) return tipo.anim.altura + 2;
  if (tipo.altura) return tipo.altura + 2;
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

  const tipoM = TIPOS_MONSTRO[m.tipo];
  if (tipoM.vistaDeCima) {
    // sombra embaixo do corpo inteiro, colada nele (visto de cima)
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(cx + 2, sy + T / 2 + 4, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    desenharSombra(cx, sy + T - 2, 11);
  }
  desenharImagemMonstro(m, sx, sy, agora, false);
  const tipo = TIPOS_MONSTRO[m.tipo];
  if (monstroComDebuff(m, agora)) {   // debuff do bardo: notas roxas girando em cima da cabeça
    const ef = EFEITOS.nota_debuff;
    desenharQuadroEfeito(ef, Math.floor(agora / ef.duracao * ef.quadros) % ef.quadros, cx, sy + T - alturaMonstro(m) + 4);
  }
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
      if (ef.espelhar && Math.abs(angulo) > Math.PI / 2) desenharQuadroEfeito(ef, quadro, x, y, angulo - Math.PI, true); // indo pra esquerda
      else desenharQuadroEfeito(ef, quadro, x, y, ef.semGiro ? 0 : angulo);
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
    const y = t.y * T - camera.y - 10 - subida - (t.linha || 0) * 13;
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

// Chefe na tela: barra vermelha larga no topo, com o nome e a vida
function desenharBarraChefe() {
  const chefe = criaturasNaTela().find(m => TIPOS_MONSTRO[m.tipo].chefe);
  if (!chefe) return;
  const W = ctx.canvas.width, larg = Math.round(W * 0.6), x = Math.round((W - larg) / 2), y = 16, alt = 12;
  const pct = Math.max(0, chefe.vida / chefe.vidaMax);
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x - 2, y - 2, larg + 4, alt + 4);
  ctx.fillStyle = '#3a0c0c'; ctx.fillRect(x, y, larg, alt);
  ctx.fillStyle = '#d62b2b'; ctx.fillRect(x, y, Math.round(larg * pct), alt);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, Math.round(larg * pct), 3); // brilho em cima
  ctx.font = 'bold 9px Verdana, sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = '#000';
  const txt = Math.max(0, chefe.vida).toLocaleString('pt-BR') + ' / ' + chefe.vidaMax.toLocaleString('pt-BR');
  ctx.strokeText(txt, W / 2, y + 9); ctx.fillStyle = '#fff'; ctx.fillText(txt, W / 2, y + 9);
  ctx.font = 'bold 10px Verdana, sans-serif';
  const nome = TIPOS_MONSTRO[chefe.tipo].nome;
  ctx.strokeText(nome, W / 2, y + alt + 13); ctx.fillStyle = '#ffa94d'; ctx.fillText(nome, W / 2, y + alt + 13);
}

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

  // 3) Criaturas, pessoas e árvores grandes, de cima pra baixo (quem está mais embaixo aparece na frente)
  const lista = [{ ehJogador: true, x: vis.x, y: vis.y }];
  // árvores: inclui umas linhas abaixo da tela, porque a copa (3 quadrados de altura) aparece antes do tronco
  for (let y = y0; y <= y0 + CONFIG.VISAO_LINHAS + 3; y++) {
    for (let x = x0 - 1; x <= x0 + CONFIG.VISAO_COLUNAS + 1; x++) {
      const t = pegarTerreno(x, y);
      if (TIPOS_ARVORE_GRANDE[t]) lista.push({ arvore: varianteArvore(t, x, y), x, y });
    }
  }
  for (const n of npcs) if (naTela(n.x, n.y)) lista.push({ npc: n, x: n.x, y: n.y });
  for (const m of monstros) {
    if (m.morto) continue;
    const p = posicaoVisualMonstro(m, agora);
    if (naTela(p.x, p.y)) lista.push({ monstro: m, x: p.x, y: p.y });
  }
  for (const o of jogadoresParaDesenhar(agora, naTela)) lista.push(o); // outros jogadores (online.js)
  lista.sort((a, b) => a.y - b.y || (a.arvore !== undefined ? -1 : 0) - (b.arvore !== undefined ? -1 : 0));

  for (const c of lista) {
    const sx = Math.round(c.x * T - camera.x);
    const sy = Math.round(c.y * T - camera.y);
    if (c.arvore !== undefined) desenharArvoreGrande(c.arvore, c.x, c.y, sx, sy, vis);
    else if (c.ehJogador) desenharJogador(sx, sy, agora);
    else if (c.npc) desenharNpc(c.npc, sx, sy);
    else if (c.outro) desenharOutroJogador(c.outro, sx, sy, agora);
    else {
      if (c.monstro === jogador.alvo) desenharMarcaAlvo(sx, sy);
      desenharMonstro(c.monstro, sx, sy, agora);
    }
  }

  // 4) Efeitos por cima de tudo
  desenharEfeitos(agora);
  desenharFalas(agora, vis); // mensagens do chat em cima da cabeça
  desenharProjeteis(agora);
  desenharTextosFlutuantes(agora);
  desenharBarraChefe();
  desenharTelaDeMorte(agora);
}
