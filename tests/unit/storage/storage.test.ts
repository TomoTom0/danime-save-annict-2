/**
 * src/modules/storage/storage.ts のユニットテスト
 */

import {
  webhookDefaultSetting,
  webhookDefaultString,
  inputObj,
  getSyncStorage,
  setSyncStorage,
  obtainVideoSite,
} from '../../../src/modules/storage/storage';

describe('webhookDefaultSetting', () => {
  test('デフォルト設定の構造が正しい', () => {
    expect(webhookDefaultSetting).toEqual({
      postUrl: '',
      webhookNoMatched: true,
      webhookNoWorkId: false,
      webhookSuccess: false,
      webhookContentChanged: false,
      webhookContent: {},
    });
  });
});

describe('webhookDefaultString', () => {
  test('JSONとしてパース可能', () => {
    const parsed = JSON.parse(webhookDefaultString);
    expect(typeof parsed).toBe('object');
  });

  test('パース結果がwebhookDefaultSettingを含む', () => {
    const parsed = JSON.parse(webhookDefaultString);
    const values = Object.values(parsed);
    expect(values.length).toBe(1);
    expect(values[0]).toEqual(webhookDefaultSetting);
  });
});

describe('inputObj', () => {
  test('デフォルト値が正しく設定されている', () => {
    expect(inputObj).toMatchObject({
      token: '',
      sendingTime: 300,
      annictSend: true,
      withTwitter: false,
      withFacebook: false,
      valid_danime: true,
      valid_amazon: false,
      valid_abema: false,
      valid_danimeAnnict: true,
      valid_amazonAnnict: true,
      valid_abemaAnnict: true,
      valid_danimeWebhook: true,
      valid_amazonWebhook: true,
      valid_abemaWebhook: true,
      valid_danimeGenre: false,
      valid_amazonGenre: false,
      valid_abemaGenre: false,
    });
  });

  test('webhookSettingsがJSON文字列', () => {
    expect(typeof inputObj.webhookSettings).toBe('string');
    expect(() => JSON.parse(inputObj.webhookSettings)).not.toThrow();
  });
});

describe('getSyncStorage', () => {
  test('chrome.storage.sync.getを呼び出してPromiseを返す', async () => {
    const mockData = { token: 'test-token', annictSend: true };
    (chrome.storage.sync.get as jest.Mock).mockImplementation((_keys: any, callback: (items: any) => void) => {
      callback(mockData);
    });

    const result = await getSyncStorage({ token: '', annictSend: false });

    expect(chrome.storage.sync.get).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });
});

describe('setSyncStorage', () => {
  test('chrome.storage.sync.setを呼び出してPromiseを返す', async () => {
    (chrome.storage.sync.set as jest.Mock).mockImplementation((_items: any, callback: () => void) => {
      callback();
    });

    await expect(setSyncStorage({ token: 'new-token' })).resolves.toBeUndefined();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ token: 'new-token' }, expect.any(Function));
  });
});

describe('obtainVideoSite', () => {
  // jsdom環境では window.location を再定義できないため、
  // デフォルト URL (http://localhost/) での動作のみテストする。
  // 各サイトのURL検出テストは @jest-environment-options で個別のURLを設定して実施する。

  test('対象外のURLは空文字を返す', () => {
    // デフォルトURL: http://localhost/ は対象サイトに一致しない
    expect(obtainVideoSite()).toBe('');
  });

  test('URLの部分一致でサイトを検出する関数が存在する', () => {
    // 関数がエクスポートされて呼び出し可能なことを確認
    expect(typeof obtainVideoSite).toBe('function');
    expect(typeof obtainVideoSite()).toBe('string');
  });
});
