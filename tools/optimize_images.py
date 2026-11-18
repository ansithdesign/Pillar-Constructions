"""Resize source-site images into assets/img for the redesign."""
from PIL import Image, ImageOps
import glob, os
def out(src, dst, maxw, q=68):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src))
    if im.mode in ('RGBA','P','LA'):
        if dst.endswith('.png'):
            im.thumbnail((maxw, maxw*4)); im.save(dst, optimize=True); return
        bg = Image.new('RGB', im.size, 'white'); im = im.convert('RGBA'); bg.paste(im, mask=im.split()[3]); im = bg
    im = im.convert('RGB'); im.thumbnail((maxw, maxw*4), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)
for f in glob.glob('source-site/img/projects_2018/*'):
    out(f, 'assets/img/p/'+os.path.splitext(os.path.basename(f))[0].replace(' ','_')+'.jpg', 1600, 66)
for f in glob.glob('source-site/img/theme/*.jpg')+glob.glob('source-site/img/projects/*.jpg')+['source-site/img/about_after.jpg','source-site/img/careers.jpg','source-site/img/news5.jpg','source-site/img/theme/pillar_ep_2.png']:
    out(f, 'assets/img/h/'+os.path.splitext(os.path.basename(f))[0]+'.jpg', 2000, 70)
for f in glob.glob('source-site/img/team/*'):
    out(f, 'assets/img/t/'+os.path.splitext(os.path.basename(f))[0]+'.jpg', 520, 72)
for f in glob.glob('source-site/img/thumbnail/*')+['source-site/img/eifsmartbig.jpg']:
    out(f, 'assets/img/n/'+os.path.splitext(os.path.basename(f))[0]+'.jpg', 600, 72)
for f in glob.glob('source-site/img/affiliation/*')+glob.glob('source-site/img/Location-*'):
    out(f, 'assets/img/a/'+os.path.splitext(os.path.basename(f))[0]+'.png', 480)
out('source-site/img/theme/pc_logo_2.png','assets/img/logo.png',600)
