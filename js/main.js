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
  configurarTela();
  configurarArrastar();
  configurarSave();

  registrar(classe
    ? 'Bem-vindo a Mythoria, ' + jogador.nome + '! Você está no templo. Visite as lojas e saia pelos portões para caçar.'
    : 'Bem-vindo de volta, ' + jogador.nome + '!', 'info');

  function loop(agora) {
    atualizarJogador(agora);
    atualizarAtaqueJogador(agora);
    atualizarMonstros(agora);
    atualizarRegeneracao(agora);
    atualizarCorpos(agora);
    atualizarLoja(agora);
    atualizarBau();
    atualizarMagias(agora);
    atualizarSave(agora);
    desenhar(agora);
    atualizarMinimapa(agora);
    atualizarHUD();
    atualizarBattleList();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// As imagens começam a carregar assim que a página abre.
// "esperaImagens" é uma Promise: uma promessa de que vai terminar.
const esperaImagens = new Promise(pronto => carregarImagens(pronto));

// A página começa nas telas de entrada
document.getElementById('txt-versao').textContent = CONFIG.VERSAO;
configurarInicio();
