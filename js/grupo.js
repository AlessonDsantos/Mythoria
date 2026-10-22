// =====================================================
// grupo.js — Grupo (party) de até 4 jogadores caçando os MESMOS monstros
//
// Como funciona (sem servidor próprio, só o Realtime Database):
//   - O LÍDER é o "dono" dos monstros: o jogo dele move, ataca e mata os monstros.
//   - A cada 0,2 s o líder manda pros membros como estão os monstros perto deles.
//   - Os MEMBROS não rodam monstros: mostram os do líder e mandam as ações
//     ("dei 35 de dano no monstro 12", "confundi o 7") pro líder aplicar.
//   - Quando um monstro ataca um membro, o líder avisa e o golpe é calculado
//     no aparelho do membro (com a armadura e as passivas dele).
//   - XP: dividida entre quem atacou ou curou e está perto, com bônus.
//
// No banco:
//   convites/<id>               → { de, nome, pid, t }     (convite pra entrar num grupo)
//   grupos/<id do líder>        → { lider, membros: { id: nome }, estado, acoes, eventos }
// =====================================================

const GRUPO = {
  MAXIMO: 4,
  ENVIO_ESTADO: 200,         // líder manda os monstros a cada 0,2 s
  RAIO_ESTADO: 11,           // monstros até 11 quadrados de algum membro
  BONUS_XP: { 2: 0.3, 3: 0.6, 4: 0.9 }, // 2 pessoas: +30% no total; 3: +60%; 4: +90%
  TEMPO_PARTICIPACAO: 20000, // curou nos últimos 20 s = participou
  PASSO_PROXY: 230,          // animação dos monstros vindos do líder
};

const grupo = {
  id: null,          // id do grupo (= id da conta do líder)
  lider: null,
  membros: {},       // id → nome
  ref: null,
  ultimoEstado: 0,
  curouEm: {},       // id → quando curou pela última vez (só o líder usa)
  proxies: new Map(),// membro: id do monstro → objeto
  ouvindo: [],       // listeners pra desligar ao sair
};

function meuId() { return nuvem.usuario ? nuvem.usuario.uid : null; }
function noGrupo() { return !!grupo.id; }
function souLider() { return noGrupo() && grupo.lider === meuId(); }
function ehMembroDoGrupo() { return noGrupo() && !souLider(); }
function outrosDoGrupo() { return Object.keys(grupo.membros).filter(id => id !== meuId()); }
function grupoAtivoComMembros() { return souLider() && outrosDoGrupo().length > 0; }
function ehDoMeuGrupo(uid) { return noGrupo() && !!grupo.membros[uid]; }

function ouvir(ref, evento, fn) { ref.on(evento, fn); grupo.ouvindo.push(() => ref.off(evento, fn)); }

// ---------- Começo: escuta convites ----------

function configurarGrupo() {
  if (!online.ativo) return;
  online.rtdb.ref('convites/' + meuId()).on('value', s => receberConvite(s.val()));
  mostrarGrupo();
}

// ---------- Convidar / entrar / sair ----------

function convidarParaGrupo(uid) {
  const o = online.outros[uid];
  if (!o || !online.ativo) return;
  if (ehMembroDoGrupo()) { mostrarMensagem('Só o líder do grupo pode convidar.'); return; }
  if (ehDoMeuGrupo(uid)) { mostrarMensagem(o.nome + ' já está no seu grupo.'); return; }
  if (Object.keys(grupo.membros).length >= GRUPO.MAXIMO) { mostrarMensagem('O grupo já tem ' + GRUPO.MAXIMO + ' pessoas.'); return; }
  abrirModal('Convidar para o grupo', 'Chamar ' + o.nome + ' (level ' + o.level + ') para caçar com você?', [
    { texto: 'Cancelar', secundario: true },
    { texto: 'Convidar', acao: async () => {
      try {
        if (!noGrupo()) await criarGrupo();
        await online.rtdb.ref('convites/' + uid).set({ de: meuId(), nome: jogador.nome, pid: grupo.id, t: firebase.database.ServerValue.TIMESTAMP });
        registrar('Convite enviado para ' + o.nome + '.', 'info');
      } catch (erro) { console.warn(erro); mostrarMensagem('Não deu pra convidar agora.'); }
    } },
  ]);
}

