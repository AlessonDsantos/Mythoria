// =====================================================
// tasks.js — Capitão Aldric (do lado da fonte): tasks de caça
//
// Cada task: mate N de um monstro, volte e entregue → ganha XP e ouro.
// Depois de entregue, a mesma task só volta 24 horas depois (relógio de verdade).
// Dá pra ter até MAX_TASKS ativas ao mesmo tempo.
//
// Para criar/ajustar uma task, mexa na lista abaixo:
//   id: o monstro (nome em TIPOS_MONSTRO, monstros.js)   level: level mínimo pra pegar
//   quantidade: quantos matar   xp / ouro: recompensa
// =====================================================

const MAX_TASKS = 3;
const ESPERA_TASK = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

const TASKS = [
  { id: 'lobo_cinza', level: 1, quantidade: 30, xp: 270, ouro: 200 },
  { id: 'cobra_pantano', level: 5, quantidade: 20, xp: 500, ouro: 300 },
  { id: 'cogumelo', level: 6, quantidade: 20, xp: 500, ouro: 300 },
  { id: 'lodo', level: 7, quantidade: 20, xp: 640, ouro: 360 },
  { id: 'planta_carnivora', level: 8, quantidade: 20, xp: 980, ouro: 400 },
  { id: 'bruxa_pantano', level: 9, quantidade: 20, xp: 1010, ouro: 440 },
  { id: 'goblin', level: 10, quantidade: 25, xp: 1520, ouro: 630 },
  { id: 'goblin_arqueiro', level: 11, quantidade: 25, xp: 1820, ouro: 700 },
  { id: 'goblin_guerreiro', level: 12, quantidade: 25, xp: 2480, ouro: 800 },
  { id: 'goblin_mago', level: 13, quantidade: 25, xp: 2480, ouro: 800 },
  { id: 'sombra', level: 15, quantidade: 25, xp: 3280, ouro: 950 },
  { id: 'esqueleto_pequeno', level: 15, quantidade: 25, xp: 3280, ouro: 950 },
  { id: 'esqueleto', level: 17, quantidade: 25, xp: 4160, ouro: 1050 },
  { id: 'esqueleto_negro', level: 18, quantidade: 25, xp: 5180, ouro: 1200 },
  { id: 'zumbi', level: 19, quantidade: 25, xp: 5180, ouro: 1200 },
  { id: 'fantasma', level: 20, quantidade: 30, xp: 6860, ouro: 1500 },
  { id: 'fantasma_cinza', level: 21, quantidade: 30, xp: 7560, ouro: 1560 },
  { id: 'abobora', level: 21, quantidade: 30, xp: 7560, ouro: 1560 },
  { id: 'diabinho_pequeno', level: 21, quantidade: 30, xp: 7560, ouro: 1560 },
  { id: 'fantasma_azul', level: 22, quantidade: 30, xp: 8280, ouro: 1650 },
  { id: 'fantasma_rosa', level: 23, quantidade: 30, xp: 9020, ouro: 1740 },
  { id: 'diabinho', level: 24, quantidade: 30, xp: 9820, ouro: 1800 },
  { id: 'mago_sombrio', level: 24, quantidade: 30, xp: 9820, ouro: 1800 },
  { id: 'morcego', level: 25, quantidade: 30, xp: 10660, ouro: 1860 },
  { id: 'aranha', level: 26, quantidade: 30, xp: 11500, ouro: 1950 },
  { id: 'lobo_neve', level: 27, quantidade: 30, xp: 12380, ouro: 2040 },
  { id: 'verme_rocha', level: 28, quantidade: 30, xp: 15980, ouro: 2100 },
  { id: 'esqueleto_gelo', level: 29, quantidade: 30, xp: 14280, ouro: 2160 },
  { id: 'olho_vigia', level: 30, quantidade: 30, xp: 15260, ouro: 2250 },
  { id: 'fogo_gelado', level: 31, quantidade: 30, xp: 16300, ouro: 2340 },
  { id: 'mago_gelo', level: 32, quantidade: 30, xp: 17350, ouro: 2400 },
  { id: 'filhote_dragao', level: 33, quantidade: 30, xp: 18430, ouro: 2460 },
  { id: 'ceifador', level: 36, quantidade: 30, xp: 21910, ouro: 2700 },
  { id: 'dragao_rubro', level: 37, quantidade: 30, xp: 23140, ouro: 2760 },
  { id: 'demonio_alado', level: 39, quantidade: 30, xp: 25700, ouro: 2940 },
];

let tasksAberto = null; // NPC com quem está falando

function taskPorId(id) { return TASKS.find(t => t.id === id); }

// Quanto falta (ms) pra poder fazer de novo (0 = liberada)
function esperaDaTask(id) {
  const quando = jogador.tasks.feitas[id];
  return quando ? Math.max(0, quando + ESPERA_TASK - Date.now()) : 0;
}

function textoEspera(ms) {
  const h = Math.floor(ms / 3600000), min = Math.ceil((ms % 3600000) / 60000);
  return h > 0 ? h + 'h ' + min + 'min' : min + 'min';
}

