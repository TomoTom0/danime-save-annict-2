class DanimeAnnictSender {
  constructor() {
    this.isDebug = false;
    this.siteName = this.detectSite();
    this.lastProcessedEpisode = null; // Performance: avoid duplicate processing
    this.observer = null; // Store observer for cleanup
    this.init();
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('animestore.docomo.ne.jp')) return 'danime';
    if (hostname.includes('amazon.co.jp')) return 'amazon';
    if (hostname.includes('abema.tv')) return 'abema';
    return null;
  }

  async init() {
    if (!this.siteName) return;
    
    this.log('Initializing for site:', this.siteName);
    
    // Load settings
    this.settings = await this.loadSettings();
    
    // Check if at least one feature is enabled
    if (!this.settings.annictToken && !this.settings.enableWebhook) {
      this.log('Neither Annict token nor Webhook is configured');
      return;
    }

    // Setup observers based on site
    this.setupSiteSpecificObserver();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
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
      }, (result) => {
        this.isDebug = result.debugMode;
        resolve(result);
      });
    });
  }

  setupSiteSpecificObserver() {
    // Check if the current site is enabled in settings
    const siteEnabledMap = {
      'danime': this.settings.enableDanime,
      'amazon': this.settings.enableAmazon,
      'abema': this.settings.enableAbema
    };

    if (!siteEnabledMap[this.siteName]) {
      this.log(`Site ${this.siteName} is disabled in settings`);
      return;
    }

    switch (this.siteName) {
      case 'danime':
        this.setupDanimeObserver();
        break;
      case 'amazon':
        this.setupAmazonObserver();
        break;
      case 'abema':
        this.setupAbemaObserver();
        break;
    }
  }

  setupDanimeObserver() {
    // Watch for video player and episode information with throttling
    let throttleTimer = null;
    const observer = new MutationObserver((mutations) => {
      // Throttle mutations to avoid excessive calls
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        this.checkDanimeEpisode();
        throttleTimer = null;
      }, 500); // 500ms throttle
    });

    // Only observe specific elements to reduce performance impact
    const targetNode = document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributeFilter: ['class'] // Only watch for class changes
    });

    // Initial check with delay
    setTimeout(() => this.checkDanimeEpisode(), 2000);
    
    // Store observer for cleanup
    this.observer = observer;
  }

  setupAmazonObserver() {
    let throttleTimer = null;
    const observer = new MutationObserver((mutations) => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        this.checkAmazonEpisode();
        throttleTimer = null;
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['data-automation-id', 'class']
    });

    setTimeout(() => this.checkAmazonEpisode(), 2000);
    this.observer = observer;
  }

  setupAbemaObserver() {
    let throttleTimer = null;
    const observer = new MutationObserver((mutations) => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        this.checkAbemaEpisode();
        throttleTimer = null;
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['class']
    });

    setTimeout(() => this.checkAbemaEpisode(), 2000);
    this.observer = observer;
  }

  async checkDanimeEpisode() {
    try {
      // Use more specific selectors to reduce search time
      const titleElement = document.querySelector('.backInfoTxt1');
      const episodeElement = document.querySelector('.backInfoTxt2');
      
      if (!titleElement || !episodeElement) return;

      const animeTitle = titleElement.textContent.trim();
      const episodeText = episodeElement.textContent.trim();
      
      // Early return if no content
      if (!animeTitle || !episodeText) return;
      
      const episodeNumber = this.extractEpisodeNumber(episodeText);

      if (animeTitle && episodeNumber) {
        // Check if this is the same as last processed to avoid duplicates
        const episodeKey = `${animeTitle}_${episodeNumber}`;
        if (this.lastProcessedEpisode === episodeKey) return;
        
        this.lastProcessedEpisode = episodeKey;
        
        const episodeData = {
          animeTitle,
          episodeNumber,
          site: 'dアニメストア'
        };

        this.log('Found episode:', episodeData);
        this.scheduleEpisodeSend(episodeData);
      }
    } catch (error) {
      this.log('Error checking dAnime episode:', error);
    }
  }

  async checkAmazonEpisode() {
    try {
      // Extract from Amazon Prime Video
      const titleElement = document.querySelector('[data-automation-id="title"]') || 
                          document.querySelector('.dv-node-dp-title');
      const episodeElement = document.querySelector('[data-automation-id="episode-title"]') ||
                           document.querySelector('.dv-node-dp-episode-title');

      if (!titleElement) return;

      const animeTitle = titleElement.textContent.trim();
      const episodeText = episodeElement ? episodeElement.textContent.trim() : '';
      const episodeNumber = this.extractEpisodeNumber(episodeText);

      if (animeTitle && episodeNumber) {
        const episodeData = {
          animeTitle,
          episodeNumber,
          site: 'Amazon Prime Video'
        };

        this.log('Found episode:', episodeData);
        this.scheduleEpisodeSend(episodeData);
      }
    } catch (error) {
      this.log('Error checking Amazon episode:', error);
    }
  }

  async checkAbemaEpisode() {
    try {
      // Extract from AbemaTV
      const titleElement = document.querySelector('.com-video-EpisodeTitle__title') ||
                          document.querySelector('[class*="ProgramTitle"]');
      const episodeElement = document.querySelector('.com-video-EpisodeTitle__episode') ||
                           document.querySelector('[class*="EpisodeNumber"]');

      if (!titleElement) return;

      const animeTitle = titleElement.textContent.trim();
      const episodeText = episodeElement ? episodeElement.textContent.trim() : '';
      const episodeNumber = this.extractEpisodeNumber(episodeText);

      if (animeTitle && episodeNumber) {
        const episodeData = {
          animeTitle,
          episodeNumber,
          site: 'AbemaTV'
        };

        this.log('Found episode:', episodeData);
        this.scheduleEpisodeSend(episodeData);
      }
    } catch (error) {
      this.log('Error checking Abema episode:', error);
    }
  }

  scheduleEpisodeSend(episodeData) {
    // Clear any existing timer for this episode
    const episodeKey = `${episodeData.animeTitle}_${episodeData.episodeNumber}`;
    if (this.sendTimers && this.sendTimers[episodeKey]) {
      clearTimeout(this.sendTimers[episodeKey]);
    }

    // Initialize timers object if not exists
    if (!this.sendTimers) {
      this.sendTimers = {};
    }

    // Schedule the send after the configured delay
    const delayMs = (this.settings.sendDelay || 30) * 1000;
    
    this.log(`Scheduling episode send in ${this.settings.sendDelay || 30} seconds`);
    
    this.sendTimers[episodeKey] = setTimeout(async () => {
      await this.sendToAnnict(episodeData);
      delete this.sendTimers[episodeKey];
    }, delayMs);
  }

  extractEpisodeNumber(text) {
    if (!text) return null;
    
    // Cache compiled regex patterns for better performance
    if (!this.episodePatterns) {
      this.episodePatterns = [
        /第?(\d+)話/,
        /第?(\d+)回/,
        /episode\s*(\d+)/i,
        /ep\.?\s*(\d+)/i,
        /#(\d+)/,
        /(\d+)/
      ];
    }

    for (const pattern of this.episodePatterns) {
      const match = text.match(pattern);
      if (match) {
        const episode = parseInt(match[1]);
        // Validate episode number (reasonable range)
        if (episode > 0 && episode <= 9999) {
          return episode;
        }
      }
    }

    return null;
  }

  async sendToAnnict(episodeData) {
    try {
      // Check if already sent to avoid duplicates
      const storageKey = `sent_${this.siteName}_${episodeData.animeTitle}_${episodeData.episodeNumber}`;
      const alreadySent = await this.checkAlreadySent(storageKey);
      
      if (alreadySent) {
        this.log('Episode already sent, skipping');
        return;
      }

      let annictSuccess = false;
      let webhookSuccess = false;

      // Send to Annict if token is configured
      if (this.settings.annictToken) {
        // Search for anime on Annict
        const animeId = await this.searchAnimeOnAnnict(episodeData.animeTitle);
        if (animeId) {
          // Record episode
          annictSuccess = await this.recordEpisodeOnAnnict(animeId, episodeData.episodeNumber);
          
          if (annictSuccess) {
            this.showNotification(`${episodeData.animeTitle} 第${episodeData.episodeNumber}話をAnnictに記録しました`, 'success');
          } else {
            this.showNotification('Annictへの記録に失敗しました', 'error');
          }
        } else {
          this.showNotification('アニメが見つかりませんでした', 'error');
        }
      }

      // Send webhook if enabled
      if (this.settings.enableWebhook && this.settings.webhookUrls.length > 0) {
        webhookSuccess = await this.sendWebhooks(episodeData);
      }

      // Mark as sent if at least one method succeeded or if only webhook is configured
      if (annictSuccess || webhookSuccess || (!this.settings.annictToken && this.settings.enableWebhook)) {
        await this.markAsSent(storageKey);
      }

      // Show appropriate notification for webhook-only mode
      if (!this.settings.annictToken && this.settings.enableWebhook) {
        if (webhookSuccess) {
          this.showNotification(`${episodeData.animeTitle} 第${episodeData.episodeNumber}話の通知を送信しました`, 'success');
        } else {
          this.showNotification('通知の送信に失敗しました', 'error');
        }
      }
    } catch (error) {
      this.log('Error processing episode:', error);
      this.showNotification('エラーが発生しました', 'error');
    }
  }

  async checkAlreadySent(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(!!result[key]);
      });
    });
  }

  async markAsSent(key) {
    return new Promise((resolve) => {
      chrome.storage.local.set({[key]: true}, resolve);
    });
  }

  async searchAnimeOnAnnict(title) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const response = await fetch(`https://api.annict.com/v1/works?access_token=${this.settings.annictToken}&filter_title=${encodeURIComponent(title)}&per_page=1`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.works && data.works.length > 0) {
        return data.works[0].id;
      }
      
      this.log(`No anime found for title: ${title}`);
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        this.log('Anime search timed out');
        this.showNotification('Annict検索がタイムアウトしました', 'error');
      } else if (error.message.includes('HTTP 401')) {
        this.log('Invalid Annict token');
        this.showNotification('Annict APIトークンが無効です', 'error');
      } else if (error.message.includes('HTTP 429')) {
        this.log('Rate limit exceeded');
        this.showNotification('API制限に達しました。しばらく待ってから再試行してください', 'error');
      } else {
        this.log('Error searching anime:', error);
        this.showNotification('アニメ検索でエラーが発生しました', 'error');
      }
      return null;
    }
  }

  async recordEpisodeOnAnnict(animeId, episodeNumber) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

      const response = await fetch('https://api.annict.com/v1/me/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.annictToken}`
        },
        body: JSON.stringify({
          work_id: animeId,
          episode_number: episodeNumber,
          rating_state: 'great'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        this.log('Episode recording timed out');
        this.showNotification('記録送信がタイムアウトしました', 'error');
      } else if (error.message.includes('HTTP 401')) {
        this.log('Invalid Annict token for recording');
        this.showNotification('APIトークンが無効です', 'error');
      } else if (error.message.includes('HTTP 422')) {
        this.log('Invalid data for recording');
        this.showNotification('記録データが無効です', 'error');
      } else if (error.message.includes('HTTP 429')) {
        this.log('Rate limit exceeded for recording');
        this.showNotification('API制限に達しました', 'error');
      } else {
        this.log('Error recording episode:', error);
        this.showNotification('記録送信でエラーが発生しました', 'error');
      }
      return false;
    }
  }

  async sendWebhooks(episodeData) {
    let successCount = 0;
    let failureCount = 0;

    for (const webhook of this.settings.webhookUrls) {
      const webhookUrl = typeof webhook === 'string' ? webhook : webhook.url;
      const isEnabled = typeof webhook === 'string' ? true : webhook.enabled;
      
      if (!webhookUrl.trim() || !isEnabled) continue;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

        const webhookBody = this.generateWebhookBody(episodeData);
        
        // Prepare headers with optional custom headers
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add custom headers if configured
        if (this.settings.webhookHeaders) {
          try {
            const customHeaders = JSON.parse(this.settings.webhookHeaders);
            Object.assign(headers, customHeaders);
          } catch (error) {
            this.log('Error parsing custom headers:', error);
          }
        }
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        successCount++;
        this.log(`Webhook sent successfully to: ${this.maskUrl(webhookUrl)}`);
      } catch (error) {
        failureCount++;
        if (error.name === 'AbortError') {
          this.log(`Webhook timeout: ${this.maskUrl(webhookUrl)}`);
        } else {
          this.log(`Webhook error for ${this.maskUrl(webhookUrl)}:`, error.message);
        }
      }
    }

    // Show summary notification for webhooks
    if (successCount > 0 && failureCount === 0) {
      this.log(`All webhooks sent successfully (${successCount})`);
      return true;
    } else if (successCount > 0 && failureCount > 0) {
      this.showNotification(`Webhook送信: ${successCount}件成功、${failureCount}件失敗`, 'error');
      return true; // At least some succeeded
    } else if (failureCount > 0) {
      this.showNotification('すべてのWebhook送信が失敗しました', 'error');
      return false;
    }
    return false;
  }

  maskUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.hostname}${urlObj.pathname.substring(0, 10)}***`;
    } catch {
      return url.substring(0, 20) + '***';
    }
  }

  generateWebhookBody(episodeData) {
    const { animeTitle, episodeNumber, site } = episodeData;
    const timestamp = new Date().toISOString();
    
    // 変数の置換用オブジェクト
    const variables = {
      title: animeTitle,
      episode: episodeNumber,
      site: site,
      timestamp: timestamp
    };

    switch (this.settings.webhookFormat) {
      case 'slack':
        return {
          text: `${animeTitle} 第${episodeNumber}話を視聴しました`,
          username: 'danime-annict-2',
          icon_emoji: ':tv:',
          attachments: [
            {
              color: 'good',
              fields: [
                {
                  title: 'アニメタイトル',
                  value: animeTitle,
                  short: true
                },
                {
                  title: 'エピソード',
                  value: `第${episodeNumber}話`,
                  short: true
                },
                {
                  title: '視聴サイト',
                  value: site,
                  short: true
                }
              ],
              footer: 'danime-save-annict-2',
              ts: Math.floor(Date.now() / 1000)
            }
          ]
        };

      case 'discord':
        return {
          content: `🎬 **${animeTitle}** 第${episodeNumber}話を視聴しました`,
          embeds: [
            {
              title: animeTitle,
              description: `第${episodeNumber}話を視聴しました`,
              color: 0x667eea,
              fields: [
                {
                  name: '視聴サイト',
                  value: site,
                  inline: true
                },
                {
                  name: '視聴時刻',
                  value: new Date().toLocaleString('ja-JP'),
                  inline: true
                }
              ],
              footer: {
                text: 'danime-save-annict-2'
              },
              timestamp: timestamp
            }
          ]
        };

      case 'teams':
        return {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: '667eea',
          summary: `${animeTitle} 第${episodeNumber}話を視聴しました`,
          sections: [
            {
              activityTitle: '📺 アニメ視聴記録',
              activitySubtitle: 'danime-save-annict-2',
              facts: [
                {
                  name: 'アニメタイトル',
                  value: animeTitle
                },
                {
                  name: 'エピソード',
                  value: `第${episodeNumber}話`
                },
                {
                  name: '視聴サイト',
                  value: site
                },
                {
                  name: '視聴時刻',
                  value: new Date().toLocaleString('ja-JP')
                }
              ]
            }
          ]
        };

      case 'custom':
        if (this.settings.webhookTemplate) {
          try {
            // カスタムテンプレートの変数を置換
            let templateString = this.settings.webhookTemplate;
            Object.keys(variables).forEach(key => {
              const regex = new RegExp(`\\{${key}\\}`, 'g');
              templateString = templateString.replace(regex, variables[key]);
            });
            return JSON.parse(templateString);
          } catch (error) {
            this.log('Error parsing custom webhook template:', error);
            // フォールバックとしてシンプル形式を使用
            return { text: `${animeTitle} 第${episodeNumber}話を視聴しました (${site})` };
          }
        }
        // テンプレートが空の場合はシンプル形式にフォールバック
        return { text: `${animeTitle} 第${episodeNumber}話を視聴しました (${site})` };

      case 'simple':
      default:
        return {
          text: `${animeTitle} 第${episodeNumber}話を視聴しました (${site})`
        };
    }
  }

  showNotification(message, type = 'info') {
    // Create modern notification element
    const notification = document.createElement('div');
    notification.className = `danime-annict-notification danime-annict-${type}`;
    notification.textContent = message;
    
    // Add CSS if not already added
    if (!document.querySelector('#danime-annict-styles')) {
      const style = document.createElement('link');
      style.id = 'danime-annict-styles';
      style.rel = 'stylesheet';
      style.href = chrome.runtime.getURL('styles/notifications.css');
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  log(...args) {
    if (this.isDebug) {
      console.log('[DanimeAnnict]', ...args);
    }
  }
}

// Cleanup function
function cleanup() {
  if (window.danimeAnnictSender) {
    // Disconnect observer
    if (window.danimeAnnictSender.observer) {
      window.danimeAnnictSender.observer.disconnect();
      window.danimeAnnictSender.observer = null;
    }
    
    // Clear all scheduled timers
    if (window.danimeAnnictSender.sendTimers) {
      Object.values(window.danimeAnnictSender.sendTimers).forEach(timer => {
        clearTimeout(timer);
      });
      window.danimeAnnictSender.sendTimers = {};
    }
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.danimeAnnictSender = new DanimeAnnictSender();
  });
} else {
  window.danimeAnnictSender = new DanimeAnnictSender();
}