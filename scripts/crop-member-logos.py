from pathlib import Path

from PIL import Image

src = Path(r'e:\Programming\Sites\UAOS\public\members\_source.png')
im = Image.open(src).convert('RGBA')
w, h = im.size

# Title ~y0-35; logos ~y68-118
band = im.crop((0, 68, w, 118))
bw, bh = band.size
pixels = band.load()


def is_content(x: int, y: int) -> bool:
    r, g, b, a = pixels[x, y]
    return a > 10 and (r > 22 or g > 22 or b > 22)


# Mark columns that contain logo pixels.
active = [any(is_content(x, y) for y in range(bh)) for x in range(bw)]

# Expand tiny gaps so each logo is one contiguous run.
gap_fill = 10
filled = active[:]
last = -10_000
for i, on in enumerate(active):
    if on:
        if i - last <= gap_fill and last >= 0:
            for j in range(last + 1, i):
                filled[j] = True
        last = i

runs: list[tuple[int, int]] = []
start = None
for i, on in enumerate(filled):
    if on and start is None:
        start = i
    elif not on and start is not None:
        runs.append((start, i - 1))
        start = None
if start is not None:
    runs.append((start, bw - 1))

print('runs', len(runs), runs)

# Expect 9 logos; if more, merge smallest gaps; if fewer, split widest.
names = [
    'effetex',
    'insight',
    'biko',
    'deltaplus',
    'ultrasafety',
    'assecuro',
    'epg',
    'portal313',
    'stg',
]

while len(runs) > 9:
    # Merge the pair with the smallest gap.
    gaps = [(runs[i + 1][0] - runs[i][1], i) for i in range(len(runs) - 1)]
    _, idx = min(gaps)
    runs[idx] = (runs[idx][0], runs[idx + 1][1])
    del runs[idx + 1]

while len(runs) < 9:
    # Split the widest run in half.
    widths = [(r[1] - r[0], i) for i, r in enumerate(runs)]
    _, idx = max(widths)
    a, b = runs[idx]
    mid = (a + b) // 2
    runs[idx : idx + 1] = [(a, mid), (mid + 1, b)]

assert len(runs) == 9, len(runs)

out = Path(r'e:\Programming\Sites\UAOS\public\members')
for name, (left, right) in zip(names, runs):
    pad = 2
    cell = band.crop((max(0, left - pad), 0, min(bw, right + pad + 1), bh))
    # Transparent black background.
    cp = cell.load()
    for y in range(cell.height):
        for x in range(cell.width):
            r, g, b, a = cp[x, y]
            if r < 18 and g < 18 and b < 18:
                cp[x, y] = (0, 0, 0, 0)
    bbox = cell.getbbox()
    if bbox:
        cell = cell.crop(bbox)
    # Keep natural aspect; add small transparent padding.
    pad_px = 6
    canvas = Image.new(
        'RGBA',
        (cell.width + pad_px * 2, cell.height + pad_px * 2),
        (0, 0, 0, 0),
    )
    canvas.paste(cell, (pad_px, pad_px), cell)
    canvas.save(out / f'{name}.png')
    print(name, canvas.size)

print('done')
