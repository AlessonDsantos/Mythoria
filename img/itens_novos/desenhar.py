# Ícones 32x32 desenhados pixel a pixel a partir de "mapas" de letras (cada letra = uma cor)
from PIL import Image
PAL = {
 '.': None, 'k': (24,18,20), 'w': (236,236,240), 'l': (190,194,204), 'm': (140,146,158), 'd': (90,94,108),
 'G': (255,226,120), 'g': (226,176,60), 'o': (160,110,30), 'R': (230,60,60), 'r': (150,30,40),
 'b': (120,80,45), 'n': (75,48,28), 'c': (110,220,235), 'e': (60,140,170), 'f': (255,140,40),
 'v': (120,200,90), 'V': (60,130,50), 'p': (190,120,230),
}
def icone(linhas, nome):
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); px = im.load()
    for y, linha in enumerate(linhas):
        for x, ch in enumerate(linha):
            cor = PAL.get(ch)
            if cor: px[x, y] = cor + (255,)
    im.save(nome + '.png'); return im
