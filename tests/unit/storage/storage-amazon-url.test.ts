/**
 * obtainVideoSite - Amazon URL検出テスト
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.amazon.co.jp/gp/video/detail/B000TEST/"}
 */

import { obtainVideoSite } from '../../../src/modules/storage/storage';

test('AmazonのURL（/gp/video/detail/）を検出する', () => {
  expect(obtainVideoSite()).toBe('amazon');
});
