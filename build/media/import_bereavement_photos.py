"""Import the owner's own job photos used on /bereavement-clearance-dublin/ (Oct 2026).

Sources are the owner's photo folders on this PC (indexed in junkremoval-ie/audit/photo-sheets).
Chosen ones are NOT used on junkremoval.ie, so the sister sites don't show the same pictures.
Each one was checked by eye: no faces, no family photographs, no documents, no readable plates.
Output: site-assets/images/<name>.jpg, longest edge 1600px. Pillow's save() without exif= drops
ALL metadata, including GPS (customers' home locations). Then run the WebP step.

Run: python build/media/import_bereavement_photos.py
"""
import json
import os
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'site-assets', 'images')
INDEX = r'C:/Users/cipri/Desktop/CLAUDE/junkremoval-ie/audit/photo-sheets/index.json'

# photo-sheet index -> (output name, crop box as fractions (l, t, r, b) or None)
PHOTOS = {
    287: ('bereavement-house-clearance-dublin', None),          # sitting room of a family home
    269: ('sentimental-belongings-display-cabinet', (0, 0.06, 0.86, 1)),  # crop out a framed picture
    118: ('books-on-shelves-before-clearance', None),
    102: ('armchairs-set-aside-for-reuse', None),
    285: ('attic-clearance-after-bereavement-dublin', None),
    296: ('garage-clearance-after-bereavement-dublin', None),
    202: ('shed-clearance-garden-tools-dublin', None),
    112: ('apartment-clearance-dublin-loading-van', None),
    191: ('apartment-cleared-ready-for-sale-dublin', None),
    5:   ('storage-unit-family-belongings', None),
    263: ('house-cleared-ready-for-sale-dublin', None),
    332: ('bedroom-before-and-after-clearance', None),          # owner's own before/after composite
}


def main():
    idx = json.load(open(INDEX, encoding='utf-8'))
    for n, (name, crop) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(idx[str(n)])).convert('RGB')
        if crop:
            w, h = im.size
            im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
        im.thumbnail((1600, 1600))
        path = os.path.join(OUT, name + '.jpg')
        im.save(path, quality=80, optimize=True, progressive=True)
        print(f'{name}.jpg {im.size} {os.path.getsize(path) // 1024}KB')

    # Share image: the sitting-room photo, cropped to 1200x630.
    im = ImageOps.exif_transpose(Image.open(idx['287'])).convert('RGB')
    w, h = im.size
    th = int(w * 630 / 1200)
    top = max(0, int((h - th) * 0.55))
    og = im.crop((0, top, w, top + th)).resize((1200, 630), Image.LANCZOS)
    og.save(os.path.join(OUT, 'og-bereavement-house-clearance-dublin.jpg'), quality=82, optimize=True)
    print('og image written')


if __name__ == '__main__':
    main()
