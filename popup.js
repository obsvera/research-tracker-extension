// Popup Script - Handles user interactions in the popup

document.addEventListener('DOMContentLoaded', () => {
  loadPapers();
  
  // Capture current page button
  document.getElementById('captureBtn').addEventListener('click', async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      // Check if URL is a PDF by looking at the URL itself
      const url = tab.url;
      const isPdfUrl = url.toLowerCase().endsWith('.pdf') || 
                       url.includes('/pdf/') ||
                       url.includes('viewcontent.cgi') ||
                       url.includes('/download') && url.includes('type=pdf');
      
      if (isPdfUrl) {
        // It's a PDF - handle without content script
        showStatus('📄 PDF detected! Finding article page...', 'info');
        
        // Try to convert PDF URL to article URL
        const articleUrl = convertPdfUrlToArticle(url);
        
        if (articleUrl) {
          // We found the article URL! Fetch metadata from there
          showStatus('Found article page! Extracting metadata...', 'info');
          
          const metadata = await fetchMetadataFromUrl(articleUrl);
          
          if (metadata) {
            // Auto-generate keywords if missing
            if ((!metadata.keywords || metadata.keywords.trim() === '') && 
                metadata.title && 
                (metadata.abstract || metadata.title.length > 20)) {
              showStatus('🏷️ Generating keywords...', 'info');
              const keywords = await generateKeywords(metadata.title, metadata.abstract);
              if (keywords) {
                metadata.keywords = keywords;
              }
            }
            
            await savePaperMetadata(metadata);
            showStatus('Paper captured from PDF! ✓', 'success');
            loadPapers();
            return;
          }
        }
        
        // Pattern matching failed - extract basic info from URL
        showStatus('Extracting info from filename...', 'info');
        const basicMetadata = extractBasicFromPdfUrl(url);
        
        if (basicMetadata) {
          await savePaperMetadata(basicMetadata);
          showStatus('⚠️ Limited info captured from PDF. Edit details manually.', 'info');
          loadPapers();
          return;
        }
        
        showStatus('Could not extract metadata from PDF. Try opening the article page.', 'error');
        return;
      }
      
      // Not a PDF - regular extraction
      showStatus('Extracting metadata...', 'info');
      
      try {
        const response = await browser.tabs.sendMessage(tab.id, { action: 'extractMetadata' });
        
        if (response && response.success) {
          const metadata = response.metadata;
          
          // Check if we got at least a title
          if (!metadata.title || metadata.title === document.title) {
            showStatus('⚠️ Limited metadata found. Saved with page title.', 'info');
          }
          
          await savePaperMetadata(metadata);
          showStatus('Paper captured successfully! ✓', 'success');
          loadPapers();
        } else {
          showStatus('Could not extract metadata from this page', 'error');
        }
      } catch (contentScriptError) {
        // Content script not loaded - might be restricted page
        showStatus('Cannot capture from this page type', 'error');
      }
    } catch (error) {
      console.error('Capture error:', error);
      showStatus('Error: Unable to capture. Try reloading the page.', 'error');
    }
  });
  
  // Open tracker button
  document.getElementById('openTrackerBtn').addEventListener('click', async () => {
    const result = await browser.storage.local.get(['trackerUrl']);
    const url = result.trackerUrl || 'https://yourusername.github.io/claude4-research-tracker';
    browser.tabs.create({ url: url });
  });
  
  // Options button
  document.getElementById('optionsBtn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
  
  // Export JSON button
  document.getElementById('exportJsonBtn').addEventListener('click', async () => {
    const result = await browser.storage.local.get(['savedPapers']);
    const papers = result.savedPapers || [];
    
    if (papers.length === 0) {
      showStatus('No papers to export', 'error');
      return;
    }
    
    // Create JSON file
    const dataStr = JSON.stringify(papers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Download the file
    const url = URL.createObjectURL(dataBlob);
    const filename = `research-papers-${new Date().toISOString().split('T')[0]}.json`;
    
    await browser.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
    
    showStatus('JSON export started! Check your downloads.', 'success');
  });
  
  // Export CSV button
  document.getElementById('exportCsvBtn').addEventListener('click', async () => {
    const result = await browser.storage.local.get(['savedPapers']);
    const papers = result.savedPapers || [];
    
    if (papers.length === 0) {
      showStatus('No papers to export', 'error');
      return;
    }
    
    // CSV headers matching your tracker format
    const headers = ['Title', 'Authors', 'Year', 'Journal/Venue', 'Keywords', 'Status', 'Priority', 'Rating', 'Date Added', 'Key Points', 'Notes', 'Citation', 'DOI/URL', 'Chapter/Topic'];
    
    // Convert papers to CSV rows
    const csvRows = papers.map(paper => {
      return [
        `"${(paper.title || '').replace(/"/g, '""')}"`,
        `"${(paper.authors || '').replace(/"/g, '""')}"`,
        paper.year || '',
        `"${(paper.journal || '').replace(/"/g, '""')}"`,
        `"${(paper.keywords || '').replace(/"/g, '""')}"`,
        'to-read', // Default status
        'medium',  // Default priority
        '',        // Empty rating
        new Date(paper.savedAt).toISOString().split('T')[0], // Date added
        `"${(paper.abstract || '').replace(/"/g, '""')}"`, // Key points (using abstract)
        '',        // Empty notes
        '',        // Empty citation (will be auto-generated in tracker)
        `"${(paper.doi || paper.url || '').replace(/"/g, '""')}"`,
        ''         // Empty chapter
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    try {
      // Send to background script to handle download
      const response = await browser.runtime.sendMessage({
        action: 'downloadCSV',
        csvContent: csvContent,
        filename: `research-papers-${new Date().toISOString().split('T')[0]}.csv`
      });
      
      if (response && response.success) {
        showStatus('CSV export started! Import into your tracker.', 'success');
      } else {
        showStatus('Export failed. Try again.', 'error');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      showStatus('Export failed. Check console for details.', 'error');
    }
  });
  
  // Clear all button
  document.getElementById('clearBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all saved papers? This cannot be undone.')) {
      await browser.storage.local.set({ savedPapers: [] });
      showStatus('All papers cleared', 'success');
      loadPapers();
    }
  });
});

// Load and display papers
async function loadPapers() {
  const result = await browser.storage.local.get(['savedPapers']);
  const papers = result.savedPapers || [];
  
  // Update stats
  document.getElementById('paperCount').textContent = papers.length;
  
  const listContainer = document.getElementById('papersList');
  
  if (papers.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div>No papers saved yet</div>
        <div style="font-size: 12px; margin-top: 8px;">Visit any webpage and click "Capture This Page"</div>
      </div>
    `;
    return;
  }
  
  // Sort by most recent first
  papers.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  
  // Clear container
  listContainer.innerHTML = '';
  
  // Create paper items
  papers.forEach(paper => {
    const paperItem = document.createElement('div');
    paperItem.className = 'paper-item';
    
    const title = document.createElement('div');
    title.className = 'paper-title';
    title.textContent = paper.title || 'Untitled';
    
    const meta = document.createElement('div');
    meta.className = 'paper-meta';
    let metaText = paper.authors || 'Unknown authors';
    if (paper.year) metaText += ` • ${paper.year}`;
    if (paper.volume) metaText += ` • Vol. ${paper.volume}`;
    if (paper.issue) metaText += `(${paper.issue})`;
    if (paper.pages) metaText += ` • pp. ${paper.pages}`;
    meta.textContent = metaText;
    
    const actions = document.createElement('div');
    actions.className = 'paper-actions';
    
    const openBtn = document.createElement('button');
    openBtn.className = 'btn-secondary';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', () => openPaper(paper.url));
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-secondary';
    copyBtn.textContent = 'Copy JSON';
    copyBtn.addEventListener('click', () => copyJSON(paper.savedAt));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deletePaper(paper.savedAt));
    
    actions.appendChild(openBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);
    
    paperItem.appendChild(title);
    paperItem.appendChild(meta);
    paperItem.appendChild(actions);
    
    listContainer.appendChild(paperItem);
  });
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/'/g, '&#39;');
}

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Open paper URL
async function openPaper(url) {
  await browser.tabs.create({ url: url });
}

// Copy paper as JSON
async function copyJSON(savedAt) {
  const result = await browser.storage.local.get(['savedPapers']);
  const papers = result.savedPapers || [];
  const paper = papers.find(p => p.savedAt === savedAt);
  
  if (paper) {
    // Format for Research Tracker with all APA 7 fields
    const formatted = {
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      journal: paper.journal,
      volume: paper.volume,
      issue: paper.issue,
      pages: paper.pages,
      publisher: paper.publisher,
      publicationType: paper.publicationType,
      keywords: paper.keywords,
      abstract: paper.abstract,
      url: paper.doi || paper.url,
      relevance: ''
    };
    
    const jsonText = JSON.stringify(formatted, null, 2);
    
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(jsonText);
      showStatus('JSON copied! Paste into your tracker.', 'success');
    } catch (err) {
      // Fallback method using textarea
      const textarea = document.createElement('textarea');
      textarea.value = jsonText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        showStatus('JSON copied! Paste into your tracker.', 'success');
      } catch (e) {
        showStatus('Could not copy to clipboard', 'error');
      }
      
      document.body.removeChild(textarea);
    }
  }
}

// Delete paper
async function deletePaper(savedAt) {
  const result = await browser.storage.local.get(['savedPapers']);
  const papers = result.savedPapers || [];
  const filtered = papers.filter(p => p.savedAt !== savedAt);
  
  await browser.storage.local.set({ savedPapers: filtered });
  showStatus('Paper deleted', 'success');
  loadPapers();
}

// Fetch metadata from article URL (background scraping)
async function fetchMetadataFromUrl(url) {
  try {
    // Create a hidden tab to scrape the article page
    const tab = await browser.tabs.create({ url: url, active: false });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract metadata
    const response = await browser.tabs.sendMessage(tab.id, { action: 'extractMetadata' });
    
    // Close the tab
    await browser.tabs.remove(tab.id);
    
    if (response && response.success) {
      return response.metadata;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching metadata from URL:', error);
    return null;
  }
}

// Convert PDF URL to article page URL
function convertPdfUrlToArticle(pdfUrl) {
  // arXiv: /pdf/ID.pdf -> /abs/ID
  if (pdfUrl.includes('arxiv.org')) {
    return pdfUrl.replace('/pdf/', '/abs/').replace('.pdf', '');
  }
  
  // Nature: /articles/ID.pdf -> /articles/ID
  if (pdfUrl.includes('nature.com')) {
    return pdfUrl.replace('.pdf', '');
  }
  
  // Science: /doi/pdf/10.1126/ID -> /doi/full/10.1126/ID
  if (pdfUrl.includes('science.org')) {
    return pdfUrl.replace('/doi/pdf/', '/doi/full/');
  }
  
  // Springer: /content/pdf/ID.pdf -> /article/ID
  if (pdfUrl.includes('springer.com') || pdfUrl.includes('springerlink.com')) {
    return pdfUrl.replace('/content/pdf/', '/article/').replace('.pdf', '');
  }
  
  // Wiley: /doi/pdf/10.1002/ID -> /doi/full/10.1002/ID
  if (pdfUrl.includes('wiley.com')) {
    return pdfUrl.replace('/doi/pdf/', '/doi/full/');
  }
  
  // ScienceDirect: /science/article/pii/ID/pdfft -> /science/article/pii/ID
  if (pdfUrl.includes('sciencedirect.com')) {
    return pdfUrl.replace('/pdfft', '').replace('/pdf', '');
  }
  
  // IEEE: /stamp/stamp.jsp?tp=&arnumber=ID -> /document/ID
  if (pdfUrl.includes('ieee.org')) {
    const match = pdfUrl.match(/arnumber=(\d+)/);
    if (match) {
      return `https://ieeexplore.ieee.org/document/${match[1]}`;
    }
  }
  
  // ACM: /doi/pdf/10.1145/ID -> /doi/10.1145/ID
  if (pdfUrl.includes('acm.org')) {
    return pdfUrl.replace('/pdf/', '/');
  }
  
  // JSTOR: /stable/pdf/ID.pdf -> /stable/ID
  if (pdfUrl.includes('jstor.org')) {
    return pdfUrl.replace('/stable/pdf/', '/stable/').replace('.pdf', '');
  }
  
  // PubMed Central: /articles/PMC123456/pdf/file.pdf -> /articles/PMC123456
  if (pdfUrl.includes('ncbi.nlm.nih.gov/pmc')) {
    return pdfUrl.replace(/\/pdf\/.*$/, '');
  }
  
  // Digital Commons / bepress: viewcontent.cgi -> article page
  if (pdfUrl.includes('viewcontent.cgi')) {
    // Extract article and context parameters
    const articleMatch = pdfUrl.match(/article=(\d+)/);
    const contextMatch = pdfUrl.match(/context=([^&]+)/);
    
    if (articleMatch && contextMatch) {
      const baseUrl = pdfUrl.split('/cgi/')[0];
      return `${baseUrl}/${contextMatch[1]}/${articleMatch[1]}`;
    }
  }
  
  // Couldn't convert - return null
  return null;
}

