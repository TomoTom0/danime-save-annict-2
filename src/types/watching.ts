export interface WatchingEpisode {
  site: string;
  workTitle: string;
  episodeTitle: string;
  episodeNumber: string;
  number: number;
  numberFromUrl?: string;
  genre: string;
  workId: string;
  workIds: string[];
  workIdsSub?: string[];
}
