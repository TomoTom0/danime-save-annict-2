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

    // Initial webhook section setup
    this.toggleWebhookSection(false);
  }

  async loadSettings() {
    try {
      const settings = await this.getStorageData({
        annictToken: '',
        webhookUrls: [],
        enableWebhook: false,
        autoSend: true,
        debugMode: false
      });

      // Populate form fields
      document.getElementById('annictToken').value = settings.annictToken;
      document.getElementById('enableWebhook').checked = settings.enableWebhook;
      document.getElementById('autoSend').checked = settings.autoSend;
      document.getElementById('debugMode').checked = settings.debugMode;

      // Setup webhook URLs
      this.setupWebhookInputs(settings.webhookUrls);
      this.toggleWebhookSection(settings.enableWebhook);

      this.showStatus('設定を読み込みました', 'info');
    } catch (error) {
      this.showStatus('設定の読み込みに失敗しました', 'error');
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      const annictToken = document.getElementById('annictToken').value.trim();
      
      if (!annictToken) {
        this.showStatus('Annict APIトークンは必須です', 'error');
        return;
      }

      const webhookUrls = this.getWebhookUrls();
      const enableWebhook = document.getElementById('enableWebhook').checked;

      if (enableWebhook && webhookUrls.length === 0) {
        this.showStatus('Webhookを有効にする場合はURLを設定してください', 'error');
        return;
      }

      const settings = {
        annictToken,
        webhookUrls,
        enableWebhook,
        autoSend: document.getElementById('autoSend').checked,
        debugMode: document.getElementById('debugMode').checked
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
      const response = await fetch(`https://api.annict.com/v1/me?access_token=${annictToken}`);
      
      if (response.ok) {
        const userData = await response.json();
        this.showStatus(`接続成功！ユーザー: ${userData.username}`, 'success');
      } else {
        this.showStatus('APIトークンが無効です', 'error');
      }
    } catch (error) {
      this.showStatus('接続テストに失敗しました', 'error');
      console.error('Connection test error:', error);
    }
  }

  setupWebhookInputs(urls) {
    const container = document.getElementById('webhookUrls');
    container.innerHTML = '';

    if (urls.length === 0) {
      this.addWebhookInput();
    } else {
      urls.forEach(url => {
        this.addWebhookInput(url);
      });
    }
  }

  addWebhookInput(value = '') {
    const container = document.getElementById('webhookUrls');
    const webhookDiv = document.createElement('div');
    webhookDiv.className = 'webhook-input';
    
    webhookDiv.innerHTML = `
      <input type="url" value="${value}" placeholder="https://hooks.slack.com/services/...">
      <button type="button" class="btn btn-remove">削除</button>
    `;

    // Add remove event listener
    webhookDiv.querySelector('.btn-remove').addEventListener('click', () => {
      webhookDiv.remove();
    });

    container.appendChild(webhookDiv);
    this.webhookCount++;
  }

  getWebhookUrls() {
    const inputs = document.querySelectorAll('#webhookUrls input[type="url"]');
    return Array.from(inputs)
      .map(input => input.value.trim())
      .filter(url => url.length > 0);
  }

  toggleWebhookSection(enabled) {
    const section = document.getElementById('webhookSection');
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