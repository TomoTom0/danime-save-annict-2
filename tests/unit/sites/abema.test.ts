/**
 * src/modules/sites/abema.ts のユニットテスト
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://abema.tv/video/episode/testwork_1-1"}
 */

import { obtainWatchingFromAbema } from '../../../src/modules/sites/abema';

function setupAbemaDOM(options: {
  jsonData?: object;
}) {
  const defaultJson = options.jsonData ?? {
    itemListElement: [
      { name: 'TOP' },
      { name: 'アニメ' },
      { name: 'テストアニメ' },
      { name: '1 第1話タイトル' },
    ]
  };

  document.body.innerHTML = `
    <script type="application/ld+json">${JSON.stringify(defaultJson)}</script>
  `;
}

describe('obtainWatchingFromAbema', () => {
  test('正常なDOMとURLから視聴情報を取得する', () => {
    // URL: https://abema.tv/video/episode/testwork_1-1 → workId='testwork'
    setupAbemaDOM({});

    const result = obtainWatchingFromAbema(true);

    expect(result).toEqual(expect.objectContaining({
      site: 'abema',
      workTitle: 'テストアニメ',
      episodeNumber: '1',
      episodeTitle: '第1話タイトル',
      genre: 'アニメ',
      number: 1,
      workId: 'testwork',
      workIds: [],
    }));
  });

  test('genreLimit=trueでアニメ以外のジャンルは空オブジェクトを返す', () => {
    const nonAnimeJson = {
      itemListElement: [
        { name: 'TOP' },
        { name: 'ドラマ' },
        { name: 'テストドラマ' },
        { name: '1 第1話タイトル' },
      ]
    };
    setupAbemaDOM({ jsonData: nonAnimeJson });

    const result = obtainWatchingFromAbema(true);

    expect(result).toEqual({});
  });

  test('genreLimit=falseでアニメ以外のジャンルも取得する', () => {
    const nonAnimeJson = {
      itemListElement: [
        { name: 'TOP' },
        { name: 'ドラマ' },
        { name: 'テストドラマ' },
        { name: '1 第1話タイトル' },
      ]
    };
    setupAbemaDOM({ jsonData: nonAnimeJson });

    const result = obtainWatchingFromAbema(false);

    expect(result).toEqual(expect.objectContaining({
      site: 'abema',
      workTitle: 'テストドラマ',
      genre: 'ドラマ',
    }));
  });

  test('itemListElementが4要素未満の場合は空オブジェクトを返す', () => {
    const shortJson = {
      itemListElement: [
        { name: 'TOP' },
        { name: 'アニメ' },
      ]
    };
    setupAbemaDOM({ jsonData: shortJson });

    const result = obtainWatchingFromAbema(true);

    expect(result).toEqual({});
  });

  test('エピソード番号が複数単語でも先頭の数字を使用する', () => {
    const multiWordJson = {
      itemListElement: [
        { name: 'TOP' },
        { name: 'アニメ' },
        { name: 'テストアニメ' },
        { name: '5 第5話タイトル 後編' },
      ]
    };
    setupAbemaDOM({ jsonData: multiWordJson });

    const result = obtainWatchingFromAbema(true);

    expect(result).toEqual(expect.objectContaining({
      episodeNumber: '5',
      number: 5,
      episodeTitle: '第5話タイトル 後編',
    }));
  });

  test('URLからworkIdを抽出する', () => {
    // env URL: https://abema.tv/video/episode/testwork_1-1
    // workIdパターン: (?<=abema\.tv\/video\/episode\/)[^_]+ → 'testwork'
    setupAbemaDOM({});

    const result = obtainWatchingFromAbema(true);

    expect(result).toEqual(expect.objectContaining({
      workId: 'testwork',
    }));
  });

  test('空文字エピソードの場合のデフォルト挙動', () => {
    // title2number('') = 0, isFinite(0) = true なのでepisodeNumber=''で返す
    const emptyEpisodeJson = {
      itemListElement: [
        { name: 'TOP' },
        { name: 'アニメ' },
        { name: 'テストアニメ' },
        { name: '' },
      ]
    };
    setupAbemaDOM({ jsonData: emptyEpisodeJson });

    const result = obtainWatchingFromAbema(true);

    expect(result).toEqual(expect.objectContaining({
      site: 'abema',
      episodeNumber: '',
      number: 0,
    }));
  });
});
