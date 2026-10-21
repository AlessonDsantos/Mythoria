// =====================================================
// main.js — Liga tudo e roda o "loop do jogo"
// A página abre na tela de boas-vindas (inicio.js).
// Quando um personagem entra, iniciarJogo() monta o mundo e
// começa o loop, que roda ~60 vezes por segundo:
//   1) atualizar (regras: andar, monstros, combate, lojas)
//   2) desenhar (mostrar o resultado na tela)
// =====================================================

// nome: personagem; classe: só quando é personagem novo
function iniciarJogo(nome, classe) {
  const canvas = document.getElementById('tela');

  jogador.templo = carregarMundo();
  criarNpcs();
  configurarMinimapa();

  if (classe) {
    novoPersonagem(nome, classe);
    revelarVila();
  } else {
    carregarPersonagem(nome);
  }
  jogoRodando = true;
  salvarJogo(); // personagem novo já fica salvo

  criarFantoches();
  popularMonstros(); // depois de posicionar o jogador, pra não nascer bicho em cima dele

  prepararDesenho(canvas);
  configurarEntrada(canvas);
  configurarHUD();
  configurarBarra();
  configurarBattleList();
  configurarBau();
  configurarTasks();
  configurarModoAtaque();
  configurarTela();
  configurarCelular();
  configurarArrastar();
  configurarSave();

  registrar(classe
    ? 'Bem-vindo a Mythoria, ' + jogador.nome + '! Você está no templo. Visite as lojas e saia pelos portões para caçar.'
    : 'Bem-vindo de volta, ' + jogador.nome + '!', 'info');

  // O mundo anda (combate, monstros, treino, regeneração, save)...
  function atualizarMundo(agora) {
    atualizarJogador(agora);
    atualizarAtaqueJogador(agora);
    atualizarMonstros(agora);
    atualizarRegeneracao(agora);
    atualizarCorpos(agora);
    atualizarLoja(agora);
    atualizarBau();
    atualizarTasks();
    atualizarMagias(agora);
    atualizarSave(agora);
  }

  // ...e a tela é desenhada. requestAnimationFrame chama ~60x por segundo,
  // MAS o navegador para de chamar quando a aba está minimizada/escondida.
  function loop(agora) {
    atualizarMundo(agora);
    desenhar(agora);
    atualizarMinimapa(agora);
    atualizarHUD();
    atualizarBattleList();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Aba minimizada: um "relógio" num Web Worker continua chamando atualizarMundo
  // (sem desenhar), então você segue treinando no fantoche. Timers comuns (setInterval)
  // ficam quase parados em aba escondida; o do Worker não.
  iniciarRelogioDeFundo(() => { if (document.hidden) atualizarMundo(performance.now()); });
}

function iniciarRelogioDeFundo(tique) {
  try {
    const codigo = 'setInterval(() => postMessage(0), 200);';
    const worker = new Worker(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
    worker.onmessage = tique;
  } catch (erro) {
    setInterval(tique, 200); // sem Worker: funciona, mas o navegador pode deixar mais lento
  }
}

// As imagens começam a carregar assim que a página abre.
// "esperaImagens" é uma Promise: uma promessa de que vai terminar.
const esperaImagens = new Promise(pronto => carregarImagens(pronto));

// A página começa nas telas de entrada
document.getElementById('txt-versao').textContent = CONFIG.VERSAO;
configurarInicio();
iniciarNuvem(); // login com Google / save na nuvem (nuvem.js)

// App instalável (PWA): só funciona em http(s), não abrindo o arquivo direto
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(erro => console.warn('Service worker:', erro));
}
