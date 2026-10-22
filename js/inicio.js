// =====================================================
// inicio.js — Telas antes do jogo
//   1) Boas-vindas (capa + "Começar a aventura")
//   2) Escolher personagem salvo OU criar um novo
// =====================================================

let classeEscolhida = 'guerreiro';

function mostrarTela(id) {
  for (const tela of document.querySelectorAll('.tela')) tela.classList.toggle('escondido', tela.id !== id);
  document.body.classList.toggle('em-jogo', id === 'tela-jogo'); // o modo celular só aparece dentro do jogo
}

function configurarInicio() {
  // Sempre passa pela escolha de personagem: é lá que fica o "Entrar com Google"
  document.getElementById('btn-comecar').addEventListener('click', abrirSelecao);
  document.getElementById('btn-novo-personagem').addEventListener('click', abrirCriacao);
  document.getElementById('btn-creditos').addEventListener('click', mostrarCreditos);
  document.getElementById('btn-voltar-selecao').addEventListener('click', abrirSelecao);
  document.getElementById('form-criar').addEventListener('submit', (ev) => {
    ev.preventDefault();
    criarEEntrar();
  });
  document.getElementById('campo-nome').addEventListener('input', () => {
    document.getElementById('erro-nome').textContent = '';
  });
  montarClasses();
}

// ---------- Seleção ----------

function abrirSelecao() {
  const lista = document.getElementById('lista-personagens');
  desenharConta();
  if (nuvem.pronta && !nuvem.verificado) { // espera saber de quem são os personagens
    lista.innerHTML = '<p class="vazio-txt">Carregando…</p>';
    document.getElementById('btn-novo-personagem').classList.add('escondido');
    mostrarTela('tela-selecao');
    return;
  }
  lista.innerHTML = listarPersonagens().length ? '' : '<p class="vazio-txt">Nenhum personagem ainda. Crie o primeiro!</p>';
  for (const p of listarPersonagens()) {
    const c = CLASSES[p.classe] || CLASSES.guerreiro;
    const cartao = document.createElement('div');
    cartao.className = 'cartao-personagem';
    cartao.innerHTML =
      '<button class="entrar">' +
        htmlRetrato(c.sprite) +
        '<span class="cartao-info"><b></b><small>' + c.nome + ' · Level ' + p.level + '</small></span>' +
        '<span class="cartao-seta">Entrar ›</span>' +
      '</button>' +
      '<button class="apagar" title="Apagar personagem">🗑</button>';
    cartao.querySelector('b').textContent = p.nome; // textContent: nome digitado nunca vira HTML
    cartao.querySelector('.entrar').addEventListener('click', () => entrarNoJogo(p.nome, null));
    cartao.querySelector('.apagar').addEventListener('click', () => {
      abrirModal('Apagar ' + p.nome + '?', 'O personagem e todos os itens dele serão perdidos para sempre.', [
        { texto: 'Cancelar', secundario: true },
        { texto: 'Apagar', perigo: true, acao: () => { apagarPersonagem(p.nome); abrirSelecao(); } },
      ]);
    });
    lista.appendChild(cartao);
  }
  document.getElementById('btn-novo-personagem').classList.toggle('escondido', listarPersonagens().length >= MAX_PERSONAGENS);
  mostrarTela('tela-selecao');
}

// ---------- Criação ----------

function montarClasses() {
  const caixa = document.getElementById('escolha-classe');
  caixa.innerHTML = '';
  for (const id in CLASSES) {
    const c = CLASSES[id];
    const inicial = ITENS[Object.values(c.equipInicial)[0].id].nome;
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'cartao-classe';
    botao.dataset.classe = id;
    botao.innerHTML =
      htmlRetrato(c.sprite) +
      '<b>' + c.nome + '</b>' +
      '<small>' + c.descricao + '</small>' +
      '<ul>' +
        '<li>Vida inicial <b>' + c.vidaInicial + '</b> · Mana <b>' + c.manaInicial + '</b></li>' +
        '<li>Por level: <b>+' + c.vidaPorLevel + '</b> vida, <b>+' + c.manaPorLevel + '</b> mana</li>' +
        '<li>Começa com: <b>' + inicial + '</b></li>' +
      '</ul>';
    botao.addEventListener('click', () => { classeEscolhida = id; marcarClasse(); });
    caixa.appendChild(botao);
  }
  marcarClasse();
}

function marcarClasse() {
  document.querySelectorAll('.cartao-classe').forEach(b => b.classList.toggle('ativa', b.dataset.classe === classeEscolhida));
}

function abrirCriacao() {
  document.getElementById('erro-nome').textContent = '';
  document.getElementById('campo-nome').value = '';
  mostrarTela('tela-criacao');
  document.getElementById('campo-nome').focus();
}

function criarEEntrar() {
  // Tira espaços sobrando e deixa a primeira letra de cada palavra maiúscula
  const nome = document.getElementById('campo-nome').value.trim().replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, l => l.toUpperCase());
  const erro = validarNome(nome);
  if (erro) { document.getElementById('erro-nome').textContent = erro; return; }
  entrarNoJogo(nome, classeEscolhida);
}

// classe = null → personagem salvo; classe = 'guerreiro'... → personagem novo
function entrarNoJogo(nome, classe) {
  // Só começa quando todas as imagens tiverem chegado
  esperaImagens.then(() => {
    mostrarTela('tela-jogo');
    ajustarTela();
    iniciarJogo(nome, classe);
  });
}

function mostrarCreditos() {
  abrirModal('Créditos',
    'Mythoria — feito por você, com ajuda do Claude. ' +
    'Mapa, personagens e monstros: Pipoya (pipoya.itch.io). ' +
    'Ícones dos itens: Matt Firth (shikashipx) — Shikashi\'s Fantasy Icons Pack, CC BY 4.0, baseado em game-icons.net (CC BY 3.0). ' +
    'Monstros do pântano e da montanha: Frakassets (frakassets.itch.io), CC BY 4.0. ' +
    'Efeitos de magia: SpritePilot e Foozle (CC0) e Pipoya. ' +
    'Árvores e decoração: bumpytable (Forest Pack). ' +
    'Lista completa no arquivo CREDITOS.txt.',
    [{ texto: 'Fechar' }]);
}
