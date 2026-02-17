/**
 * src/modules/ui/notification.ts のユニットテスト
 */

import {
  resetNotificationClasses,
  fadeIn,
  fadeOut,
  showMessage,
} from '../../../src/modules/ui/notification';

describe('resetNotificationClasses', () => {
  test('ダイアログからすべてのアニメーションクラスを削除する', () => {
    const dialog = document.createElement('div');
    dialog.classList.add('dsa-dialog-show', 'dsa-dialog-fade-in', 'dsa-dialog-fade-out');

    resetNotificationClasses(dialog);

    expect(dialog.classList.contains('dsa-dialog-show')).toBe(false);
    expect(dialog.classList.contains('dsa-dialog-fade-in')).toBe(false);
    expect(dialog.classList.contains('dsa-dialog-fade-out')).toBe(false);
  });

  test('クラスが存在しなくてもエラーにならない', () => {
    const dialog = document.createElement('div');
    expect(() => resetNotificationClasses(dialog)).not.toThrow();
  });
});

describe('fadeIn', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('タイムアウト後にdsa-dialog-showクラスを追加する', () => {
    const dialog = document.createElement('div');

    fadeIn(dialog);
    jest.advanceTimersByTime(0);

    expect(dialog.classList.contains('dsa-dialog-show')).toBe(true);
  });

  test('dsa-dialog-showの後にdsa-dialog-fade-inを追加する', () => {
    const dialog = document.createElement('div');

    fadeIn(dialog);
    jest.advanceTimersByTime(20);

    expect(dialog.classList.contains('dsa-dialog-fade-in')).toBe(true);
  });
});

describe('fadeOut', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('デフォルトdelayの後にdsa-dialog-fade-inを削除してdsa-dialog-fade-outを追加する', () => {
    const dialog = document.createElement('div');
    dialog.classList.add('dsa-dialog-show', 'dsa-dialog-fade-in');

    fadeOut(dialog);
    jest.advanceTimersByTime(5000);

    expect(dialog.classList.contains('dsa-dialog-fade-in')).toBe(false);
    expect(dialog.classList.contains('dsa-dialog-fade-out')).toBe(true);
  });

  test('カスタムdelayを指定できる', () => {
    const dialog = document.createElement('div');
    dialog.classList.add('dsa-dialog-show', 'dsa-dialog-fade-in');

    fadeOut(dialog, 1000);
    jest.advanceTimersByTime(500);
    expect(dialog.classList.contains('dsa-dialog-fade-in')).toBe(true);

    jest.advanceTimersByTime(600);
    expect(dialog.classList.contains('dsa-dialog-fade-in')).toBe(false);
  });

  test('フェードアウトアニメーション後にクラスをすべて削除する', () => {
    const dialog = document.createElement('div');
    dialog.classList.add('dsa-dialog-show', 'dsa-dialog-fade-in');

    fadeOut(dialog, 0);
    jest.advanceTimersByTime(700);

    expect(dialog.classList.contains('dsa-dialog-show')).toBe(false);
    expect(dialog.classList.contains('dsa-dialog-fade-out')).toBe(false);
  });
});

describe('showMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('ダイアログ要素にメッセージをセットする', () => {
    const dialog = document.createElement('div');
    dialog.className = 'dsa-dialog';
    document.body.appendChild(dialog);

    showMessage('テストメッセージ');

    expect(dialog.textContent).toBe('テストメッセージ');
  });

  test('dialog_inが指定された場合はそのダイアログを使用する', () => {
    const dialog = document.createElement('div');

    showMessage('直接指定', dialog);

    expect(dialog.textContent).toBe('直接指定');
  });

  test('ダイアログが存在しない場合は何もしない', () => {
    expect(() => showMessage('エラーなし')).not.toThrow();
  });

  test('メッセージ表示後にfadeIn/fadeOutが呼ばれる', () => {
    const dialog = document.createElement('div');

    showMessage('フェードテスト', dialog);

    jest.advanceTimersByTime(20);
    expect(dialog.classList.contains('dsa-dialog-fade-in')).toBe(true);
  });
});
