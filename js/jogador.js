// =====================================================
// jogador.js — O personagem e como ele anda
// Posição "lógica" (x, y) sempre é um quadrado inteiro.
// A animação desliza suavemente do quadrado anterior
// para o novo durante CONFIG.DURACAO_PASSO.
// =====================================================

const jogador = {
  nome: 'Aventureiro',
  classe: 'guerreiro',        // chave de CLASSES (classes.js)
  x: 0, y: 0,                 // quadrado atual
  anteriorX: 0, anteriorY: 0, // quadrado de onde veio (para animar)
  templo: { x: 0, y: 0 },     // onde nasce e renasce
  direcao: 'baixo',
  inicioPasso: -Infinity,
  caminho: [],                // passos pendentes do clique
  destino: null,              // quadrado clicado (para desenhar a marca)

  // Atributos
  vida: 100, vidaMax: 100,   // os valores certos vêm da classe
  mana: 0, manaMax: 0,
  level: 1,
  xp: 0,
  ouro: 0,

  // Skills de combate e o progresso de cada uma
  skills: { melee: 10, distance: 10, magia: 0 },
  treinoSkills: { melee: 0, distance: 0, magia: 0 },

  // O que está vestindo. Cada espaço: null ou { id, qtd }
  equip: { capacete: null, armadura: null, calca: null, botas: null, arma: null, municao: null },

  // Combate
  alvo: null,
  proximoAtaque: 0,
  proximaRegen: 0,
  ultimoDano: -Infinity,
  morreuEm: -Infinity,

  // Fome e magias
  saciadoAte: 0,          // momento (performance.now) em que a fome volta
  avisouFome: false,
  esperaMagias: {},       // id da magia → momento em que pode usar de novo
  furia: null,            // Attractio ativa: { ate, vidaExtra }
  imortalAte: 0,          // buff do arqueiro (Velox Aeternus): não toma dano até esse momento
  velozAte: 0,            // ...e anda 50% mais rápido
  arcanoAte: 0,           // buff do mago (Mens Arcana): Magic Level +50%
  regenBonus: null,       // comida especial: { ate, vida, mana, proximo }
  passivaArma: null,         // { tipo, ate } — passiva da arma ativa (passivas.js)
  passivaClasse: null,       // { tipo, ate, ... } — passiva da classe ativa
  esperaPassivaClasse: 0,    // quando a passiva da classe pode ativar de novo
  tasks: { ativas: {}, feitas: {} }, // tasks do capitão: ativas = id → mortos; feitas = id → quando entregou (Date.now)
};

// Quanto tempo leva um passo: fica mais curto a cada level (até um limite) e com o buff de velocidade
function duracaoPasso(agora) {
  const bonus = Math.min(CONFIG.VELOCIDADE_MAXIMA, (jogador.level - 1) * CONFIG.VELOCIDADE_POR_LEVEL);
  let ms = CONFIG.DURACAO_PASSO * (1 - bonus);
  if (agora < jogador.velozAte) ms /= 1.5;
  return ms;
}

// Kit que todo aventureiro ganha: set de couro + 5 poções de cada
const KIT_INICIAL = ['capuz_couro', 'armadura_couro', 'calca_couro', 'botas_couro'];

// Veste o que couber; o resto vai pra mochila
function darKitInicial() {
  for (const id of KIT_INICIAL) {
    const espaco = espacoDoItem(ITENS[id]);
    if (!jogador.equip[espaco]) jogador.equip[espaco] = { id, qtd: 1 };
    else guardarNaMochila(id, 1);
  }
  guardarNaMochila('pocao', 5);
  guardarNaMochila('pocao_mana', 5);
}

// Personagem recém-criado: atributos e itens vêm da classe escolhida
function novoPersonagem(nome, classe) {
  const c = CLASSES[classe];
  jogador.nome = nome;
  jogador.classe = classe;
  jogador.vida = jogador.vidaMax = c.vidaInicial;
  jogador.mana = jogador.manaMax = c.manaInicial;
  jogador.ouro = CONFIG.OURO_INICIAL;
  for (const espaco in c.equipInicial) jogador.equip[espaco] = { ...c.equipInicial[espaco] };
  Object.assign(jogador.skills, c.skillsIniciais || {});
  darKitInicial();
  guardarNaMochila('queijo', 3);
  jogador.saciadoAte = performance.now() + CONFIG.FOME_INICIAL_MIN * 60000;
  barraAcao[0] = { tipo: 'magia', id: 'vita_lux' };
  barraAcao[1] = { tipo: 'item', id: 'pocao' };
  barraAcao[2] = { tipo: 'item', id: 'pocao_mana' };
  barraAcao[3] = { tipo: 'item', id: 'queijo' };
  posicionarJogador(jogador.templo.x, jogador.templo.y);
}

