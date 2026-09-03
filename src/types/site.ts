export interface Genre {
  text: string;
}

export interface AmazonDetailData {
  genres: Genre[];
}

export interface AmazonSelfItem {
  asins: string[];
}

export interface AmazonScriptData {
  props: {
    state: {
      pageTitleId: string;
      self: Record<string, AmazonSelfItem>;
      detail: {
        detail: Record<string, AmazonDetailData>;
        headerDetail: Record<string, AmazonDetailData>;
      };
    };
  };
}
