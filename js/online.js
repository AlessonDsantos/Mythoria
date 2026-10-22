// =====================================================
// online.js — Ver outros jogadores e conversar (Realtime Database do Firebase)
//
// Só para quem entrou com a conta Google. Cada um vê os outros andando
// pelo mapa, mas os MONSTROS continuam sendo de cada um (não dá pra caçar junto).
//
// No banco:
//   online/<id da conta>  → { nome, classe, level, x, y, dir, t }  (some sozinho quando a pessoa sai)
//   chat/<id da mensagem> → { uid, nome, texto, t }
// =====================================================

const ONLINE = {
  ENVIO_MINIMO: 100,      // manda a posição no máximo a cada 0,1 s
  BATIMENTO: 15000,       // mesmo parado, avisa "ainda estou aqui" a cada 15 s
  SUMIDO: 45000,          // quem não dá sinal há 45 s é considerado fora
  DURACAO_PASSO: 260,     // tempo da animação de andar dos outros
  TEMPO_FALA: 5000,       // quanto tempo a fala fica em cima da cabeça
  TAMANHO_FALA: 120,      // máximo de letras por mensagem
  HISTORICO_CHAT: 10 * 60000, // ao entrar, mostra as mensagens dos últimos 10 min
};

const online = {
  ativo: false,
  rtdb: null,
  eu: null,          // referência online/<meu id>
  outros: {},        // uid → { nome, classe, level, x, y, dir, t, de, inicio }
  falas: {},         // uid → { texto, ate }
  enviado: null,     // último estado enviado
  ultimoEnvio: 0,
  ultimoBatimento: 0,
  diferencaRelogio: 0, // relógio do servidor - relógio daqui
};

function agoraServidor() { return Date.now() + online.diferencaRelogio; }

function iniciarOnline() {
  configurarChat();
  if (!nuvem.pronta || !nuvem.usuario || typeof firebase.database !== 'function') {
    mostrarListaOnline();
    return;
  }
  try {
    online.rtdb = firebase.database();
  } catch (erro) {
    console.warn('Online indisponível:', erro);
    mostrarListaOnline();
    return;
  }
  online.ativo = true;
  const uid = nuvem.usuario.uid;
  online.eu = online.rtdb.ref('online/' + uid);

  online.rtdb.ref('.info/serverTimeOffset').on('value', s => { online.diferencaRelogio = s.val() || 0; });

  // Ao conectar (e ao reconectar depois de cair a internet): se cair, o servidor me apaga sozinho
  online.rtdb.ref('.info/connected').on('value', (s) => {
    if (s.val() !== true) return;
    online.eu.onDisconnect().remove();
    online.enviado = null; // manda tudo de novo
  });

  // Os outros jogadores
  const lista = online.rtdb.ref('online');
  lista.on('child_added', s => receberJogador(s.key, s.val()));
  lista.on('child_changed', s => receberJogador(s.key, s.val()));
  lista.on('child_removed', (s) => { delete online.outros[s.key]; mostrarListaOnline(); });

  // Chat: mensagens dos últimos minutos e as novas
  online.rtdb.ref('chat').orderByChild('t').startAt(agoraServidor() - ONLINE.HISTORICO_CHAT).limitToLast(30)
    .on('child_added', s => receberMensagem(s.val()));

  window.addEventListener('pagehide', sairOnline);
  registrar('Você está online. Outros jogadores conectados com Google aparecem no mapa.', 'info');
  mostrarListaOnline();
}

function sairOnline() {
  if (!online.ativo) return;
  try { online.eu.remove(); } catch (e) { /* já caiu */ }
}

// ---------- Enviar a minha posição ----------

function estadoAtual() {
  return { nome: jogador.nome, classe: jogador.classe, level: jogador.level, x: jogador.x, y: jogador.y, dir: jogador.direcao };
}

function atualizarOnline(agora) {
  if (!online.ativo || !online.eu) return;
  const e = estadoAtual();
  const mudou = !online.enviado || Object.keys(e).some(k => e[k] !== online.enviado[k]);
  const batimento = agora - online.ultimoBatimento > ONLINE.BATIMENTO;
  if ((mudou && agora - online.ultimoEnvio >= ONLINE.ENVIO_MINIMO) || batimento) {
    online.eu.set(Object.assign({}, e, { t: firebase.database.ServerValue.TIMESTAMP })).catch(erro => console.warn('online:', erro));
    online.enviado = e;
    online.ultimoEnvio = agora;
    online.ultimoBatimento = agora;
  }
}

// ---------- Receber os outros ----------

function receberJogador(uid, dados) {
  if (!dados || uid === nuvem.usuario.uid) return;
  const agora = performance.now();
  const antigo = online.outros[uid];
  const o = Object.assign({}, dados);
  if (antigo) {
    const p = posicaoVisualOutro(antigo, agora);
    const andou = antigo.x !== o.x || antigo.y !== o.y;
    o.de = andou ? p : antigo.de;
    o.inicio = andou ? agora : antigo.inicio;
    // pulou longe (templo, teleporte): não desliza pelo mapa
    if (Math.abs(o.x - p.x) > 2 || Math.abs(o.y - p.y) > 2) o.de = { x: o.x, y: o.y };
  } else {
    o.de = { x: o.x, y: o.y };
    o.inicio = -Infinity;
  }
  online.outros[uid] = o;
  if (!antigo) mostrarListaOnline();
}

