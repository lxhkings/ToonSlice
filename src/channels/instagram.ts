import type { ChannelSpec } from "./types";

export const instagram: ChannelSpec = {
  id: "instagram",
  label: "Instagram",
  canvasWidth: 1080,
  maxSegmentHeight: 1350,
  maxFileSize: 10 * 1024 * 1024,
  format: "image/png",
  exporter: "carouselPage",
  seo: {
    keyword: "instagram comic carousel size",
    title: "Instagram Comic Carousel Size & Free Tool | ToonSlice",
    description:
      "Format your comic for Instagram carousel in your browser. No upload.",
  },
};
