// Service worker for OmniMind Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('OmniMind extension installed');
  
  // Create context menu
  chrome.contextMenus.create({
    id: 'extractTasks',
    title: 'Extract tasks with OmniMind',
    contexts: ['selection']
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'extractTasks') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractTasks',
      text: info.selectionText
    });
  }
});

// Handle notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
  // Handle notification click
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_TASKS') {
    processTaskExtraction(message.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});

async function processTaskExtraction(data) {
  // Send to backend API
  const response = await fetch('http://localhost:3000/api/v1/ai/extract-tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  return await response.json();
}