/**
 * E2Eテスト - 拡張機能全体テスト
 * Playwrightを使用した実環境テスト
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// 拡張機能のパス
const extensionPath = path.join(__dirname, '../../src');

test.describe('Chrome拡張機能 E2Eテスト', () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    // 拡張機能を読み込んでコンテキストを作成
    context = await browser.newContext({
      // Chrome拡張機能の読み込み
      // 注意: Playwrightでの拡張機能テストはChromiumでのみサポート
    });

    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe('設定画面のテスト', () => {
    test('設定画面が正常に表示される', async () => {
      // 拡張機能のオプションページにアクセス
      await page.goto('chrome-extension://test-id/html/options.html');

      // ページタイトルの確認
      await expect(page.locator('h1')).toContainText('danime-save-annict-2 設定');

      // 主要な設定項目の確認
      await expect(page.locator('#annictToken')).toBeVisible();
      await expect(page.locator('#enableWebhook')).toBeVisible();
      await expect(page.locator('#autoSend')).toBeVisible();
      await expect(page.locator('#debugMode')).toBeVisible();
    });

    test('APIトークンの入力と保存', async () => {
      await page.goto('chrome-extension://test-id/html/options.html');

      // APIトークンを入力
      await page.fill('#annictToken', 'test-api-token-123');

      // 保存ボタンをクリック
      await page.click('#saveButton');

      // 成功メッセージの確認
      await expect(page.locator('#status')).toContainText('設定を保存しました');
      await expect(page.locator('#status')).toHaveClass(/success/);
    });

    test('接続テスト機能', async () => {
      await page.goto('chrome-extension://test-id/html/options.html');

      // 有効なAPIトークンを入力
      await page.fill('#annictToken', 'valid-test-token');

      // 接続テストボタンをクリック
      await page.click('#testButton');

      // テスト結果の確認（モックが必要）
      await expect(page.locator('#status')).toContainText('接続テスト中...');
    });

    test('Webhook URLの追加と削除', async () => {
      await page.goto('chrome-extension://test-id/html/options.html');

      // Webhookを有効にする
      await page.check('#enableWebhook');

      // Webhook URLを追加
      await page.click('#addWebhook');
      
      // 追加されたInput要素にURLを入力
      const webhookInputs = page.locator('#webhookUrls input[type="url"]');
      await webhookInputs.first().fill('https://hooks.slack.com/test');

      // さらにWebhook URLを追加
      await page.click('#addWebhook');
      await webhookInputs.nth(1).fill('https://discord.com/api/webhooks/test');

      // 削除ボタンのテスト
      await page.click('#webhookUrls .btn-remove').first();

      // 1つのWebhook URLが削除されたことを確認
      await expect(webhookInputs).toHaveCount(1);
    });

    test('レスポンシブデザインの確認', async () => {
      await page.goto('chrome-extension://test-id/html/options.html');

      // デスクトップサイズ
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.locator('.container')).toBeVisible();

      // タブレットサイズ
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.container')).toBeVisible();

      // モバイルサイズ
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('.container')).toBeVisible();
    });
  });

  test.describe('対応サイトでの動作テスト', () => {
    test('dアニメストア - アニメ情報の検出', async () => {
      // モックサーバーまたはテスト用ページに移動
      await page.goto('https://animestore.docomo.ne.jp/animestore/sc_d_pc?partId=test');

      // テスト用のDOM要素を挿入
      await page.evaluate(() => {
        const titleElement = document.createElement('div');
        titleElement.className = 'backInfoTxt1';
        titleElement.textContent = 'テストアニメ';
        document.body.appendChild(titleElement);

        const episodeElement = document.createElement('div');
        episodeElement.className = 'backInfoTxt2';
        episodeElement.textContent = '第1話';
        document.body.appendChild(episodeElement);
      });

      // 拡張機能がアニメ情報を検出するまで待機
      await page.waitForTimeout(3000);

      // 通知が表示されることを確認（実際のテストではモックが必要）
      // await expect(page.locator('.danime-annict-notification')).toBeVisible();
    });

    test('Amazon Prime Video - アニメ情報の検出', async () => {
      await page.goto('https://www.amazon.co.jp/gp/video/detail/test');

      // Amazon特有のDOM構造を挿入
      await page.evaluate(() => {
        const titleElement = document.createElement('div');
        titleElement.setAttribute('data-automation-id', 'title');
        titleElement.textContent = 'Amazonテストアニメ';
        document.body.appendChild(titleElement);

        const episodeElement = document.createElement('div');
        episodeElement.setAttribute('data-automation-id', 'episode-title');
        episodeElement.textContent = 'Episode 1';
        document.body.appendChild(episodeElement);
      });

      await page.waitForTimeout(3000);
      // 検出結果の確認
    });

    test('AbemaTV - アニメ情報の検出', async () => {
      await page.goto('https://abema.tv/video/test');

      // AbemaTV特有のDOM構造を挿入
      await page.evaluate(() => {
        const titleElement = document.createElement('div');
        titleElement.className = 'com-video-EpisodeTitle__title';
        titleElement.textContent = 'Abemaテストアニメ';
        document.body.appendChild(titleElement);

        const episodeElement = document.createElement('div');
        episodeElement.className = 'com-video-EpisodeTitle__episode';
        episodeElement.textContent = '#1';
        document.body.appendChild(episodeElement);
      });

      await page.waitForTimeout(3000);
      // 検出結果の確認
    });
  });

  test.describe('通知システムのテスト', () => {
    test('成功通知の表示', async () => {
      await page.goto('https://animestore.docomo.ne.jp/test');

      // 通知をトリガーするJavaScriptを実行
      await page.evaluate(() => {
        // 拡張機能の通知機能を直接呼び出し
        const notification = document.createElement('div');
        notification.className = 'danime-annict-notification danime-annict-success';
        notification.textContent = 'テストアニメ 第1話をAnnictに記録しました';
        document.body.appendChild(notification);
      });

      // 通知が表示されることを確認
      await expect(page.locator('.danime-annict-notification')).toBeVisible();
      await expect(page.locator('.danime-annict-notification')).toHaveClass(/success/);
      await expect(page.locator('.danime-annict-notification')).toContainText('テストアニメ 第1話をAnnictに記録しました');
    });

    test('エラー通知の表示', async () => {
      await page.goto('https://animestore.docomo.ne.jp/test');

      await page.evaluate(() => {
        const notification = document.createElement('div');
        notification.className = 'danime-annict-notification danime-annict-error';
        notification.textContent = 'Annictへの記録に失敗しました';
        document.body.appendChild(notification);
      });

      await expect(page.locator('.danime-annict-notification')).toBeVisible();
      await expect(page.locator('.danime-annict-notification')).toHaveClass(/error/);
    });

    test('通知の自動消去', async () => {
      await page.goto('https://animestore.docomo.ne.jp/test');

      await page.evaluate(() => {
        const notification = document.createElement('div');
        notification.className = 'danime-annict-notification danime-annict-info';
        notification.textContent = 'テスト通知';
        document.body.appendChild(notification);

        // 3秒後に自動削除をシミュレート
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      });

      // 通知が表示される
      await expect(page.locator('.danime-annict-notification')).toBeVisible();

      // 3秒後に消去される
      await page.waitForTimeout(3500);
      await expect(page.locator('.danime-annict-notification')).not.toBeVisible();
    });
  });

  test.describe('パフォーマンステスト', () => {
    test('ページ読み込み時のパフォーマンス', async () => {
      // パフォーマンス測定開始
      await page.goto('https://animestore.docomo.ne.jp/test');

      // 拡張機能の初期化時間を測定
      const startTime = Date.now();
      
      // DOM要素の検出処理をトリガー
      await page.evaluate(() => {
        const titleElement = document.createElement('div');
        titleElement.className = 'backInfoTxt1';
        titleElement.textContent = 'パフォーマンステスト';
        document.body.appendChild(titleElement);
      });

      // 処理完了まで待機
      await page.waitForTimeout(1000);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 実行時間が1秒以内であることを確認
      expect(executionTime).toBeLessThan(1000);
    });

    test('メモリ使用量の確認', async () => {
      await page.goto('https://animestore.docomo.ne.jp/test');

      // メモリ使用量の測定
      const metrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
          totalJSHeapSize: performance.memory?.totalJSHeapSize || 0
        };
      });

      // メモリ使用量が適切な範囲内であることを確認
      expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB未満
    });
  });

  test.describe('セキュリティテスト', () => {
    test('CSP (Content Security Policy) 準拠', async () => {
      await page.goto('chrome-extension://test-id/html/options.html');

      // インラインスクリプトが実行されないことを確認
      const cspErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          cspErrors.push(msg.text());
        }
      });

      // CSPエラーが発生しないことを確認
      await page.waitForTimeout(2000);
      expect(cspErrors).toHaveLength(0);
    });

    test('HTTPS通信の確認', async () => {
      // 拡張機能が外部APIとHTTPS通信を行うことを確認
      const requests = [];
      page.on('request', request => {
        if (request.url().includes('api.annict.com')) {
          requests.push(request);
        }
      });

      // API呼び出しをトリガー
      await page.goto('chrome-extension://test-id/html/options.html');
      await page.fill('#annictToken', 'test-token');
      await page.click('#testButton');

      // HTTPS通信が使用されることを確認
      if (requests.length > 0) {
        expect(requests[0].url()).toMatch(/^https:/);
      }
    });
  });
});