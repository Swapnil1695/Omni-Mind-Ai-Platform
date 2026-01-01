// OmniMind Chrome Extension - Content Script

console.log('OmniMind extension loaded');

class OmniMindGmailIntegration {
  constructor() {
    this.observer = null;
    this.apiBaseUrl = 'http://localhost:3000/api/v1';
    this.isProcessing = false;
    this.setup();
  }

  async setup() {
    await this.injectStyles();
    this.observeGmail();
    this.setupContextMenu();
    this.listenForMessages();
  }

  async injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .omnimind-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      
      .omnimind-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      .omnimind-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .omnimind-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      }
      
      .omnimind-modal {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .omnimind-task-list {
        margin-top: 16px;
      }
      
      .omnimind-task-item {
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .omnimind-priority-high {
        background-color: #fee2e2;
        color: #dc2626;
      }
      
      .omnimind-priority-medium {
        background-color: #fef3c7;
        color: #d97706;
      }
      
      .omnimind-priority-low {
        background-color: #d1fae5;
        color: #059669;
      }
    `;
    document.head.appendChild(style);
  }

  observeGmail() {
    if (window.location.href.includes('mail.google.com')) {
      this.observer = new MutationObserver(() => {
        this.injectGmailButtons();
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      
      // Initial injection
      setTimeout(() => this.injectGmailButtons(), 1000);
    }
  }

  injectGmailButtons() {
    // Find email compose button area
    const composeButton = document.querySelector('.T-I.T-I-KE.L3');
    if (composeButton && !document.querySelector('.omnimind-gmail-button')) {
      const omnimindButton = composeButton.cloneNode(true);
      omnimindButton.className = 'T-I T-I-KE L3 omnimind-gmail-button';
      omnimindButton.innerHTML = `
        <div class="T-I-J3 J-J5-Ji">
          <div class="T-I-J3-aj">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="CJ">OmniMind</span>
        </div>
      `;
      
      omnimindButton.onclick = (e) => {
        e.preventDefault();
        this.extractFromCurrentEmail();
      };
      
      composeButton.parentNode.insertBefore(omnimindButton, composeButton.nextSibling);
    }

    // Add button to individual emails
    const emailActions = document.querySelectorAll('[role="toolbar"]');
    emailActions.forEach(toolbar => {
      if (!toolbar.querySelector('.omnimind-extract-button')) {
        const extractButton = document.createElement('div');
        extractButton.className = 'omnimind-extract-button';
        extractButton.innerHTML = `
          <div class="T-I J-J5-Ji nX T-I-ax7 T-I-Js-Gs" role="button" style="user-select: none;">
            <div class="asa">
              <div class="akn">
                <div class="ajZ">
                  <div class="ajY">
                    <div class="ar7" aria-label="Extract Tasks" data-tooltip="Extract Tasks">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        extractButton.onclick = () => {
          const email = this.getCurrentEmailContent();
          if (email) {
            this.extractTasksFromText(email);
          }
        };
        
        toolbar.appendChild(extractButton);
      }
    });
  }

  getCurrentEmailContent() {
    // Try different selectors for Gmail's email content
    const selectors = [
      '.a3s.aiL',
      '.ii.gt',
      '.adn.ads',
      '[role="listitem"] .y2'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent;
      }
    }
    
    return null;
  }

  async extractFromCurrentEmail() {
    const emailContent = this.getCurrentEmailContent();
    if (!emailContent) {
      alert('No email content found');
      return;
    }
    
    await this.extractTasksFromText(emailContent);
  }

  async extractTasksFromText(text) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Get auth token from storage
      const token = await this.getAuthToken();
      
      if (!token) {
        this.showAuthPrompt();
        return;
      }
      
      // Show loading indicator
      this.showLoading();
      
      // Call backend API
      const response = await fetch(`${this.apiBaseUrl}/ai/extract-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text,
          context: 'email'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showTasksModal(data.tasks);
      } else {
        this.showError('Failed to extract tasks');
      }
    } catch (error) {
      console.error('Error extracting tasks:', error);
      this.showError('Error connecting to OmniMind');
    } finally {
      this.isProcessing = false;
      this.hideLoading();
    }
  }

  async getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['omnimind_token'], (result) => {
        resolve(result.omnimind_token);
      });
    });
  }

  showAuthPrompt() {
    const modal = document.createElement('div');
    modal.className = 'omnimind-overlay';
    modal.innerHTML = `
      <div class="omnimind-modal">
        <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">Authentication Required</h3>
        <p style="margin-bottom: 24px; color: #6b7280;">Please log in to OmniMind to use this feature.</p>
        <button onclick="window.open('http://localhost:3001/login', '_blank')" 
                class="omnimind-button" style="width: 100%; justify-content: center;">
          Open OmniMind
        </button>
        <button onclick="this.closest('.omnimind-overlay').remove()" 
                style="width: 100%; margin-top: 12px; padding: 8px 16px; background: none; border: 1px solid #d1d5db; border-radius: 8px;">
          Cancel
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  showLoading() {
    // Implementation for loading indicator
  }

  hideLoading() {
    // Implementation to hide loading indicator
  }

  showTasksModal(tasks) {
    const modal = document.createElement('div');
    modal.className = 'omnimind-overlay';
    
    const tasksHtml = tasks.map(task => `
      <div class="omnimind-task-item">
        <div>
          <strong>${task.title}</strong>
          <div style="margin-top: 4px; font-size: 14px; color: #6b7280;">
            ${task.description || ''}
          </div>
        </div>
        <span class="omnimind-priority-${task.priority}" style="padding: 4px 8px; border-radius: 12px; font-size: 12px;">
          ${task.priority}
        </span>
      </div>
    `).join('');
    
    modal.innerHTML = `
      <div class="omnimind-modal">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 600;">Extracted Tasks</h3>
          <button onclick="this.closest('.omnimind-overlay').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">
            ✕
          </button>
        </div>
        
        <div class="omnimind-task-list">
          ${tasksHtml}
        </div>
        
        <div style="margin-top: 24px; display: flex; gap: 12px;">
          <button onclick="this.closest('.omnimind-overlay').remove()" 
                  style="flex: 1; padding: 10px; background: none; border: 1px solid #d1d5db; border-radius: 8px;">
            Cancel
          </button>
          <button onclick="this.saveTasks()" 
                  class="omnimind-button" style="flex: 1; justify-content: center;">
            Save to OmniMind
          </button>
        </div>
      </div>
    `;
    
    // Attach save function
    modal.querySelector('.omnimind-button').onclick = () => this.saveTasks(tasks);
    
    document.body.appendChild(modal);
  }

  async saveTasks(tasks) {
    // Implementation to save tasks to backend
    console.log('Saving tasks:', tasks);
    // Close modal after saving
    const modal = document.querySelector('.omnimind-overlay');
    if (modal) modal.remove();
  }

  showError(message) {
    // Implementation for error display
  }

  setupContextMenu() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractTasks') {
        this.extractTasksFromText(request.text);
        sendResponse({ success: true });
      }
    });
  }

  listenForMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_EMAIL_CONTENT') {
        const content = this.getCurrentEmailContent();
        sendResponse({ content });
      }
      return true;
    });
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OmniMindGmailIntegration();
  });
} else {
  new OmniMindGmailIntegration();
}