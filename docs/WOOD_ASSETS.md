# Walnut archive assets

Shiori uses three locally bundled SVG texture images to distinguish the product's two visual metaphors:

- geological photography represents **time accumulating in layers**;
- walnut cabinetry represents **the place where records are kept**.

The textures are deterministic, procedurally generated assets created specifically for this repository. They do not depend on a stock-photo service and may be redistributed under CC0-1.0. Asset metadata is recorded in [`WOOD_ASSETS.json`](../WOOD_ASSETS.json).

## Files

- `public/assets/textures/walnut-shelf-back.svg` — restrained vertical grain used behind book spines;
- `public/assets/textures/walnut-shelf-plank.svg` — horizontal grain and bevel shading used for shelf planks;
- `public/assets/textures/walnut-frame.svg` — polished vertical grain used for cabinet rails.

Text is never placed directly on the texture without an opaque or translucent contrast layer. In forced-colors, print, and reduced-data modes, the texture images are removed while the information architecture remains intact.
