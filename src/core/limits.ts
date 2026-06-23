export const MAX_TOTAL_HEIGHT = 30000;

export function checkTotalHeight(h: number): "TOO_TALL" | null {
  return h > MAX_TOTAL_HEIGHT ? "TOO_TALL" : null;
}

export const MAX_CAROUSEL_PAGES = 10;

export function checkCarouselPages(n: number): "TOO_MANY_SLIDES" | null {
  return n > MAX_CAROUSEL_PAGES ? "TOO_MANY_SLIDES" : null;
}
