import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { packZip } from "./zip";

describe("packZip", () => {
  it("names panels sequentially panel_001.png and packs", async () => {
    const blobs = [new Blob(["a"]), new Blob(["bb"]), new Blob(["ccc"])];
    const buf = await packZip(blobs, "panel");
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["panel_001.png", "panel_002.png", "panel_003.png"]);
  });
});