function aceitarTask(id) {
  const t = taskPorId(id);
  if (jogador.level < t.level) { mostrarMensagem('Precisa do level ' + t.level + '.'); return; }
  if (Object.keys(jogador.tasks.ativas).length >= MAX_TASKS) { mostrarMensagem('Você já tem ' + MAX_TASKS + ' tasks. Entregue uma antes.'); return; }
  if (esperaDaTask(id) > 0) { mostrarMensagem('Volte em ' + textoEspera(esperaDaTask(id)) + '.'); return; }
  jogador.tasks.ativas[id] = 0;
  registrar('Task aceita: mate ' + t.quantidade + ' × ' + TIPOS_MONSTRO[id].nome + '.', 'skill');
  salvarJogo();
  desenharTasks();
}

function desistirTask(id) {
  delete jogador.tasks.ativas[id];
  salvarJogo();
  desenharTasks();
}

function entregarTask(id) {
  const t = taskPorId(id);
  if ((jogador.tasks.ativas[id] || 0) < t.quantidade) return;
  delete jogador.tasks.ativas[id];
  jogador.tasks.feitas[id] = Date.now();
  jogador.ouro += t.ouro;
  registrar('Task concluída: ' + TIPOS_MONSTRO[id].nome + '! +' + t.ouro + ' de ouro e +' + t.xp + ' XP.', 'level');
  ganharXp(t.xp, performance.now());
  salvarJogo();
  desenharTasks();
}

// Chamado em matarMonstro (combate.js)
function contarTask(tipo) {
  const ativas = jogador.tasks.ativas;
  if (!(tipo in ativas)) return;
  const t = taskPorId(tipo);
  if (ativas[tipo] >= t.quantidade) return;
  ativas[tipo]++;
  // cada kill aparece no Server Log e na tela (no celular, por cima do jogo)
  const texto = 'Task ' + TIPOS_MONSTRO[tipo].nome + ': ' + ativas[tipo] + '/' + t.quantidade;
  if (ativas[tipo] === t.quantidade) registrar('Task completa: ' + TIPOS_MONSTRO[tipo].nome + ' ' + t.quantidade + '/' + t.quantidade + '. Volte ao Capitão Aldric!', 'level');
  else registrar(texto, 'task');
  mostrarMensagem(texto);
}

// ---------- Janela ----------

function abrirTasks(npc) {
  tasksAberto = npc;
  npcPendente = null;
  limparAlvo();
  desenharTasks();
}

function fecharTasks() {
  tasksAberto = null;
  desenharTasks();
}

function atualizarTasks() {
  if (tasksAberto && distancia(tasksAberto, jogador) > CONFIG.ALCANCE_NPC + 1) fecharTasks();
}

function configurarTasks() {
  document.getElementById('btn-fechar-tasks').addEventListener('click', fecharTasks);
  document.getElementById('lista-tasks').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'aceitar') aceitarTask(b.dataset.id);
    else if (b.dataset.acao === 'entregar') entregarTask(b.dataset.id);
    else if (b.dataset.acao === 'desistir') desistirTask(b.dataset.id);
  });
}

function desenharTasks() {
  const janela = document.getElementById('janela-tasks');
  if (!tasksAberto) { janela.classList.add('escondido'); return; }
  janela.classList.remove('escondido');
  const ativas = jogador.tasks.ativas;
  document.getElementById('tasks-info').textContent = Object.keys(ativas).length + ' / ' + MAX_TASKS + ' ativas';

  const lista = document.getElementById('lista-tasks');
  lista.innerHTML = '';
  // ativas primeiro, depois na ordem de level
  const ordem = [...TASKS].sort((a, b) => ((b.id in ativas) - (a.id in ativas)) || a.level - b.level);
  for (const t of ordem) {
    const nome = TIPOS_MONSTRO[t.id].nome;
    const ativa = t.id in ativas;
    const espera = esperaDaTask(t.id);
    let estado, botao = '';
    if (ativa) {
      const feitos = ativas[t.id];
      estado = '<b class="task-progresso">' + feitos + ' / ' + t.quantidade + '</b>';
      botao = feitos >= t.quantidade
        ? '<button class="btn" data-acao="entregar" data-id="' + t.id + '">Entregar</button>'
        : '<button class="btn btn-secundario btn-pequeno" data-acao="desistir" data-id="' + t.id + '">Desistir</button>';
    } else if (jogador.level < t.level) {
      estado = '<small>Level ' + t.level + '</small>';
    } else if (espera > 0) {
      estado = '<small>Volte em ' + textoEspera(espera) + '</small>';
    } else {
      estado = '<small>Disponível</small>';
      botao = '<button class="btn btn-pequeno" data-acao="aceitar" data-id="' + t.id + '">Aceitar</button>';
    }
    const linha = document.createElement('div');
    linha.className = 'task-linha' + (ativa ? ' ativa' : '') + (jogador.level < t.level ? ' bloqueada' : '');
    linha.innerHTML =
      '<span class="task-nome"><b>' + t.quantidade + ' × ' + nome + '</b><small>Level ' + t.level + ' · ' + t.xp + ' XP · ' + t.ouro + ' ouro</small></span>' +
      '<span class="task-estado">' + estado + '</span>' + '<span>' + botao + '</span>';
    lista.appendChild(linha);
  }
}
