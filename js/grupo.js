// =====================================================
// grupo.js — Grupo (party) de até 4 jogadores caçando os MESMOS monstros
//
// Como funciona (sem servidor próprio, só o Realtime Database):
//   - O LÍDER é o "dono" dos monstros: o jogo dele move, ataca e mata os monstros.
//   - O líder manda pros membros SÓ o que mudou nos monstros perto deles.
//   - Os MEMBROS não rodam monstros: mostram os do líder e mandam as ações
//     ("dei 35 de dano no monstro 12", "quero o loot do corpo 7") pro líder aplicar.
//   - Quando um monstro ataca um membro, o líder avisa e o golpe é calculado
//     no aparelho do membro (com a armadura e as passivas dele).
//   - Efeitos (magias, tiros, números de dano) de cada um aparecem pros outros.
//   - Se o líder sair, outro membro vira líder e o grupo continua
//     (os monstros em volta nascem de novo, porque eram do jogo do líder antigo).
//
// No banco:
//   convites/<id>         → { de, nome, pid, t }
//   grupos/<pid>          → { lider, membros: { id: nome }, estado, acoes, eventos, fx }
// =====================================================

const GRUPO = {
  MAXIMO: 4,
  ENVIO_ESTADO: 200,         // líder confere a cada 0,2 s o que mudou nos monstros
  RAIO_ESTADO: 11,           // monstros até 11 quadrados de algum membro
  BONUS_XP: { 2: 0.3, 3: 0.6, 4: 0.9 }, // 2 pessoas: +30% no total; 3: +60%; 4: +90%
  PASSO_PROXY: 230,          // animação dos monstros vindos do líder
  ENVIO_FX: 100,             // efeitos visuais saem em pacotes a cada 0,1 s
  VIDA_LOCAL: 1500,          // por quanto tempo o membro confia no dano que ele mesmo deu
};

const grupo = {
  id: null,          // id do grupo
  lider: null,       // id da conta do líder
  membros: {},       // id → nome
  ref: null,
  ultimoEstado: 0,
  enviado: {},       // líder: último estado mandado de cada monstro
  estadoCompleto: false,
  proxies: new Map(),// membro: id do monstro → objeto
  ouvindo: [],       // listeners pra desligar ao sair
  liderOuvindo: [],  // listeners que só o líder usa
  fxFila: [], fxSeq: 0, fxUltimo: 0, fxVisto: {},
};

function meuId() { return nuvem.usuario ? nuvem.usuario.uid : null; }
function noGrupo() { return !!grupo.id; }
function souLider() { return noGrupo() && grupo.lider === meuId(); }
function ehMembroDoGrupo() { return noGrupo() && !souLider(); }
function outrosDoGrupo() { return Object.keys(grupo.membros).filter(id => id !== meuId()); }
function grupoAtivoComMembros() { return souLider() && outrosDoGrupo().length > 0; }
function ehDoMeuGrupo(uid) { return noGrupo() && !!grupo.membros[uid]; }

function ouvir(ref, evento, fn, lista = grupo.ouvindo) { ref.on(evento, fn); lista.push(() => ref.off(evento, fn)); }

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
  const ref = online.rtdb.ref('grupos').push();
  await ref.set({ lider: meuId(), membros: { [meuId()]: jogador.nome } });
  ref.child('membros/' + meuId()).onDisconnect().remove(); // caí: saio do grupo (outro vira líder)
  entrarNoGrupo(ref.key);
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
  grupo.membros = {};
  grupo.lider = null;
  ouvir(grupo.ref.child('membros'), 'value', s => atualizarMembros(s.val()));
  ouvir(grupo.ref.child('lider'), 'value', s => mudarLider(s.val()));
  ouvir(grupo.ref.child('eventos/' + meuId()), 'child_added', (s) => { receberEvento(s.val()); s.ref.remove(); });
  const fx = grupo.ref.child('fx');
  ouvir(fx, 'child_added', s => receberFx(s.key, s.val()));
  ouvir(fx, 'child_changed', s => receberFx(s.key, s.val()));
  mostrarGrupo();
}

