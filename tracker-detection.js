// Tracker App Detection Module
// Detects if the Research Tracker web app is open in any tab

/**
 * Check if tracker app is open in any tab
 * @returns {Promise<Object>} - { isOpen: boolean, tabs: Array<Tab> }
 */
async function isTrackerAppOpen() {
  try {
    // Get tracker URL from settings
    const settings = await browser.storage.local.get(['trackerUrl']);
    const trackerUrl = settings.trackerUrl;

    if (!trackerUrl || trackerUrl === 'https://yourusername.github.io/claude4-research-tracker') {
      // Default URL not configured
      return { isOpen: false, tabs: [], configured: false };
    }

    // Parse tracker URL to match against open tabs
    const trackerDomain = new URL(trackerUrl).origin;

    // Query all tabs
    const allTabs = await browser.tabs.query({});

    // Find tabs that match tracker domain
    const trackerTabs = allTabs.filter(tab => {
      if (!tab.url) return false;
      try {
        const tabOrigin = new URL(tab.url).origin;
        return tabOrigin === trackerDomain;
      } catch {
        return false;
      }
    });

    return {
      isOpen: trackerTabs.length > 0,
      tabs: trackerTabs,
      configured: true,
      trackerUrl
    };
  } catch (error) {
    console.error('Error checking tracker app:', error);
    return { isOpen: false, tabs: [], error: error.message };
  }
}

/**
 * Get the active tracker tab (if any)
 */
async function getTrackerTab() {
  const result = await isTrackerAppOpen();
  if (result.isOpen && result.tabs.length > 0) {
    // Return the first tracker tab (or most recently active)
    return result.tabs[0];
  }
  return null;
}

/**
 * Focus on tracker tab if open, or open new tab
 */
async function openOrFocusTracker() {
  const result = await isTrackerAppOpen();

  if (result.isOpen && result.tabs.length > 0) {
    // Focus on existing tracker tab
    const tab = result.tabs[0];
    await browser.tabs.update(tab.id, { active: true });
    await browser.windows.update(tab.windowId, { focused: true });
    return { action: 'focused', tab };
  } else if (result.configured) {
    // Open new tracker tab
    const tab = await browser.tabs.create({ url: result.trackerUrl });
    return { action: 'opened', tab };
  } else {
    return { action: 'not_configured', error: 'Tracker URL not configured' };
  }
}

/**
 * Send message to tracker app (if open)
 * This could be used for real-time sync in the future
 * @param {Object} message - Message to send to tracker
 */
async function sendToTracker(message) {
  const tab = await getTrackerTab();

  if (!tab) {
    return { success: false, reason: 'Tracker app not open' };
  }

  try {
    // Send message to tracker tab's content script
    // Note: Tracker app would need to have a content script listening
    const response = await browser.tabs.sendMessage(tab.id, {
      type: 'FROM_EXTENSION',
      ...message
    });

    return { success: true, response, tabId: tab.id };
  } catch (error) {
    console.error('Error sending message to tracker:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify tracker app of new papers (if open)
 * This displays a badge or notification in the tracker app
 */
async function notifyTrackerOfNewPapers(paperCount) {
  const result = await isTrackerAppOpen();

  if (!result.isOpen) {
    return { notified: false, reason: 'Tracker not open' };
  }

  // Could send a message to tracker to show notification
  // For now, just return status
  return {
    notified: true,
    count: paperCount,
    tabs: result.tabs.length
  };
}

/**
 * Check if auto-sync is possible
 * Returns whether we can automatically sync data to tracker
 */
async function canAutoSync() {
  const result = await isTrackerAppOpen();

  return {
    possible: result.isOpen && result.configured,
    reason: !result.configured ? 'Tracker URL not configured' :
            !result.isOpen ? 'Tracker app not open' :
            'Ready for auto-sync',
    trackerUrl: result.trackerUrl,
    tabCount: result.tabs ? result.tabs.length : 0
  };
}

/**
 * Get tracker app status for display
 */
async function getTrackerStatus() {
  const result = await isTrackerAppOpen();

  if (!result.configured) {
    return {
      status: 'not_configured',
      message: 'Tracker URL not configured. Click Options to set it up.',
      icon: '⚙️'
    };
  }

  if (result.isOpen) {
    return {
      status: 'open',
      message: `Tracker is open in ${result.tabs.length} tab(s)`,
      icon: '🟢',
      tabs: result.tabs
    };
  }

  return {
    status: 'closed',
    message: 'Tracker app is not currently open',
    icon: '⚪',
    trackerUrl: result.trackerUrl
  };
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isTrackerAppOpen,
    getTrackerTab,
    openOrFocusTracker,
    sendToTracker,
    notifyTrackerOfNewPapers,
    canAutoSync,
    getTrackerStatus
  };
}
