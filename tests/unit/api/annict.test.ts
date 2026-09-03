/**
 * src/modules/api/annict.ts のユニットテスト
 */

import { fetchWork, obtainWork, sendAnnict } from '../../../src/modules/api/annict';
import { WatchingEpisode, WorkNode, WorkInfo, StorageItems } from '../../../src/types';

const mockWorkNode: WorkNode = {
  title: 'テストアニメ',
  annictId: 1001,
  media: 'tv',
  episodes: {
    edges: [
      {
        node: {
          annictId: 2001,
          sortNumber: 1,
          number: '1',
          title: '第1話タイトル',
        }
      },
      {
        node: {
          annictId: 2002,
          sortNumber: 2,
          number: '2',
          title: '第2話タイトル',
        }
      }
    ]
  }
};

const mockWatchingEpisode: WatchingEpisode = {
  site: 'danime',
  workTitle: 'テストアニメ',
  episodeTitle: '第1話タイトル',
  episodeNumber: '第1話',
  number: 1,
  genre: 'アニメ',
  workId: '12345',
  workIds: [],
  numberFromUrl: '001',
};

describe('fetchWork', () => {
  test('GraphQL APIを呼び出してWorkNodeの配列を返す', async () => {
    const mockResponse = {
      data: {
        searchWorks: {
          edges: [{ node: mockWorkNode }]
        }
      }
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchWork('テストアニメ', 'test-token');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.annict.com/graphql'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      })
    );
    expect(result).toEqual([mockWorkNode]);
  });

  test('APIがエラーを返した場合は空配列を返す', async () => {
    const mockErrorResponse = {
      errors: [{ message: 'Unauthorized' }]
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockErrorResponse),
    });

    const result = await fetchWork('テストアニメ', 'bad-token');

    expect(result).toEqual([]);
  });
});

describe('obtainWork', () => {
  test('通常エピソードはidentifyWorkを呼ぶ', async () => {
    const mockAnnictResponse = {
      data: {
        searchWorks: {
          edges: [{ node: mockWorkNode }]
        }
      }
    };
    // fetchWork用
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnnictResponse),
    });
    // checkTitleWithWorkId用のHTMLレスポンス（workIdなし）
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<html><body></body></html>'),
    });

    const result = await obtainWork(mockWatchingEpisode, 'test-token');

    expect(result).toHaveProperty('WatchingEpisode', mockWatchingEpisode);
    expect(result).toHaveProperty('nodes');
    expect(result).toHaveProperty('webhook');
  });

  test('結合エピソード（～区切り）は複数エピソードを処理する', async () => {
    const combinedEpisode: WatchingEpisode = {
      ...mockWatchingEpisode,
      episodeNumber: '1～3',
      number: 1,
    };

    const mockResponse = {
      data: {
        searchWorks: {
          edges: [{ node: mockWorkNode }]
        }
      }
    };
    // 各エピソード(1,2,3)についてfetchWorkとcheckTitleWithWorkIdが呼ばれる
    for (let i = 0; i < 6; i++) {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve('<html><body></body></html>'),
      });
    }

    const result = await obtainWork(combinedEpisode, 'test-token');

    expect(result).toHaveProperty('WatchingEpisode', combinedEpisode);
    expect(result).toHaveProperty('nodes');
  });

  test('結合エピソード（／区切り）も処理する', async () => {
    const combinedEpisode: WatchingEpisode = {
      ...mockWatchingEpisode,
      episodeNumber: '1／2',
      number: 1,
    };

    const mockResponse = {
      data: {
        searchWorks: {
          edges: [{ node: mockWorkNode }]
        }
      }
    };
    for (let i = 0; i < 4; i++) {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve('<html><body></body></html>'),
      });
    }

    const result = await obtainWork(combinedEpisode, 'test-token');

    expect(result).toHaveProperty('WatchingEpisode', combinedEpisode);
  });
});

describe('sendAnnict', () => {
  const baseItems: StorageItems = {
    token: 'test-token',
    annictSend: true,
    valid_danimeAnnict: true,
    withTwitter: false,
    withFacebook: false,
  };

  const workInfo: WorkInfo = {
    WatchingEpisode: mockWatchingEpisode,
    nodes: [{
      annictId: 2001,
      sortNumber: 1,
      number: '1',
      title: '第1話タイトル',
    }],
    webhook: { WatchingEpisode: mockWatchingEpisode, error: 'none' },
  };

  test('正常な場合にAnnictへPOSTする', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    await sendAnnict(workInfo, baseItems);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.annict.com/v1/me/records'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('annictSend=falseの場合はfetchを呼ばない', async () => {
    const items: StorageItems = { ...baseItems, annictSend: false };

    await sendAnnict(workInfo, items);

    expect(fetch).not.toHaveBeenCalled();
  });

  test('tokenが空の場合はfetchを呼ばない', async () => {
    const items: StorageItems = { ...baseItems, token: '' };

    await sendAnnict(workInfo, items);

    expect(fetch).not.toHaveBeenCalled();
  });

  test('valid_danimeAnnictがfalseの場合はfetchを呼ばない', async () => {
    const items: StorageItems = { ...baseItems, valid_danimeAnnict: false };

    await sendAnnict(workInfo, items);

    expect(fetch).not.toHaveBeenCalled();
  });

  test('genreにアニメが含まれない場合はfetchを呼ばない', async () => {
    const nonAnimeWorkInfo: WorkInfo = {
      ...workInfo,
      WatchingEpisode: { ...mockWatchingEpisode, genre: 'ドラマ' },
    };

    await sendAnnict(nonAnimeWorkInfo, baseItems);

    expect(fetch).not.toHaveBeenCalled();
  });

  test('IsZeroEpisodeの場合はstatusエンドポイントにPOSTする', async () => {
    const zeroEpisodeWorkInfo: WorkInfo = {
      WatchingEpisode: mockWatchingEpisode,
      nodes: [{
        annictId: 1001,
        sortNumber: 0,
        number: '',
        title: 'テストアニメ',
        IsZeroEpisode: true,
      }],
      webhook: { WatchingEpisode: mockWatchingEpisode, error: 'none' },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

    await sendAnnict(zeroEpisodeWorkInfo, baseItems);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.annict.com/v1/me/statuses'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
