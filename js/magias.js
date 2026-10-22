// =====================================================
// magias.js — Magias do jogador
//
// Para criar uma magia nova: copie um bloco, mude os números e
// escreva o que ela faz em "lancar". O ícone fica em img/itens.png
// com o nome 'magia_<id>' (veja ORDEM_ICONES em sprites.js).
//
//   classe: 'guerreiro', 'arqueiro', 'mago', 'bardo' ou null (todas as classes)
//   level:  level mínimo para usar
//   mana:   quanto gasta
//   espera: tempo até poder usar de novo (ms)
//   forca:  multiplicador do dano (veja danoDeMagia)
// =====================================================

const MAGIAS = {
  // ---------- Curas (todas as classes) ----------
  vita_lux: {
    nome: 'Vita Lux', classe: null, level: 1, mana: 20, espera: 1000,
    cura: { base: 20, porLevel: 1, porMagia: { mago: 1.5, bardo: 1.5, outros: 2.5 } },
    descricao: 'Cura um pouco de vida. Fica mais forte com o level e o Magic Level.',
    lancar(agora) { return curar(valorCura(this), 'cura', agora); },
  },
  sanatio: {
    nome: 'Sanatio', classe: null, level: 10, mana: 70, espera: 10000,
    cura: { base: 100, porLevel: 2, porMagia: { mago: 4, bardo: 4, outros: 2.5 } },
    descricao: 'Cura muita vida. Fica mais forte com o level e o Magic Level.',
    lancar(agora) { return curar(valorCura(this), 'pilar', agora); },
  },

  // ---------- Guerreiro ----------
  ictus_validus: {
    nome: 'Ictus Validus', classe: 'guerreiro', level: 5, mana: 15, espera: 2000, forca: 1.2, alcance: 1,
    descricao: 'Um golpe muito forte no alvo colado em você.',
  lancar(agora) {
      const alvo = alvoAoAlcance(1); if (!alvo) return false;
      criarEfeito('espada_voadora', alvo.x, alvo.y, agora);
      danificarComMagia(alvo, danoDeMagia('melee', this.forca), agora, 300);
      return true;
    },
  },
  ictus_triplex: {
    nome: 'Ictus Triplex', classe: 'guerreiro', level: 10, mana: 35, espera: 6000, forca: 0.75, alcance: 3, golpes: 3,
    descricao: 'Três golpes seguidos no alvo, até 3 quadrados de distância.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      for (let k = 0; k < 3; k++) {
        criarEfeito('garra', alvo.x, alvo.y, agora, k * 260);
        danificarComMagia(alvo, danoDeMagia('melee', this.forca), agora, k * 260 + 120);
      }
      return true;
    },
  },
  attractio: {
    nome: 'Attractio', classe: 'guerreiro', level: 15, mana: 40, espera: 20000, duracao: 10000,
    descricao: 'Puxa os monstros à vista pra perto de você. Por 10s: +20% de vida, 15% menos dano e todas as outras magias voltam em 2s.',
    lancar(agora) {
      criarEfeito('onda', jogador.x, jogador.y, agora);
      puxarMonstros(agora);
      ativarFuria(agora, this.duracao);
      return true;
    },
  },
  terrae_motus: {
    nome: 'Terrae Motus', classe: 'guerreiro', level: 20, mana: 80, espera: 12000, forca: 1.3, raio: 2,
    descricao: 'Terremoto: espinhos de pedra saem do chão em volta de você (área 5x5).',
    lancar(agora) {
      criarEfeito('impacto_chao', jogador.x, jogador.y, agora);
      for (let dy = -this.raio; dy <= this.raio; dy++) {
        for (let dx = -this.raio; dx <= this.raio; dx++) {
          if ((dx || dy) && ehPassavel(jogador.x + dx, jogador.y + dy)) {
            criarEfeito('espinhos', jogador.x + dx, jogador.y + dy, agora, 80 + (Math.abs(dx) + Math.abs(dy)) * 90);
          }
        }
      }
      for (const m of monstrosNaArea(jogador, this.raio)) danificarComMagia(m, danoDeMagia('melee', this.forca), agora, 300);
      return true;
    },
  },
  ictus_rotatorius: {
    nome: 'Ictus Rotatorius', classe: 'guerreiro', level: 25, mana: 90, espera: 16000, forca: 1.5, raio: 1,
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

  // ---------- Arqueiro ----------
  ictus_certus: {
    nome: 'Ictus Certus', classe: 'arqueiro', level: 5, mana: 15, espera: 2000, forca: 1.2, alcance: 6,
    descricao: 'Uma flecha grande e poderosa no alvo.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      flechaGrande(alvo, danoDeMagia('distance', this.forca), agora, 0);
      return true;
    },
  },
  ictus_duplex: {
    nome: 'Ictus Duplex', classe: 'arqueiro', level: 10, mana: 40, espera: 6000, forca: 1.0, alcance: 6, golpes: 2,
    descricao: 'Duas flechas grandes seguidas no alvo.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      flechaGrande(alvo, danoDeMagia('distance', this.forca), agora, 0);
      flechaGrande(alvo, danoDeMagia('distance', this.forca), agora, 260);
      return true;
    },
  },
  sagitta_mortarium: {
    nome: 'Sagitta Mortarium', classe: 'arqueiro', level: 15, mana: 70, espera: 10000, forca: 1.4, alcance: 6, raio: 1,
    descricao: 'Flecha morteiro: cai do céu no alvo e explode, acertando tudo em volta (área 3x3).',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const centro = { x: alvo.x, y: alvo.y };
      criarProjetilEfeito('flecha_grande', { x: centro.x + 0.4, y: centro.y - 4 }, centro, agora, 380);
      criarEfeito('explosao', centro.x, centro.y, agora, 380);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) criarEfeito('impacto', centro.x + dx, centro.y + dy, agora, 460);
      for (const m of monstrosNaArea(centro, this.raio)) danificarComMagia(m, danoDeMagia('distance', this.forca), agora, 420);
      return true;
    },
  },
  velox_aeternus: {
    nome: 'Velox Aeternus', classe: 'arqueiro', level: 20, mana: 60, espera: 50000, duracao: 5000,
    descricao: 'Por 5 segundos: você anda 50% mais rápido.',
    lancar(agora) {
      jogador.velozAte = agora + this.duracao;
      criarEfeito('pilar_azul', jogador.x, jogador.y, agora);
      registrar('Velox Aeternus: 50% mais rápido por 5 segundos!', 'skill');
      return true;
    },
  },
  pluvia_sagittarum: {
    nome: 'Pluvia Sagittarum', classe: 'arqueiro', level: 25, mana: 110, espera: 16000, forca: 1.5, alcance: 6, raio: 2,
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

  // ---------- Mago (elementalista) ----------
  // elemento: o dano é multiplicado pela fraqueza/resistência do monstro (FRAQUEZAS, monstros.js)
  flatus_venti: {
    nome: 'Flatus Venti', classe: 'mago', level: 5, mana: 15, espera: 2000, forca: 1.25, alcance: 5, elemento: 'vento',
    descricao: 'Rajada de vento: duas lâminas de ar cortam o alvo.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const voo = 100 + distancia(alvo, jogador) * 55;
      criarProjetilEfeito('vento', jogador, alvo, agora, voo);
      criarProjetilEfeito('vento', jogador, alvo, agora, voo, 120);
      criarEfeito('corte', alvo.x, alvo.y, agora, voo + 60);
      danificarComMagia(alvo, danoDeMagia('magia', this.forca), agora, voo + 60, this.elemento);
      return true;
    },
  },
  aqua_triplex: {
    nome: 'Aqua Triplex', classe: 'mago', level: 10, mana: 40, espera: 6000, forca: 0.75, alcance: 5, golpes: 3, elemento: 'gelo',
    descricao: 'Rajada de 3 bolas d\'água geladas no alvo.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const voo = 120 + distancia(alvo, jogador) * 60;
      for (let k = 0; k < 3; k++) {
        criarProjetilEfeito('agua', jogador, alvo, agora, voo, k * 200);
        danificarComMagia(alvo, danoDeMagia('magia', this.forca), agora, k * 200 + voo, this.elemento);
      }
      return true;
    },
  },
  turbo_venti: {
    nome: 'Turbo Venti', classe: 'mago', level: 15, mana: 70, espera: 10000, forca: 1.3, alcance: 5, raio: 1, elemento: 'vento',
    descricao: 'Tornado de vento no alvo, acertando tudo em volta (área 3x3).',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const centro = { x: alvo.x, y: alvo.y };
      criarEfeito('tornado', centro.x, centro.y, agora);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) criarEfeito('vento', centro.x + dx, centro.y + dy, agora, 200);
      for (const m of monstrosNaArea(centro, this.raio)) danificarComMagia(m, danoDeMagia('magia', this.forca), agora, 350, this.elemento);
      return true;
    },
  },
  mens_arcana: {
    nome: 'Mens Arcana', classe: 'mago', level: 20, mana: 60, espera: 50000, duracao: 10000,
    descricao: 'Por 10 segundos, seu Magic Level fica 50% maior (mais dano em magias e no cajado).',
    lancar(agora) {
      jogador.arcanoAte = agora + this.duracao;
      criarEfeito('pilar_roxo', jogador.x, jogador.y, agora);
      registrar('Mens Arcana: Magic Level +50% por 10 segundos!', 'skill');
      return true;
    },
  },
  fulmen_pluvia: {
    nome: 'Fulmen Pluvia', classe: 'mago', level: 25, mana: 120, espera: 16000, forca: 1.6, alcance: 5, raio: 2, elemento: 'raio',
    descricao: 'Chuva de raios em volta do alvo (área 5x5).',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const centro = { x: alvo.x, y: alvo.y };
      for (let dy = -this.raio; dy <= this.raio; dy++) {
        for (let dx = -this.raio; dx <= this.raio; dx++) {
          if (ehPassavel(centro.x + dx, centro.y + dy) && Math.random() < 0.75) criarEfeito('raio', centro.x + dx, centro.y + dy, agora, Math.random() * 600);
        }
      }
      criarEfeito('raio', centro.x, centro.y, agora, 100);
      for (const m of monstrosNaArea(centro, this.raio)) danificarComMagia(m, danoDeMagia('magia', this.forca), agora, 500, this.elemento);
      return true;
    },
  },

  // ---------- Bardo (suporte musical) ----------
  // O dano vem do Magic Level, como o do mago. Som não tem elemento.
  quinque_notae: {
    nome: 'Quinque Notae', classe: 'bardo', level: 5, mana: 15, espera: 2000, forca: 1.12, forcaTotal: true, alcance: 5, golpes: 5,
    descricao: 'Cinco notas seguidas no alvo. A defesa do monstro conta uma vez só, no total das cinco.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      // dano total, menos a defesa uma vez, dividido nas 5 notas
      const total = Math.max(this.golpes, danoDeMagia('magia', this.forca) - aleatorioInt(0, Math.floor(defesaMonstro(alvo, agora) / 2)));
      const voo = 90 + distancia(alvo, jogador) * 55;
      for (let k = 0; k < this.golpes; k++) {
        const parte = Math.round(total * (k + 1) / this.golpes) - Math.round(total * k / this.golpes);
        criarProjetilEfeito('nota', jogador, alvo, agora, voo, k * 130);
        danificarComMagia(alvo, parte, agora, k * 130 + voo, null, true);
      }
      return true;
    },
  },
  unda_sonora: {
    nome: 'Unda Sonora', classe: 'bardo', level: 10, mana: 40, espera: 6000, forca: 1.1, raio: 1,
    descricao: 'Uma onda de notas sai de você e acerta tudo em volta (área 3x3).',
    lancar(agora) {
      criarEfeito('onda_som', jogador.x, jogador.y, agora);
      for (const m of monstrosNaArea(jogador, this.raio)) danificarComMagia(m, danoDeMagia('magia', this.forca), agora, 250);
      return true;
    },
  },
  carmen_torpor: {
    nome: 'Carmen Torpor', classe: 'bardo', level: 15, mana: 50, espera: 10000, alcance: 5, duracao: 4000,
    lentidao: 0.5, lentidaoChefe: 0.25,
    descricao: 'Canção do torpor: o alvo fica 50% mais lento e sem nenhuma defesa por 4 segundos (no boss, 25% mais lento). Não causa dano.',
    lancar(agora) {
      const alvo = alvoAoAlcance(this.alcance); if (!alvo) return false;
      const voo = 90 + distancia(alvo, jogador) * 55;
      criarProjetilEfeito('nota', jogador, alvo, agora, voo);
      const lent = TIPOS_MONSTRO[alvo.tipo].chefe ? this.lentidaoChefe : this.lentidao;
      deixarLento(alvo, lent, agora + voo + this.duracao);
      tirarDefesa(alvo, agora + voo + this.duracao);
      adicionarTexto(alvo.x, alvo.y, 'sem defesa', '#d6a8ff', agora + voo);
      return true;
    },
  },
  cantus_vitae: {
    nome: 'Cantus Vitae', classe: 'bardo', level: 20, mana: 60, espera: 50000, duracao: 10000,
    descricao: 'Canção da vida: por 10 segundos, cura o mesmo que um Vita Lux a cada 2 segundos e você anda 20% mais rápido.',
    lancar(agora) {
      jogador.cantusAte = agora + this.duracao;
      jogador.cantusProximo = agora + 2000;
      criarEfeito('nota_buff', jogador.x, jogador.y, agora);
      registrar('Cantus Vitae: cura e +20% de velocidade por 10 segundos!', 'skill');
      return true;
    },
  },
  dissonantia: {
    nome: 'Dissonantia', classe: 'bardo', level: 25, mana: 120, espera: 16000, raio: 2, confusao: 3000,
    golpes: 3, intervalo: 2000, danoBase: 10, danoPorMagia: 1.4,
    descricao: 'Música dissonante em volta de você (área 5x5): os monstros ficam confusos por 3 segundos (não atacam) e tomam 3 golpes, um a cada 2 segundos. Bosses não ficam confusos, ficam lentos.',
    lancar(agora) {
      criarEfeito('dissonancia', jogador.x, jogador.y, agora);
      const dano = Math.round(this.danoBase + valorSkill('magia', agora) * this.danoPorMagia);
      for (const m of monstrosNaArea(jogador, this.raio)) {
        if (TIPOS_MONSTRO[m.tipo].fantoche) continue;
        confundir(m, agora, this.confusao);
        for (let k = 1; k <= this.golpes; k++) danosPeriodicos.push({ m, dano, quando: agora + k * this.intervalo });
      }
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
  if (comFx(() => m.lancar(agora)) === false) return; // em grupo, os outros veem a magia (grupo.js)
  jogador.mana -= m.mana;
  treinarMagia(m.mana);
  // Durante a fúria do Attractio, as outras magias voltam em 2 segundos
  const espera = jogador.furia && id !== 'attractio' ? Math.min(m.espera, 2000) : m.espera;
  jogador.esperaMagias[id] = agora + espera;
  comFx(() => adicionarTexto(jogador.x, jogador.y, m.nome, '#cfe3ff', agora));
}

// ---------- Ajudantes das magias ----------

// Cura = base + level x porLevel + Magic Level x peso da classe.
// O Magic Level conta com buffs (Mens Arcana aumenta a cura do mago).
function valorCura(magia) {
  const c = magia.cura;
  const peso = c.porMagia[jogador.classe] ?? c.porMagia.outros;
  return Math.round(c.base + jogador.level * c.porLevel + valorSkill('magia') * peso);
}

function curar(quantidade, efeito, agora) {
  if (jogador.vida >= jogador.vidaMax) { mostrarMensagem('Sua vida já está cheia.'); return false; }
  marcarCuraNoGrupo(); // em grupo, curar também conta como participar (XP)
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

// Valor da skill agora (o Magic Level ganha +50% com o Mens Arcana)
function valorSkill(skill, agora = performance.now()) {
  const v = jogador.skills[skill] || 0;
  if (skill === 'magia' && agora < jogador.arcanoAte) return Math.round(v * 1.5);
  if (skill === 'distance' && armaAtiva('distancia', agora)) return Math.round(v * (1 + PASSIVAS_ARMA.distancia.bonusSkill)); // Precisão
  return v;
}

// Dano de magia: cresce com o level e com a skill da classe, vezes a "forca" da magia.
// O mago usa o Magic Level, que pesa mais (ele não tem arma forte como os outros).
function danoDeMagia(skill, forca) {
  const peso = skill === 'magia' ? 2.2 : 1.5;
  const maximo = Math.round((jogador.level * 2 + valorSkill(skill) * peso) * forca);
  return aleatorioInt(Math.ceil(maximo * 0.7), maximo);
}

function flechaGrande(alvo, dano, agora, atraso) {
  const voo = 90 + distancia(alvo, jogador) * 60;
  criarProjetilEfeito('flecha_grande', jogador, alvo, agora, voo, atraso);
  criarEfeito('impacto', alvo.x, alvo.y, agora, atraso + voo);
  danificarComMagia(alvo, dano, agora, atraso + voo);
}

function monstrosNaArea(centro, raio) {
  return monstros.filter(m => !m.morto && Math.abs(m.x - centro.x) <= raio && Math.abs(m.y - centro.y) <= raio);
}

// Aplica o dano (a defesa do monstro ainda reduz um pouco). Fantoche não morre.
// elemento (mago): multiplica pela fraqueza/resistência; a cor do número mostra o elemento.
// semDefesa: true quando a defesa já foi descontada antes (notas do Quinque Notae, Dissonantia)
const COR_ELEMENTO = { fogo: '#ff8a3c', gelo: '#8fd8ff', vento: '#b6f0c8', raio: '#ffe14d' };
function danificarComMagia(m, bruto, agora, atraso = 0, elemento = null, semDefesa = false) {
  if (m.morto) return;
  const reducao = semDefesa ? 0 : aleatorioInt(0, Math.floor(defesaMonstro(m, agora) / 2));
  let dano = Math.max(1, bruto - reducao);
  const mult = elemento ? multiplicadorElemento(m.tipo, elemento) : 1;
  dano = Math.max(1, Math.round(dano * mult));
  const critico = rolarCritico(agora, false); // passiva do arqueiro também vale nas magias
  if (critico) { dano = Math.round(dano * DANO_CRITICO); mostrarCritico(m, agora, atraso); }
  ferirMonstro(m, dano);
  m.ultimoDano = agora + atraso;
  const texto = String(dano) + (mult > 1 || critico ? '!' : '');
  adicionarTexto(m.x, m.y, texto, critico ? '#ffd23f' : elemento ? COR_ELEMENTO[elemento] : '#7ec8ff', agora + atraso);
  if (TIPOS_MONSTRO[m.tipo].fantoche) { m.vida = m.vidaMax; return; }
  if (m.vida <= 0 && !ehMembroDoGrupo()) matarMonstro(m, agora);
}

// Attractio: cada monstro à vista desliza até um quadrado livre perto do guerreiro.
// centro: quem puxou (em grupo, o líder puxa pra perto do membro que lançou)
function puxarMonstros(agora, centro = jogador) {
  if (ehMembroDoGrupo()) { enviarAcaoGrupo({ t: 'puxar', x: jogador.x, y: jogador.y }); return; }
  const vizinhos = [];
  for (let raio = 1; raio <= 2; raio++) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === raio) vizinhos.push({ x: centro.x + dx, y: centro.y + dy });
      }
    }
  }
  const meiaL = Math.floor(CONFIG.VISAO_COLUNAS / 2), meiaA = Math.floor(CONFIG.VISAO_LINHAS / 2);
  const alvos = monstros.filter(m => !m.morto && !TIPOS_MONSTRO[m.tipo].fantoche && distancia(m, centro) > 1 &&
    Math.abs(m.x - centro.x) <= meiaL && Math.abs(m.y - centro.y) <= meiaA).sort((a, b) => distancia(a, centro) - distancia(b, centro));
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
  if (puxados && centro === jogador) registrar('Attractio puxou ' + puxados + (puxados === 1 ? ' monstro.' : ' monstros.'), 'skill');
}

