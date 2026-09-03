/**
 * src/modules/sites/danime.ts のユニットテスト
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=1234510100"}
 */

import { obtainWatchingFromDanime } from '../../../src/modules/sites/danime';

function setupDanimeDOM(options: {
  workTitle?: string;
  episodeNumber?: string;
  episodeTitle?: string;
}) {
  document.body.innerHTML = `
    <span class="backInfoTxt1">${options.workTitle ?? ''}</span>
    <span class="backInfoTxt2">${options.episodeNumber ?? ''}</span>
    <span class="backInfoTxt3">${options.episodeTitle ?? ''}</span>
  `;
}

describe('obtainWatchingFromDanime', () => {
  test('正常なDOMとURLから視聴情報を取得する', () => {
    // URL: partId=1234500101 → workId='12345', numberFromUrl='101'
    setupDanimeDOM({
      workTitle: 'テストアニメ',
      episodeNumber: '第1話',
      episodeTitle: '始まりの章',
    });

    const result = obtainWatchingFromDanime();

    expect(result).toEqual(expect.objectContaining({
      site: 'danime',
      workTitle: 'テストアニメ',
      episodeNumber: '第1話',
      episodeTitle: '始まりの章',
      genre: 'アニメ',
      number: 1,
      numberFromUrl: '101',  // partId=1234510100 の5桁以降の3桁
      workId: '12345',
      workIds: [],
    }));
  });

  test('エピソード番号が漢数字でも正しく変換する', () => {
    setupDanimeDOM({
      workTitle: 'アニメB',
      episodeNumber: '第十二話',
      episodeTitle: 'タイトル',
    });

    const result = obtainWatchingFromDanime();

    expect(result).toEqual(expect.objectContaining({
      number: 12,
      episodeNumber: '第十二話',
      workId: '12345',
      numberFromUrl: '101',  // partId=1234510100 の5桁以降の3桁
    }));
  });

  test('DOM要素が存在しない場合は空文字フィールドを返す', () => {
    document.body.innerHTML = '';

    const result = obtainWatchingFromDanime();

    expect(result).toEqual(expect.objectContaining({
      site: 'danime',
      workTitle: '',
      episodeTitle: '',
      episodeNumber: '',
      number: 0,
      // URLは環境変数のURL (partId=1234510100) なのでworkId/numberFromUrlは引き続き抽出される
      workId: '12345',
      numberFromUrl: '101',
    }));
  });

  test('workIdsは常に空配列を返す', () => {
    setupDanimeDOM({
      workTitle: 'テスト',
      episodeNumber: '第1話',
      episodeTitle: '',
    });

    const result = obtainWatchingFromDanime();

    expect(result).toEqual(expect.objectContaining({
      workIds: [],
    }));
  });

  test('genreは常にアニメを返す', () => {
    setupDanimeDOM({
      workTitle: 'テスト',
      episodeNumber: '第1話',
      episodeTitle: '',
    });

    const result = obtainWatchingFromDanime();

    expect(result).toEqual(expect.objectContaining({
      genre: 'アニメ',
    }));
  });
});
