# Ícones 32x32 na diagonal (cabo embaixo à esquerda, cabeça em cima à direita),
# desenhados por "formas" num sistema de coordenadas da arma EM PÉ e girados 45°.
# Cada pixel da imagem é levado de volta pra coordenada da arma e pintado pela função da forma.
import math
from PIL import Image
S = 1.0  # escala (1 unidade = 1 pixel)
C = {
 'k': (22,16,18), 'w': (240,240,244), 'l': (196,200,210), 'm': (146,152,164), 'd': (96,100,114), 'x': (64,66,78),
 'G': (255,228,128), 'g': (224,172,58), 'o': (150,100,28), 'R': (236,64,64), 'r': (150,30,40),
 'b': (128,84,46), 'n': (78,50,28), 'c': (120,226,240),
}
def gerar(forma, nome):
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); px = im.load()
    for py in range(32):
        for pxx in range(32):
            xs, ys = (pxx + 0.5 - 16) / S, (py + 0.5 - 16) / S
            lx, ly = (xs + ys) / math.sqrt(2), (ys - xs) / math.sqrt(2)  # volta pra arma em pé
            cor = forma(lx, ly)
            if cor: px[pxx, py] = C[cor] + (255,)
    # contorno escuro de 1 px em volta
    contorno = []
    for y in range(32):
        for x in range(32):
            if px[x, y][3]: continue
            if any(0 <= x + dx < 32 and 0 <= y + dy < 32 and px[x + dx, y + dy][3] and px[x + dx, y + dy][:3] != C['k']
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                contorno.append((x, y))
    for x, y in contorno: px[x, y] = C['k'] + (255,)
    im.save(nome + '.png'); return im

def cabo(lx, ly, madeira=('b', 'n'), faixa=None, topo=-5, fim=13):
    if abs(lx) <= 1.3 and topo <= ly <= fim:
        if faixa and int(ly + 20) % 4 == 0: return faixa
        return madeira[0] if lx < 0 else madeira[1]
    if abs(lx) <= 1.9 and fim < ly <= fim + 2.2: return 'g' if lx > 0 else 'G'   # pomo dourado
    return None

def machado_runico(lx, ly):
    if abs(lx) <= 2.0 and -13.5 <= ly <= -4.5:                    # miolo dourado
        if abs(lx) < 1.1 and -11 < ly < -8: return 'R'             # gema
        return 'G' if lx < 0 else 'g'
    u = abs(lx) - 2.0
    if 0 < u <= 9.5:                                               # as duas lâminas
        topo, base = -12 - u * 0.7, -6 + u * 0.65
        if topo <= ly <= base and u <= 9.5 - ((ly + 9.5) / 7.5) ** 2 * 2.2:
            borda = 9.5 - ((ly + 9.5) / 7.5) ** 2 * 2.2 - u
            if borda < 1.4: return 'w'
            if (u > 3 and u < 4.2 and -11 < ly < -7): return 'x'   # runa
            return 'l' if lx < 0 else 'm'
    return cabo(lx, ly, faixa='R')

def machado_lua(lx, ly):
    r = math.hypot(lx, ly + 8)
    if 4.2 <= r <= 7.6 and ly >= -10.5:                              # meia-lua (abre pra cima, longe do cabo)
        if ly < -8.5 and r > 7: return None                          # pontas finas
        if r < 5.2: return 'w'                                       # fio de dentro, brilhando
        return 'G' if lx < 0 else ('g' if r < 6.8 else 'o')
    if abs(lx) <= 2.1 and -1 <= ly <= 1.5: return 'g'                # encaixe
    return cabo(lx, ly, madeira=('b', 'n'), faixa='G', topo=1)

def maca_espinhos(lx, ly):
    cx, cy, rb = 0, -9, 5.6
    dx, dy = lx - cx, ly - cy; r = math.hypot(dx, dy); ang = math.degrees(math.atan2(dy, dx)) % 360
    if r <= rb:                                                       # bola de ferro com sombra
        luz = (-dx - dy) / rb
        return 'w' if luz > 0.75 else 'l' if luz > 0.1 else 'm' if luz > -0.6 else 'd'
    for a in range(0, 360, 60):                                       # 6 espinhos
        dif = min(abs(ang - a), 360 - abs(ang - a))
        if rb < r <= rb + 3.4 and dif < (rb + 3.4 - r) * 9: return 'l' if a in (180, 240, 300) else 'm'
    return cabo(lx, ly, madeira=('b', 'n'), faixa='g', topo=-3.5)

if __name__ == '__main__':
    ims = [gerar(machado_runico, 'machado_runico'), gerar(machado_lua, 'machado_lua'), gerar(maca_espinhos, 'maca_espinhos')]
    ref = Image.open('/home/claude/jogo-rpg/img/itens.png').convert('RGBA')
    ic = lambda i: ref.crop(((i % 8) * 32, (i // 8) * 32, (i % 8) * 32 + 32, (i // 8) * 32 + 32))
    W = Image.new('RGBA', (6 * 140, 170), (42, 35, 27, 255))
    for i, im in enumerate([ic(17), ic(14), ic(20)] + ims):
        W.alpha_composite(im.resize((128, 128), Image.NEAREST), (i * 140 + 6, 6)); W.alpha_composite(im, (i * 140 + 54, 138))
    W.save('previa2.png')
