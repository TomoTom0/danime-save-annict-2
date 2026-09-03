/**
 * src/modules/utils/string.ts のユニットテスト
 */

import { kanji2arab, remakeString, title2number, checkTitle, splitTitle } from '../../../src/modules/utils/string';

describe('kanji2arab', () => {
  test('一桁の漢数字を変換する', () => {
    expect(kanji2arab('一')).toBe('1');
    expect(kanji2arab('五')).toBe('5');
    expect(kanji2arab('九')).toBe('9');
  });

  test('二桁以上の漢数字を変換する', () => {
    expect(kanji2arab('十')).toBe('10');
    expect(kanji2arab('十五')).toBe('15');
    expect(kanji2arab('二十')).toBe('20');
    expect(kanji2arab('百')).toBe('100');
    expect(kanji2arab('千')).toBe('1000');
  });

  test('混在する文字列を変換する', () => {
    expect(kanji2arab('第一話')).toBe('第1話');
    expect(kanji2arab('第十二話')).toBe('第12話');
  });

  test('万・億などの大きな漢数字を変換する', () => {
    expect(kanji2arab('一万')).toBe('10000');
    expect(kanji2arab('二万')).toBe('20000');
    expect(kanji2arab('一億')).toBe('100000000');
  });

  test('アラビア数字のみの文字列はそのまま返す', () => {
    expect(kanji2arab('abc123')).toBe('abc123');
  });
});

describe('remakeString - episodeNumber mode', () => {
  test('全角数字を半角に変換する', () => {
    expect(remakeString('第１話', 'episodeNumber')).toBe('第1話');
    expect(remakeString('第１２話', 'episodeNumber')).toBe('第12話');
  });

  test('漢数字を変換する', () => {
    expect(remakeString('第一話', 'episodeNumber')).toBe('第1話');
    expect(remakeString('第十二話', 'episodeNumber')).toBe('第12話');
  });

  test('nullやundefinedには空文字を返す', () => {
    expect(remakeString(null, 'episodeNumber')).toBe('');
    expect(remakeString(undefined, 'episodeNumber')).toBe('');
    expect(remakeString('', 'episodeNumber')).toBe('');
  });
});

describe('remakeString - title mode', () => {
  test('全角英数字を半角に変換する', () => {
    expect(remakeString('ＡＢＣ', 'title')).toBe('ABC');
    expect(remakeString('１２３', 'title')).toBe('123');
    expect(remakeString('Ａ１Ｂ２', 'title')).toBe('A1B2');
  });

  test('カギ括弧を削除する', () => {
    expect(remakeString('「テスト」', 'title')).toBe('テスト');
    expect(remakeString('『テスト』', 'title')).toBe('テスト');
    expect(remakeString('｢テスト｣', 'title')).toBe('テスト');
  });

  test('ローマ数字を変換する', () => {
    expect(remakeString('Ⅰ', 'title')).toBe('I');
    expect(remakeString('Ⅱ', 'title')).toBe('II');
    expect(remakeString('Ⅲ', 'title')).toBe('III');
  });

  test('nullやundefinedには空文字を返す', () => {
    expect(remakeString(null, 'title')).toBe('');
    expect(remakeString(undefined, 'title')).toBe('');
    expect(remakeString('', 'title')).toBe('');
  });

  test('デフォルトモードはtitle', () => {
    expect(remakeString('ＡＢＣ')).toBe('ABC');
  });

  test('未知のモードは空文字を返す', () => {
    expect(remakeString('テスト', 'unknown')).toBe('');
  });
});

describe('title2number', () => {
  test('数字を含む文字列から最初の数値を抽出する', () => {
    expect(title2number('第1話')).toBe(1);
    expect(title2number('12話')).toBe(12);
    expect(title2number('100')).toBe(100);
  });

  test('数字がない場合は0を返す', () => {
    expect(title2number('話')).toBe(0);
    expect(title2number('abc')).toBe(0);
  });

  test('nullやundefinedには0を返す', () => {
    expect(title2number(null)).toBe(0);
    expect(title2number(undefined)).toBe(0);
    expect(title2number('')).toBe(0);
  });
});

describe('checkTitle', () => {
  test('一方のタイトルが他方に含まれる場合にカウントを返す', () => {
    const result = checkTitle(['テストアニメ', 'テストアニメ 2期'], 'length');
    expect(result).toBeGreaterThan(0);
  });

  test('すべての単語が含まれる場合にtrueを返す (every mode)', () => {
    const result = checkTitle(['テスト', 'テストアニメ'], 'every');
    expect(result).toBe(true);
  });

  test('含まれない場合にfalseを返す (every mode)', () => {
    const result = checkTitle(['全く別のアニメ', 'テストアニメ'], 'every');
    expect(result).toBe(false);
  });

  test('nullが含まれる場合はfalseを返す', () => {
    expect(checkTitle([null, 'テスト'], 'length')).toBe(false);
    expect(checkTitle(['テスト', null], 'every')).toBe(false);
  });

  test('未知のモードはfalseを返す', () => {
    expect(checkTitle(['テスト', 'テスト'], 'unknown')).toBe(false);
  });
});

describe('splitTitle', () => {
  test('スペースで分割する', () => {
    const result = splitTitle('テスト アニメ');
    expect(result).toContain('テスト');
    expect(result).toContain('アニメ');
  });

  test('中点で分割する', () => {
    const result = splitTitle('テスト・アニメ');
    expect(result).toContain('テスト');
    expect(result).toContain('アニメ');
  });

  test('括弧で分割する', () => {
    const result = splitTitle('テスト(アニメ)');
    expect(result).toContain('テスト');
    expect(result).toContain('アニメ');
  });

  test('空白のみのトークンは除外する', () => {
    const result = splitTitle('テスト  アニメ');
    expect(result.every(d => !/^\s*$/.test(d))).toBe(true);
  });
});