function posicionarJogador(x, y) {
  jogador.x = jogador.anteriorX = x;
  jogador.y = jogador.anteriorY = y;
  jogador.inicioPasso = -Infinity;
}

function estaAndando(agora) {
  return agora - jogador.inicioPasso < duracaoPasso(agora);
}

function direcaoPara(dx, dy) {
  return Object.keys(DIRECOES).find(n => DIRECOES[n].dx === dx && DIRECOES[n].dy === dy) || null;
}

// Tenta dar um passo numa direção. Devolve true se andou.
function tentarMover(nomeDirecao, agora) {
  const d = DIRECOES[nomeDirecao];
  jogador.direcao = nomeDirecao; // vira o rosto mesmo se estiver bloqueado

  const nx = jogador.x + d.dx;
  const ny = jogador.y + d.dy;
  if (!ehPassavel(nx, ny)) {
    mostrarMensagem('Não dá pra passar: ' + TERRENOS[pegarTerreno(nx, ny)].nome.toLowerCase() + '.');
    return false;
  }
  if (monstroEm(nx, ny) || npcEm(nx, ny)) {
    mostrarMensagem('Tem alguém no caminho.');
    return false;
  }

  jogador.anteriorX = jogador.x;
  jogador.anteriorY = jogador.y;
  jogador.x = nx;
  jogador.y = ny;
  jogador.inicioPasso = agora;
  return true;
}

function ehLivreParaJogador(x, y) {
  return ehPassavel(x, y) && !monstroEm(x, y) && !npcEm(x, y);
}

// Mandar o jogador andar até um quadrado (clique no mapa ou no minimapa)
function irAte(x, y, limite = 3000) {
  corpoPendente = null; // um clique novo cancela "ir abrir o corpo"
  npcPendente = null;   // e "ir falar com o NPC"
  const caminho = encontrarCaminho({ x: jogador.x, y: jogador.y }, { x, y }, ehLivreParaJogador, limite);
  if (caminho === null) {
    mostrarMensagem('Não dá pra ir até aí.');
    jogador.caminho = [];
    jogador.destino = null;
    return false;
  }
  jogador.caminho = caminho;
  jogador.destino = caminho.length ? { x, y } : null;
  return true;
}

// Anda um passo na direção do alvo (modo "perseguir" do Tibia)
function chegarPertoDoAlvo(agora) {
  const alvo = jogador.alvo;
  // O quadrado do alvo conta como livre, senão a busca nunca chega nele
  const podePassar = (x, y) => ehPassavel(x, y) && !npcEm(x, y) && (!monstroEm(x, y) || (x === alvo.x && y === alvo.y));
  const caminho = encontrarCaminho({ x: jogador.x, y: jogador.y }, { x: alvo.x, y: alvo.y }, podePassar, 800);
  if (!caminho || caminho.length < 2) return; // sem caminho, ou já colado
  const prox = caminho[0];
  tentarMover(direcaoPara(prox.x - jogador.x, prox.y - jogador.y), agora);
}

// Chamado a cada quadro pelo main.js
function atualizarJogador(agora) {
  if (estaAndando(agora)) return; // ainda no meio de um passo

  // 1) Teclado tem prioridade e cancela o caminho do clique
  const dirTeclado = direcaoDoTeclado();
  if (dirTeclado) {
    jogador.caminho = [];
    jogador.destino = null;
    corpoPendente = null;
    npcPendente = null;
    tentarMover(dirTeclado, agora);
    return;
  }

  // 2) Segue o caminho do clique, um passo de cada vez
  if (jogador.caminho.length > 0) {
    const prox = jogador.caminho.shift();
    const nome = direcaoPara(prox.x - jogador.x, prox.y - jogador.y);
    if (!nome || !tentarMover(nome, agora)) jogador.caminho = [];
    if (jogador.caminho.length === 0) jogador.destino = null;
    return;
  }

  // 3) Tem alvo que não dá pra atacar daqui? No modo "Seguir", chega mais perto
  //    (com arma de distância ele para assim que estiver no alcance). No "Parado", fica onde está.
  if (modoAtaque === 'seguir' && jogador.alvo && !jogador.alvo.morto && !podeAtacarDe(jogador.alvo)) {
    chegarPertoDoAlvo(agora);
  }
}

// Posição em "quadrados com vírgula" para desenhar a animação suave
function posicaoVisual(agora) {
  const t = Math.min(1, (agora - jogador.inicioPasso) / duracaoPasso(agora));
  return {
    x: jogador.anteriorX + (jogador.x - jogador.anteriorX) * t,
    y: jogador.anteriorY + (jogador.y - jogador.anteriorY) * t,
    progresso: t,
  };
}
