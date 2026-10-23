// =====================================================
// sprites.js — Carrega as imagens (pixel art) e desenha pedaços delas
//
// Arte: Pipoya (mapa, personagens, monstros) e Shikashi (ícones).
// Os créditos completos estão em CREDITOS.txt.
// =====================================================

// Todas as imagens do jogo. A chave é o nome que o código usa.
const IMAGENS = {
  base:        'img/tiles/base.png',        // folha principal: chão, paredes, móveis, árvores...
  grama:       'img/tiles/grama.png',       // "autotiles": 5 peças que se encaixam sozinhas
  grama_escura:'img/tiles/grama_escura.png',
  terra:       'img/tiles/terra.png',
  areia:       'img/tiles/areia.png',
  agua:        'img/tiles/agua.png',        // 8 quadros de animação lado a lado
  parede_topo: 'img/tiles/parede_topo.png',
  lama:        'img/tiles/lama.png',
  agua_pantano:'img/tiles/agua_pantano.png', // 8 quadros de animação, igual à água
  chao_rocha:  'img/tiles/chao_rocha.png',
  arvores:     'img/tiles/arvores.png',   // árvores grandes do Forest Pack (64x96, várias cores)
  floresta:    'img/tiles/floresta.png',  // arbustos, tocos, pedras, grama e flores do Forest Pack
  itens:       'img/itens.png',
  guerreiro:   'img/personagens/guerreiro.png',
  arqueiro:    'img/personagens/arqueiro.png',
  mago:        'img/personagens/mago.png',
  bardo:       'img/personagens/bardo.png',
  npc_mirela:  'img/personagens/npc_mirela.png',
  npc_bruno:   'img/personagens/npc_bruno.png',
  npc_helga:   'img/personagens/npc_helga.png',
  npc_rosa:    'img/personagens/npc_rosa.png',
  npc_otto:    'img/personagens/npc_otto.png',
  npc_aldric:  'img/personagens/npc_aldric.png',
  fantoche:    'img/monstros/fantoche.png',  // imagem única (o espantalho não anda)
};

// Monstros: uma folha animada 3x4 para cada tipo em TIPOS_MONSTRO (monstros.js),
// com o mesmo nome do campo "sprite". Ex.: sprite 'goblin' → img/monstros/goblin.png
for (const id in TIPOS_MONSTRO) {
  const s = TIPOS_MONSTRO[id].sprite;
  if (!IMAGENS[s]) IMAGENS[s] = 'img/monstros/' + s + '.png';
  // corpo próprio (campo "corpo"): img/monstros/<corpo>.png
  const c = TIPOS_MONSTRO[id].corpo;
  if (c && !IMAGENS[c]) IMAGENS[c] = 'img/monstros/' + c + '.png';
}

// Efeitos de magia: img/efeitos/<nome>.png, com a chave "fx_<nome>"
for (const nome in EFEITOS) { // (dois efeitos podem usar a mesma imagem, ex.: flecha e flecha_grande)
  if (!IMAGENS[EFEITOS[nome].img]) IMAGENS[EFEITOS[nome].img] = 'img/efeitos/' + nome + '.png';
}

const img = {}; // depois de carregar: img.base, img.grama...

// Carrega tudo e só então chama "pronto". Imagem demora um pouco
// pra chegar, e desenhar antes disso não mostra nada.
function carregarImagens(pronto) {
  const nomes = Object.keys(IMAGENS);
  let faltam = nomes.length;
  for (const nome of nomes) {
    const im = new Image();
    im.onload = () => { if (--faltam === 0) pronto(); };
    im.onerror = () => { console.error('Imagem não encontrada:', IMAGENS[nome]); if (--faltam === 0) pronto(); };
    im.src = IMAGENS[nome];
    img[nome] = im;
  }
}

// ---------- Folha principal: cada peça tem um número ----------
// A folha tem 8 peças por linha. Peça 0 = canto de cima à esquerda.
function desenharPeca(numero, sx, sy) {
  const T = 32;
  ctx.drawImage(img.base, (numero % 8) * T, Math.floor(numero / 8) * T, T, T, sx, sy, T, T);
}

// ---------- Autotile ----------
// A imagem tem 5 peças em pé (32x160):
//   0 = ilha sozinha   1 = bordas dos lados   2 = bordas em cima/embaixo
//   3 = cantos de dentro   4 = meio cheio
// Cada quadrado é montado com 4 pedacinhos de 16x16. Pra cada canto
// olhamos os vizinhos: se são do mesmo tipo, usamos o pedaço "cheio";
// se não, usamos o pedaço com borda. É assim que a água ganha margem
// e a estrada ganha bordas de grama sozinhas.
function desenharAutotile(imagem, quadro, x, y, sx, sy, mesmo) {
  const h = 16;
  for (const [cantoX, cantoY] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const dx = cantoX ? 1 : -1;
    const dy = cantoY ? 1 : -1;
    const vertical = mesmo(x, y + dy);
    const horizontal = mesmo(x + dx, y);
    let peca;
    if (vertical && horizontal) peca = mesmo(x + dx, y + dy) ? 4 : 3;
    else if (vertical) peca = 1;
    else if (horizontal) peca = 2;
    else peca = 0;
    ctx.drawImage(imagem,
      quadro * 32 + cantoX * h, peca * 32 + cantoY * h, h, h,
      sx + cantoX * h, sy + cantoY * h, h, h);
  }
}