// O líder mudou (ou é a primeira vez que sei quem é)
function mudarLider(novo) {
  if (!novo || novo === grupo.lider) return;
  const antes = grupo.lider;
  grupo.lider = novo;
  for (const desligar of grupo.liderOuvindo) desligar();
  grupo.liderOuvindo = [];
  if (novo === meuId()) virarLider(antes !== null);
  else virarMembro();
  if (antes) registrar((novo === meuId() ? 'Você' : (grupo.membros[novo] || 'Outro jogador')) + ' agora é o líder do grupo.', 'info');
  mostrarGrupo();
}

function virarLider(herdou) {
  grupo.enviado = {};
  grupo.estadoCompleto = false;
  if (herdou) {
    // os monstros eram do jogo do líder antigo: aqui eles nascem de novo
    monstros.length = 0;
    grupo.proxies.clear();
    limparAlvo();
    criarFantoches();
    popularMonstros();
  }
  ouvir(grupo.ref.child('acoes'), 'child_added', (s) => { aplicarAcao(s.val()); s.ref.remove(); }, grupo.liderOuvindo);
}

function virarMembro() {
  // some com os meus monstros e passa a mostrar os do líder
  monstros.length = 0;
  respawnsPendentes.length = 0;
  grupo.proxies.clear();
  limparAlvo();
  fecharCorpo();
  const est = grupo.ref.child('estado');
  ouvir(est, 'child_added', s => aplicarMonstro(Number(s.key), s.val()), grupo.liderOuvindo);
  ouvir(est, 'child_changed', s => aplicarMonstro(Number(s.key), s.val()), grupo.liderOuvindo);
  ouvir(est, 'child_removed', s => tirarMonstro(Number(s.key)), grupo.liderOuvindo);
  registrar('Você está no grupo. Os monstros agora são os do líder.', 'info');
}

function atualizarMembros(membros) {
  if (!membros || !membros[meuId()]) {
    if (noGrupo()) sairDoGrupoLocal(membros ? 'Você saiu do grupo.' : 'O grupo acabou.');
    return;
  }
  const antes = Object.keys(grupo.membros);
  grupo.membros = membros;
  for (const id of Object.keys(membros)) {
    if (!antes.includes(id) && id !== meuId() && antes.length) registrar(membros[id] + ' entrou no grupo.', 'info');
  }
  for (const id of antes) if (!membros[id] && id !== meuId()) registrar((online.outros[id] ? online.outros[id].nome : 'Alguém') + ' saiu do grupo.', 'info');
  // O líder saiu? Quem tem o menor id assume (os outros esperam)
  if (grupo.lider && !membros[grupo.lider]) {
    const proximo = Object.keys(membros).sort()[0];
    if (proximo === meuId()) grupo.ref.child('lider').set(meuId()).catch(e => console.warn('liderança:', e));
  }
  mostrarGrupo();
}

async function sairDoGrupo(semPerguntar = false) {
  if (!noGrupo()) return;
  const sair = async () => {
    try {
      if (souLider() && !outrosDoGrupo().length) await grupo.ref.remove(); // sozinho: apaga o grupo
      else await grupo.ref.child('membros/' + meuId()).remove();        // os outros continuam
    } catch (e) { /* já caiu */ }
    sairDoGrupoLocal('Você saiu do grupo.');
  };
  if (semPerguntar) return sair();
  abrirModal('Sair do grupo?', 'Você volta a caçar sozinho, com os seus próprios monstros.' +
    (souLider() && outrosDoGrupo().length ? ' Outro membro vira o líder.' : ''), [
    { texto: 'Cancelar', secundario: true },
    { texto: 'Sair', perigo: true, acao: sair },
  ]);
}

