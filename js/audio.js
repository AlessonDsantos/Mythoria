// =====================================================
// audio.js — Som ambiente (música de fundo por região) e botão de mudo
//
// Cada região toca uma faixa em loop; ao mudar de região, uma some
// devagar e a outra entra (transição de ~1,5 s). Na estrada entre
// regiões, continua a faixa que já estava tocando.
//   vila    → Vila Início
//   campo   → Campos do Leste, Pântano, Floresta Perdida, Montanha do Norte
//   sombrio → Floresta Negra e Vila Desolada
// O navegador só deixa tocar som depois de um clique do jogador —
// por isso a música começa quando você entra no jogo.
// =====================================================

const MUSICAS = {
  vila:    'sons/vila.mp3',
  campo:   'sons/campo.mp3',
  sombrio: 'sons/sombrio.mp3',
};
const VOLUME_MUSICA = 0.35;  // 0 a 1
const TRANSICAO = 1500;      // ms

const som = {
  mudo: false,
  faixas: {},     // nome → elemento <audio>
  atual: null,    // nome da faixa tocando
  proximaChecagem: 0,
  iniciado: false,
};

function configurarSom() {
  try { som.mudo = localStorage.getItem('mythoria.mudo') === '1'; } catch (e) { /* sem storage */ }
  for (const nome in MUSICAS) {
    const a = new Audio(MUSICAS[nome]);
    a.loop = true;
    a.preload = 'none'; // só baixa quando for tocar (economiza internet no celular)
    a.volume = 0;
    som.faixas[nome] = a;
  }
  for (const id of ['btn-som', 'btn-som-celular']) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', alternarMudo);
  }
  desenharBotaoSom();
}

// Chamado ao entrar no jogo (veio de um clique, então o navegador deixa tocar)
function iniciarSom() {
  som.iniciado = true;
  atualizarSom(performance.now(), true);
}

function regiaoMusical(x, y) {
  if (naZonaSegura(x, y)) return 'vila';
  const area = mapa.areas.find(a => dentroDe(a, x, y));
  if (!area) return null; // estrada: mantém o que estava tocando
  if (/^(Floresta Negra|Vila Desolada)/.test(area.nome)) return 'sombrio';
  return 'campo';
}

// A cada segundo vê em que região o jogador está
function atualizarSom(agora, forcar = false) {
  if (!som.iniciado || (!forcar && agora < som.proximaChecagem)) return;
  som.proximaChecagem = agora + 1000;
  const regiao = regiaoMusical(jogador.x, jogador.y) || som.atual || 'campo';
  if (regiao !== som.atual) trocarFaixa(regiao);
}

function trocarFaixa(nome) {
  const antiga = som.atual ? som.faixas[som.atual] : null;
  som.atual = nome;
  if (som.mudo) return;
  const nova = som.faixas[nome];
  if (antiga && antiga !== nova) aplicarVolume(antiga, 0, () => antiga.pause());
  nova.play().catch(() => { /* navegador bloqueou: tenta de novo no próximo clique */ });
  aplicarVolume(nova, VOLUME_MUSICA);
}

// Muda o volume aos poucos (fade)
function aplicarVolume(audio, alvo, quandoAcabar) {
  clearInterval(audio._fade);
  const inicio = audio.volume, t0 = performance.now();
  audio._fade = setInterval(() => {
    const t = Math.min(1, (performance.now() - t0) / TRANSICAO);
    audio.volume = Math.max(0, Math.min(1, inicio + (alvo - inicio) * t));
    if (t >= 1) { clearInterval(audio._fade); if (quandoAcabar) quandoAcabar(); }
  }, 50);
}

function alternarMudo() {
  som.mudo = !som.mudo;
  try { localStorage.setItem('mythoria.mudo', som.mudo ? '1' : '0'); } catch (e) { /* sem storage */ }
  if (som.mudo) {
    for (const nome in som.faixas) { clearInterval(som.faixas[nome]._fade); som.faixas[nome].pause(); som.faixas[nome].volume = 0; }
  } else if (som.iniciado && som.atual) {
    const a = som.faixas[som.atual];
    a.play().catch(() => {});
    aplicarVolume(a, VOLUME_MUSICA);
  }
  desenharBotaoSom();
}

function desenharBotaoSom() {
  for (const id of ['btn-som', 'btn-som-celular']) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.textContent = som.mudo ? '🔇 Som desligado' : '🔊 Som ligado';
    b.title = som.mudo ? 'Ligar o som' : 'Desligar o som';
  }
  const curto = document.getElementById('btn-som');
  if (curto) curto.textContent = som.mudo ? '🔇' : '🔊';
}
