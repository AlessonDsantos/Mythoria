// =====================================================
// classes.js — As vocações que o jogador pode escolher
// Para criar uma classe nova, copie um bloco e mude os valores.
// Ela aparece sozinha na tela de criação de personagem.
// =====================================================

const CLASSES = {
  guerreiro: {
    nome: 'Guerreiro',
    sprite: 'guerreiro',             // imagem em img/personagens (veja sprites.js)
    descricao: 'Luta corpo a corpo. Aguenta mais pancada.',
    vidaInicial: 200, manaInicial: 60,
    vidaPorLevel: 25, manaPorLevel: 10,
    equipInicial: { arma: { id: 'espada_curta', qtd: 1 } },
  },
  arqueiro: {
    nome: 'Arqueiro',
    sprite: 'arqueiro',
    descricao: 'Ataca de longe. Menos vida, mais mana.',
    vidaInicial: 180, manaInicial: 80,
    vidaPorLevel: 15, manaPorLevel: 15,
    equipInicial: { arma: { id: 'shuriken_aprendiz', qtd: 1 } },
  },
  mago: {
    nome: 'Mago',
    sprite: 'mago',
    descricao: 'Elementalista: fogo, gelo, vento e raio. Pouca vida, muita mana.',
    vidaInicial: 150, manaInicial: 120,
    vidaPorLevel: 10, manaPorLevel: 40,
    equipInicial: { arma: { id: 'cajado_aprendiz', qtd: 1 } },
    skillsIniciais: { magia: 10 },   // as outras classes começam com Magic Level 0
  },
  bardo: {
    nome: 'Bardo',
    sprite: 'bardo',
    descricao: 'Suporte musical: enfraquece e confunde os monstros e se fortalece com canções.',
    vidaInicial: 150, manaInicial: 120,
    vidaPorLevel: 12, manaPorLevel: 30,
    equipInicial: { arma: { id: 'flauta', qtd: 1 } },
    skillsIniciais: { magia: 10 },
  },
};
