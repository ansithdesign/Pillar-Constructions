"""Graded image set for the v2 options (assets/img/g/): the same night grade as Nocturne,
at viewer resolution, for every project photo, the stock atmosphere set and the EP shots.
Usage: python3 tools/v2_images.py"""
import glob, os
from PIL import Image
from nocturne_images import grade, fit, save

OUT = 'assets/img/g'
if __name__ == '__main__':
    for i, f in enumerate(sorted(glob.glob('assets/img/p/*.jpg'))):
        n = os.path.basename(f)[:-4]
        save(grade(fit(Image.open(f), 1440, 1440), grain=0.012, seed=i), f'{OUT}/{n}.jpg', 78)
    for f in sorted(glob.glob('assets/img/s/*.jpg')):
        n = os.path.basename(f)[:-4]
        save(grade(fit(Image.open(f), 2200, 2200), sky=0.22, sat=0.72, grain=0.012), f'{OUT}/s/{n}.jpg', 80)
    for n in ['pillar_ep_1', 'pillar_ep_2']:
        save(grade(fit(Image.open(f'assets/img/h/{n}.jpg'), 1200, 1500), ev=-0.3, grain=0.012), f'{OUT}/h/{n}.jpg', 80)
    for f in sorted(glob.glob('assets/img/t/*.jpg')):
        n = os.path.basename(f)[:-4]
        save(grade(fit(Image.open(f), 560, 700), ev=-0.15, sat=0.3, contrast=0.48, sky=0, vig=0.35, grain=0.01), f'{OUT}/t/{n}.jpg', 80)
    print('done')
