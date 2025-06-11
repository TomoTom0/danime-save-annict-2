class OptionsManager {
  constructor() {
    this.webhookCount = 0;
    this.currentHistory = [];
    this.filteredHistory = [];
    this.sortField = 'detectedAt';
    this.sortDirection = 'desc';
    this.hasUnsavedChanges = false;
    this.originalSettings = {};
    this.autoSaveFields = [
      'autoSend', 'debugMode', 'enableDanime', 'enableAmazon', 'enableAbema', 
      'enableWebhook', 'showNotifications'
    ];
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.restoreActiveTab();
    this.setupBeforeUnload();
    this.autoLoadHistoryOnHistoryTab();
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

    // History management event listeners (now only used for hide functionality)
    document.getElementById('viewHistoryButton').addEventListener('click', () => {
      this.toggleHistorySection();
    });

    document.getElementById('exportHistoryButton').addEventListener('click', () => {
      this.exportHistory();
    });

    document.getElementById('importHistoryFile').addEventListener('change', (e) => {
      this.importHistory(e);
    });

    document.getElementById('clearHistoryButton').addEventListener('click', () => {
      this.clearHistory();
    });

    document.getElementById('historySearch').addEventListener('input', () => {
      this.filterHistory();
    });

    document.getElementById('historyFilter').addEventListener('change', () => {
      this.filterHistory();
    });

    document.getElementById('historySite').addEventListener('change', () => {
      this.filterHistory();
    });

    document.getElementById('selectAllHistory').addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });

    document.getElementById('resendSelectedButton').addEventListener('click', () => {
      this.resendSelected();
    });

    document.getElementById('deleteSelectedButton').addEventListener('click', () => {
      this.deleteSelected();
    });

    // Tab switching event listeners
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        this.switchTab(tabId);
        // Auto-load history when switching to history tab
        if (tabId === 'history') {
          this.autoShowHistory();
        }
      });
    });

    // Unsaved changes warning event listeners
    document.getElementById('saveFromWarning').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('discardChanges').addEventListener('click', () => {
      this.discardChanges();
    });

    // Auto-save for checkbox fields
    this.autoSaveFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && element.type === 'checkbox') {
        element.addEventListener('change', () => {
          this.autoSaveCheckbox(fieldId, element.checked);
        });
      }
    });

    // Change detection for other fields
    this.setupChangeDetection();

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
        sendDelay: 30,
        showNotifications: true
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
      document.getElementById('showNotifications').checked = settings.showNotifications;

      // Setup webhook URLs
      this.setupWebhookInputs(settings.webhookUrls);
      this.toggleWebhookSection(settings.enableWebhook);
      this.toggleCustomTemplate(settings.webhookFormat === 'custom');

      // Store original settings for change detection
      this.originalSettings = { ...settings };
      this.hasUnsavedChanges = false;
      this.updateUnsavedWarning();

      // Show content after settings are loaded to prevent checkbox flicker
      document.querySelector('.tab-content').classList.add('loaded');

      this.showStatus('設定を読み込みました', 'info');
    } catch (error) {
      // Show content even if loading fails to prevent blank page
      document.querySelector('.tab-content').classList.add('loaded');
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
        sendDelay: parseInt(document.getElementById('sendDelay').value) || 30,
        showNotifications: document.getElementById('showNotifications').checked
      };

      await this.setStorageData(settings);
      
      // Update original settings and clear unsaved changes
      this.originalSettings = { ...settings };
      this.hasUnsavedChanges = false;
      this.updateUnsavedWarning();
      
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
      this.checkForUnsavedChanges();
    });

    container.appendChild(webhookDiv);
    this.webhookCount++;
    
    // Trigger change detection for new webhook
    setTimeout(() => {
      this.checkForUnsavedChanges();
    }, 100);
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

  // Tab Management
  switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Store active tab in local storage
    localStorage.setItem('danime-annict-active-tab', tabId);
  }

  restoreActiveTab() {
    const savedTab = localStorage.getItem('danime-annict-active-tab');
    if (savedTab && document.getElementById(savedTab)) {
      this.switchTab(savedTab);
      // Auto-load history if returning to history tab
      if (savedTab === 'history') {
        this.autoShowHistory();
      }
    }
  }

  autoLoadHistoryOnHistoryTab() {
    // Auto-load history if starting on history tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab && activeTab.dataset.tab === 'history') {
      this.autoShowHistory();
    }
  }

  async autoShowHistory() {
    const section = document.getElementById('historySection');
    const button = document.getElementById('viewHistoryButton');
    
    // Always show and load history automatically
    await this.loadHistory();
    section.style.display = 'block';
    button.textContent = '履歴を非表示';
  }

  // Auto-save and Change Detection Methods
  async autoSaveCheckbox(fieldId, value) {
    try {
      const partialSettings = {};
      partialSettings[fieldId] = value;
      
      // Get current settings and update the specific field
      const currentSettings = await this.getStorageData({});
      const updatedSettings = { ...currentSettings, ...partialSettings };
      
      await this.setStorageData(updatedSettings);
      
      // Update original settings to reflect the auto-saved change
      this.originalSettings[fieldId] = value;
      
      // Show brief feedback
      this.showStatus(`${this.getFieldDisplayName(fieldId)}を${value ? '有効' : '無効'}にしました`, 'info');
      
      // Check for other unsaved changes
      this.checkForUnsavedChanges();
    } catch (error) {
      this.showStatus('自動保存に失敗しました', 'error');
      console.error('Auto-save error:', error);
    }
  }

  setupChangeDetection() {
    // Text inputs
    ['annictToken', 'sendDelay', 'webhookTemplate', 'webhookHeaders'].forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.addEventListener('input', () => {
          this.checkForUnsavedChanges();
        });
      }
    });

    // Select elements
    ['webhookFormat'].forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.addEventListener('change', () => {
          this.checkForUnsavedChanges();
        });
      }
    });

    // Webhook URLs need special handling
    document.addEventListener('input', (e) => {
      if (e.target.closest('#webhookUrls')) {
        this.checkForUnsavedChanges();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.closest('#webhookUrls')) {
        this.checkForUnsavedChanges();
      }
    });
  }

  checkForUnsavedChanges() {
    // Skip if we're currently loading settings
    if (!this.originalSettings || Object.keys(this.originalSettings).length === 0) {
      return;
    }

    const currentValues = this.getCurrentFormValues();
    const hasChanges = this.compareSettings(this.originalSettings, currentValues);
    
    if (hasChanges !== this.hasUnsavedChanges) {
      this.hasUnsavedChanges = hasChanges;
      this.updateUnsavedWarning();
    }
  }

  getCurrentFormValues() {
    return {
      annictToken: document.getElementById('annictToken').value.trim(),
      enableWebhook: document.getElementById('enableWebhook').checked,
      autoSend: document.getElementById('autoSend').checked,
      debugMode: document.getElementById('debugMode').checked,
      enableDanime: document.getElementById('enableDanime').checked,
      enableAmazon: document.getElementById('enableAmazon').checked,
      enableAbema: document.getElementById('enableAbema').checked,
      webhookFormat: document.getElementById('webhookFormat').value,
      webhookTemplate: document.getElementById('webhookTemplate').value,
      webhookHeaders: document.getElementById('webhookHeaders').value.trim(),
      sendDelay: parseInt(document.getElementById('sendDelay').value) || 30,
      showNotifications: document.getElementById('showNotifications').checked,
      webhookUrls: this.getWebhookUrls()
    };
  }

  compareSettings(original, current) {
    // Compare simple fields
    const simpleFields = [
      'annictToken', 'enableWebhook', 'autoSend', 'debugMode', 
      'enableDanime', 'enableAmazon', 'enableAbema', 'webhookFormat',
      'webhookTemplate', 'webhookHeaders', 'sendDelay', 'showNotifications'
    ];

    for (const field of simpleFields) {
      if (original[field] !== current[field]) {
        return true;
      }
    }

    // Compare webhook URLs (more complex comparison)
    const originalUrls = original.webhookUrls || [];
    const currentUrls = current.webhookUrls || [];

    if (originalUrls.length !== currentUrls.length) {
      return true;
    }

    for (let i = 0; i < originalUrls.length; i++) {
      const orig = typeof originalUrls[i] === 'string' ? 
        { url: originalUrls[i], enabled: true } : originalUrls[i];
      const curr = currentUrls[i];

      if (orig.url !== curr.url || orig.enabled !== curr.enabled) {
        return true;
      }
    }

    return false;
  }

  updateUnsavedWarning() {
    const warning = document.getElementById('unsavedWarning');
    if (this.hasUnsavedChanges) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  }

  async discardChanges() {
    try {
      // Reload settings from storage
      await this.loadSettings();
      this.showStatus('変更を破棄しました', 'info');
    } catch (error) {
      this.showStatus('変更の破棄に失敗しました', 'error');
      console.error('Discard changes error:', error);
    }
  }

  getFieldDisplayName(fieldId) {
    const displayNames = {
      'autoSend': '自動送信',
      'debugMode': 'デバッグモード',
      'enableDanime': 'dアニメストア',
      'enableAmazon': 'Amazon Prime Video',
      'enableAbema': 'AbemaTV',
      'enableWebhook': 'Webhook',
      'showNotifications': '画面通知'
    };
    return displayNames[fieldId] || fieldId;
  }

  setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '未保存の変更があります。ページを離れますか？';
        return e.returnValue;
      }
    });
  }

  // History Management Methods
  async toggleHistorySection() {
    const section = document.getElementById('historySection');
    const button = document.getElementById('viewHistoryButton');
    
    if (section.style.display === 'none') {
      await this.loadHistory();
      section.style.display = 'block';
      button.textContent = '履歴を非表示';
    } else {
      section.style.display = 'none';
      button.textContent = '履歴を表示';
    }
  }

  async loadHistory() {
    try {
      this.showStatus('履歴を読み込み中...', 'info');
      this.currentHistory = await this.getWatchHistory();
      this.filterHistory();
      this.showStatus(`履歴を読み込みました (${this.currentHistory.length}件)`, 'success');
    } catch (error) {
      this.showStatus('履歴の読み込みに失敗しました', 'error');
      console.error('Error loading history:', error);
    }
  }

  filterHistory() {
    const searchText = document.getElementById('historySearch').value.toLowerCase();
    const filterType = document.getElementById('historyFilter').value;
    const siteFilter = document.getElementById('historySite').value;

    this.filteredHistory = this.currentHistory.filter(entry => {
      // Search filter
      if (searchText && !entry.animeTitle.toLowerCase().includes(searchText)) {
        return false;
      }

      // Site filter
      if (siteFilter !== 'all' && entry.site !== siteFilter) {
        return false;
      }

      // Status filter
      switch (filterType) {
        case 'unsent':
          return !entry.annictSent && !entry.webhookSent;
        case 'annict-sent':
          return entry.annictSent;
        case 'webhook-sent':
          return entry.webhookSent;
        case 'errors':
          return entry.errors && entry.errors.length > 0;
        default:
          return true;
      }
    });

    this.sortHistory();
    this.renderHistoryTable();
    this.updateHistoryStats();
  }

  sortHistory() {
    this.filteredHistory.sort((a, b) => {
      let aVal = a[this.sortField];
      let bVal = b[this.sortField];

      if (this.sortField === 'detectedAt' || this.sortField === 'lastAttempt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (this.sortField === 'episodeNumber') {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }

      if (this.sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    // Add sortable click handlers
    document.querySelectorAll('.sortable').forEach(th => {
      th.removeEventListener('click', this.handleSort);
      th.addEventListener('click', (e) => this.handleSort(e));
    });

    this.filteredHistory.forEach(entry => {
      const row = document.createElement('tr');
      
      const annictStatus = this.getStatusBadge(entry.annictSent, entry.errors);
      const webhookStatus = this.getStatusBadge(entry.webhookSent, entry.errors);
      const errorIndicator = (entry.errors && entry.errors.length > 0) ? 
        `<span class="error-indicator error-tooltip">⚠<span class="tooltip-text">${entry.errors[entry.errors.length - 1].message}</span></span>` : '';

      row.innerHTML = `
        <td><input type="checkbox" class="history-checkbox" data-id="${entry.id}"></td>
        <td><div class="episode-title" title="${entry.animeTitle}">${entry.animeTitle} ${errorIndicator}</div></td>
        <td>${entry.episodeNumber}話</td>
        <td>${entry.site}</td>
        <td>${this.formatDate(entry.detectedAt)}</td>
        <td>${annictStatus}</td>
        <td>${webhookStatus}</td>
        <td>
          <button class="btn btn-mini btn-secondary" onclick="optionsManager.resendEntry('${entry.id}')">再送信</button>
          <button class="btn btn-mini btn-remove" onclick="optionsManager.deleteEntry('${entry.id}')">削除</button>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  handleSort(e) {
    const field = e.target.dataset.sort;
    if (!field) return;

    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    e.target.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');

    this.filterHistory();
  }

  getStatusBadge(success, errors) {
    if (success) {
      return '<span class="status-badge success">成功</span>';
    } else if (errors && errors.length > 0) {
      return '<span class="status-badge error">エラー</span>';
    } else {
      return '<span class="status-badge pending">未送信</span>';
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  updateHistoryStats() {
    const totalCount = this.filteredHistory.length;
    const unsentCount = this.filteredHistory.filter(entry => !entry.annictSent && !entry.webhookSent).length;

    document.getElementById('historyCount').textContent = `履歴: ${totalCount}件`;
    document.getElementById('unsentCount').textContent = `未送信: ${unsentCount}件`;
  }

  toggleSelectAll(checked) {
    document.querySelectorAll('.history-checkbox').forEach(checkbox => {
      checkbox.checked = checked;
      if (checked) {
        checkbox.closest('tr').classList.add('selected');
      } else {
        checkbox.closest('tr').classList.remove('selected');
      }
    });
  }

  async exportHistory() {
    try {
      this.showStatus('エクスポート準備中...', 'info');
      
      // Get CSV content from content script
      const csvContent = await this.callContentScript('exportHistoryToCSV');
      
      if (!csvContent) {
        this.showStatus('エクスポートするデータがありません', 'error');
        return;
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danime-annict-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showStatus('CSVファイルをダウンロードしました', 'success');
    } catch (error) {
      this.showStatus('エクスポートに失敗しました', 'error');
      console.error('Export error:', error);
    }
  }

  async importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.showStatus('インポート中...', 'info');
      
      const csvContent = await this.readFileAsText(file);
      const importedCount = await this.callContentScript('importHistoryFromCSV', csvContent);
      
      this.showStatus(`${importedCount}件のデータをインポートしました`, 'success');
      
      // Refresh history display
      if (document.getElementById('historySection').style.display !== 'none') {
        await this.loadHistory();
      }
    } catch (error) {
      this.showStatus(`インポートに失敗しました: ${error.message}`, 'error');
      console.error('Import error:', error);
    }

    // Reset file input
    event.target.value = '';
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  async clearHistory() {
    if (!confirm('すべての視聴履歴を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      await this.setLocalStorageData({ watchHistory: [] });
      this.currentHistory = [];
      this.filterHistory();
      this.showStatus('履歴を削除しました', 'success');
    } catch (error) {
      this.showStatus('履歴の削除に失敗しました', 'error');
      console.error('Clear history error:', error);
    }
  }

  async resendSelected() {
    const selectedIds = this.getSelectedIds();
    if (selectedIds.length === 0) {
      this.showStatus('再送信する項目を選択してください', 'error');
      return;
    }

    if (!confirm(`選択した${selectedIds.length}件の項目を再送信しますか？`)) {
      return;
    }

    try {
      this.showStatus('再送信中...', 'info');
      
      for (const id of selectedIds) {
        const entry = this.currentHistory.find(h => h.id === id);
        if (entry) {
          await this.callContentScript('resendEntry', {
            animeTitle: entry.animeTitle,
            episodeNumber: entry.episodeNumber,
            site: entry.site
          });
        }
      }

      this.showStatus(`${selectedIds.length}件の再送信を開始しました`, 'success');
      
      // Refresh history after a short delay
      setTimeout(() => {
        this.loadHistory();
      }, 2000);
    } catch (error) {
      this.showStatus('再送信に失敗しました', 'error');
      console.error('Resend error:', error);
    }
  }

  async deleteSelected() {
    const selectedIds = this.getSelectedIds();
    if (selectedIds.length === 0) {
      this.showStatus('削除する項目を選択してください', 'error');
      return;
    }

    if (!confirm(`選択した${selectedIds.length}件の項目を削除しますか？`)) {
      return;
    }

    try {
      this.currentHistory = this.currentHistory.filter(entry => !selectedIds.includes(entry.id));
      await this.setLocalStorageData({ watchHistory: this.currentHistory });
      this.filterHistory();
      this.showStatus(`${selectedIds.length}件の項目を削除しました`, 'success');
    } catch (error) {
      this.showStatus('削除に失敗しました', 'error');
      console.error('Delete error:', error);
    }
  }

  async resendEntry(id) {
    const entry = this.currentHistory.find(h => h.id === id);
    if (!entry) return;

    try {
      this.showStatus('再送信中...', 'info');
      
      await this.callContentScript('resendEntry', {
        animeTitle: entry.animeTitle,
        episodeNumber: entry.episodeNumber,
        site: entry.site
      });

      this.showStatus('再送信を開始しました', 'success');
      
      // Refresh history after a short delay
      setTimeout(() => {
        this.loadHistory();
      }, 2000);
    } catch (error) {
      this.showStatus('再送信に失敗しました', 'error');
      console.error('Resend error:', error);
    }
  }

  async deleteEntry(id) {
    if (!confirm('この項目を削除しますか？')) {
      return;
    }

    try {
      this.currentHistory = this.currentHistory.filter(entry => entry.id !== id);
      await this.setLocalStorageData({ watchHistory: this.currentHistory });
      this.filterHistory();
      this.showStatus('項目を削除しました', 'success');
    } catch (error) {
      this.showStatus('削除に失敗しました', 'error');
      console.error('Delete error:', error);
    }
  }

  getSelectedIds() {
    return Array.from(document.querySelectorAll('.history-checkbox:checked'))
      .map(checkbox => checkbox.dataset.id);
  }

  async getWatchHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['watchHistory'], (result) => {
        resolve(result.watchHistory || []);
      });
    });
  }

  setLocalStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  async callContentScript(method, data) {
    return new Promise((resolve, reject) => {
      // Since we can't directly call content script methods from options page,
      // we'll work with storage directly for now
      if (method === 'exportHistoryToCSV') {
        this.exportHistoryToCSV().then(resolve).catch(reject);
      } else if (method === 'importHistoryFromCSV') {
        this.importHistoryFromCSV(data).then(resolve).catch(reject);
      } else {
        reject(new Error('Method not implemented'));
      }
    });
  }

  async exportHistoryToCSV() {
    const history = await this.getWatchHistory();
    
    if (history.length === 0) {
      return null;
    }

    const csvHeader = 'アニメタイトル,エピソード番号,視聴サイト,検出日時,Annict送信,Webhook送信,最終試行,試行回数,エラー\n';
    
    const csvRows = history.map(entry => {
      const errors = entry.errors ? entry.errors.map(e => e.message).join(';') : '';
      return [
        this.escapeCSV(entry.animeTitle),
        entry.episodeNumber,
        this.escapeCSV(entry.site),
        entry.detectedAt,
        entry.annictSent ? '成功' : '未送信',
        entry.webhookSent ? '成功' : '未送信',
        entry.lastAttempt,
        entry.attempts,
        this.escapeCSV(errors)
      ].join(',');
    });

    return csvHeader + csvRows.join('\n');
  }

  async importHistoryFromCSV(csvContent) {
    try {
      const lines = csvContent.split('\n');
      const header = lines[0];
      
      // Validate header
      if (!header.includes('アニメタイトル') || !header.includes('エピソード番号')) {
        throw new Error('無効なCSVファイル形式です');
      }

      const importedEntries = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = this.parseCSVLine(line);
        if (columns.length < 5) continue;
        
        const entry = {
          id: this.generateHistoryId({
            animeTitle: columns[0],
            episodeNumber: parseInt(columns[1]),
            site: columns[2]
          }),
          animeTitle: columns[0],
          episodeNumber: parseInt(columns[1]),
          site: columns[2],
          detectedAt: columns[3],
          annictSent: columns[4] === '成功',
          webhookSent: columns[5] === '成功',
          lastAttempt: columns[6] || columns[3],
          attempts: parseInt(columns[7]) || 0,
          errors: columns[8] ? columns[8].split(';').map(msg => ({
            timestamp: new Date().toISOString(),
            message: msg
          })) : []
        };
        
        importedEntries.push(entry);
      }

      // Merge with existing history
      const existingHistory = await this.getWatchHistory();
      const mergedHistory = [...importedEntries];
      
      // Add existing entries that are not in imported data
      existingHistory.forEach(existing => {
        if (!importedEntries.find(imported => imported.id === existing.id)) {
          mergedHistory.push(existing);
        }
      });
      
      // Sort by detection date (newest first)
      mergedHistory.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
      
      await this.setLocalStorageData({ watchHistory: mergedHistory });
      return importedEntries.length;
    } catch (error) {
      throw new Error(`CSVインポートに失敗しました: ${error.message}`);
    }
  }

  generateHistoryId(episodeData) {
    const siteName = this.getSiteNameFromUrl(episodeData.site);
    return `${siteName}_${episodeData.animeTitle}_${episodeData.episodeNumber}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  getSiteNameFromUrl(site) {
    if (site.includes('dアニメストア') || site.includes('animestore.docomo.ne.jp')) return 'danime';
    if (site.includes('Amazon Prime Video') || site.includes('amazon.co.jp')) return 'amazon';
    if (site.includes('AbemaTV') || site.includes('abema.tv')) return 'abema';
    return 'unknown';
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current);
    return result;
  }

  escapeCSV(str) {
    if (typeof str !== 'string') return str;
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
}

// Initialize options manager when DOM is ready
let optionsManager;
document.addEventListener('DOMContentLoaded', () => {
  optionsManager = new OptionsManager();
});