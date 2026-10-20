// =====================================================
// nuvem.js — Login com Google e save na nuvem (Firebase)
//
// Sem login: os personagens ficam só neste navegador (como antes).
// Com login: ficam também no Firestore, em usuarios/<seu id>/personagens/<nome>,
// e aparecem em qualquer aparelho onde você entrar com a mesma conta Google.
//
// Cada conta tem a sua "gaveta" local (cópia rápida, funciona offline):
//   mythoria.personagens          → quem joga sem login
//   mythoria.personagens.<id>     → quem entrou com Google
// Se o mesmo personagem estiver diferente no aparelho e na nuvem,
// vale o que foi jogado por último (campo ultimoAcesso).
// =====================================================

// A chave do Firebase pode ficar no código: quem protege os dados são as REGRAS
// do Firestore (cada jogador só lê e escreve os próprios personagens).
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBfTCWlFPjOcsblpocL8BkAg0XststdTLM',
  authDomain: 'meu-rpg-42daa.firebaseapp.com',
  projectId: 'meu-rpg-42daa',
  storageBucket: 'meu-rpg-42daa.firebasestorage.app',
  messagingSenderId: '1081066578487',
  appId: '1:1081066578487:web:5bd67833d614501b6315b2',
};

const ENVIO_MINIMO = 30000; // manda pra nuvem no máximo a cada 30 s (o resto fica guardado no aparelho)

const nuvem = {
  pronta: false,    // o Firebase carregou?
  usuario: null,    // conta Google conectada (ou null)
  verificado: false, // já sabemos se tem alguém logado? (o Firebase demora um instante pra responder)
  auth: null, db: null,
  pendente: null,   // último save ainda não enviado
  ultimoEnvio: 0,
  timer: null,
};

function chaveSave() {
  return nuvem.usuario ? CONFIG.CHAVE_SAVE + '.' + nuvem.usuario.uid : CONFIG.CHAVE_SAVE;
}

function iniciarNuvem() {
  // Aberto como arquivo (file://) ou sem internet: o jogo funciona, só sem a nuvem
  if (typeof firebase === 'undefined' || location.protocol === 'file:') { desenharConta(); return; }
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    nuvem.auth = firebase.auth();
    nuvem.db = firebase.firestore();
    // guarda as escritas se cair a internet e manda quando voltar
    nuvem.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    nuvem.pronta = true;
  } catch (erro) {
    console.warn('Firebase não iniciou:', erro);
    desenharConta();
    return;
  }
  nuvem.auth.getRedirectResult().catch(mostrarErroConta);
  nuvem.auth.onAuthStateChanged(async (usuario) => {
    nuvem.usuario = usuario;
    desenharConta();
    if (usuario) await baixarDaNuvem();
    nuvem.verificado = true;
    desenharConta();
    if (!document.getElementById('tela-selecao').classList.contains('escondido')) abrirSelecao();
  });
  desenharConta();
}

function entrarComGoogle() {
  if (!nuvem.pronta) { mostrarErroConta({ message: 'A nuvem não está disponível (sem internet ou jogo aberto como arquivo).' }); return; }
  const provedor = new firebase.auth.GoogleAuthProvider();
  provedor.setCustomParameters({ prompt: 'select_account' });
  nuvem.auth.signInWithPopup(provedor).catch((erro) => {
    // celular / app instalado às vezes bloqueia a janelinha: tenta pelo redirecionamento
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(erro.code)) {
      nuvem.auth.signInWithRedirect(provedor);
    } else if (erro.code !== 'auth/popup-closed-by-user' && erro.code !== 'auth/cancelled-popup-request') {
      mostrarErroConta(erro);
    }
  });
}

function sairDaConta() {
  enviarPendenteJa();
  nuvem.auth.signOut();
}

function colecaoPersonagens() {
  return nuvem.db.collection('usuarios').doc(nuvem.usuario.uid).collection('personagens');
}

// Firestore não aceita "undefined": a ida e volta por JSON limpa isso
function limparParaNuvem(dados) { return JSON.parse(JSON.stringify(dados)); }

// ---------- Baixar (ao entrar) ----------

async function baixarDaNuvem() {
  try {
    const snap = await colecaoPersonagens().get();
    const gaveta = lerGaveta();
    const naNuvem = new Set();
    let mudou = false;
    snap.forEach((doc) => {
      const d = doc.data();
      naNuvem.add(doc.id);
      const local = gaveta.personagens[d.nome];
      if (!local || (d.ultimoAcesso || 0) > (local.ultimoAcesso || 0)) { gaveta.personagens[d.nome] = d; mudou = true; }
    });
    if (mudou) gravarGaveta(gaveta);
    // personagem que só existe aqui (jogou offline) → sobe pra nuvem
    for (const nome in gaveta.personagens) if (!naNuvem.has(nome)) enviarPersonagem(gaveta.personagens[nome]);
    oferecerMigracao();
  } catch (erro) {
    mostrarErroConta(erro);
  }
}

