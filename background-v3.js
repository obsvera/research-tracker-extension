// Background Service Worker (Manifest v3) - Handles context menus and data storage
// This version is compatible with Chrome, Edge, Opera, Brave, and other Chromium browsers

// Import polyfill for cross-browser compatibility
// Note: Service workers import scripts differently
importScripts('browser-polyfill.min.js');

// Schema version and migration
const CURRENT_SCHEMA_VERSION = '2.0.0';

// Check and run migration on extension install/update
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);

  // Run migration if needed
  if (details.reason === 'install' || details.reason === 'update') {
    await checkAndMigrate();
  }

  // Create context menu on install
  await createContextMenu();

  // Set default options
  await setDefaultOptions();
});

// Also check migration on startup
browser.runtime.onStartup.addListener(async () => {
  console.log('Extension starting up');
  await checkAndMigrate();
});

async function createContextMenu() {
  browser.contextMenus.create({
    id: 'save-paper',
    title: 'Save to Research Tracker',
    contexts: ['page', 'selection', 'link']
  });
}

async function setDefaultOptions() {
  const result = await browser.storage.local.get(['trackerUrl']);
  if (!result.trackerUrl) {
    await browser.storage.local.set({
      trackerUrl: 'https://yourusername.github.io/claude4-research-tracker',
      autoOpen: true
    });
  }
}

async function checkAndMigrate() {
  try {
    const result = await browser.storage.local.get(['savedPapers', 'schemaVersion']);
    const currentStorageVersion = result.schemaVersion || '1.0.0';
    const papers = result.savedPapers || [];

    // Check if migration is needed
    if (currentStorageVersion !== CURRENT_SCHEMA_VERSION || papers.length > 0) {
      const needsMigration = papers.some(paper => !paper._schemaVersion || paper._schemaVersion !== CURRENT_SCHEMA_VERSION);

      if (needsMigration) {
        console.log(`Migrating ${papers.length} papers from v${currentStorageVersion} to v${CURRENT_SCHEMA_VERSION}`);

        // Migrate papers
        const migratedPapers = papers.map(paper => migratePaper(paper));

        // Save migrated papers
        await browser.storage.local.set({
          savedPapers: migratedPapers,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          lastMigration: new Date().toISOString()
        });

        console.log(`Migration complete: ${migratedPapers.length} papers migrated to schema v${CURRENT_SCHEMA_VERSION}`);

        // Show notification
        browser.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'Extension Updated',
          message: `${migratedPapers.length} papers migrated to new format`
        });
      } else {
        // Update schema version even if no migration needed
        await browser.storage.local.set({ schemaVersion: CURRENT_SCHEMA_VERSION });
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Migration functions (inlined for service worker)
function migratePaper(paper) {
  if (paper._schemaVersion === CURRENT_SCHEMA_VERSION) {
    return paper;
  }

  const newPaper = {
    _schemaVersion: CURRENT_SCHEMA_VERSION,
    _lastModified: new Date().toISOString(),
    id: paper.id,
    title: paper.title || '',
    authors: normalizeAuthors(paper.authors),
    dateAdded: normalizeDate(paper.savedAt || paper.dateAdded),
    savedAt: normalizeDate(paper.savedAt || paper.dateAdded)
  };

  // Normalize DOI
  if (paper.doi) {
    newPaper.doi = normalizeDOI(paper.doi);
  }

  // Normalize year
  if (paper.year) {
    newPaper.year = String(paper.year);
  }

  // Normalize keywords
  if (paper.keywords) {
    newPaper.keywords = Array.isArray(paper.keywords) ? paper.keywords : paper.keywords.split(/[;,]\s*/);
  }

  // Copy other fields
  const fieldsToCopy = ['url', 'abstract', 'journal', 'volume', 'issue', 'pages',
    'publisher', 'issn', 'chapter', 'status', 'priority', 'rating', 'relevance',
    'keyPoints', 'notes', 'language', 'citation', 'pdf', 'pdfPath', 'pdfFilename',
    'hasPDF', 'pdfSource', 'tags', 'collections'];

  fieldsToCopy.forEach(field => {
    if (paper[field] !== undefined && paper[field] !== null) {
      newPaper[field] = paper[field];
    }
  });

  // Handle itemType
  if (paper.itemType) {
    newPaper.itemType = paper.itemType;
  } else if (paper.publicationType) {
    newPaper.itemType = inferItemType(paper.publicationType);
  } else {
    newPaper.itemType = 'article';
  }

  // Set defaults
  if (!newPaper.status) newPaper.status = 'to-read';
  if (!newPaper.priority) newPaper.priority = 'medium';
  if (!newPaper.language) newPaper.language = 'en';
  if (newPaper.hasPDF === undefined) newPaper.hasPDF = Boolean(newPaper.pdf);

  return newPaper;
}

function normalizeAuthors(authorsInput) {
  if (!authorsInput) return [];
  if (Array.isArray(authorsInput) && authorsInput.length > 0 && typeof authorsInput[0] === 'object') {
    return authorsInput;
  }
  if (typeof authorsInput === 'string') {
    const authorList = authorsInput.split(/;\s*|,\s*and\s+|\s+and\s+/i);
    return authorList.map(name => {
      const trimmed = name.trim();
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim());
        return { fullName: `${parts[1]} ${parts[0]}`, firstName: parts[1], lastName: parts[0] };
      }
      const words = trimmed.split(/\s+/);
      if (words.length === 2) {
        return { fullName: trimmed, firstName: words[0], lastName: words[1] };
      }
      return { fullName: trimmed };
    });
  }
  return [];
}

function normalizeDOI(doi) {
  if (!doi) return '';
  if (doi.startsWith('https://doi.org/')) return doi;
  doi = doi.replace(/^(doi:|DOI:)/i, '').trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  return `https://doi.org/${doi}`;
}

function normalizeDate(dateInput) {
  if (!dateInput) return new Date().toISOString();
  if (typeof dateInput === 'string' && dateInput.includes('T')) return dateInput;
  try {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date.toISOString();
  } catch (e) {}
  return new Date().toISOString();
}

function inferItemType(publicationType) {
  if (!publicationType) return 'article';
  const type = publicationType.toLowerCase();
  const typeMap = {
    'conference': 'inproceedings',
    'book': 'book',
    'chapter': 'inbook',
    'thesis': 'phdthesis',
    'report': 'techreport',
    'preprint': 'misc'
  };
  return typeMap[type] || 'article';
}

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
      // Manifest v3 uses action instead of browserAction
      browser.action.setBadgeText({ text: '📄', tabId: sender.tab.id });
      browser.action.setBadgeBackgroundColor({ color: '#4a90e2', tabId: sender.tab.id });
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
      // Manifest v3 uses action instead of browserAction
      browser.action.setBadgeText({ text: count.toString() });
      browser.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      browser.action.setBadgeText({ text: '' });
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
