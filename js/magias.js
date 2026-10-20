// =====================================================
// magias.js — Magias do jogador
//
// Para criar uma magia nova: copie um bloco, mude os números e
// escreva o que ela faz em "lancar". O ícone fica em img/itens.png
// com o nome 'magia_<id>' (veja ORDEM_ICONES em sprites.js).
//
//   classe: 'guerreiro', 'arqueiro' ou null (todas as classes)
//   level:  level mínimo para usar
//   mana:   quanto gasta
//   espera: tempo até poder usar de novo (ms)
//   forca:  multiplicador do dano (veja danoDeMagia)
// =====================================================

const MAGIAS = {
  // ---------- Curas (todas as classes) ----------
  vita_lux: {
    nome: 'Vita Lux', classe: null, level: 1, mana: 20, espera: 1000, cura: 20,
    descricao: 'Cura 20 de vida.',
    lancar(agora) { return curar(this.cura, 'cura', agora); },
  },
  sanatio: {
    nome: 'Sanatio', classe: null, level: 10, mana: 70, espera: 10000, cura: 100,
    descricao: 'Cura 100 de vida.',
    lancar(agora) { return curar(this.cura, 'pilar', agora); },
  },

  // ---------- Arqueiro ----------
  ictus_certus: {
    nome: 'Ictus Certus', classe: 'arqueiro', level: 5, mana: 25, espera: 7000, forca: 1.3, alcance: 6,
    descricao: 'Um tiro poderoso de energia azul no alvo.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      tiroAzul(alvo, danoDeMagia('distance', this.forca), agora, 0);
      return true;
    },
  },
  ictus_duplex: {
    nome: 'Ictus Duplex', classe: 'arqueiro', level: 15, mana: 50, espera: 16000, forca: 1.15, alcance: 6,
    descricao: 'Dois tiros poderosos seguidos no alvo.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      tiroAzul(alvo, danoDeMagia('distance', this.forca), agora, 0);
      tiroAzul(alvo, danoDeMagia('distance', this.forca), agora, 250);
      return true;
    },
  },
  pluvia_sagittarum: {
    nome: 'Pluvia Sagittarum', classe: 'arqueiro', level: 23, mana: 110, espera: 40000, forca: 1.4, alcance: 6, raio: 2,
    descricao: 'Chuva de flechas em volta do alvo (área 5x5).',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const centro = { x: alvo.x, y: alvo.y };
      // flechas caindo em cada quadrado da área, em momentos sorteados
      for (let dy = -this.raio; dy <= this.raio; dy++) {
        for (let dx = -this.raio; dx <= this.raio; dx++) {
          const x = centro.x + dx, y = centro.y + dy;
          if (!ehPassavel(x, y)) continue;
          for (let k = 0; k < 2; k++) {
            const atraso = Math.random() * 700;
            criarProjetilEfeito('flecha', { x: x + 0.6, y: y - 3 }, { x, y }, agora, 260, atraso);
            criarEfeito('impacto', x, y, agora, atraso + 260);
          }
        }
      }
      for (const m of monstrosNaArea(centro, this.raio)) danificarComMagia(m, danoDeMagia('distance', this.forca), agora, 600);
      return true;
    },
  },

  // ---------- Guerreiro ----------
  ictus_validus: {
    nome: 'Ictus Validus', classe: 'guerreiro', level: 5, mana: 20, espera: 7000, forca: 1.5,
    descricao: 'Um golpe muito forte no alvo colado em você.',
    lancar(agora) {
      const alvo = alvoAoAlcance(1); if (!alvo) return false;
      criarEfeito('corte', alvo.x, alvo.y, agora);
      criarEfeito('impacto', alvo.x, alvo.y, agora, 150);
      danificarComMagia(alvo, danoDeMagia('melee', this.forca), agora, 150);
      return true;
    },
  },
  attractio: {
    nome: 'Attractio', classe: 'guerreiro', level: 15, mana: 40, espera: 20000, duracao: 10000,
    descricao: 'Puxa os monstros à vista pra perto de você. Por 10s: +20% de vida e 15% menos dano.',
    lancar(agora) {
      criarEfeito('onda', jogador.x, jogador.y, agora);
      puxarMonstros(agora);
      ativarFuria(agora, this.duracao);
      return true;
    },
  },
  ictus_rotatorius: {
    nome: 'Ictus Rotatorius', classe: 'guerreiro', level: 23, mana: 90, espera: 40000, forca: 1.4,
    descricao: 'Golpe giratório: acerta todos os monstros em volta.',
    lancar(agora) {
      criarEfeito('onda', jogador.x, jogador.y, agora);
      for (const [dx, dy] of [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]) {
        criarEfeito('corte', jogador.x + dx, jogador.y + dy, agora, 60);
      }
      for (const m of monstrosNaArea(jogador, 1)) danificarComMagia(m, danoDeMagia('melee', this.forca), agora, 150);
      return true;
    },
  },
};

// ---------- Quem pode usar ----------

function magiasDaClasse() {
  return Object.keys(MAGIAS).filter(id => !MAGIAS[id].classe || MAGIAS[id].classe === jogador.classe);
}

function magiaAprendida(id) {
  const m = MAGIAS[id];
  return m && (!m.classe || m.classe === jogador.classe) && jogador.level >= m.level;
}

// Quanto falta (ms) pra poder usar de novo
function esperaRestante(id, agora) {
  return Math.max(0, (jogador.esperaMagias[id] || 0) - agora);
}

// ---------- Lançar ----------

