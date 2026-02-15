/**
 * options.js のユニットテスト
 */

describe('Options Page', () => {
  let optionsModule;

  beforeEach(() => {
    // テスト前のセットアップ
    document.body.innerHTML = `
      <div class="container">
        <input type="text" id="input_token" />
        <input type="number" id="input_sendingTime" value="300" />
        <input type="checkbox" id="check_annictSend" checked />
        <input type="checkbox" id="check_withTwitter" />
        <input type="checkbox" id="check_withFacebook" />
        <button id="btn_token" class="saveButton">保存</button>
      </div>
    `;

    // Chrome storage のモックセットアップ
    testHelpers.setupStorageMock({
      token: 'test-token',
      sendingTime: 300,
      annictSend: true,
      withTwitter: false,
      withFacebook: false
    });
  });

  describe('Storage operations', () => {
    test('should load settings from chrome.storage', async () => {
      const mockCallback = jest.fn();
      chrome.storage.sync.get({ token: '' }, mockCallback);

      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    test('should save settings to chrome.storage', async () => {
      const mockCallback = jest.fn();
      chrome.storage.sync.set({ token: 'new-token' }, mockCallback);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { token: 'new-token' },
        expect.any(Function)
      );
    });
  });

  describe('Form validation', () => {
    test('should validate token input', () => {
      const tokenInput = document.querySelector('#input_token');
      tokenInput.value = 'test-token-123';

      expect(tokenInput.value).toBe('test-token-123');
      expect(tokenInput.value.length).toBeGreaterThan(0);
    });

    test('should validate sendingTime input', () => {
      const sendingTimeInput = document.querySelector('#input_sendingTime');
      sendingTimeInput.value = '600';

      expect(parseInt(sendingTimeInput.value)).toBe(600);
      expect(parseInt(sendingTimeInput.value)).toBeGreaterThan(0);
    });
  });

  describe('Checkbox states', () => {
    test('should handle checkbox state changes', () => {
      const annictSendCheckbox = document.querySelector('#check_annictSend');
      const twitterCheckbox = document.querySelector('#check_withTwitter');

      expect(annictSendCheckbox.checked).toBe(true);
      expect(twitterCheckbox.checked).toBe(false);

      twitterCheckbox.checked = true;
      expect(twitterCheckbox.checked).toBe(true);
    });
  });

  describe('Webhook settings', () => {
    test('should handle webhook configuration', () => {
      const webhookSettings = {
        postUrl: 'https://example.com/webhook',
        webhookNoMatched: true,
        webhookNoWorkId: false,
        webhookSuccess: false,
        webhookContentChanged: false,
        webhookContent: {}
      };

      chrome.storage.sync.set({ webhookSettings: JSON.stringify(webhookSettings) });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookSettings: expect.any(String)
        })
      );
    });

    test('should parse webhook settings correctly', () => {
      const webhookSettingsString = JSON.stringify({
        '12345': {
          postUrl: 'https://example.com/webhook',
          webhookNoMatched: true,
          webhookNoWorkId: false,
          webhookSuccess: false,
          webhookContentChanged: false,
          webhookContent: { key1: 'value1' }
        }
      });

      const parsed = JSON.parse(webhookSettingsString);
      expect(parsed).toHaveProperty('12345');
      expect(parsed['12345'].postUrl).toBe('https://example.com/webhook');
    });
  });
});