async function criarGrupo() {
  const id = meuId();
  const ref = online.rtdb.ref('grupos/' + id);
  await ref.set({ lider: id, membros: { [id]: jogador.nome } });
  ref.onDisconnect().remove(); // líder caiu: o grupo acaba
  entrarNoGrupo(id);
}

let conviteAberto = null;
function receberConvite(c) {
  if (!c || !c.pid || conviteAberto === c.pid) return;
  if (c.t && agoraServidor() - c.t > 120000) { online.rtdb.ref('convites/' + meuId()).remove(); return; } // velho
  conviteAberto = c.pid;
  abrirModal('Convite de grupo', c.nome + ' te chamou para caçar junto. Os monstros dele passam a ser os seus, e a XP é dividida com bônus.', [
    { texto: 'Recusar', secundario: true, acao: () => { conviteAberto = null; online.rtdb.ref('convites/' + meuId()).remove(); } },
    { texto: 'Entrar', acao: () => aceitarConvite(c) },
  ]);
}

async function aceitarConvite(c) {
  conviteAberto = null;
  try {
    if (noGrupo()) await sairDoGrupo(true);
    const ref = online.rtdb.ref('grupos/' + c.pid + '/membros/' + meuId());
    await ref.set(jogador.nome);
    ref.onDisconnect().remove();
    await online.rtdb.ref('convites/' + meuId()).remove();
    entrarNoGrupo(c.pid);
  } catch (erro) {
    console.warn(erro);
    mostrarMensagem('Não deu pra entrar no grupo (ele pode ter acabado).');
    online.rtdb.ref('convites/' + meuId()).remove();
  }
}

function entrarNoGrupo(pid) {
  grupo.id = pid;
  grupo.ref = online.rtdb.ref('grupos/' + pid);
  grupo.lider = pid;     // o id do grupo é o id do líder
  grupo.membros = {};
  // só a lista de membros (o "estado" dos monstros muda 5x por segundo e tem listener próprio)
  ouvir(grupo.ref.child('membros'), 'value', s => atualizarDadosGrupo(s.val()));
  ouvir(grupo.ref.child('eventos/' + meuId()), 'child_added', (s) => { receberEvento(s.val()); s.ref.remove(); });
  if (pid === meuId()) {
    ouvir(grupo.ref.child('acoes'), 'child_added', (s) => { aplicarAcao(s.val()); s.ref.remove(); });
  } else {
    // Vira membro: some com os meus monstros e passa a mostrar os do líder
    monstros.length = 0;
    respawnsPendentes.length = 0;
    grupo.proxies.clear();
    limparAlvo();
    ouvir(grupo.ref.child('estado'), 'value', s => aplicarEstado(s.val()));
    registrar('Você entrou no grupo. Os monstros agora são os do líder.', 'info');
  }
  mostrarGrupo();
}

function atualizarDadosGrupo(membros) {
  if (!membros || !membros[meuId()]) {
    // o grupo acabou ou eu saí/fui tirado
    if (noGrupo()) sairDoGrupoLocal(membros ? 'Você saiu do grupo.' : 'O grupo acabou.');
    return;
  }
  const antes = Object.keys(grupo.membros);
  grupo.membros = membros;
  for (const id of Object.keys(grupo.membros)) {
    if (!antes.includes(id) && id !== meuId() && antes.length) registrar(grupo.membros[id] + ' entrou no grupo.', 'info');
  }
  for (const id of antes) if (!grupo.membros[id] && id !== meuId()) registrar((online.outros[id] ? online.outros[id].nome : 'Alguém') + ' saiu do grupo.', 'info');
  mostrarGrupo();
}

async function sairDoGrupo(semPerguntar = false) {
  if (!noGrupo()) return;
  const sair = async () => {
    try {
      if (souLider()) await grupo.ref.remove();
      else await grupo.ref.child('membros/' + meuId()).remove();
    } catch (e) { /* já caiu */ }
    sairDoGrupoLocal('Você saiu do grupo.');
  };
  if (semPerguntar) return sair();
  abrirModal('Sair do grupo?', souLider() ? 'Você é o líder: o grupo acaba pra todo mundo.' : 'Você volta a caçar sozinho, com os seus próprios monstros.', [
    { texto: 'Cancelar', secundario: true },
    { texto: 'Sair', perigo: true, acao: sair },
  ]);
}

