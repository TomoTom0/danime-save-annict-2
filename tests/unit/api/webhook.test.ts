/**
 * src/modules/api/webhook.ts のユニットテスト
 */

import { checkWebhookSettings, post2webhook } from '../../../src/modules/api/webhook';
import { WebhookSetting, StorageItems } from '../../../src/types';

const defaultWebhookSetting: WebhookSetting = {
  postUrl: 'https://example.com/webhook',
  webhookNoMatched: true,
  webhookNoWorkId: false,
  webhookSuccess: false,
  webhookContentChanged: false,
  webhookContent: {},
};

describe('checkWebhookSettings', () => {
  test('JSON文字列をパースして返す', () => {
    const settings = { key1: defaultWebhookSetting };
    const result = checkWebhookSettings(JSON.stringify(settings));
    expect(result).toEqual(settings);
  });

  test('無効なJSON文字列でもエラーにならない', () => {
    expect(() => checkWebhookSettings('invalid json')).not.toThrow();
  });

  test('nullに対してはデフォルト設定を返す', () => {
    const result = checkWebhookSettings(null);
    expect(typeof result).toBe('object');
  });

  test('undefinedに対してはデフォルト設定を返す', () => {
    const result = checkWebhookSettings(undefined);
    expect(typeof result).toBe('object');
  });

  test('配列ライクなオブジェクトをRecordに変換する', () => {
    const arrayLike = { 0: defaultWebhookSetting, 1: defaultWebhookSetting, length: 2 };
    const result = checkWebhookSettings(arrayLike);
    expect(typeof result).toBe('object');
  });
});

describe('post2webhook', () => {
  const watchingEpisode = {
    site: 'danime',
    workTitle: 'テストアニメ',
    episodeTitle: '第1話タイトル',
    episodeNumber: '第1話',
    number: 1,
    genre: 'アニメ',
    workId: '12345',
    workIds: [],
  };

  test('itemsがundefinedの場合はfetchを呼ばない', async () => {
    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'none' }, undefined);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('valid_danimeWebhookがfalseの場合はfetchを呼ばない', async () => {
    const items: StorageItems = { valid_danimeWebhook: false };
    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'none' }, items);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('webhookSuccessがtrueで error=noneの場合にfetchを呼ぶ', async () => {
    const successSetting: WebhookSetting = {
      ...defaultWebhookSetting,
      webhookSuccess: true,
    };
    const items: StorageItems = {
      valid_danimeWebhook: true,
      webhookSettings: JSON.stringify({ key1: successSetting }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'none' }, items);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('webhookNoMatchedがtrueでerror=noWorkMatchedの場合にfetchを呼ぶ', async () => {
    const items: StorageItems = {
      valid_danimeWebhook: true,
      webhookSettings: JSON.stringify({ key1: defaultWebhookSetting }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'noWorkMatched' }, items);

    expect(fetch).toHaveBeenCalled();
  });

  test('エラー条件にマッチしない場合はfetchを呼ばない', async () => {
    const noMatchSetting: WebhookSetting = {
      ...defaultWebhookSetting,
      webhookNoMatched: false,
      webhookNoWorkId: false,
      webhookSuccess: false,
    };
    const items: StorageItems = {
      valid_danimeWebhook: true,
      webhookSettings: JSON.stringify({ key1: noMatchSetting }),
    };

    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'noWorkMatched' }, items);

    expect(fetch).not.toHaveBeenCalled();
  });

  test('webhookContentChangedがtrueの場合はカスタムコンテンツでPOSTする', async () => {
    const customSetting: WebhookSetting = {
      ...defaultWebhookSetting,
      webhookSuccess: true,
      webhookContentChanged: true,
      webhookContent: {
        title: '{workTitle}',
        episode: '{episodeNumber}',
        fixed: 'fixedValue',
      },
    };
    const items: StorageItems = {
      valid_danimeWebhook: true,
      webhookSettings: JSON.stringify({ key1: customSetting }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'none' }, items);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        body: JSON.stringify({
          title: 'テストアニメ',
          episode: '第1話',
          fixed: 'fixedValue',
        }),
      })
    );
  });

  test('Google Apps ScriptのURLはno-corsモードで送信する', async () => {
    const gasSetting: WebhookSetting = {
      ...defaultWebhookSetting,
      postUrl: 'https://script.google.com/macros/s/test/exec',
      webhookSuccess: true,
    };
    const items: StorageItems = {
      valid_danimeWebhook: true,
      webhookSettings: JSON.stringify({ key1: gasSetting }),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    await post2webhook({ WatchingEpisode: watchingEpisode, error: 'none' }, items);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ mode: 'no-cors' })
    );
  });
});