// Extract basic info from PDF URL when pattern matching fails
function extractBasicFromPdfUrl(pdfUrl) {
  try {
    // Decode URL
    const decodedUrl = decodeURIComponent(pdfUrl);
    
    // Extract filename
    const urlParts = decodedUrl.split('/');
    const filename = urlParts[urlParts.length - 1].replace('.pdf', '');
    
    // Try to make a readable title from filename
    let title = filename
      .replace(/[-_]/g, ' ')
      .replace(/%20/g, ' ')
      .replace(/\d{4}/g, '') // Remove years that look isolated
      .replace(/\s+/g, ' ')
      .trim();
    
    // Capitalize first letter of each word for better readability
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (!title || title.length < 5) {
      title = 'PDF Document - ' + filename;
    }
    
    return {
      title: title,
      authors: '',
      year: '',
      journal: '',
      abstract: '',
      doi: pdfUrl,
      keywords: '',
      volume: '',
      issue: '',
      pages: '',
      publisher: '',
      publicationType: 'PDF',
      url: pdfUrl
    };
  } catch (error) {
    console.error('Basic extraction error:', error);
    return null;
  }
}

// Generate keywords from title and abstract
async function generateKeywords(title, abstract) {
  try {
    // Extract keywords using rule-based approach
    const text = `${title} ${abstract || ''}`.toLowerCase();
    
    // Common research keywords by domain
    const keywordPatterns = {
      // Research methods
      'qualitative': /\b(qualitative|interview|ethnograph|case study|thematic)\b/g,
      'quantitative': /\b(quantitative|statistical|regression|anova|correlation)\b/g,
      'mixed methods': /\b(mixed method|triangulation)\b/g,
      'experimental': /\b(experiment|rct|randomized|control group)\b/g,
      'survey': /\b(survey|questionnaire|likert)\b/g,
      'meta-analysis': /\b(meta-analysis|systematic review)\b/g,
      
      // Common research areas
      'machine learning': /\b(machine learning|deep learning|neural network|ai|artificial intelligence)\b/g,
      'social media': /\b(social media|facebook|twitter|instagram|tiktok)\b/g,
      'health': /\b(health|medical|clinical|patient|disease|treatment)\b/g,
      'education': /\b(education|learning|teaching|pedagogy|curriculum)\b/g,
      'psychology': /\b(psychology|behavior|cognitive|mental|emotion)\b/g,
      'gaming': /\b(game|gaming|gamer|mmo|mmorpg|esports|video game)\b/g,
      'social interaction': /\b(social|interaction|community|relationship|network)\b/g,
      'communication': /\b(communication|discourse|conversation|dialogue)\b/g,
      'technology': /\b(technology|digital|online|internet|computer)\b/g,
      'data science': /\b(data|analytics|big data|visualization)\b/g,
      'user experience': /\b(ux|user experience|usability|interface|hci)\b/g,
      'policy': /\b(policy|governance|regulation|law)\b/g,
      'economics': /\b(economic|market|financial|trade)\b/g,
      'climate': /\b(climate|environment|sustainability|carbon)\b/g,
      'pandemic': /\b(pandemic|covid|virus|epidemic)\b/g,
      
      // Research focus
      'theory': /\b(theory|theoretical|framework|model)\b/g,
      'empirical': /\b(empirical|data|evidence|findings)\b/g,
      'review': /\b(review|literature|survey)\b/g
    };
    
    const foundKeywords = [];
    
    // Find matching keywords
    for (const [keyword, pattern] of Object.entries(keywordPatterns)) {
      if (pattern.test(text)) {
        foundKeywords.push(keyword);
      }
    }
    
    // Extract potential keywords from title (capitalized words, excluding common words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);
    
    const titleWords = title.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Add important title words (that appear multiple times or are longer)
    const wordCounts = {};
    titleWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    titleWords.forEach(word => {
      if ((word.length > 8 || wordCounts[word] > 1) && foundKeywords.length < 10) {
        if (!foundKeywords.some(kw => kw.includes(word) || word.includes(kw))) {
          foundKeywords.push(word);
        }
      }
    });
    
    // Limit to 5-7 keywords
    const finalKeywords = foundKeywords.slice(0, 7);
    
    return finalKeywords.length > 0 ? finalKeywords.join(', ') : '';
    
  } catch (error) {
    console.error('Keyword generation error:', error);
    return '';
  }
}
async function savePaperMetadata(metadata) {
  // Debug: log what was captured
  console.log('Captured metadata:', metadata);
  
  // Warn if no authors found
  if (!metadata.authors || metadata.authors.trim() === '') {
    console.warn('No authors found on this page');
  }
  
  // Save to storage
  const result = await browser.storage.local.get(['savedPapers']);
  const papers = result.savedPapers || [];
  
  // Check for duplicates
  const isDuplicate = papers.some(paper => 
    paper.title === metadata.title || paper.url === metadata.url
  );
  
  if (isDuplicate) {
    showStatus('This paper is already saved!', 'error');
    throw new Error('Duplicate paper');
  }
  
  metadata.savedAt = new Date().toISOString();
  papers.push(metadata);
  
  await browser.storage.local.set({ savedPapers: papers });
}