function sairDoGrupoLocal(texto) {
  const eraMembro = ehMembroDoGrupo();
  for (const desligar of grupo.ouvindo) desligar();
  grupo.ouvindo = [];
  grupo.id = null; grupo.lider = null; grupo.membros = {}; grupo.ref = null;
  if (eraMembro) {
    // volta a ter os próprios monstros
    monstros.length = 0;
    grupo.proxies.clear();
    limparAlvo();
    criarFantoches();
    popularMonstros();
  }
  registrar(texto, 'info');
  mostrarGrupo();
}

// ---------- LÍDER: manda o estado dos monstros ----------

const DIRS = ['baixo', 'esquerda', 'direita', 'cima'];

function atualizarGrupo(agora) {
  if (!grupoAtivoComMembros() || agora - grupo.ultimoEstado < GRUPO.ENVIO_ESTADO) return;
  grupo.ultimoEstado = agora;
  const perto = outrosDoGrupo().map(id => online.outros[id]).filter(Boolean);
  if (!perto.length) return;
  const estado = {};
  for (const m of monstros) {
    if (!perto.some(p => Math.abs(p.x - m.x) <= GRUPO.RAIO_ESTADO && Math.abs(p.y - m.y) <= GRUPO.RAIO_ESTADO)) continue;
    const f = (monstroConfuso(m, agora) ? 1 : 0) | (agora < (m.lentoAte || 0) ? 2 : 0) |
              (agora < (m.semDefesaAte || 0) ? 4 : 0) | (m.morto ? 8 : 0);
    estado[m.id] = [m.tipo, m.x, m.y, Math.max(0, DIRS.indexOf(m.direcao)), Math.max(0, Math.round(m.vida)), m.vidaMax, f].join('|');
  }
  grupo.ref.child('estado').set(estado).catch(() => {});
}

// Monstro atacou um membro: o líder avisa e o golpe é calculado lá
function golpearMembro(m, alvo, agora) {
  virarPara(m, alvo);
  m.ultimoAtaque = agora;
  grupo.ref.child('eventos/' + alvo.uid).push({ t: 'golpe', id: m.id }).catch(() => {});
}

// Quem o monstro persegue: o jogador do grupo mais perto que ele enxerga
function alvoDoMonstro(m, tipo) {
  let melhor = null, melhorDist = Infinity;
  const considerar = (p) => {
    if (!p || p.vida <= 0 || naZonaSegura(p.x, p.y)) return;
    const d = distancia(m, p);
    if (d <= tipo.visao && d < melhorDist) { melhor = p; melhorDist = d; }
  };
  considerar(jogador);
  if (grupoAtivoComMembros()) {
    for (const id of outrosDoGrupo()) {
      const o = online.outros[id];
      if (o) considerar({ x: o.x, y: o.y, vida: o.vida === undefined ? 1 : o.vida, uid: id });
    }
  }
  return melhor;
}

// Algum membro do grupo está nesse quadrado? (monstro não pisa em cima)
function membroEm(x, y) {
  if (!noGrupo()) return false;
  return outrosDoGrupo().some(id => { const o = online.outros[id]; return o && o.x === x && o.y === y; });
}

// ---------- LÍDER: aplica as ações dos membros ----------

function monstroPorId(id) { return monstros.find(m => m.id === id); }

function aplicarAcao(a) {
  if (!a || !ehDoMeuGrupo(a.de)) return;
  const agora = performance.now();
  if (a.t === 'cura') { grupo.curouEm[a.de] = agora; return; }
  if (a.t === 'puxar') { puxarMonstros(agora, { x: a.x, y: a.y }); return; }
  const m = monstroPorId(a.id);
  if (!m || m.morto) return;
  const tipo = TIPOS_MONSTRO[m.tipo];
  if (a.t === 'dano') {
    const dano = Math.max(0, Math.round(a.d) || 0);
    if (!dano) return;
    m.danoPor = m.danoPor || {};
    m.danoPor[a.de] = (m.danoPor[a.de] || 0) + dano;
    m.ultimoDano = agora;
    adicionarTexto(m.x, m.y, String(dano), '#ff9e4d', agora); // dano do amigo (laranja)
    if (tipo.fantoche) return;
    m.vida -= dano;
    if (m.vida <= 0) matarMonstro(m, agora);
  } else if (a.t === 'conf') {
    confundir(m, agora, Math.min(10000, a.ms || 0));
  } else if (a.t === 'lento') {
    deixarLento(m, Math.min(0.9, a.l || 0), agora + Math.min(10000, a.ms || 0));
  } else if (a.t === 'semdef') {
    tirarDefesa(m, agora + Math.min(10000, a.ms || 0));
  }
}