// Personagens criados SEM login neste aparelho: pergunta se quer levar pra conta
function oferecerMigracao() {
  let convidado;
  try { convidado = JSON.parse(localStorage.getItem(CONFIG.CHAVE_SAVE)); } catch (e) { return; }
  if (!convidado || !convidado.personagens) return;
  const nomes = Object.keys(convidado.personagens);
  if (!nomes.length) return;
  abrirModal('Levar personagens para a sua conta?',
    'Este aparelho tem ' + nomes.length + ' personagem(ns) criado(s) sem login: ' + nomes.join(', ') +
    '. Quer guardar na sua conta Google, para jogar com eles em qualquer aparelho?', [
      { texto: 'Agora não', secundario: true },
      { texto: 'Levar', acao: () => migrarConvidado(convidado) },
    ]);
}

function migrarConvidado(convidado) {
  const gaveta = lerGaveta();
  const levados = [];
  for (const nome in convidado.personagens) {
    if (gaveta.personagens[nome] || Object.keys(gaveta.personagens).length >= MAX_PERSONAGENS) continue;
    gaveta.personagens[nome] = convidado.personagens[nome];
    enviarPersonagem(convidado.personagens[nome]);
    delete convidado.personagens[nome];
    levados.push(nome);
  }
  gravarGaveta(gaveta);
  try { localStorage.setItem(CONFIG.CHAVE_SAVE, JSON.stringify(convidado)); } catch (e) { /* sem storage */ }
  abrirModal('Pronto!', levados.length ? 'Agora na sua conta: ' + levados.join(', ') + '.'
    : 'Nenhum personagem foi levado (nome repetido ou limite de ' + MAX_PERSONAGENS + ').', [{ texto: 'OK' }]);
  abrirSelecao();
}

// ---------- Enviar (ao salvar) ----------

function enviarPersonagem(dados) {
  if (!nuvem.usuario) return;
  colecaoPersonagens().doc(dados.nome).set(limparParaNuvem(dados)).catch(mostrarErroConta);
}

// Chamado por salvarJogo: envia agora ou daqui a pouco (no máximo 1 vez a cada 30 s)
function agendarNuvem(dados) {
  if (!nuvem.usuario) return;
  nuvem.pendente = dados;
  const falta = nuvem.ultimoEnvio + ENVIO_MINIMO - Date.now();
  if (falta <= 0) enviarPendenteJa();
  else if (!nuvem.timer) nuvem.timer = setTimeout(enviarPendenteJa, falta);
}

function enviarPendenteJa() {
  clearTimeout(nuvem.timer);
  nuvem.timer = null;
  if (!nuvem.pendente || !nuvem.usuario) return;
  enviarPersonagem(nuvem.pendente);
  nuvem.pendente = null;
  nuvem.ultimoEnvio = Date.now();
}

function apagarDaNuvem(nome) {
  if (nuvem.usuario) colecaoPersonagens().doc(nome).delete().catch(mostrarErroConta);
}

// ---------- Tela (barra da conta na escolha de personagem) ----------

function desenharConta() {
  const caixa = document.getElementById('conta');
  if (!caixa) return;
  if (!nuvem.pronta) {
    caixa.innerHTML = '<small>☁️ Save na nuvem indisponível agora (sem internet ou jogo aberto como arquivo). Seus personagens ficam neste aparelho.</small>';
  } else if (!nuvem.verificado) {
    caixa.innerHTML = '<small>☁️ Verificando sua conta…</small>';
  } else if (nuvem.usuario) {
    caixa.innerHTML = '<span>☁️ Conectado como <b></b></span><button id="btn-sair-conta" class="btn btn-secundario btn-pequeno">Sair da conta</button>';
    caixa.querySelector('b').textContent = nuvem.usuario.displayName || nuvem.usuario.email;
    caixa.querySelector('#btn-sair-conta').addEventListener('click', sairDaConta);
  } else {
    caixa.innerHTML = '<span><small>Sem login, seus personagens ficam só neste aparelho.</small></span>' +
      '<button id="btn-google" class="btn btn-google">Entrar com Google</button>';
    caixa.querySelector('#btn-google').addEventListener('click', entrarComGoogle);
  }
}

function mostrarErroConta(erro) {
  if (!erro) return;
  console.warn('Nuvem:', erro);
  const dica = erro.code === 'auth/unauthorized-domain'
    ? ' Este endereço não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).'
    : erro.code === 'permission-denied' ? ' Confira as regras do Firestore.' : '';
  abrirModal('Problema com a nuvem', (erro.message || String(erro)) + dica, [{ texto: 'OK' }]);
}