function lancarMagia(id, agora) {
  const m = MAGIAS[id];
  if (!m) return;
  if (m.classe && m.classe !== jogador.classe) { mostrarMensagem(m.nome + ' é uma magia de ' + CLASSES[m.classe].nome.toLowerCase() + '.'); return; }
  if (jogador.level < m.level) { mostrarMensagem(m.nome + ' precisa do level ' + m.level + '.'); return; }
  const falta = esperaRestante(id, agora);
  if (falta > 0) { mostrarMensagem(m.nome + ' estará pronta em ' + Math.ceil(falta / 1000) + 's.'); return; }
  if (jogador.mana < m.mana) { mostrarMensagem('Mana insuficiente (' + m.mana + ').'); return; }

  // "lancar" devolve false quando não deu (sem alvo, longe demais...): aí não gasta mana
  if (m.lancar(agora) === false) return;
  jogador.mana -= m.mana;
  jogador.esperaMagias[id] = agora + m.espera;
  adicionarTexto(jogador.x, jogador.y, m.nome, '#cfe3ff', agora);
}

// ---------- Ajudantes das magias ----------

function curar(quantidade, efeito, agora) {
  if (jogador.vida >= jogador.vidaMax) { mostrarMensagem('Sua vida já está cheia.'); return false; }
  const antes = jogador.vida;
  jogador.vida = Math.min(jogador.vidaMax, jogador.vida + quantidade);
  criarEfeito(efeito, jogador.x, jogador.y, agora);
  adicionarTexto(jogador.x, jogador.y, '+' + (jogador.vida - antes), '#5ce65c', agora + 150);
  return true;
}

// O alvo marcado, se estiver vivo, no alcance e à vista
function alvoAoAlcance(alcance) {
  const alvo = jogador.alvo;
  if (!alvo || alvo.morto) { mostrarMensagem('Escolha um alvo primeiro (botão direito no monstro).'); return null; }
  const d = distancia(alvo, jogador);
  if (d > alcance) { mostrarMensagem(alcance === 1 ? 'Fique colado no alvo.' : 'O alvo está longe demais.'); return null; }
  if (d > 1 && !linhaDeVisao(jogador, alvo)) { mostrarMensagem('Tem algo no caminho.'); return null; }
  return alvo;
}

// Dano de magia: cresce com o level e com a skill da classe, vezes a "forca" da magia
function danoDeMagia(skill, forca) {
  const maximo = Math.round((jogador.level * 2 + jogador.skills[skill] * 1.5) * forca);
  return aleatorioInt(Math.ceil(maximo * 0.7), maximo);
}

function tiroAzul(alvo, dano, agora, atraso) {
  const voo = 80 + distancia(alvo, jogador) * 60;
  criarProjetilEfeito('gelo', jogador, alvo, agora, voo, atraso);
  criarEfeito('impacto', alvo.x, alvo.y, agora, atraso + voo);
  danificarComMagia(alvo, dano, agora, atraso + voo);
}

function monstrosNaArea(centro, raio) {
  return monstros.filter(m => !m.morto && Math.abs(m.x - centro.x) <= raio && Math.abs(m.y - centro.y) <= raio);
}

// Aplica o dano (a defesa do monstro ainda reduz um pouco). Fantoche não morre.
function danificarComMagia(m, bruto, agora, atraso = 0) {
  if (m.morto) return;
  const dano = Math.max(1, bruto - aleatorioInt(0, Math.floor(TIPOS_MONSTRO[m.tipo].defesa / 2)));
  m.vida -= dano;
  m.ultimoDano = agora + atraso;
  adicionarTexto(m.x, m.y, String(dano), '#7ec8ff', agora + atraso);
  if (TIPOS_MONSTRO[m.tipo].fantoche) { m.vida = m.vidaMax; return; }
  if (m.vida <= 0) matarMonstro(m, agora);
}

// Attractio: cada monstro à vista desliza até um quadrado livre perto do guerreiro
function puxarMonstros(agora) {
  const vizinhos = [];
  for (let raio = 1; raio <= 2; raio++) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === raio) vizinhos.push({ x: jogador.x + dx, y: jogador.y + dy });
      }
    }
  }
  const alvos = criaturasNaTela().filter(m => !TIPOS_MONSTRO[m.tipo].fantoche && distancia(m, jogador) > 1);
  let puxados = 0;
  for (const m of alvos) {
    const lugar = vizinhos.find(p => ehLivre(p.x, p.y) && !naZonaSegura(p.x, p.y));
    if (!lugar) break;
    m.anteriorX = m.x; m.anteriorY = m.y;   // desliza do lugar antigo até o novo
    m.x = lugar.x; m.y = lugar.y;
    m.inicioPasso = agora;
    m.proximoAtaque = Math.max(m.proximoAtaque, agora + 600);
    criarEfeito('impacto', lugar.x, lugar.y, agora, 200);
    puxados++;
  }
  if (puxados) registrar('Attractio puxou ' + puxados + (puxados === 1 ? ' monstro.' : ' monstros.'), 'skill');
}

// Fúria do Attractio: +20% de vida máxima (e cura esse tanto) e 15% menos dano
function ativarFuria(agora, duracao) {
  terminarFuria(); // se já estava ativa, começa de novo
  const extra = Math.round(jogador.vidaMax * 0.2);
  jogador.furia = { ate: agora + duracao, vidaExtra: extra };
  jogador.vidaMax += extra;
  jogador.vida = Math.min(jogador.vidaMax, jogador.vida + extra);
}

function terminarFuria() {
  if (!jogador.furia) return;
  jogador.vidaMax -= jogador.furia.vidaExtra;
  jogador.vida = Math.min(jogador.vida, jogador.vidaMax);
  jogador.furia = null;
}

function atualizarMagias(agora) {
  if (jogador.furia && agora >= jogador.furia.ate) {
    terminarFuria();
    mostrarMensagem('A fúria do Attractio passou.');
  }
}