// ---------- MEMBRO: mostra os monstros do líder ----------

function aplicarEstado(estado) {
  if (!ehMembroDoGrupo()) return;
  const agora = performance.now();
  const vistos = new Set();
  for (const chave in (estado || {})) {
    const id = Number(chave);
    const [tipo, xs, ys, ds, vs, vms, fs] = String(estado[chave]).split('|');
    if (!TIPOS_MONSTRO[tipo]) continue;
    const x = Number(xs), y = Number(ys), f = Number(fs);
    vistos.add(id);
    let m = grupo.proxies.get(id);
    if (!m) {
      m = { id, tipo, x, y, anteriorX: x, anteriorY: y, inicioPasso: -Infinity, direcao: 'baixo', vida: 0, vidaMax: 1,
            proximoAtaque: 0, proximaDecisao: 0, ultimoDano: -Infinity, morto: false, morreuEm: 0, loot: [], removido: false, casa: null, proxy: true };
      grupo.proxies.set(id, m);
      monstros.push(m);
    }
    if (m.x !== x || m.y !== y) {
      const p = posicaoVisualMonstro(m, agora);
      m.anteriorX = p.x; m.anteriorY = p.y;
      m.x = x; m.y = y;
      m.inicioPasso = agora;
      m.passoAtual = GRUPO.PASSO_PROXY;
    }
    m.direcao = DIRS[Number(ds)] || 'baixo';
    m.vida = Number(vs); m.vidaMax = Number(vms);
    // debuffs: mostra as notas roxas e deixa a defesa certa pro meu cálculo de dano
    m.confusoAte = f & 1 ? agora + 400 : 0;
    m.lentoAte = f & 2 ? agora + 400 : 0;
    m.semDefesaAte = f & 4 ? agora + 400 : 0;
    if (f & 8 && !m.morto) {
      m.morto = true; m.morreuEm = agora; m.vida = 0;
      if (jogador.alvo === m) limparAlvo();
    }
  }
  // quem não veio mais: saiu de perto ou o corpo sumiu
  for (let i = monstros.length - 1; i >= 0; i--) {
    const m = monstros[i];
    if (m.proxy && !vistos.has(m.id)) {
      m.removido = true;
      monstros.splice(i, 1);
      grupo.proxies.delete(m.id);
      if (jogador.alvo === m) limparAlvo();
    }
  }
}

// O líder avisou alguma coisa
function receberEvento(e) {
  if (!e) return;
  const agora = performance.now();
  if (e.t === 'golpe') {
    const m = grupo.proxies.get(e.id);
    if (m && !m.morto && jogador.vida > 0) monstroAtaca(m, agora);
  } else if (e.t === 'xp') {
    const tipo = TIPOS_MONSTRO[e.tipo];
    const nome = tipo ? tipo.nome : 'Monstro';
    registrar(nome + ' morto pelo grupo (+' + e.v + ' XP).', 'loot');
    if (tipo) contarTask(e.tipo);
    adicionarTexto(jogador.x, jogador.y, '+' + e.v + ' XP', '#ffffff', agora);
    ganharXp(e.v, agora);
  }
}

// ---------- Dano e cura (chamados pelo combate e pelas magias) ----------

function enviarAcaoGrupo(a) {
  if (!grupo.ref) return;
  a.de = meuId();
  grupo.ref.child('acoes').push(a).catch(() => {});
}