// ---------- Personagens (folha 3 colunas x 4 linhas) ----------
// Linhas: 0 = baixo, 1 = esquerda, 2 = direita, 3 = cima
// Quase todos têm quadros de 32x32; o chefe grande tem 96x96.
// O desenho fica centralizado no quadrado e "em pé" na base dele.
const LINHA_DIRECAO = { baixo: 0, esquerda: 1, direita: 2, cima: 3 };

function desenharPersonagem(imagem, direcao, quadro, sx, sy) {
  const w = imagem.width / 3, h = imagem.height / 4;
  ctx.drawImage(imagem, quadro * w, LINHA_DIRECAO[direcao] * h, w, h,
    Math.round(sx + 16 - w / 2), Math.round(sy + 32 - h), w, h);
}

// Quadro da animação de andar: parado = 1 (meio); andando alterna 0 e 2
function quadroAndando(andando, agora) {
  if (!andando) return 1;
  return Math.floor(agora / 140) % 2 === 0 ? 0 : 2;
}

// ---------- Ícones de itens (img/itens.png) ----------
// A ordem aqui é a mesma da folha de ícones montada a partir do pacote.
const ORDEM_ICONES = ['queijo', 'carne', 'pocao', 'pocao_grande', 'rabo_rato', 'pele_cobra', 'presa_lobo', 'pele_lobo',
  'garra_urso', 'pele_urso', 'presa_tigre', 'pele_tigre', 'espada_curta', 'espada', 'espada_longa',
  'machado_mao', 'machado', 'machado_guerra', 'clava', 'maca', 'martelo_guerra', 'shuriken', 'shuriken_aprendiz',
  'lanca', 'arco', 'flecha', 'flecha_ferro', 'capuz_couro', 'capacete_ferro', 'armadura_couro', 'cota_malha',
  'armadura_placas', 'calca_couro', 'calca_malha', 'botas_couro', 'botas_ferro', 'ouro',
  // extras
  'katana', 'sabre', 'adaga_larga', 'mangual', 'chapeu_cacador', 'elmo_cruzado', 'armadura_aco',
  'tunica_azul', 'tunica_verde', 'manto', 'maca_fruta', 'pao', 'peixe', 'frango', 'pocao_mana',
  'tecido', 'pena', 'minerio', 'gema', 'rubi', 'moeda_antiga', 'erva', 'pergaminho',
  // magias
  'magia_vita_lux', 'magia_sanatio', 'magia_ictus_certus', 'magia_ictus_duplex', 'magia_pluvia_sagittarum',
  'magia_ictus_validus', 'magia_attractio', 'magia_ictus_rotatorius',
  // v0.11: cajados, comidas especiais e magias novas
  'cajado_aprendiz', 'cajado_vento', 'cajado_trovao', 'ensopado', 'torta_real',
  'magia_hasta_ignis', 'magia_aqua_triplex', 'magia_turbo_venti', 'magia_fulmen_pluvia', 'magia_mens_arcana',
  'magia_ictus_triplex', 'magia_terrae_motus', 'magia_sagitta_mortarium', 'magia_velox_aeternus',
  // v0.12
  'pocao_enorme', 'pocao_mana_enorme', 'magia_flatus_venti',
  // v0.15 (desenhados em img/itens_novos)
  'machado_runico', 'machado_lua', 'maca_espinhos',
  // v0.16: passivas de classe
  'passiva_guerreiro', 'passiva_arqueiro', 'passiva_mago',
  // v0.17: bardo (desenhados em img/itens_novos)
  'magia_quinque_notae', 'magia_unda_sonora', 'magia_carmen_torpor', 'magia_cantus_vitae', 'magia_dissonantia',
  'passiva_bardo'];

function posicaoIcone(id) {
  const i = Math.max(0, ORDEM_ICONES.indexOf(id));
  return { x: (i % 8) * 32, y: Math.floor(i / 8) * 32 };
}

// Ícone no HTML (mochila, loja, barra...): um <span> com a folha de fundo
// Ícones "pintados" (desenhos do autor do jogo, sem pixel art): um arquivo por item, em img/itens/.
// Para trocar o ícone de um item por um desenho seu, salve o PNG lá e coloque uma linha aqui.
const ICONES_HD = {
  cajado_aprendiz: 'img/itens/cajado_fogo.png',
  cajado_vento:    'img/itens/cajado_vento.png',
  cajado_gelo:     'img/itens/cajado_gelo.png',
  cajado_trovao:   'img/itens/cajado_raio.png',
  flauta:          'img/itens/flauta.png',
  alaude:          'img/itens/alaude.png',
  violino:         'img/itens/violino.png',
};
for (const id in ICONES_HD) IMAGENS['hd_' + id] = ICONES_HD[id];

function htmlIcone(id, classeExtra = '') {
  if (ICONES_HD[id]) return '<span class="icone icone-hd ' + classeExtra + '" style="background-image:url(' + ICONES_HD[id] + ')"></span>';
  const p = posicaoIcone(id);
  return '<span class="icone ' + classeExtra + '" style="background-position:-' + p.x + 'px -' + p.y + 'px"></span>';
}

// Ícone desenhado no canvas (arma na mão do personagem, por exemplo)
function desenharIcone(id, sx, sy, tamanho = 32) {
  if (ICONES_HD[id] && img['hd_' + id]) { ctx.drawImage(img['hd_' + id], sx, sy, tamanho, tamanho); return; }
  const p = posicaoIcone(id);
  ctx.drawImage(img.itens, p.x, p.y, 32, 32, sx, sy, tamanho, tamanho);
}

// Retrato pequeno de um personagem (telas de entrada): quadro de frente
function htmlRetrato(chaveImagem) {
  return '<span class="retrato" style="background-image:url(' + IMAGENS[chaveImagem] + ')"></span>';
}
