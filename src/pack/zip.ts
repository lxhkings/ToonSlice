import JSZip from "jszip";

// Pack blob segments as baseName_NNN.png into a zip ArrayBuffer.
// Caller wraps in Blob for browser download.
export async function packZip(
  blobs: Blob[],
  baseName: string
): Promise<ArrayBuffer> {
  const zip = new JSZip();
  blobs.forEach((b, i) => {
    const n = String(i + 1).padStart(3, "0");
    zip.file(`${baseName}_${n}.png`, b);
  });
  return zip.generateAsync({ type: "arraybuffer" });
}
