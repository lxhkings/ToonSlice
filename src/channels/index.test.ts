import { describe, it, expect } from "vitest";
import { channels, getChannel } from "./index";

describe("channels registry", () => {
  it("has 4 channels", () => {
    expect(Object.keys(channels).sort()).toEqual(
      ["instagram", "tapas", "webtoon", "x"]
    );
  });
  it("webtoon spec correct", () => {
    const c = getChannel("webtoon");
    expect(c.canvasWidth).toBe(800);
    expect(c.maxSegmentHeight).toBe(1280);
    expect(c.exporter).toBe("verticalSlice");
  });
  it("instagram uses carousel mode", () => {
    expect(getChannel("instagram").exporter).toBe("carouselPage");
  });
  it("each channel has seo.keyword", () => {
    Object.values(channels).forEach((c) => {
      expect(c.seo.keyword.length).toBeGreaterThan(0);
    });
  });
});
