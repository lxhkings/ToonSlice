export const MAX_TOTAL_HEIGHT = 30000;

export function checkTotalHeight(h: number): "TOO_TALL" | null {
  return h > MAX_TOTAL_HEIGHT ? "TOO_TALL" : null;
}
