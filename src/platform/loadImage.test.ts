import { describe, it, expect } from "vitest";
import { validateFile } from "./loadImage";

describe("validateFile", () => {
  it("rejects unsupported type", () => {
    const f = new File(["x"], "a.gif", { type: "image/gif" });
    expect(validateFile(f, 10 * 1024 * 1024)).toBe("UNSUPPORTED_TYPE");
  });
  it("rejects oversize file", () => {
    const f = new File(
      [new Uint8Array(11 * 1024 * 1024)],
      "a.png",
      { type: "image/png" }
    );
    expect(validateFile(f, 10 * 1024 * 1024)).toBe("TOO_LARGE");
  });
  it("returns null for valid file", () => {
    const f = new File(["x"], "a.png", { type: "image/png" });
    expect(validateFile(f, 10 * 1024 * 1024)).toBeNull();
  });
});
