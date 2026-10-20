// =====================================================
// save.js — Personagens salvos no navegador (localStorage)
//
// localStorage é uma "gaveta" do navegador que guarda TEXTO.
// Guardamos um objeto com todos os personagens, um por nome:
//   { versao: 2, personagens: { "Arthur": {...}, "Lara": {...} } }
// Transformamos em texto com JSON.stringify e de volta com JSON.parse.
// =====================================================

const VERSAO_SAVE = 2;
const MAX_PERSONAGENS = 5;

let proximoSave = 0;
let jogoRodando = false; // só salva depois que um personagem entrou

// ---------- Ler e gravar a gaveta inteira ----------

function lerGaveta() {
  try {
    const dados = JSON.parse(localStorage.getItem(CONFIG.CHAVE_SAVE));
    if (dados && dados.versao === VERSAO_SAVE && dados.personagens) return dados;
  } catch (erro) {
    console.warn('Save ilegível, começando do zero.', erro);
  }
  return { versao: VERSAO_SAVE, personagens: {} };
}

function gravarGaveta(gaveta) {
  try {
    localStorage.setItem(CONFIG.CHAVE_SAVE, JSON.stringify(gaveta));
    return true;
  } catch (erro) {
    console.warn('Não foi possível salvar:', erro);
    return false;
  }
}

// ---------- Lista de personagens (tela inicial) ----------

function listarPersonagens() {
  const p = lerGaveta().personagens;
  // Quem jogou por último aparece primeiro
  return Object.values(p).sort((a, b) => (b.ultimoAcesso || 0) - (a.ultimoAcesso || 0));
}

// Devolve um texto de erro, ou null se o nome serve
function validarNome(nome) {
  if (nome.length < 3 || nome.length > 16) return 'O nome precisa ter de 3 a 16 letras.';
  if (!/^[A-Za-zÀ-ÿ ]+$/.test(nome)) return 'Use só letras e espaços.';
  const existentes = Object.keys(lerGaveta().personagens).map(n => n.toLowerCase());
  if (existentes.includes(nome.toLowerCase())) return 'Já existe um personagem com esse nome.';
  if (existentes.length >= MAX_PERSONAGENS) return 'Limite de ' + MAX_PERSONAGENS + ' personagens. Apague um para criar outro.';
  return null;
}

function apagarPersonagem(nome) {
  const gaveta = lerGaveta();
  delete gaveta.personagens[nome];
  gravarGaveta(gaveta);
}

// ---------- Salvar e carregar o personagem atual ----------

function salvarJogo() {
  if (!jogoRodando) return;
  const gaveta = lerGaveta();
  gaveta.personagens[jogador.nome] = {
    nome: jogador.nome,
    classe: jogador.classe,
    ultimoAcesso: Date.now(),
    x: jogador.x, y: jogador.y,
    vida: jogador.vida, vidaMax: jogador.vidaMax,
    mana: jogador.mana, manaMax: jogador.manaMax,
    level: jogador.level, xp: jogador.xp, ouro: jogador.ouro,
    skills: jogador.skills,
    treinoSkills: jogador.treinoSkills,
    equip: jogador.equip,
    mochila: mochila.espacos,
    barra: barraAcao,
    explorado: exploradoParaTexto(),
  };
  if (gravarGaveta(gaveta)) mostrarSalvo();
}

// Coloca no jogo os dados de um personagem salvo
function carregarPersonagem(nome) {
  const dados = lerGaveta().personagens[nome];
  if (!dados) return false;

  // Itens que não existem mais no jogo são descartados
  const itemValido = e => {
    if (!e || !ITENS[e.id] || !(e.qtd > 0)) return null;
    const limpo = { id: e.id, qtd: e.qtd };
    if (e.usos) limpo.usos = e.usos; // desgaste da shuriken/lança atual
    return limpo;
  };

  jogador.nome = dados.nome;
  jogador.classe = CLASSES[dados.classe] ? dados.classe : 'guerreiro';
  jogador.level = dados.level;
  jogador.xp = dados.xp;
  jogador.ouro = dados.ouro;
  jogador.vidaMax = dados.vidaMax;
  jogador.vida = Math.max(1, Math.min(dados.vida, dados.vidaMax));
  jogador.manaMax = dados.manaMax;
  jogador.mana = Math.min(dados.mana, dados.manaMax);
  Object.assign(jogador.skills, dados.skills);
  Object.assign(jogador.treinoSkills, dados.treinoSkills);
  for (const espaco in jogador.equip) jogador.equip[espaco] = itemValido(dados.equip && dados.equip[espaco]);
  for (let i = 0; i < mochila.espacos.length; i++) mochila.espacos[i] = itemValido(dados.mochila && dados.mochila[i]);
  for (let i = 0; i < barraAcao.length; i++) {
    const a = dados.barra && dados.barra[i];
    barraAcao[i] = a && ITENS[a.id] ? { tipo: a.tipo, id: a.id } : null;
  }

  // Volta exatamente onde parou (se o lugar ainda existir no mapa)
  if (ehLivreParaJogador(dados.x, dados.y)) posicionarJogador(dados.x, dados.y);
  else posicionarJogador(jogador.templo.x, jogador.templo.y);

  if (dados.explorado) textoParaExplorado(dados.explorado);
  return true;
}

// Chamado a cada quadro: salva sozinho de tempos em tempos
function atualizarSave(agora) {
  if (agora < proximoSave) return;
  proximoSave = agora + CONFIG.INTERVALO_SAVE;
  salvarJogo();
}

function configurarSave() {
  // Salva também quando a aba é fechada ou escondida
  window.addEventListener('beforeunload', salvarJogo);
  document.addEventListener('visibilitychange', () => { if (document.hidden) salvarJogo(); });
}

let tempoSalvo = null;
function mostrarSalvo() {
  const el = document.getElementById('indicador-save');
  if (!el) return;
  el.textContent = 'Salvo ✓';
  clearTimeout(tempoSalvo);
  tempoSalvo = setTimeout(() => { el.textContent = ''; }, 1500);
}
