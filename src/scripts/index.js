class DanimeAnnictSender {
  constructor() {
    this.isDebug = false;
    this.siteName = this.detectSite();
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
    
    if (!this.settings.annictToken) {
      this.log('Annict token not found');
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
        debugMode: false
      }, (result) => {
        this.isDebug = result.debugMode;
        resolve(result);
      });
    });
  }

  setupSiteSpecificObserver() {
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
    // Watch for video player and episode information
    const observer = new MutationObserver((mutations) => {
      this.checkDanimeEpisode();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    setTimeout(() => this.checkDanimeEpisode(), 2000);
  }

  setupAmazonObserver() {
    const observer = new MutationObserver((mutations) => {
      this.checkAmazonEpisode();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => this.checkAmazonEpisode(), 2000);
  }

  setupAbemaObserver() {
    const observer = new MutationObserver((mutations) => {
      this.checkAbemaEpisode();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => this.checkAbemaEpisode(), 2000);
  }

  async checkDanimeEpisode() {
    try {
      // Extract anime title and episode number from dAnime Store
      const titleElement = document.querySelector('.backInfoTxt1');
      const episodeElement = document.querySelector('.backInfoTxt2');
      
      if (!titleElement || !episodeElement) return;

      const animeTitle = titleElement.textContent.trim();
      const episodeText = episodeElement.textContent.trim();
      const episodeNumber = this.extractEpisodeNumber(episodeText);

      if (animeTitle && episodeNumber) {
        const episodeData = {
          animeTitle,
          episodeNumber,
          site: 'dアニメストア'
        };

        this.log('Found episode:', episodeData);
        await this.sendToAnnict(episodeData);
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
        await this.sendToAnnict(episodeData);
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
        await this.sendToAnnict(episodeData);
      }
    } catch (error) {
      this.log('Error checking Abema episode:', error);
    }
  }

  extractEpisodeNumber(text) {
    if (!text) return null;
    
    // Various patterns for episode number extraction
    const patterns = [
      /第?(\d+)話/,
      /第?(\d+)回/,
      /episode\s*(\d+)/i,
      /ep\.?\s*(\d+)/i,
      /#(\d+)/,
      /(\d+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
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

      // Search for anime on Annict
      const animeId = await this.searchAnimeOnAnnict(episodeData.animeTitle);
      if (!animeId) {
        this.showNotification('アニメが見つかりませんでした', 'error');
        return;
      }

      // Record episode
      const success = await this.recordEpisodeOnAnnict(animeId, episodeData.episodeNumber);
      
      if (success) {
        // Mark as sent
        await this.markAsSent(storageKey);
        
        this.showNotification(`${episodeData.animeTitle} 第${episodeData.episodeNumber}話をAnnictに記録しました`, 'success');
        
        // Send webhook if enabled
        if (this.settings.enableWebhook && this.settings.webhookUrls.length > 0) {
          await this.sendWebhooks(episodeData);
        }
      } else {
        this.showNotification('Annictへの記録に失敗しました', 'error');
      }
    } catch (error) {
      this.log('Error sending to Annict:', error);
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
      const response = await fetch(`https://api.annict.com/v1/works?access_token=${this.settings.annictToken}&filter_title=${encodeURIComponent(title)}&per_page=1`);
      const data = await response.json();
      
      if (data.works && data.works.length > 0) {
        return data.works[0].id;
      }
      
      return null;
    } catch (error) {
      this.log('Error searching anime:', error);
      return null;
    }
  }

  async recordEpisodeOnAnnict(animeId, episodeNumber) {
    try {
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
        })
      });

      return response.ok;
    } catch (error) {
      this.log('Error recording episode:', error);
      return false;
    }
  }

  async sendWebhooks(episodeData) {
    for (const webhookUrl of this.settings.webhookUrls) {
      if (!webhookUrl.trim()) continue;
      
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: `${episodeData.animeTitle} 第${episodeData.episodeNumber}話を視聴しました (${episodeData.site})`
          })
        });
      } catch (error) {
        this.log('Error sending webhook:', error);
      }
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DanimeAnnictSender();
  });
} else {
  new DanimeAnnictSender();
}