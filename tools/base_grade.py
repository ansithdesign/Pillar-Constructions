"""Stage-1 colour grade: normalise the mixed photography in source-site/ into one consistent base.

Per image:
  1. partial grey-world white balance (only pulls casts part of the way, keeps golden hours)
  2. exposure normalisation toward a mid-grey target on the luminance median
  3. filmic tone curve: soft shoulder for blown skies / glazing, gentle toe
  4. hue-selective saturation: calm the over-saturated "brochure blue" skies, keep materials
  5. global vibrance trim + light unsharp mask
Writes into assets/img/p, assets/img/h (same names), overwriting the plain resized copies.
"""
import numpy as np, glob, os, sys
from PIL import Image, ImageOps, ImageFilter

def srgb_to_lin(x): return np.where(x <= .04045, x/12.92, ((x+.055)/1.055)**2.4)
def lin_to_srgb(x): return np.where(x <= .0031308, x*12.92, 1.055*np.power(np.clip(x,0,None),1/2.4)-.055)

def filmic(x, shoulder=.86, toe=.04):
    # smooth S: lift toe slightly, compress highlights above `shoulder`
    y = x.copy()
    hi = x > shoulder
    y[hi] = shoulder + (1-shoulder)*(1-np.exp(-(x[hi]-shoulder)/(1-shoulder)*1.2))/(1-np.exp(-1.2))
    y = toe + (1-toe)*y
    # gentle contrast around mid-grey
    return np.clip(.5 + (y-.5)*1.06 - .02*np.sin(2*np.pi*y), 0, 1)

def rgb_to_hsv(a):
    r,g,b = a[...,0],a[...,1],a[...,2]
    mx = a.max(-1); mn = a.min(-1); d = mx-mn+1e-6
    h = np.where(mx==r, ((g-b)/d)%6, np.where(mx==g, (b-r)/d+2, (r-g)/d+4))/6
    s = np.where(mx>0, (mx-mn)/(mx+1e-6), 0)
    return h, s, mx

def grade(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)/255
    lin = srgb_to_lin(a)
    # 1. partial grey world on mid-tones only
    lum = lin @ np.array([.2126,.7152,.0722])
    mid = (lum > .05) & (lum < .7)
    if mid.sum() > 1000:
        means = lin[mid].mean(0); g = means.mean()
        gains = np.clip((g/np.maximum(means,1e-4))**.35, .92, 1.08)   # partial, clamped to ±8%
        lin = lin*gains
    # 2. exposure: median luminance toward .18 (bounded)
    lum = lin @ np.array([.2126,.7152,.0722])
    med = np.median(lum)
    ev = np.clip(np.log2(.17/max(med,1e-4)), -.6, .6)*.6
    lin = lin*(2**ev)
    a = np.clip(lin_to_srgb(np.clip(lin,0,None)),0,1)
    # 3. filmic curve on luminance, preserve chroma ratio
    l = a @ np.array([.2126,.7152,.0722])
    l2 = filmic(l)
    a = np.clip(a*(l2/np.maximum(l,1e-4))[...,None], 0, 1)
    # 4. hue-selective saturation (blue/cyan skies -25%, overall -6%)
    h, s, v = rgb_to_hsv(a)
    blue = np.exp(-((h-.6)/.07)**2)                      # centred on sky blue
    satk = 1 - .06 - .25*blue*np.clip(s*1.4,0,1)
    l = (a @ np.array([.2126,.7152,.0722]))[...,None]
    a = np.clip(l + (a-l)*satk[...,None], 0, 1)
    out = Image.fromarray((a*255+.5).astype(np.uint8))
    return out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))

def run(src_glob, dst_dir, maxw, q):
    os.makedirs(dst_dir, exist_ok=True)
    for f in src_glob:
        im = ImageOps.exif_transpose(Image.open(f))
        if im.mode in ('RGBA','LA','P'):
            im = im.convert('RGBA'); bg = Image.new('RGB', im.size, 'white'); bg.paste(im, mask=im.split()[3]); im = bg
        im = im.convert('RGB'); im.thumbnail((maxw, maxw*4), Image.LANCZOS)
        name = os.path.splitext(os.path.basename(f))[0].replace(' ','_')+'.jpg'
        grade(im).save(os.path.join(dst_dir,name),'JPEG',quality=q,optimize=True,progressive=True)

if __name__ == '__main__':
    only = sys.argv[1:]  # optional subset of basenames, for previewing
    P = sorted(glob.glob('source-site/img/projects_2018/*'))
    if only: P = [p for p in P if os.path.splitext(os.path.basename(p))[0] in only]
    run(P, sys.argv and os.environ.get('OUT_P','assets/img/p'), 1600, 66)
    if not only:
        H = glob.glob('source-site/img/theme/*.jpg')+glob.glob('source-site/img/projects/*.jpg')+['source-site/img/about_after.jpg','source-site/img/careers.jpg','source-site/img/news5.jpg']
        run(H, 'assets/img/h', 2000, 70)
