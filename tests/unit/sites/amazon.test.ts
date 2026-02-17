/**
 * src/modules/sites/amazon.ts のユニットテスト
 */

import { obtainWatchingFromAmazon } from '../../../src/modules/sites/amazon';

function buildAmazonScriptData(options: {
  pageTitleId?: string;
  asins?: string[];
  subasins?: string[];
  genres?: { text: string }[];
}) {
  const pageTitleId = options.pageTitleId ?? 'WORK001';
  const asins = options.asins ?? ['ASIN001'];
  const genres = options.genres ?? [{ text: 'アニメ' }];

  const selfData: Record<string, { asins: string[] }> = {
    [pageTitleId]: { asins },
  };
  if (options.subasins) {
    selfData['WORK002'] = { asins: options.subasins };
  }

  return {
    props: {
      state: {
        features: { isElcano: true },
        pageTitleId,
        self: selfData,
        detail: {
          detail: {
            [pageTitleId]: {
              genres,
            }
          },
          headerDetail: {}
        }
      }
    }
  };
}

function setupAmazonDOM(options: {
  workTitle?: string;
  seasonEpisodeText?: string;
  genres?: { text: string }[];
  pageTitleId?: string;
  asins?: string[];
  noScript?: boolean;
}) {
  const scriptData = buildAmazonScriptData({
    pageTitleId: options.pageTitleId,
    asins: options.asins,
    genres: options.genres,
  });

  const scriptContent = JSON.stringify(scriptData);
  const seasonEpisodeText = options.seasonEpisodeText ?? 'シーズン1、エピソード1 1 第1話タイトル';

  document.body.innerHTML = `
    <h1 data-automation-id="title">${options.workTitle ?? 'テストアニメ'}</h1>
    ${options.noScript ? '' : `<script type="text/template">${scriptContent}</script>`}
    <h2 class="subtitle">${seasonEpisodeText}</h2>
  `;
}

describe('obtainWatchingFromAmazon', () => {
  test('正常なDOMから視聴情報を取得する', () => {
    setupAmazonDOM({
      workTitle: 'テストアニメ',
      seasonEpisodeText: 'シーズン1、エピソード1 1 第1話タイトル',
    });

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual(expect.objectContaining({
      site: 'amazon',
      workTitle: 'テストアニメ',
      episodeNumber: '1',
      number: 1,
      workId: 'WORK001',
      workIds: ['ASIN001'],
    }));
  });

  test('スクリプトがない場合は空オブジェクトを返す', () => {
    setupAmazonDOM({ noScript: true });

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual({});
  });

  test('genreLimit=trueでアニメ以外のジャンルは空オブジェクトを返す', () => {
    setupAmazonDOM({
      genres: [{ text: 'ドラマ' }],
      seasonEpisodeText: 'シーズン1、エピソード1 1 エピソードタイトル',
    });

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual({});
  });

  test('genreLimit=falseでアニメ以外のジャンルも取得する', () => {
    setupAmazonDOM({
      genres: [{ text: 'ドラマ' }],
      workTitle: 'テストドラマ',
      seasonEpisodeText: 'シーズン1、エピソード1 1 エピソードタイトル',
    });

    const result = obtainWatchingFromAmazon(false);

    expect(result).toEqual(expect.objectContaining({
      site: 'amazon',
      workTitle: 'テストドラマ',
    }));
  });

  test('subitleクラスのh2が複数ある場合は空オブジェクトを返す', () => {
    const scriptData = buildAmazonScriptData({});
    document.body.innerHTML = `
      <h1 data-automation-id="title">テスト</h1>
      <script type="text/template">${JSON.stringify(scriptData)}</script>
      <h2 class="subtitle">シーズン1、エピソード1 1 タイトルA</h2>
      <h2 class="subtitle">シーズン1、エピソード2 2 タイトルB</h2>
    `;

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual({});
  });

  test('シーズン・エピソード形式でないh2の場合は空オブジェクトを返す', () => {
    setupAmazonDOM({
      seasonEpisodeText: 'エピソードタイトルのみ',
    });

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual({});
  });

  test('シーズン・エピソードの後に数字がない場合もepisodeNumberをそのまま使用する', () => {
    // title2number("タイトルのみ") === 0 は isFinite(0) === true なので、
    // episodeNumber = "タイトルのみ", number = 0 として返す
    setupAmazonDOM({
      seasonEpisodeText: 'シーズン1、エピソード1 タイトルのみ',
    });

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual(expect.objectContaining({
      site: 'amazon',
      episodeNumber: 'タイトルのみ',
      number: 0,
      episodeTitle: '',
    }));
  });

  test('ジャンルが空の場合はデフォルトでアニメを使用する', () => {
    setupAmazonDOM({
      genres: [],
      seasonEpisodeText: 'シーズン1、エピソード1 1 第1話',
    });

    const result = obtainWatchingFromAmazon(true);

    expect(result).toEqual(expect.objectContaining({
      genre: 'アニメ',
    }));
  });
});
