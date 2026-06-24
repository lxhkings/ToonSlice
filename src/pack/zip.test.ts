import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { packZip } from "./zip";

describe("packZip", () => {
  it("names panels sequentially panel_001.png and packs (PNG format)", async () => {
    const blobs = [new Blob(["a"]), new Blob(["bb"]), new Blob(["ccc"])];
    const buf = await packZip(blobs, "panel", "image/png");
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["panel_001.png", "panel_002.png", "panel_003.png"]);
  });

  it("uses .jpg extension when format is image/jpeg", async () => {
    const blobs = [new Blob(["a"]), new Blob(["bb"])];
    const buf = await packZip(blobs, "panel", "image/jpeg");
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["panel_001.jpg", "panel_002.jpg"]);
  });
});
