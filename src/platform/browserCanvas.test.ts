import { describe, it, expect, vi, afterEach } from "vitest";
import { browserCanvasFactory } from "./browserCanvas";

describe("browserCanvasFactory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes format and quality through to canvas.toBlob", async () => {
    const fakeBlob = new Blob(["x"]);
    let capturedArgs: unknown[] = [];
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({}) as unknown as CanvasRenderingContext2D,
      toBlob: (cb: (b: Blob | null) => void, ...args: unknown[]) => {
        capturedArgs = args;
        cb(fakeBlob);
      },
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      fakeCanvas as unknown as HTMLCanvasElement
    );

    const handle = browserCanvasFactory(100, 200, "image/jpeg", 0.85);
    const blob = await handle.toBlob();

    expect(capturedArgs).toEqual(["image/jpeg", 0.85]);
    expect(blob).toBe(fakeBlob);
    expect(fakeCanvas.width).toBe(100);
    expect(fakeCanvas.height).toBe(200);
  });
});
