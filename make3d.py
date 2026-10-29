# Builds the 3D layers from the farm photo: a height map (plants raised, soil flat)
# and cut-out plants with transparent backgrounds.
import numpy as np
from PIL import Image, ImageFilter
OUT = '/mnt/project-files/plant-doctor/assets/'
im = Image.open('/mnt/project-files/plant-doctor/assets/marker.png').convert('RGB')
a = np.asarray(im).astype(float)
exg = 2 * a[..., 1] - a[..., 0] - a[..., 2]          # "excess green": high on leaves, low on soil
mask = Image.fromarray(((exg > 25) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
# Height map: blurred mask, so rows become soft mounds. Near rows (bottom of photo) stand taller.
h = np.asarray(mask.filter(ImageFilter.GaussianBlur(9))).astype(float) / 255
h *= np.linspace(0.45, 1.0, h.shape[0])[:, None]
Image.fromarray((h * 255).astype(np.uint8)).resize((500, 667)).save(OUT + 'height.png')
soft = np.asarray(mask.filter(ImageFilter.GaussianBlur(1.2))).astype(float)
def cut(box, name, sick=False):
    x0, y0, x1, y1 = box
    rgb = a[y0:y1, x0:x1].copy()
    if sick:  # turn green leaves yellow-brown
        g = rgb[..., 1]
        rgb[..., 0] = np.minimum(255, g * 1.08 + 20)
        rgb[..., 1] = g * 0.92
        rgb[..., 2] = rgb[..., 2] * 0.45
    alpha = soft[y0:y1, x0:x1]
    # fade the bottom edge out less than the sides so the plant looks rooted
    out = np.dstack([rgb, alpha]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(OUT + name)
cut((430, 380, 620, 540), 'plant-a.png')
cut((260, 780, 580, 1000), 'plant-b.png')
cut((360, 560, 600, 760), 'plant-sick.png', sick=True)
cut((360, 560, 600, 760), 'plant-sick-healed.png')
print('ok')
# Texture for the raised photo: a lighter JPEG copy (power-of-two size loads fastest on phones).
im.resize((1024, 1024)).save(OUT + 'photo-texture.jpg', quality=85)
