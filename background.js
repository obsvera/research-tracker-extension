// Background Script - Handles context menus and data storage

// Create context menu on install
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'save-paper',
    title: 'Save to Research Tracker',
    contexts: ['page', 'selection', 'link']
  });
  
  // Set default options
  browser.storage.local.get(['trackerUrl']).then(result => {
    if (!result.trackerUrl) {
      browser.storage.local.set({
        trackerUrl: 'https://yourusername.github.io/claude4-research-tracker',
        autoOpen: true
      });
    }
  });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-paper') {
    // Send message to content script to extract metadata
    browser.tabs.sendMessage(tab.id, { action: 'extractMetadata' })
      .then(response => {
        if (response && response.success) {
          savePaper(response.metadata);
        }
      })
      .catch(error => {
        console.error('Error extracting metadata:', error);
        browser.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Research Paper Tracker',
          message: 'Could not extract paper metadata from this page.'
        });
      });
  }
});

// Save paper to storage
function savePaper(metadata) {
  browser.storage.local.get(['savedPapers']).then(result => {
    const papers = result.savedPapers || [];
    
    // Add timestamp
    metadata.savedAt = new Date().toISOString();
    
    // Check for duplicates
    const isDuplicate = papers.some(paper => 
      paper.title === metadata.title || paper.url === metadata.url
    );
    
    if (isDuplicate) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Already Saved',
        message: 'This paper is already in your collection.'
      });
      return;
    }
    
    papers.push(metadata);
    
    browser.storage.local.set({ savedPapers: papers }).then(() => {
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'Paper Saved!',
        message: `"${metadata.title.substring(0, 50)}..." has been saved.`
      });
      
      // Auto-open tracker if enabled
      browser.storage.local.get(['autoOpen', 'trackerUrl']).then(result => {
        if (result.autoOpen && result.trackerUrl) {
          browser.tabs.create({ url: result.trackerUrl });
        }
      });
    });
  });
}

// Listen for messages from content scripts and popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'academicSiteDetected') {
    // Update icon to show we detected an academic site
    if (sender.tab) {
      browser.browserAction.setBadgeText({ text: '📄', tabId: sender.tab.id });
      browser.browserAction.setBadgeBackgroundColor({ color: '#4a90e2', tabId: sender.tab.id });
    }
  }
  
  if (request.action === 'getSavedPapers') {
    browser.storage.local.get(['savedPapers']).then(result => {
      sendResponse({ papers: result.savedPapers || [] });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'deletePaper') {
    browser.storage.local.get(['savedPapers']).then(result => {
      const papers = result.savedPapers || [];
      const filtered = papers.filter(paper => paper.savedAt !== request.savedAt);
      browser.storage.local.set({ savedPapers: filtered }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (request.action === 'clearAllPapers') {
    browser.storage.local.set({ savedPapers: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'exportPapers') {
    browser.storage.local.get(['savedPapers']).then(result => {
      const papers = result.savedPapers || [];
      sendResponse({ papers: papers });
    });
    return true;
  }
  
  if (request.action === 'downloadCSV') {
    // Handle CSV download from background script (has more permissions)
    const blob = new Blob([request.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    browser.downloads.download({
      url: url,
      filename: request.filename,
      saveAs: true
    }).then(() => {
      // Clean up the blob URL after download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Download error:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Keep channel open for async response
  }
});

// Badge update for number of saved papers
function updateBadge() {
  browser.storage.local.get(['savedPapers']).then(result => {
    const count = (result.savedPapers || []).length;
    if (count > 0) {
      browser.browserAction.setBadgeText({ text: count.toString() });
      browser.browserAction.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      browser.browserAction.setBadgeText({ text: '' });
    }
  });
}

// Update badge on startup and when storage changes
updateBadge();
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.savedPapers) {
    updateBadge();
  }
});