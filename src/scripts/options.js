class OptionsManager {
  constructor() {
    this.webhookCount = 0;
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Save button
    document.getElementById('saveButton').addEventListener('click', () => {
      this.saveSettings();
    });

    // Test button
    document.getElementById('testButton').addEventListener('click', () => {
      this.testConnection();
    });

    // Webhook toggle
    document.getElementById('enableWebhook').addEventListener('change', (e) => {
      this.toggleWebhookSection(e.target.checked);
    });

    // Add webhook button
    document.getElementById('addWebhook').addEventListener('click', () => {
      this.addWebhookInput();
    });

    // Webhook format change
    document.getElementById('webhookFormat').addEventListener('change', (e) => {
      this.toggleCustomTemplate(e.target.value === 'custom');
    });

    // Initial webhook section setup
    this.toggleWebhookSection(false);
    this.toggleCustomTemplate(false);
  }

  async loadSettings() {
    try {
      const settings = await this.getStorageData({
        annictToken: '',
        webhookUrls: [],
        enableWebhook: false,
        autoSend: true,
        debugMode: false,
        enableDanime: true,
        enableAmazon: true,
        enableAbema: true,
        webhookFormat: 'simple',
        webhookTemplate: '',
        webhookHeaders: '',
        sendDelay: 30
      });

      // Populate form fields
      document.getElementById('annictToken').value = settings.annictToken;
      document.getElementById('enableWebhook').checked = settings.enableWebhook;
      document.getElementById('autoSend').checked = settings.autoSend;
      document.getElementById('debugMode').checked = settings.debugMode;
      document.getElementById('enableDanime').checked = settings.enableDanime;
      document.getElementById('enableAmazon').checked = settings.enableAmazon;
      document.getElementById('enableAbema').checked = settings.enableAbema;
      document.getElementById('webhookFormat').value = settings.webhookFormat;
      document.getElementById('webhookTemplate').value = settings.webhookTemplate;
      document.getElementById('webhookHeaders').value = settings.webhookHeaders;
      document.getElementById('sendDelay').value = settings.sendDelay;

      // Setup webhook URLs
      this.setupWebhookInputs(settings.webhookUrls);
      this.toggleWebhookSection(settings.enableWebhook);
      this.toggleCustomTemplate(settings.webhookFormat === 'custom');

      this.showStatus('設定を読み込みました', 'info');
    } catch (error) {
      this.showStatus('設定の読み込みに失敗しました', 'error');
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      const annictToken = document.getElementById('annictToken').value.trim();
      const enableWebhook = document.getElementById('enableWebhook').checked;
      
      const webhookUrls = this.getWebhookUrls();

      // Validate custom headers JSON if provided
      const webhookHeaders = document.getElementById('webhookHeaders').value.trim();
      if (webhookHeaders) {
        try {
          JSON.parse(webhookHeaders);
        } catch (error) {
          this.showStatus('カスタムヘッダーの形式が無効です（有効なJSON形式で入力してください）', 'error');
          return;
        }
      }

      const settings = {
        annictToken,
        webhookUrls,
        enableWebhook,
        autoSend: document.getElementById('autoSend').checked,
        debugMode: document.getElementById('debugMode').checked,
        enableDanime: document.getElementById('enableDanime').checked,
        enableAmazon: document.getElementById('enableAmazon').checked,
        enableAbema: document.getElementById('enableAbema').checked,
        webhookFormat: document.getElementById('webhookFormat').value,
        webhookTemplate: document.getElementById('webhookTemplate').value,
        webhookHeaders,
        sendDelay: parseInt(document.getElementById('sendDelay').value) || 30
      };

      await this.setStorageData(settings);
      this.showStatus('設定を保存しました', 'success');
    } catch (error) {
      this.showStatus('設定の保存に失敗しました', 'error');
      console.error('Error saving settings:', error);
    }
  }

  async testConnection() {
    const annictToken = document.getElementById('annictToken').value.trim();
    
    if (!annictToken) {
      this.showStatus('Annict APIトークンを入力してください', 'error');
      return;
    }

    this.showStatus('接続テスト中...', 'info');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

      const response = await fetch(`https://api.annict.com/v1/me?access_token=${annictToken}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const userData = await response.json();
        this.showStatus(`接続成功！ユーザー: ${userData.username}`, 'success');
      } else if (response.status === 401) {
        this.showStatus('APIトークンが無効または期限切れです', 'error');
      } else if (response.status === 429) {
        this.showStatus('API制限に達しています。しばらく待ってから再試行してください', 'error');
      } else {
        this.showStatus(`接続エラー (HTTP ${response.status})`, 'error');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.showStatus('接続テストがタイムアウトしました', 'error');
      } else if (error.message.includes('Failed to fetch')) {
        this.showStatus('ネットワークエラー: インターネット接続を確認してください', 'error');
      } else {
        this.showStatus('接続テストに失敗しました', 'error');
        console.error('Connection test error:', error);
      }
    }
  }

  setupWebhookInputs(urls) {
    const container = document.getElementById('webhookUrls');
    container.innerHTML = '';

    if (urls.length === 0) {
      this.addWebhookInput();
    } else {
      urls.forEach(webhook => {
        if (typeof webhook === 'string') {
          // 下位互換性のため文字列URLをサポート
          this.addWebhookInput(webhook, true);
        } else {
          this.addWebhookInput(webhook.url, webhook.enabled);
        }
      });
    }
  }

  addWebhookInput(value = '', enabled = true) {
    const container = document.getElementById('webhookUrls');
    const webhookDiv = document.createElement('div');
    webhookDiv.className = 'webhook-input';
    
    webhookDiv.innerHTML = `
      <div class="webhook-row">
        <label class="webhook-toggle">
          <input type="checkbox" ${enabled ? 'checked' : ''}>
          <span class="webhook-enabled-text">有効</span>
        </label>
        <input type="url" value="${value}" placeholder="https://hooks.slack.com/services/...">
        <button type="button" class="btn btn-remove">削除</button>
      </div>
    `;

    // Add remove event listener
    webhookDiv.querySelector('.btn-remove').addEventListener('click', () => {
      webhookDiv.remove();
    });

    container.appendChild(webhookDiv);
    this.webhookCount++;
  }

  getWebhookUrls() {
    const webhookInputs = document.querySelectorAll('#webhookUrls .webhook-input');
    return Array.from(webhookInputs)
      .map(input => {
        const urlInput = input.querySelector('input[type="url"]');
        const enabledCheckbox = input.querySelector('input[type="checkbox"]');
        return {
          url: urlInput.value.trim(),
          enabled: enabledCheckbox ? enabledCheckbox.checked : true
        };
      })
      .filter(webhook => webhook.url.length > 0);
  }

  toggleWebhookSection(enabled) {
    const section = document.getElementById('webhookSection');
    if (enabled) {
      section.classList.add('enabled');
    } else {
      section.classList.remove('enabled');
    }
  }

  toggleCustomTemplate(enabled) {
    const section = document.getElementById('customWebhookTemplate');
    if (enabled) {
      section.classList.add('enabled');
    } else {
      section.classList.remove('enabled');
    }
  }

  showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;

    // Clear status after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status';
      }, 5000);
    }
  }

  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, resolve);
    });
  }

  setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, resolve);
    });
  }
}

// Initialize options manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});