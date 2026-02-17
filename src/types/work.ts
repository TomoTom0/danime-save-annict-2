export interface EpisodeNode {
  annictId: number;
  sortNumber?: number;
  number: string;
  title: string;
  IsZeroEpisode?: boolean;
  media?: string;
}

export interface WorkNode {
  id?: number;
  annictId: number;
  title: string;
  media?: string;
  episodes: {
    edges: Array<{
      node: EpisodeNode;
    }>;
  };
}
