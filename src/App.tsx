import { Routes, Route, Navigate } from "react-router-dom";
import { channels } from "./channels";
import { ChannelPage } from "./ui/ChannelPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChannelPage spec={channels.webtoon} />} />
      <Route path="/webtoon" element={<ChannelPage spec={channels.webtoon} />} />
      <Route path="/tapas" element={<ChannelPage spec={channels.tapas} />} />
      <Route path="/x" element={<ChannelPage spec={channels.x} />} />
      <Route path="/instagram" element={<ChannelPage spec={channels.instagram} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
