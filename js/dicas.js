// =====================================================
// dicas.js — Caixinhas de explicação (tooltip) de magias, itens e passivas
//
// Computador: passe o mouse por cima.
// Celular: SEGURE o dedo em cima (meio segundo) — a explicação aparece grande
// na parte de baixo da tela; toque em qualquer lugar pra fechar.
//
// Qualquer elemento com data-dica="magia:<id>", "item:<id>" ou "passiva:<classe>" ganha a dica.
// =====================================================

let dicaAtual = null;          // elemento com a dica aberta
let toqueDica = null;          // { timer, x, y, el }
let ignorarCliqueAte = 0;      // depois de segurar pra ver a dica, o toque não usa a magia/item
let ultimoToque = 0;

function configurarDicas() {
  const caixa = document.getElementById('dica');
  // ---- mouse ----
  document.addEventListener('mouseover', (e) => {
    if (performance.now() - ultimoToque < 800) return; // celular também dispara "mouse" depois do toque
    const el = e.target.closest('[data-dica]');
    if (el) mostrarDica(el, e.clientX, e.clientY, false); else esconderDica();
  });
  document.addEventListener('mousemove', (e) => {
    if (dicaAtual && !caixa.classList.contains('dica-toque')) posicionarDica(e.clientX, e.clientY);
  });
  // ---- toque: segurar ----
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    ultimoToque = performance.now();
    if (dicaAtual && caixa.classList.contains('dica-toque')) { esconderDica(); ignorarCliqueAte = performance.now() + 400; return; }
    const el = e.target.closest('[data-dica]');
    if (!el) return;
    toqueDica = { x: e.clientX, y: e.clientY, el, timer: setTimeout(() => {
      mostrarDica(el, 0, 0, true);
      ignorarCliqueAte = performance.now() + 1500;
    }, 450) };
  }, true);
  const cancelar = () => { if (toqueDica) clearTimeout(toqueDica.timer); toqueDica = null; };
  document.addEventListener('pointermove', (e) => {
    if (toqueDica && Math.hypot(e.clientX - toqueDica.x, e.clientY - toqueDica.y) > 10) cancelar(); // arrastando: não é dica
  }, true);
  document.addEventListener('pointerup', cancelar, true);
  document.addEventListener('pointercancel', cancelar, true);
  document.addEventListener('click', (e) => {
    if (performance.now() < ignorarCliqueAte) { e.stopPropagation(); e.preventDefault(); ignorarCliqueAte = 0; }
  }, true);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('[data-dica]') && performance.now() - ultimoToque < 1500) e.preventDefault(); }, true);
}

function mostrarDica(el, x, y, porToque) {
  const html = textoDaDica(el.dataset.dica);
  if (!html) { esconderDica(); return; }
  const caixa = document.getElementById('dica');
  if (dicaAtual !== el || caixa.classList.contains('escondido')) caixa.innerHTML = html;
  dicaAtual = el;
  caixa.classList.remove('escondido');
  caixa.classList.toggle('dica-toque', porToque);
  if (!porToque) posicionarDica(x, y);
}

function posicionarDica(x, y) {
  const caixa = document.getElementById('dica');
  const w = caixa.offsetWidth, h = caixa.offsetHeight;
  let px = x + 16, py = y + 16;
  if (px + w > innerWidth - 8) px = x - w - 12;
  if (py + h > innerHeight - 8) py = Math.max(8, y - h - 12);
  caixa.style.left = Math.max(8, px) + 'px';
  caixa.style.top = py + 'px';
}

function esconderDica() {
  dicaAtual = null;
  document.getElementById('dica').classList.add('escondido');
}

// ---------- O texto de cada tipo ----------

function textoDaDica(chave) {
  if (!chave) return '';
  const [tipo, id] = chave.split(':');
  if (tipo === 'magia' && MAGIAS[id]) return dicaMagia(id);
  if (tipo === 'item' && ITENS[id]) return dicaItem(id);
  if (tipo === 'passiva' && PASSIVAS_CLASSE[id]) return dicaPassiva(id);
  return '';
}

const NOME_ELEMENTO = { fogo: '🔥 fogo', gelo: '❄️ gelo', vento: '🌪️ vento', raio: '⚡ raio' };
const SKILL_DA_CLASSE = { guerreiro: 'melee', arqueiro: 'distance', mago: 'magia', bardo: 'magia' };

function linhaDica(rotulo, valor) { return '<div class="dica-linha"><span>' + rotulo + '</span><b>' + valor + '</b></div>'; }

