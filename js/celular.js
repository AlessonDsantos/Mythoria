// =====================================================
// celular.js — Versão de celular (deitado)
//
// Quando o aparelho é de toque e a tela é pequena, o jogo troca de arrumação:
//   • a tela do jogo ocupa quase tudo, com um direcional no canto
//   • à direita: vida/mana, a barra de ação grande e os botões Alvo, Loot e Menu
//   • o Menu abre uma "gaveta" com abas: Mochila, Magias, Mapa, Batalha, Status, Log e Opções
// Os painéis são os MESMOS do computador: só mudam de lugar (appendChild).
// Tocar num monstro = atacar (no celular não tem botão direito).
// =====================================================

let modoCelular = false;
const lugaresOriginais = {}; // id → { pai, proximo } para devolver ao voltar pro modo computador

const ABAS_CELULAR = [
  { id: 'mochila', nome: '🎒', titulo: 'Mochila', paineis: ['painel-equip', 'painel-mochila'] },
  { id: 'magias',  nome: '✨', titulo: 'Magias',  paineis: ['painel-magias'] },
  { id: 'mapa',    nome: '🗺️', titulo: 'Mapa',    paineis: ['painel-mapa'] },
  { id: 'batalha', nome: '⚔️', titulo: 'Batalha', paineis: ['painel-battle'] },
  { id: 'status',  nome: '📊', titulo: 'Status',  paineis: ['painel-status'] },
  { id: 'log',     nome: '📜', titulo: 'Log',     paineis: ['abaixo'] },
  { id: 'opcoes',  nome: '⚙️', titulo: 'Opções',  paineis: ['opcoes-celular'] },
];
let abaCelular = 'mochila';

function ehAparelhoCelular() {
  const toque = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  return toque && Math.min(window.innerWidth, window.innerHeight) <= 600;
}

function configurarCelular() {
  const $ = id => document.getElementById(id);
  // guarda onde cada painel mora no modo computador
  for (const id of ['painel-equip', 'painel-mochila', 'painel-magias', 'painel-mapa', 'painel-battle', 'painel-status', 'abaixo', 'barra-acao']) {
    const el = $(id);
    lugaresOriginais[id] = { pai: el.parentNode, proximo: el.nextSibling };
  }

  // Abas da gaveta
  const abas = $('abas-celular');
  for (const a of ABAS_CELULAR) {
    const b = document.createElement('button');
    b.className = 'aba aba-celular';
    b.dataset.aba = a.id;
    b.title = a.titulo;
    b.innerHTML = a.nome + '<small>' + a.titulo + '</small>';
    b.addEventListener('click', () => mostrarAbaCelular(a.id));
    abas.appendChild(b);
  }
  $('btn-fechar-gaveta').addEventListener('click', () => abrirGaveta(false));
  $('btn-menu-celular').addEventListener('click', () => abrirGaveta($('gaveta-celular').classList.contains('escondido')));
  $('btn-alvo-celular').addEventListener('click', mirarMaisProximo);
  // barra de magias: toque = lança
  $('magias-celular').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-magia]');
    if (b) lancarMagia(b.dataset.magia, performance.now());
  });
  $('btn-loot-celular').addEventListener('click', abrirCorpoProximo);
  $('btn-ajuda-celular').addEventListener('click', () => { abrirGaveta(false); $('painel-ajuda').classList.remove('escondido'); });
  $('btn-sair-celular').addEventListener('click', () => { abrirGaveta(false); pedirParaSair(); });
  $('btn-tela-cheia').addEventListener('click', alternarTelaCheia);

  // Direcional: segurar = andar (igual a segurar a seta do teclado)
  document.querySelectorAll('#dpad [data-dir]').forEach(botao => {
    const dir = botao.dataset.dir;
    const soltar = () => { const i = direcoesApertadas.indexOf(dir); if (i >= 0) direcoesApertadas.splice(i, 1); botao.classList.remove('apertado'); };
    botao.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { botao.setPointerCapture(e.pointerId); } catch (erro) { /* alguns navegadores não deixam */ }
      jogador.caminho = []; jogador.destino = null; // cancela o "andar até o clique"
      if (!direcoesApertadas.includes(dir)) direcoesApertadas.push(dir);
      botao.classList.add('apertado');
    });
    botao.addEventListener('pointerup', soltar);
    botao.addEventListener('pointercancel', soltar);
    botao.addEventListener('lostpointercapture', soltar);
  });

  window.addEventListener('resize', aplicarModoCelular);
  window.addEventListener('orientationchange', () => setTimeout(aplicarModoCelular, 200));
  aplicarModoCelular();
}

