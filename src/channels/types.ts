export interface ChannelSpec {
  id: string;
  label: string;
  canvasWidth: number;
  maxSegmentHeight: number;
  maxFileSize: number; // bytes
  format: "image/png" | "image/jpeg";
  exporter: "verticalSlice" | "carouselPage";
  seo: { keyword: string; title: string; description: string };
}
