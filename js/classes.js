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
    vidaInicial: 185, manaInicial: 35,
    vidaPorLevel: 20, manaPorLevel: 10,
    equipInicial: { arma: { id: 'espada_curta', qtd: 1 } },
  },
  arqueiro: {
    nome: 'Arqueiro',
    sprite: 'arqueiro',
    descricao: 'Ataca de longe. Menos vida, mais mana.',
    vidaInicial: 150, manaInicial: 50,
    vidaPorLevel: 15, manaPorLevel: 15,
    equipInicial: { arma: { id: 'shuriken_aprendiz', qtd: 1 } },
  },
};
