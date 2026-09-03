import { WatchingEpisode } from './watching';
import { EpisodeNode } from './work';

export interface WorkInfo {
  WatchingEpisode: WatchingEpisode;
  nodes: EpisodeNode[];
  webhook: {
    WatchingEpisode: WatchingEpisode;
    error: string;
  };
}