function posicaoVisualOutro(o, agora) {
  const t = Math.min(1, (agora - o.inicio) / ONLINE.DURACAO_PASSO);
  return { x: o.de.x + (o.x - o.de.x) * t, y: o.de.y + (o.y - o.de.y) * t };
}

// Quem está conectado de verdade (ignora quem sumiu sem avisar)
function outrosAtivos() {
  const limite = agoraServidor() - ONLINE.SUMIDO;
  return Object.entries(online.outros).filter(([, o]) => !o.t || o.t >= limite);
}

// Para o desenho (desenho.js): os outros que estão perto da tela
function jogadoresParaDesenhar(agora, naTela) {
  const lista = [];
  for (const [uid, o] of outrosAtivos()) {
    const p = posicaoVisualOutro(o, agora);
    if (naTela(p.x, p.y)) lista.push({ outro: o, uid, x: p.x, y: p.y });
  }
  return lista;
}

function desenharOutroJogador(o, sx, sy, agora) {
  const T = CONFIG.TAMANHO_TILE;
  const imagem = img[(CLASSES[o.classe] || CLASSES.guerreiro).sprite];
  const andando = agora - o.inicio < ONLINE.DURACAO_PASSO;
  desenharSombra(sx + T / 2, sy + T - 2, 9);
  if (imagem) desenharPersonagem(imagem, o.dir || 'baixo', quadroAndando(andando, agora), sx, sy);
  desenharNome(o.nome + ' (' + o.level + ')', '#7ec8ff', sx + T / 2, sy - 7);
}

// ---------- Chat ----------

function configurarChat() {
  const form = document.getElementById('form-chat');
  if (!form || form.dataset.pronto) return;
  form.dataset.pronto = '1';
  const campo = document.getElementById('campo-chat');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = campo.value.trim().slice(0, ONLINE.TAMANHO_FALA);
    campo.value = '';
    campo.blur();
    if (!texto) return;
    if (!online.ativo) { mostrarMensagem('Entre com a conta Google para conversar com outros jogadores.'); return; }
    online.rtdb.ref('chat').push({ uid: nuvem.usuario.uid, nome: jogador.nome, texto, t: firebase.database.ServerValue.TIMESTAMP })
      .catch(() => mostrarMensagem('Não deu pra enviar a mensagem.'));
  });
  campo.addEventListener('keydown', (e) => { if (e.key === 'Escape') campo.blur(); });
  // Enter no jogo abre o chat
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'INPUT' || modalAberto()) return;
    e.preventDefault();
    campo.focus();
  });
}

function receberMensagem(m) {
  if (!m || !m.texto) return;
  const texto = String(m.texto).slice(0, ONLINE.TAMANHO_FALA);
  registrar(m.nome + ': ' + texto, 'chat');
  // mensagem nova (não do histórico): aparece em cima da cabeça
  if (m.t && agoraServidor() - m.t < 10000) online.falas[m.uid] = { texto, ate: performance.now() + ONLINE.TEMPO_FALA };
}

// Falas em cima da cabeça (a minha e a dos outros), desenhadas por cima de tudo
function desenharFalas(agora, visJogador) {
  const T = CONFIG.TAMANHO_TILE;
  for (const uid in online.falas) {
    const f = online.falas[uid];
    if (agora > f.ate) { delete online.falas[uid]; continue; }
    let p = null;
    if (nuvem.usuario && uid === nuvem.usuario.uid) p = visJogador;
    else if (online.outros[uid]) p = posicaoVisualOutro(online.outros[uid], agora);
    if (!p) continue;
    const cx = p.x * T + T / 2 - camera.x;
    const cy = p.y * T - camera.y - 20;
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    const linhas = quebrarTexto(f.texto, 26);
    linhas.forEach((l, i) => {
      const y = cy - (linhas.length - 1 - i) * 13;
      ctx.strokeText(l, cx, y);
      ctx.fillStyle = '#ffe14d';
      ctx.fillText(l, cx, y);
    });
  }
}

function quebrarTexto(texto, max) {
  const linhas = [];
  let atual = '';
  for (const p of texto.split(' ')) {
    if ((atual + ' ' + p).trim().length > max && atual) { linhas.push(atual); atual = p; }
    else atual = (atual + ' ' + p).trim();
  }
  if (atual) linhas.push(atual);
  return linhas.slice(0, 4);
}

// ---------- Lista de quem está online ----------

function mostrarListaOnline() {
  const el = document.getElementById('online-lista');
  if (!el) return;
  if (!online.ativo) {
    el.textContent = nuvem.usuario ? 'Online indisponível agora.' : 'Entre com a conta Google para ver outros jogadores.';
    return;
  }
  const nomes = outrosAtivos().map(([, o]) => o.nome + ' (' + o.level + ')');
  el.textContent = '🟢 Online: ' + (nomes.length ? nomes.join(' · ') : 'só você por enquanto');
}
setInterval(() => { if (online.ativo) mostrarListaOnline(); }, 5000);
