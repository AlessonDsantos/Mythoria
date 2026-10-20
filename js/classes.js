// =====================================================
// classes.js — As vocações que o jogador pode escolher
// Para criar uma classe nova, copie um bloco e mude os valores.
// Ela aparece sozinha na tela de criação de personagem.
// =====================================================

const CLASSES = {
  guerreiro: {
    nome: 'Guerreiro',
    icone: '⚔️',
    descricao: 'Luta corpo a corpo. Aguenta mais pancada.',
    vidaInicial: 185, manaInicial: 35,
    vidaPorLevel: 20, manaPorLevel: 10,
    corTunica: '#8a2e2e',             // cor da roupa quando está sem armadura
    equipInicial: { arma: { id: 'espada_curta', qtd: 1 } },
  },
  arqueiro: {
    nome: 'Arqueiro',
    icone: '🏹',
    descricao: 'Ataca de longe. Menos vida, mais mana.',
    vidaInicial: 150, manaInicial: 50,
    vidaPorLevel: 15, manaPorLevel: 15,
    corTunica: '#2f6b3a',
    equipInicial: { arma: { id: 'shuriken_aprendiz', qtd: 1 } },
  },
};
