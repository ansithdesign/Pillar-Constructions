"""Build the graded image set for the Nocturne direction (nocturne/img/).

One night grade for every photo: lower exposure, calmer blue skies, a filmic
S-curve, cool shadows and warm highlights, a graduated darkening at the top of
the frame, a feathered elliptical vignette, lifted tinted blacks and fine grain.
Usage: python3 tools/nocturne_images.py <stock_dir>
"""
import glob, os, sys
import numpy as np
from PIL import Image

OUT = 'nocturne/img'
STOCK = sys.argv[1] if len(sys.argv) > 1 else 'assets/img/s'

FEATURE = ['6565Rt', 'V17-004D', '8621Rt', 'The_Westerly_Waterfront_1', 'V12-026', 'V19-019R',
           'College_Park_City_Hall_1', 'V18-002R', 'VA_Hostpital_Fredericksburg_1', 'V18-014R',
           'V16-047', 'V10-002', 'EP_003', 'V17-030R', 'Institute_for_Digital_Innovation_1']


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def grade(im, ev=-0.4, sat=0.8, contrast=0.62, sky=0.32, vig=0.5, grain=0.022, mono=0.0, seed=7):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    h, w, _ = a.shape
    a = a * (2 ** ev)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    blue = np.clip((b - np.maximum(r, g)) / (b + 1e-3) * 2.4, 0, 1)
    f = sat * (1 - 0.6 * blue) * (1 - mono)
    a = lum[..., None] + (a - lum[..., None]) * f[..., None]
    a = np.clip(a, 0, 1)
    a = a + contrast * (smooth(a) - a)              # filmic S-curve
    a = np.clip((a - 0.035) / 0.965, 0, 1) ** 1.06  # deeper black point
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    sh = (1 - lum) ** 2
    hi = lum ** 2
    a = a + sh * np.array([-0.012, 0.004, 0.03]) + hi * np.array([0.035, 0.016, -0.018])
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    top = np.clip(1 - yy / (0.5 * h), 0, 1) ** 1.6     # graduated darkening of the sky
    a = a * (1 - sky * top)[..., None]
    nx, ny = (xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)
    d = np.sqrt((nx * nx + ny * ny) * 0.5)
    t = smooth((d - 0.3) / 0.8)
    a = a * (1 - vig * t)[..., None]
    a = np.array([0.008, 0.01, 0.015]) + a * 0.985     # tinted, lifted blacks
    if grain:
        rng = np.random.default_rng(seed)
        n = rng.normal(0, 1, (h, w)).astype(np.float32)
        a = a + (n * grain * (0.6 + 0.4 * (1 - lum[..., 0])))[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def fit(im, max_w, max_h=None):
    im = im.convert('RGB')
    w, h = im.size
    s = min(1, max_w / w, (max_h or 10 ** 6) / h)
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS) if s < 1 else im


def save(im, path, q=80):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, quality=q, optimize=True, progressive=True)


def logo(src, dst):
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(np.float32) / 255
    bg = a[2, 2, :3]
    dist = np.sqrt(((a[..., :3] - bg) ** 2).sum(-1)) / 1.2
    alpha = np.clip(dist * 2.2, 0, 1) * a[..., 3]
    out = np.zeros_like(a)
    out[..., :3] = 0.92
    out[..., 3] = alpha
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.fromarray((out * 255).astype(np.uint8)).save(dst, optimize=True)


if __name__ == '__main__':
    for i, f in enumerate(sorted(glob.glob('assets/img/p/*.jpg'))):
        n = os.path.basename(f)[:-4]
        im = Image.open(f)
        save(grade(fit(im, 960, 960), vig=0.4, seed=i), f'{OUT}/t/{n}.jpg', 74)
        if n in FEATURE:
            save(grade(fit(im, 1600, 1600), seed=i), f'{OUT}/w/{n}.jpg', 82)
    for n, (ev, vig) in {'fins': (-0.55, 0.55), 'canal': (-0.3, 0.45), 'darktower': (-0.25, 0.45)}.items():
        save(grade(fit(Image.open(f'{STOCK}/{n}.jpg'), 2600), ev=ev, vig=vig, sky=0.2, sat=0.7), f'{OUT}/s/{n}.jpg', 80)
    for n in ['pillar_ep_1', 'pillar_ep_2']:
        save(grade(fit(Image.open(f'assets/img/h/{n}.jpg'), 1200, 1500), ev=-0.3), f'{OUT}/w/{n}.jpg', 82)
    for f in sorted(glob.glob('assets/img/t/*.jpg')):
        n = os.path.basename(f)[:-4]
        save(grade(fit(Image.open(f), 560, 700), ev=-0.2, sat=0.25, contrast=0.48, sky=0, vig=0.35, grain=0.018), f'{OUT}/p/{n}.jpg', 78)
    for n in ['wbc', 'abc', 'agc_america', 'asa', 'awci', 'eima', 'abaa']:
        logo(f'assets/img/a/{n}.png', f'{OUT}/a/{n}.png')
    logo('assets/img/logo.png', f'{OUT}/a/logo.png')
    print('done')