// Fúria do Attractio: +20% de vida máxima (e cura esse tanto) e 15% menos dano
function ativarFuria(agora, duracao) {
  terminarFuria(); // se já estava ativa, começa de novo
  const extra = Math.round(jogador.vidaMax * 0.2);
  jogador.furia = { ate: agora + duracao, vidaExtra: extra };
  jogador.vidaMax += extra;
  for (const id in jogador.esperaMagias) {
    if (id !== 'attractio') jogador.esperaMagias[id] = Math.min(jogador.esperaMagias[id], agora + 2000);
  }
  jogador.vida = Math.min(jogador.vidaMax, jogador.vida + extra);
}

function terminarFuria() {
  if (!jogador.furia) return;
  jogador.vidaMax -= jogador.furia.vidaExtra;
  jogador.vida = Math.min(jogador.vida, jogador.vidaMax);
  jogador.furia = null;
}

// ---------- Bardo: dano em vários tempos e a cura da Cantus Vitae ----------

const danosPeriodicos = []; // { m, dano, quando } — golpes da Dissonantia

function atualizarMagias(agora) {
  for (let i = danosPeriodicos.length - 1; i >= 0; i--) {
    const d = danosPeriodicos[i];
    if (d.m.morto) { danosPeriodicos.splice(i, 1); continue; }
    if (agora < d.quando) continue;
    danosPeriodicos.splice(i, 1);
    criarEfeito('nota_debuff', d.m.x, d.m.y, agora);
    danificarComMagia(d.m, d.dano, agora, 0, null, true);
  }
  if (jogador.cantusAte && agora < jogador.cantusAte && agora >= jogador.cantusProximo) {
    jogador.cantusProximo += 2000;
    if (jogador.vida > 0 && jogador.vida < jogador.vidaMax) {
      const antes = jogador.vida;
      jogador.vida = Math.min(jogador.vidaMax, jogador.vida + valorCura(MAGIAS.vita_lux));
      adicionarTexto(jogador.x, jogador.y, '+' + (jogador.vida - antes), '#5ce65c', agora);
    }
    criarEfeito('nota_buff', jogador.x, jogador.y, agora);
  }

  if (jogador.furia && agora >= jogador.furia.ate) {
    terminarFuria();
    mostrarMensagem('A fúria do Attractio passou.');
  }
}
