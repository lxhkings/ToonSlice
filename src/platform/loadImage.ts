import type { ImageSize } from "../core/layout";

export type FileError = "UNSUPPORTED_TYPE" | "TOO_LARGE" | null;

const OK_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateFile(file: File, maxSize: number): FileError {
  if (!OK_TYPES.includes(file.type)) return "UNSUPPORTED_TYPE";
  if (file.size > maxSize) return "TOO_LARGE";
  return null;
}

export interface LoadedImage {
  image: HTMLImageElement;
  size: ImageSize;
  url: string;
}

// File → decoded HTMLImageElement + original dimensions.
// Rejects with "DECODE_FAILED" on error.
export function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        image: img,
        size: { w: img.naturalWidth, h: img.naturalHeight },
        url,
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("DECODE_FAILED"));
    };
    img.src = url;
  });
}
