"""Vectorise Pillar Construction's logo (source-site/img/theme/pc_logo_2.png) into assets/img/pillar-logo.svg.

Each of the logo's five flat colours is traced separately: alpha coverage for that colour is
upsampled into a smooth field, contoured with marching squares at the 50% level, simplified
(Ramer-Douglas-Peucker) and fitted with cubic Beziers that keep sharp corners.
Only numpy and Pillow are needed. Usage: python3 tools/trace_logo.py"""
import numpy as np
from PIL import Image

SRC = 'source-site/img/theme/pc_logo_2.png'
UP = 6
PAL = {  # drawn in this order
    'teal': (11, 165, 196), 'teal-2': (78, 193, 214), 'mid': (131, 210, 225), 'light': (170, 222, 234), 'word': (138, 143, 142),
}


def coverage(a):
    rgb, al = a[..., :3].astype(float), a[..., 3].astype(float) / 255
    keys = list(PAL)
    d = np.stack([((rgb - np.array(PAL[k])) ** 2).sum(-1) for k in keys])
    near = d.argmin(0)
    return {k: np.where(near == i, al, 0.0) for i, k in enumerate(keys)}


def upsample(m):
    h, w = m.shape
    im = Image.fromarray((m * 255).astype(np.float32), mode='F').resize((w * UP, h * UP), Image.BICUBIC)
    f = np.asarray(im) / 255
    return np.pad(f, 1)


def contours(F, t=.5):
    a, b, c, d = F[:-1, :-1], F[:-1, 1:], F[1:, 1:], F[1:, :-1]
    case = (a > t) * 8 + (b > t) * 4 + (c > t) * 2 + (d > t) * 1
    ii, jj = np.nonzero((case > 0) & (case < 15))
    lerp = lambda p, q: np.clip((t - p) / np.where(np.abs(q - p) < 1e-9, 1e-9, q - p), 0, 1)
    def pt(e, i, j):
        A, B, C, Dd = F[i, j], F[i, j + 1], F[i + 1, j + 1], F[i + 1, j]
        if e == 'T': return (j + lerp(A, B), i), ('h', i, j)
        if e == 'B': return (j + lerp(Dd, C), i + 1), ('h', i + 1, j)
        if e == 'L': return (j, i + lerp(A, Dd)), ('v', i, j)
        return (j + 1, i + lerp(B, C)), ('v', i, j + 1)
    TAB = {1: [('L', 'B')], 2: [('B', 'R')], 3: [('L', 'R')], 4: [('T', 'R')], 6: [('T', 'B')], 7: [('L', 'T')], 8: [('L', 'T')], 9: [('T', 'B')],
           11: [('T', 'R')], 12: [('L', 'R')], 13: [('B', 'R')], 14: [('L', 'B')]}
    adj, pos = {}, {}
    for i, j in zip(ii.tolist(), jj.tolist()):
        k = int(case[i, j])
        if k in (5, 10):
            center = (F[i, j] + F[i, j + 1] + F[i + 1, j + 1] + F[i + 1, j]) / 4 > t
            segs = ([('L', 'T'), ('B', 'R')] if center else [('L', 'B'), ('T', 'R')]) if k == 5 else ([('T', 'R'), ('L', 'B')] if center else [('L', 'T'), ('B', 'R')])
        else:
            segs = TAB[k]
        for e1, e2 in segs:
            p1, id1 = pt(e1, i, j); p2, id2 = pt(e2, i, j)
            pos[id1], pos[id2] = p1, p2
            adj.setdefault(id1, []).append(id2); adj.setdefault(id2, []).append(id1)
    seen, loops = set(), []
    for start in adj:
        if start in seen: continue
        loop, prev, cur = [], None, start
        while cur not in seen:
            seen.add(cur); loop.append(pos[cur])
            nxt = [n for n in adj[cur] if n != prev and n not in seen]
            if not nxt: break
            prev, cur = cur, nxt[0]
        if len(loop) > 8: loops.append(np.array(loop) - 1)  # undo the pad
    return loops


def rdp(P, eps):
    if len(P) < 3: return P
    a, b = P[0], P[-1]; ab = b - a; n = np.hypot(*ab)
    d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / n if n > 1e-9 else np.hypot(*(P - a).T)
    k = int(d.argmax())
    if d[k] > eps: return np.vstack([rdp(P[:k + 1], eps)[:-1], rdp(P[k:], eps)])
    return np.array([a, b])


def closed_rdp(P, eps):
    k = int(np.hypot(*(P - P[0]).T).argmax())
    return np.vstack([rdp(P[:k + 1], eps)[:-1], rdp(np.vstack([P[k:], P[:1]]), eps)[:-1]])


def bez(P, s, corner_deg=48):
    n = len(P); out = []
    ang = []
    for i in range(n):
        u, v = P[i] - P[i - 1], P[(i + 1) % n] - P[i]
        cu = np.dot(u, v) / (np.hypot(*u) * np.hypot(*v) + 1e-9)
        ang.append(np.degrees(np.arccos(np.clip(cu, -1, 1))))
    corner = [x > corner_deg for x in ang]
    f = lambda p: f'{p[0] / s:.2f} {p[1] / s:.2f}'
    out.append('M' + f(P[0]))
    for i in range(n):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % n], P[(i + 2) % n]
        c1 = p1 if corner[i] else p1 + (p2 - p0) / 6
        c2 = p2 if corner[(i + 1) % n] else p2 - (p3 - p1) / 6
        if corner[i] and corner[(i + 1) % n]: out.append('L' + f(p2))
        else: out.append('C' + f(c1) + ' ' + f(c2) + ' ' + f(p2))
    return ''.join(out) + 'Z'


def main():
    a = np.asarray(Image.open(SRC).convert('RGBA'))
    cov = coverage(a)
    layers = []
    for k, rgb in PAL.items():
        loops = contours(upsample(cov[k]))
        d = ''.join(bez(closed_rdp(L, .55), UP) for L in loops if len(L) > 12)
        layers.append((k, '#%02x%02x%02x' % rgb, d))
    ys, xs = np.nonzero(a[..., 3] > 20)
    x0, y0, x1, y1 = xs.min() - 1, ys.min() - 1, xs.max() + 2, ys.max() + 2
    mark = ''.join(f'<path class="pl-{k}" fill="{c}" fill-rule="evenodd" d="{d}"/>' for k, c, d in layers if k != 'word')
    word = ''.join(f'<path class="pl-{k}" fill="{c}" fill-rule="evenodd" d="{d}"/>' for k, c, d in layers if k == 'word')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" role="img" aria-label="Pillar Construction"><g id="mark">{mark}</g><g id="word">{word}</g></svg>\n'
    open('assets/img/pillar-logo.svg', 'w').write(svg)
    print('assets/img/pillar-logo.svg', len(svg), 'bytes', f'viewBox {x0} {y0} {x1 - x0} {y1 - y0}')


if __name__ == '__main__':
    main()
