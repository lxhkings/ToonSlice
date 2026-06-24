import JSZip from "jszip";
import type { ExportFormat } from "../exporters/verticalSlice";

// Pack blob segments as baseName_NNN.<ext> into a zip ArrayBuffer.
// Extension follows format: .jpg for image/jpeg, .png for image/png.
// Caller wraps in Blob for browser download.
export async function packZip(
  blobs: Blob[],
  baseName: string,
  format: ExportFormat
): Promise<ArrayBuffer> {
  const ext = format === "image/jpeg" ? "jpg" : "png";
  const zip = new JSZip();
  blobs.forEach((b, i) => {
    const n = String(i + 1).padStart(3, "0");
    zip.file(`${baseName}_${n}.${ext}`, b);
  });
  return zip.generateAsync({ type: "arraybuffer" });
}