function aplicarModoCelular() {
  const ligar = ehAparelhoCelular();
  if (ligar === modoCelular) { ajustarTela(); return; }
  modoCelular = ligar;
  document.body.classList.toggle('celular', ligar);
  const $ = id => document.getElementById(id);
  if (ligar) {
    $('celular-direita').insertBefore($('barra-acao'), $('botoes-celular'));
    for (const a of ABAS_CELULAR) {
      const caixa = $('aba-' + a.id);
      for (const p of a.paineis) caixa.appendChild($(p));
    }
    mostrarAbaCelular(abaCelular);
  } else {
    // devolve tudo pro lugar do modo computador
    for (const id in lugaresOriginais) {
      const { pai, proximo } = lugaresOriginais[id];
      pai.insertBefore($(id), proximo && proximo.parentNode === pai ? proximo : null);
    }
    abrirGaveta(false);
    modoTela = null; // o ajustarTela rearruma as colunas do computador
  }
  ajustarTela();
}

function abrirGaveta(abrir) {
  document.getElementById('gaveta-celular').classList.toggle('escondido', !abrir);
  document.getElementById('btn-menu-celular').classList.toggle('ativa', abrir);
}

function mostrarAbaCelular(id) {
  abaCelular = id;
  for (const a of ABAS_CELULAR) document.getElementById('aba-' + a.id).classList.toggle('escondido', a.id !== id);
  document.querySelectorAll('.aba-celular').forEach(b => b.classList.toggle('ativa', b.dataset.aba === id));
}

function alternarTelaCheia() {
  const doc = document.documentElement;
  if (!document.fullscreenElement && doc.requestFullscreen) doc.requestFullscreen().catch(() => {});
  else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
}

// Barra vertical de magias (entre o jogo e a coluna da direita): todas as magias
// da sua classe, sempre à mão. Bloqueada mostra o level; em espera mostra os segundos.
let assinaturaMagiasCelular = '';
function atualizarMagiasCelular(agora) {
  if (!modoCelular) return;
  const ids = magiasDaClasse();
  const assinatura = jogador.level + '|' + jogador.mana + '|' + ids.map(id => Math.ceil(esperaRestante(id, agora) / 1000)).join(',');
  if (assinatura === assinaturaMagiasCelular) return;
  assinaturaMagiasCelular = assinatura;
  const caixa = document.getElementById('magias-celular');
  caixa.innerHTML = '';
  for (const id of ids) {
    const m = MAGIAS[id];
    const aprendida = magiaAprendida(id);
    const falta = esperaRestante(id, agora);
    const b = document.createElement('button');
    b.className = 'espaco magia-celular' + (aprendida ? '' : ' bloqueada') + (aprendida && jogador.mana < m.mana ? ' sem-mana' : '');
    if (aprendida) b.dataset.magia = id;
    b.title = m.nome;
    b.innerHTML = htmlIcone('magia_' + id) +
      (!aprendida ? '<span class="nivel-magia">' + m.level + '</span>' : falta > 0 ? '<span class="espera">' + Math.ceil(falta / 1000) + '</span>' : '');
    caixa.appendChild(b);
  }
}

// Tamanho do canvas no celular: o maior que couber ao lado das colunas da direita
function ajustarTelaCelular(canvas) {
  const direita = (document.getElementById('celular-direita').offsetWidth || 220) + (document.getElementById('magias-celular').offsetWidth || 56);
  const escala = Math.max(0.5, escalaPara(window.innerWidth - direita - 10, window.innerHeight - 8));
  canvas.style.width = Math.floor(canvas.width * escala) + 'px';
  canvas.style.height = Math.floor(canvas.height * escala) + 'px';
}

// Vida e mana sempre à vista (coluna da direita)
function atualizarHudCelular() {
  if (!modoCelular) return;
  const j = jogador;
  document.getElementById('hud-vida').style.width = (100 * Math.max(0, j.vida) / j.vidaMax) + '%';
  document.getElementById('hud-mana').style.width = (j.manaMax ? 100 * Math.max(0, j.mana) / j.manaMax : 0) + '%';
  document.getElementById('hud-vida-txt').textContent = Math.max(0, j.vida) + ' / ' + j.vidaMax;
  document.getElementById('hud-mana-txt').textContent = Math.max(0, j.mana) + ' / ' + j.manaMax;
  document.getElementById('hud-level').textContent = 'Lv ' + j.level;
}
