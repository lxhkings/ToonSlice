import type { ChannelSpec } from "./types";
import { webtoon } from "./webtoon";
import { tapas } from "./tapas";
import { x } from "./x";
import { instagram } from "./instagram";

export const channels: Record<string, ChannelSpec> = {
  webtoon,
  tapas,
  x,
  instagram,
};

export function getChannel(id: string): ChannelSpec {
  const c = channels[id];
  if (!c) throw new Error(`unknown channel: ${id}`);
  return c;
}