function sairDoGrupoLocal(texto) {
  const eraMembro = ehMembroDoGrupo();
  for (const desligar of grupo.ouvindo.concat(grupo.liderOuvindo)) desligar();
  grupo.ouvindo = []; grupo.liderOuvindo = [];
  grupo.id = null; grupo.lider = null; grupo.membros = {}; grupo.ref = null;
  grupo.fxFila = [];
  if (eraMembro) {
    // volta a ter os próprios monstros
    monstros.length = 0;
    grupo.proxies.clear();
    limparAlvo();
    fecharCorpo();
    criarFantoches();
    popularMonstros();
  }
  registrar(texto, 'info');
  mostrarGrupo();
}

// ---------- LÍDER: manda SÓ o que mudou nos monstros ----------

const DIRS = ['baixo', 'esquerda', 'direita', 'cima'];

function textoDoMonstro(m, agora) {
  const f = (monstroConfuso(m, agora) ? 1 : 0) | (agora < (m.lentoAte || 0) ? 2 : 0) |
            (agora < (m.semDefesaAte || 0) ? 4 : 0) | (m.morto ? 8 : 0);
  let t = [m.tipo, m.x, m.y, Math.max(0, DIRS.indexOf(m.direcao)), Math.max(0, Math.round(m.vida)), m.vidaMax, f].join('|');
  if (m.morto) {
    // corpo: o loot e quem pode pegar (quem atacou)
    const loot = m.loot.map(e => e ? e.id + ':' + e.qtd : '-').join(',');
    t += '|' + loot + '|' + Object.keys(m.danoPor || {}).join(',');
  }
  return t;
}

