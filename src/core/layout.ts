export interface ImageSize {
  w: number;
  h: number;
}

export interface LayoutItem {
  y: number;
  height: number;
  scale: number;
}

export interface GutterGap {
  start: number;
  end: number;
}

export interface Layout {
  width: number;
  totalHeight: number;
  items: LayoutItem[];
  gutters: GutterGap[];
}

// Scale all images to width, stack vertically, insert gutter gaps between adjacent images.
export function computeLayout(
  images: ImageSize[],
  width: number,
  gutter: number
): Layout {
  const items: LayoutItem[] = [];
  const gutters: GutterGap[] = [];
  let y = 0;
  images.forEach((img, i) => {
    const scale = width / img.w;
    const height = Math.round(img.h * scale);
    items.push({ y, height, scale });
    y += height;
    if (gutter > 0 && i < images.length - 1) {
      gutters.push({ start: y, end: y + gutter });
      y += gutter;
    }
  });
  return { width, totalHeight: y, items, gutters };
}
