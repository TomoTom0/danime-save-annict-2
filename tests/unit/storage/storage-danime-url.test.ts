/**
 * obtainVideoSite - dアニメストアURL検出テスト
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=1234510100"}
 */

import { obtainVideoSite } from '../../../src/modules/storage/storage';

test('dアニメストアのURLを検出する', () => {
  expect(obtainVideoSite()).toBe('danime');
});