function atualizarGrupo(agora) {
  enviarFx(agora);
  if (ehMembroDoGrupo()) { limparCorposVelhos(agora); return; }
  if (!grupoAtivoComMembros() || agora - grupo.ultimoEstado < GRUPO.ENVIO_ESTADO) return;
  grupo.ultimoEstado = agora;
  const perto = outrosDoGrupo().map(id => online.outros[id]).filter(Boolean);
  const agoraEstado = {};
  for (const m of monstros) {
    if (m.removido) continue;
    if (!perto.some(p => Math.abs(p.x - m.x) <= GRUPO.RAIO_ESTADO && Math.abs(p.y - m.y) <= GRUPO.RAIO_ESTADO)) continue;
    agoraEstado[m.id] = textoDoMonstro(m, agora);
  }
  const mudancas = {};
  let tem = false;
  for (const id in agoraEstado) if (grupo.enviado[id] !== agoraEstado[id]) { mudancas[id] = agoraEstado[id]; tem = true; }
  for (const id in grupo.enviado) if (!(id in agoraEstado)) { mudancas[id] = null; tem = true; }
  if (!grupo.estadoCompleto) {
    grupo.ref.child('estado').set(agoraEstado).catch(() => {}); // primeira vez: apaga o que o líder antigo deixou
    grupo.estadoCompleto = true;
  } else if (tem) {
    grupo.ref.child('estado').update(mudancas).catch(() => {});
  }
  grupo.enviado = agoraEstado;
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

// roda sem deixar textos na tela (o membro já manda os dele junto com os efeitos)
function semTextos(fn) { const n = textosFlutuantes.length; fn(); textosFlutuantes.length = n; }

function aplicarAcao(a) {
  if (!a || !ehDoMeuGrupo(a.de)) return;
  const agora = performance.now();
  if (a.t === 'puxar') { puxarMonstros(agora, { x: a.x, y: a.y }); return; }
  const m = monstroPorId(a.id);
  if (!m) return;
  if (a.t === 'loot') { darLoot(m, a); return; }
  if (m.morto) return;
  const tipo = TIPOS_MONSTRO[m.tipo];
  if (a.t === 'dano') {
    const dano = Math.max(0, Math.round(a.d) || 0);
    if (!dano) return;
    m.danoPor = m.danoPor || {};
    m.danoPor[a.de] = (m.danoPor[a.de] || 0) + dano;
    m.ultimoDano = agora;
    if (tipo.fantoche) return;
    m.vida -= dano;
    if (m.vida <= 0) matarMonstro(m, agora);
  } else if (a.t === 'conf') {
    semTextos(() => confundir(m, agora, Math.min(10000, a.ms || 0)));
  } else if (a.t === 'lento') {
    deixarLento(m, Math.min(0.9, a.l || 0), agora + Math.min(10000, a.ms || 0));
  } else if (a.t === 'semdef') {
    tirarDefesa(m, agora + Math.min(10000, a.ms || 0));
  }
}

// ---------- LOOT: só quem atacou o monstro pode pegar ----------

function podePegarLoot(m, uid) {
  if (!m.danoPor) return true;           // monstro morto fora do grupo
  return !!m.danoPor[uid];
}

// Líder: um membro pediu itens do corpo. a.p = [[slot, máximo que cabe], ...]
function darLoot(m, a) {
  if (!m.morto) return;
  const evento = (e) => grupo.ref.child('eventos/' + a.de).push(e).catch(() => {});
  if (!podePegarLoot(m, a.de)) { evento({ t: 'aviso', texto: 'Só quem atacou esse monstro pode pegar o loot.' }); return; }
  const itens = [];
  for (const par of comoLista(a.p)) {
    const [slot, max] = comoLista(par);
    const e = m.loot[slot];
    if (!e || !(max > 0)) continue;
    const qtd = Math.min(e.qtd, max);
    itens.push({ id: e.id, qtd });
    e.qtd -= qtd;
    if (e.qtd <= 0) m.loot[slot] = null;
  }
  if (itens.length) evento({ t: 'itens', itens });
  if (corpoAberto === m) desenharJanelaCorpo();
}

// Membro: em vez de pegar sozinho, pede pro líder (o corpo é dele)
function pedirLoot(m, slots) {
  if (!podePegarLoot(m, meuId())) { mostrarMensagem('Só quem atacou esse monstro pode pegar o loot.'); return; }
  const pedido = [];
  for (const i of slots) {
    const e = m.loot[i];
    if (!e) continue;
    const cabe = quantoCabe(e.id);
    if (cabe > 0) pedido.push([i, Math.min(cabe, e.qtd)]);
  }
  if (!pedido.length) { mostrarMensagem('Sua mochila está cheia.'); return; }
  enviarAcaoGrupo({ t: 'loot', id: m.id, p: pedido });
}

// ---------- MEMBRO: mostra os monstros do líder ----------

function aplicarMonstro(id, texto) {
  if (!ehMembroDoGrupo() || !texto) return;
  const agora = performance.now();
  const [tipo, xs, ys, ds, vs, vms, fs, loot, donos] = String(texto).split('|');
  if (!TIPOS_MONSTRO[tipo]) return;
  const x = Number(xs), y = Number(ys), f = Number(fs);
  let m = grupo.proxies.get(id);
  if (!m) {
    m = { id, tipo, x, y, anteriorX: x, anteriorY: y, inicioPasso: -Infinity, direcao: 'baixo', vida: Number(vs), vidaMax: 1,
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
  m.vidaMax = Number(vms);
  // a vida do líder pode estar "atrasada" em relação ao golpe que eu acabei de dar: não deixa subir de volta
  const vidaLider = Number(vs);
  m.vida = agora < (m.vidaLocalAte || 0) ? Math.min(vidaLider, m.vidaLocal) : vidaLider;
  // debuffs: mostra as notas roxas e deixa a defesa certa pro meu cálculo de dano
  m.confusoAte = f & 1 ? agora + 600 : 0;
  m.lentoAte = f & 2 ? agora + 600 : 0;
  m.semDefesaAte = f & 4 ? agora + 600 : 0;
  if (f & 8) {
    if (!m.morto) {
      m.morto = true; m.morreuEm = agora; m.vida = 0;
      if (jogador.alvo === m) limparAlvo();
    }
    m.loot = (loot || '').split(',').filter(s => s !== '').map(s => {
      if (s === '-') return null;
      const [iid, q] = s.split(':');
      return ITENS[iid] ? { id: iid, qtd: Number(q) } : null;
    });
    m.danoPor = {};
    for (const uid of (donos || '').split(',')) if (uid) m.danoPor[uid] = 1;
    if (corpoAberto === m) desenharJanelaCorpo();
  }
}

function tirarMonstro(id) {
  const m = grupo.proxies.get(id);
  if (!m) return;
  if (m.morto) return; // corpo: fica até o tempo do corpo acabar (limparCorposVelhos)
  removerProxy(m);
}

function removerProxy(m) {
  m.removido = true;
  const i = monstros.indexOf(m);
  if (i >= 0) monstros.splice(i, 1);
  grupo.proxies.delete(m.id);
  if (jogador.alvo === m) limparAlvo();
  if (corpoAberto === m) fecharCorpo();
}

function limparCorposVelhos(agora) {
  for (const m of [...grupo.proxies.values()]) {
    if (m.morto && agora - m.morreuEm > CONFIG.TEMPO_CORPO) removerProxy(m);
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
    registrar(nome + (tipo && tipo.feminino ? ' morta' : ' morto') + ' pelo grupo (+' + e.v + ' XP). Loot: ' + (e.loot || 'nada') + '.', 'loot');
    if (tipo) contarTask(e.tipo);
    adicionarTexto(jogador.x, jogador.y, '+' + e.v + ' XP', '#ffffff', agora);
    ganharXp(e.v, agora);
  } else if (e.t === 'itens') {
    const pegou = [];
    for (const it of comoLista(e.itens)) {
      if (!ITENS[it.id]) continue;
      const guardou = guardarNaMochila(it.id, it.qtd);
      if (guardou > 0) pegou.push(nomeComQuantidade(it.id, guardou));
      if (guardou < it.qtd) mostrarMensagem('Sua mochila encheu: ' + nomeComQuantidade(it.id, it.qtd - guardou) + ' se perdeu.');
    }
    if (pegou.length) registrar('Você pegou: ' + pegou.join(', ') + '.', 'loot');
  } else if (e.t === 'aviso') {
    mostrarMensagem(e.texto);
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
    if (!TIPOS_MONSTRO[m.tipo].fantoche) {
      m.vida = Math.max(1, m.vida - dano); // mostra já; o líder confirma
      m.vidaLocal = m.vida;
      m.vidaLocalAte = performance.now() + GRUPO.VIDA_LOCAL;
    }
    enviarAcaoGrupo({ t: 'dano', id: m.id, d: dano });
    return;
  }
  m.vida -= dano;
  if (grupoAtivoComMembros()) {
    m.danoPor = m.danoPor || {};
    m.danoPor[meuId()] = (m.danoPor[meuId()] || 0) + dano;
  }
}

function marcarCuraNoGrupo() { /* v0.19: estar na tela já basta pra ganhar XP */ }

// ---------- XP do grupo (o líder calcula quando o monstro morre) ----------
// Ganha quem está no grupo e com o monstro na tela (ou quem bateu nele).
// Levels parecidos (o menor ≥ 2/3 do maior): XP com bônus dividida igual.
// Levels muito diferentes: dividida igual, sem bônus.
// Devolve a MINHA parte (ou null se eu não estava lá).

function dividirXpDoGrupo(m, tipo, agora, descricaoLoot) {
  const meiaL = Math.floor(CONFIG.VISAO_COLUNAS / 2), meiaA = Math.floor(CONFIG.VISAO_LINHAS / 2);
  const naTelaDe = (p) => Math.abs(p.x - m.x) <= meiaL && Math.abs(p.y - m.y) <= meiaA;
  const danoPor = m.danoPor || {};
  const pessoas = []; // { id, level }
  if (jogador.vida > 0 && (naTelaDe(jogador) || danoPor[meuId()])) pessoas.push({ id: meuId(), level: jogador.level });
  for (const id of outrosDoGrupo()) {
    const o = online.outros[id];
    if (o && (o.vida === undefined || o.vida > 0) && (naTelaDe(o) || danoPor[id])) pessoas.push({ id, level: o.level });
  }
  if (!pessoas.length) return null;

  const levels = pessoas.map(p => p.level);
  const dentroDaFaixa = Math.min(...levels) >= Math.ceil(Math.max(...levels) * 2 / 3);
  const bonus = pessoas.length > 1 && dentroDaFaixa ? (GRUPO.BONUS_XP[pessoas.length] || 0) : 0;
  const parte = Math.max(1, Math.round(tipo.xp * (1 + bonus) / pessoas.length));
  for (const p of pessoas) {
    if (p.id !== meuId()) grupo.ref.child('eventos/' + p.id).push({ t: 'xp', v: parte, tipo: m.tipo, loot: descricaoLoot }).catch(() => {});
  }
  return pessoas.some(p => p.id === meuId()) ? parte : null;
}

// ---------- Efeitos dos amigos ----------
// Tudo que o MEU personagem cria na tela (magias, tiros, números) vai junto pros outros do grupo.

function comFx(fn) {
  if (!noGrupo() || !outrosDoGrupo().length) return fn();
  const agora = performance.now();
  const e0 = efeitosAtivos.length, p0 = projeteis.length, t0 = textosFlutuantes.length;
  const r = fn();
  const r2 = n => Math.round(n * 100) / 100;
  for (const e of efeitosAtivos.slice(e0)) grupo.fxFila.push(['e', e.nome, r2(e.x), r2(e.y), Math.round(e.inicio - agora)]);
  for (const p of projeteis.slice(p0)) grupo.fxFila.push(['p', p.tipo, p.efeito ? 1 : 0, r2(p.de.x), r2(p.de.y), r2(p.para.x), r2(p.para.y), Math.round(p.inicio - agora), Math.round(p.duracao)]);
  for (const t of textosFlutuantes.slice(t0)) {
    if (t.x === jogador.x && t.y === jogador.y && /^\+\d+ XP$/.test(t.texto)) continue; // XP é só minha
    grupo.fxFila.push(['t', r2(t.x), r2(t.y), String(t.texto).slice(0, 30), t.cor, Math.round(t.inicio - agora)]);
  }
  if (grupo.fxFila.length > 120) grupo.fxFila.splice(0, grupo.fxFila.length - 120);
  return r;
}

function enviarFx(agora) {
  if (!grupo.ref || !grupo.fxFila.length || agora - grupo.fxUltimo < GRUPO.ENVIO_FX) return;
  grupo.fxUltimo = agora;
  grupo.ref.child('fx/' + meuId()).set({ n: ++grupo.fxSeq, l: grupo.fxFila }).catch(() => {});
  grupo.fxFila = [];
}

// O Firebase às vezes devolve listas como objeto {0:..., 1:...}
function comoLista(x) { return Array.isArray(x) ? x : Object.values(x || {}); }

function receberFx(uid, dados) {
  if (!dados || uid === meuId() || !ehDoMeuGrupo(uid) || !dados.l) return;
  if (grupo.fxVisto[uid] === dados.n) return;
  grupo.fxVisto[uid] = dados.n;
  const agora = performance.now();
  for (const f0 of comoLista(dados.l)) {
    const f = comoLista(f0);
    if (f[0] === 'e' && EFEITOS[f[1]]) efeitosAtivos.push({ nome: f[1], x: f[2], y: f[3], inicio: agora + Math.max(0, f[4]) });
    else if (f[0] === 'p') projeteis.push({ tipo: f[1], efeito: !!f[2], de: { x: f[3], y: f[4] }, para: { x: f[5], y: f[6] }, inicio: agora + Math.max(0, f[7]), duracao: f[8] || 300 });
    else if (f[0] === 't') adicionarTexto(f[1], f[2], f[3], f[4], agora + Math.max(0, f[5]));
  }
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