function dicaMagia(id) {
  const m = MAGIAS[id];
  const agora = performance.now();
  let h = '<div class="dica-titulo">' + m.nome + '</div><div class="dica-sub">' +
    (m.classe ? CLASSES[m.classe].nome : 'Todas as classes') + ' · level ' + m.level + '</div>';
  h += '<p>' + m.descricao + '</p>';
  h += linhaDica('Mana', m.mana);
  h += linhaDica('Espera', (m.espera / 1000) + ' s');
  if (m.alcance) h += linhaDica('Alcance', m.alcance === 1 ? 'colado no alvo' : 'até ' + m.alcance + ' quadrados');
  if (m.raio) h += linhaDica('Área', (m.raio * 2 + 1) + 'x' + (m.raio * 2 + 1) + (m.alcance ? ' em volta do alvo' : ' em volta de você'));
  if (m.elemento) h += linhaDica('Elemento', NOME_ELEMENTO[m.elemento]);
  if (m.duracao) h += linhaDica('Duração', (m.duracao / 1000) + ' s');
  if (m.cura) h += linhaDica('Cura', valorCura(m) + ' de vida (sobe com level e Magic Level)');
  if (m.danoBase) {   // Dissonantia: dano fixo por golpe que cresce com o Magic Level
    const porGolpe = Math.round(m.danoBase + valorSkill('magia', agora) * m.danoPorMagia);
    h += linhaDica('Dano agora', porGolpe + ' × ' + m.golpes + ' golpes (1 a cada ' + (m.intervalo / 1000) + ' s)');
    h += linhaDica('Confusão', (m.confusao / 1000) + ' s');
  }
  if (m.forca) {
    const skill = SKILL_DA_CLASSE[m.classe] || 'magia';
    const peso = skill === 'magia' ? 2.2 : 1.5;
    const max = Math.round((jogador.level * 2 + valorSkill(skill) * peso) * m.forca);
    const golpes = m.golpes || 1;
    if (m.forcaTotal) h += linhaDica('Dano agora', Math.ceil(max * 0.7) + '–' + max + ' no total (' + golpes + ' notas)');
    else h += linhaDica('Dano agora', Math.ceil(max * 0.7) + '–' + max + (golpes > 1 ? ' × ' + golpes + ' golpes' : ''));
    h += '<div class="dica-nota">antes da defesa do monstro' + (m.elemento ? ' e da fraqueza/resistência dele' : '') + '</div>';
  }
  const falta = esperaRestante(id, agora);
  const estado = !magiaAprendida(id) ? (m.classe && m.classe !== jogador.classe ? 'De outra classe' : 'Libera no level ' + m.level)
    : falta > 0 ? 'Pronta em ' + Math.ceil(falta / 1000) + ' s' : jogador.mana < m.mana ? 'Falta mana' : 'Pronta';
  h += '<div class="dica-estado">' + estado + '</div>';
  return h;
}

function dicaItem(id) {
  const it = ITENS[id];
  const nomesTipo = { arma: 'Arma', municao: 'Munição', capacete: 'Cabeça', armadura: 'Corpo', calca: 'Pernas', botas: 'Pés',
    consumivel: 'Consumível', material: 'Material', ouro: 'Ouro' };
  let h = '<div class="dica-titulo">' + it.nome + '</div><div class="dica-sub">' + (nomesTipo[it.tipo] || it.tipo) +
    (it.categoria ? ' · ' + it.categoria : '') + (it.classe ? ' · só ' + CLASSES[it.classe].nome.toLowerCase() : '') + '</div>';
  if (it.tipo === 'arma') {
    h += linhaDica('Ataque', it.ataque + (it.municao ? ' + flecha' : ''));
    h += linhaDica('Acerto', Math.round(it.acerto * 100) + '%');
    h += linhaDica('Alcance', it.alcance === 1 ? 'corpo a corpo' : it.alcance + ' quadrados');
    if (it.elemento) h += linhaDica('Elemento', NOME_ELEMENTO[it.elemento]);
    if (it.quebraEntre) h += linhaDica('Dura', it.quebraEntre[0] + ' a ' + it.quebraEntre[1] + ' arremessos');
    // dano com o seu skill e level de agora
    let ataque = it.ataque;
    if (it.municao) { const mun = jogador.equip.municao; ataque += mun && ITENS[mun.id].municaoDe === it.municao ? ITENS[mun.id].ataque : 0; }
    const s = valorSkill(it.skill);
    const max = Math.round(ataque * (0.5 + s / 20) + jogador.level / 2);
    h += linhaDica('Dano agora', Math.ceil(max * 0.3) + '–' + max);
    const tipoP = tipoPassivaArma(it);
    if (tipoP) {
      const p = PASSIVAS_ARMA[tipoP];
      h += '<div class="dica-passiva"><b>Passiva: ' + p.nome + '</b><br>' + Math.round(p.chance * 100) + '% de chance a cada ataque; por ' +
        (p.duracao / 1000) + ' s, ' + p.descricao + '.</div>';
    }
  } else {
    const desc = descreverItem(id);
    if (desc) h += '<p>' + desc + '</p>';
  }
  if (it.valor) h += linhaDica('Vende por', it.valor + ' de ouro');
  return h;
}

function dicaPassiva(classe) {
  const p = PASSIVAS_CLASSE[classe];
  let h = '<div class="dica-titulo">' + p.nome + '</div><div class="dica-sub">Passiva do ' + CLASSES[classe].nome.toLowerCase() + ' · automática</div>';
  h += '<p>' + p.descricao + '</p>';
  h += linhaDica('Espera', '60 s');
  const falta = Math.max(0, (jogador.esperaPassivaClasse || 0) - performance.now());
  h += '<div class="dica-estado">' + (falta > 0 ? 'Pronta em ' + Math.ceil(falta / 1000) + ' s' : 'Pronta') + '</div>';
  return h;
}
