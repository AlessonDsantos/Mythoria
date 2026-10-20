// =====================================================
// caminho.js — Encontra o caminho até um quadrado
// Usa "busca em largura" (BFS): explora o mapa em ondas
// a partir do início até achar o destino, desviando
// de tudo em que podePassar(x, y) responde false.
// =====================================================

function encontrarCaminho(inicio, destino, podePassar = ehPassavel, limite = 3000) {
  if (!podePassar(destino.x, destino.y)) return null;
  if (inicio.x === destino.x && inicio.y === destino.y) return [];

  const chave = (x, y) => x + ',' + y;
  const veioDe = new Map();          // guarda de onde chegamos em cada quadrado
  const fila = [inicio];
  veioDe.set(chave(inicio.x, inicio.y), null);

  while (fila.length > 0 && veioDe.size < limite) {
    const atual = fila.shift();

    if (atual.x === destino.x && atual.y === destino.y) {
      // Chegou! Volta pelo "veioDe" montando a lista de passos
      const passos = [];
      let p = atual;
      while (p && !(p.x === inicio.x && p.y === inicio.y)) {
        passos.unshift({ x: p.x, y: p.y });
        p = veioDe.get(chave(p.x, p.y));
      }
      return passos;
    }

    for (const nome in DIRECOES) {
      const d = DIRECOES[nome];
      const nx = atual.x + d.dx;
      const ny = atual.y + d.dy;
      const k = chave(nx, ny);
      if (!veioDe.has(k) && podePassar(nx, ny)) {
        veioDe.set(k, atual);
        fila.push({ x: nx, y: ny });
      }
    }
  }

  return null; // não tem caminho (ou está longe demais)
}
