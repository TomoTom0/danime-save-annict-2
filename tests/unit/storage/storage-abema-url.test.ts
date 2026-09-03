/**
 * obtainVideoSite - Abema/Netflix URL検出テスト
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://abema.tv/video/episode/anime-test_1-1"}
 */

import { obtainVideoSite } from '../../../src/modules/storage/storage';

test('AbemaTVのURLを検出する', () => {
  expect(obtainVideoSite()).toBe('abema');
});
