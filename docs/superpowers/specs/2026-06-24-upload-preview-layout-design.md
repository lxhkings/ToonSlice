# Upload Preview Layout Fix

## Problem

In `Workspace.tsx`'s drop zone, once images are uploaded, the preview images render much
smaller than the surrounding frame, with large blank gaps on all sides.

Measured on a 638px-wide / 842px-tall drop zone with one uploaded image:

| Element | Width | Height |
|---|---|---|
| Drop zone | 638px | 842px |
| Rendered image | 538px | 285px |

Root causes:
1. **Width**: padding stacks across three nested elements — outer card `p-8` (64px),
   drop zone `p-8` (64px, duplicate of the outer card's padding), and the image list
   wrapper `px-4` (32px) — eating ~160px of horizontal space before the image renders.
2. **Height**: the drop zone uses `items-center justify-center` to center its content.
   This is correct for the empty "drag & drop" placeholder state, but once images are
   loaded it centers a short image stack inside a tall (`min-h-[400px]`, often taller
   in practice) box, leaving large blank space above and below.

## Fix

Split the drop zone's layout behavior by state, in `src/ui/Workspace.tsx`:

- **Empty state** (`items.length === 0`): unchanged — keep `p-8`, `items-center
  justify-center` so the icon/text placeholder stays centered.
- **Loaded state** (`items.length > 0`): remove the redundant padding layers and
  centering so the image list fills the drop zone edge-to-edge and top-aligns instead
  of vertically centering. The "Select Files" button stays below the image list,
  unchanged in position (confirmed via reference screenshot during brainstorming).

Concretely: drop the outer card's `p-8`/`justify-center` when content is loaded (or
conditionally swap classes), and reduce the image-list wrapper's horizontal padding so
only one padding layer remains between the drop zone border and the image.

## Out of scope

- The earlier hypothesis (broken image icon / image not rendering at all) was
  investigated and ruled out — browser testing with 1 and 4 uploaded images showed no
  decode errors, no console errors, no broken `<img>` icons. The real issue is purely
  the layout/spacing described above.
- "Select Files" button reordering — user's reference image confirmed the button
  staying below the image list is the desired layout; no change needed there.

## Testing

Manual verification via headless browser (`browse` skill): upload 1 image, measure
drop zone vs. rendered image dimensions before/after fix — gap should shrink to a
single consistent padding (not ~160px width / ~278px height blank margins).
