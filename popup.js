// OmniMind Popup JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Load user stats
  loadUserStats();
  
  // Button event listeners
  document.getElementById('newTaskBtn').addEventListener('click', createNewTask);
  document.getElementById('quickNoteBtn').addEventListener('click', createQuickNote);
  document.getElementById('extractBtn').addEventListener('click', extractFromCurrentPage);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  
  // Check authentication status
  checkAuthStatus();
});

async function loadUserStats() {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      // Show login prompt
      document.getElementById('taskCount').textContent = '--';
      return;
    }
    
    // Fetch today's task count
    const response = await fetch('http://localhost:3000/api/v1/tasks?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('taskCount').textContent = data.pagination?.total || 0;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['omnimind_token'], (result) => {
      resolve(result.omnimind_token);
    });
  });
}

async function checkAuthStatus() {
  const token = await getAuthToken();
  
  if (!token) {
    // Show auth warning
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.style.background = '#ef4444';
    }
  }
}

function createNewTask() {
  chrome.tabs.create({
    url: 'http://localhost:3001/tasks?action=new'
  });
}

function createQuickNote() {
  chrome.tabs.create({
    url: 'http://localhost:3001'
  });
}

async function extractFromCurrentPage() {
  // Get active tab
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    
    // Send message to content script
    chrome.tabs.sendMessage(activeTab.id, { 
      action: 'extractTasks' 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        // Content script might not be loaded
        alert('OmniMind extension is not active on this page. Try refreshing.');
      }
    });
  });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TASKS_EXTRACTED') {
    // Update UI with extracted task count
    const count = message.count || 0;
    alert(`Successfully extracted ${count} tasks!`);
  }
  
  if (message.type === 'AUTH_REQUIRED') {
    chrome.tabs.create({
      url: 'http://localhost:3001/login'
    });
  }
});