// Todo dano em monstro passa por aqui
function ferirMonstro(m, dano) {
  if (ehMembroDoGrupo()) {
    if (!TIPOS_MONSTRO[m.tipo].fantoche) m.vida = Math.max(1, m.vida - dano); // mostra já; o líder confirma
    enviarAcaoGrupo({ t: 'dano', id: m.id, d: dano });
    return;
  }
  m.vida -= dano;
  if (grupoAtivoComMembros()) {
    m.danoPor = m.danoPor || {};
    m.danoPor[meuId()] = (m.danoPor[meuId()] || 0) + dano;
  }
}

function marcarCuraNoGrupo() {
  if (ehMembroDoGrupo()) enviarAcaoGrupo({ t: 'cura' });
  else if (souLider()) grupo.curouEm[meuId()] = performance.now();
}

// ---------- XP do grupo (o líder calcula quando o monstro morre) ----------
// Devolve a MINHA parte (ou null se eu não participei)

function dividirXpDoGrupo(m, tipo, agora) {
  const meiaL = Math.floor(CONFIG.VISAO_COLUNAS / 2), meiaA = Math.floor(CONFIG.VISAO_LINHAS / 2);
  const naTelaDe = (p) => Math.abs(p.x - m.x) <= meiaL && Math.abs(p.y - m.y) <= meiaA;
  const danoPor = m.danoPor || {};
  const participou = (id) => danoPor[id] > 0 || agora - (grupo.curouEm[id] || -Infinity) < GRUPO.TEMPO_PARTICIPACAO;

  const pessoas = []; // { id, level, dano }
  if (participou(meuId()) && naTelaDe(jogador)) pessoas.push({ id: meuId(), level: jogador.level, dano: danoPor[meuId()] || 0 });
  for (const id of outrosDoGrupo()) {
    const o = online.outros[id];
    if (o && participou(id) && naTelaDe(o)) pessoas.push({ id, level: o.level, dano: danoPor[id] || 0 });
  }
  if (!pessoas.length) return null;

  // Como no Tibia: só divide com bônus se o menor level for pelo menos 2/3 do maior
  const levels = pessoas.map(p => p.level);
  const dentroDaFaixa = Math.min(...levels) >= Math.ceil(Math.max(...levels) * 2 / 3);
  const partes = {};
  if (pessoas.length > 1 && dentroDaFaixa) {
    const total = tipo.xp * (1 + (GRUPO.BONUS_XP[pessoas.length] || 0));
    for (const p of pessoas) partes[p.id] = Math.round(total / pessoas.length);
  } else {
    // fora da faixa de level (ou só uma pessoa): cada um pelo dano que causou, sem bônus
    const somaDano = pessoas.reduce((s, p) => s + p.dano, 0);
    for (const p of pessoas) partes[p.id] = somaDano > 0 ? Math.round(tipo.xp * p.dano / somaDano) : Math.round(tipo.xp / pessoas.length);
  }
  for (const id in partes) {
    if (id !== meuId() && partes[id] > 0) grupo.ref.child('eventos/' + id).push({ t: 'xp', v: partes[id], tipo: m.tipo }).catch(() => {});
  }
  return partes[meuId()] === undefined ? null : partes[meuId()];
}

// ---------- Painel do grupo (embaixo do Server Log) ----------

function mostrarGrupo() {
  const el = document.getElementById('grupo-info');
  if (!el) return;
  el.innerHTML = '';
  if (!noGrupo()) {
    el.classList.add('escondido');
    return;
  }
  el.classList.remove('escondido');
  const titulo = document.createElement('span');
  titulo.textContent = '👥 Grupo (' + Object.keys(grupo.membros).length + '/' + GRUPO.MAXIMO + '): ';
  el.appendChild(titulo);
  for (const id of Object.keys(grupo.membros)) {
    const s = document.createElement('span');
    s.className = 'membro-grupo';
    const o = id === meuId() ? jogador : online.outros[id];
    const pct = o && o.vidaMax ? ' ' + Math.max(0, Math.round(100 * o.vida / o.vidaMax)) + '%' : '';
    s.textContent = (id === grupo.lider ? '★ ' : '') + grupo.membros[id] + pct;
    el.appendChild(s);
  }
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-secundario btn-pequeno';
  b.textContent = 'Sair do grupo';
  b.addEventListener('click', () => sairDoGrupo());
  el.appendChild(b);
}
setInterval(() => { if (noGrupo()) mostrarGrupo(); }, 2000);
