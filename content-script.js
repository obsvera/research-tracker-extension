// Content Script - Extracts paper metadata from academic websites

// Helper function to clean text
function cleanText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ').replace(/\n/g, ' ');
}

// Helper function to extract meta tag content
function getMeta(name) {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta ? cleanText(meta.getAttribute('content')) : '';
}

// Check if current page is a PDF
function isPDF() {
  return document.contentType === 'application/pdf' || 
         window.location.href.toLowerCase().endsWith('.pdf') ||
         document.querySelector('embed[type="application/pdf"]') !== null;
}

// Convert PDF URL to article page URL
function pdfUrlToArticleUrl(pdfUrl) {
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
  
  // Couldn't convert - return null
  return null;
}

// Extract paper metadata based on current site
function extractPaperMetadata() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  
  let metadata = {
    url: url,
    title: '',
    authors: '',
    year: '',
    journal: '',
    abstract: '',
    doi: '',
    keywords: '',
    volume: '',
    issue: '',
    pages: '',
    publisher: '',
    publicationType: ''
  };
  
  // arXiv
  if (hostname.includes('arxiv.org')) {
    metadata.title = cleanText(document.querySelector('.title')?.textContent.replace('Title:', ''));
    
    const authors = Array.from(document.querySelectorAll('.authors a'))
      .map(a => cleanText(a.textContent))
      .join(', ');
    metadata.authors = authors;
    
    const abstractDiv = document.querySelector('.abstract');
    if (abstractDiv) {
      metadata.abstract = cleanText(abstractDiv.textContent.replace('Abstract:', ''));
    }
    
    metadata.journal = 'arXiv preprint';
    
    // Extract arXiv ID and year
    const arxivMatch = url.match(/arxiv\.org\/abs\/(\d+)\.(\d+)/);
    if (arxivMatch) {
      const yearPrefix = arxivMatch[1].substring(0, 2);
      metadata.year = yearPrefix.startsWith('0') || yearPrefix.startsWith('1') ? `20${yearPrefix}` : `19${yearPrefix}`;
      metadata.doi = url;
    }
  }
  
  // PubMed
  else if (hostname.includes('ncbi.nlm.nih.gov')) {
    metadata.title = cleanText(document.querySelector('.heading-title')?.textContent);
    
    const authorsDiv = document.querySelector('.authors-list');
    if (authorsDiv) {
      const authors = Array.from(authorsDiv.querySelectorAll('.authors-list-item'))
        .map(a => cleanText(a.textContent))
        .join(', ');
      metadata.authors = authors;
    }
    
    const abstractDiv = document.querySelector('#abstract');
    if (abstractDiv) {
      metadata.abstract = cleanText(abstractDiv.textContent);
    }
    
    const journalCitation = document.querySelector('.journal-citation');
    if (journalCitation) {
      const citationText = cleanText(journalCitation.textContent);
      const yearMatch = citationText.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) metadata.year = yearMatch[0];
      
      const journalMatch = citationText.match(/^([^.]+)/);
      if (journalMatch) metadata.journal = cleanText(journalMatch[1]);
      
      // Extract volume, issue, pages
      const volumeMatch = citationText.match(/;\s*(\d+)\s*\(/);
      if (volumeMatch) metadata.volume = volumeMatch[1];
      
      const issueMatch = citationText.match(/\((\d+)\)/);
      if (issueMatch) metadata.issue = issueMatch[1];
      
      const pagesMatch = citationText.match(/:\s*(\d+)-(\d+)/);
      if (pagesMatch) metadata.pages = `${pagesMatch[1]}-${pagesMatch[2]}`;
    }
    
    const doiLink = document.querySelector('a[href*="doi.org"]');
    if (doiLink) {
      metadata.doi = doiLink.href;
    }
  }
  
  // Google Scholar
  else if (hostname.includes('scholar.google.com')) {
    metadata.title = cleanText(document.querySelector('#gs_ab_md .gs_rt')?.textContent);
    
    const authorsDiv = document.querySelector('.gs_a');
    if (authorsDiv) {
      const authorText = cleanText(authorsDiv.textContent);
      const parts = authorText.split('-');
      if (parts.length > 0) {
        metadata.authors = cleanText(parts[0]);
      }
      if (parts.length > 1) {
        const yearMatch = parts[1].match(/\b(19|20)\d{2}\b/);
        if (yearMatch) metadata.year = yearMatch[0];
      }
    }
    
    const snippet = document.querySelector('.gs_rs');
    if (snippet) {
      metadata.abstract = cleanText(snippet.textContent);
    }
  }
  
  // ResearchGate
  else if (hostname.includes('researchgate.net')) {
    // Title from header
    metadata.title = cleanText(document.querySelector('h1')?.textContent) || 
                     getMeta('citation_title');
    
    // Authors from profile links
    const authorLinks = document.querySelectorAll('a[itemprop="author"] div[itemprop="name"]');
    if (authorLinks.length > 0) {
      metadata.authors = Array.from(authorLinks)
        .map(el => cleanText(el.textContent))
        .join(', ');
    }
    
    // If no authors found, try researcher names
    if (!metadata.authors) {
      const researcherLinks = document.querySelectorAll('.nova-legacy-e-text--size-m a[href*="/profile/"]');
      if (researcherLinks.length > 0 && researcherLinks.length < 10) {
        const names = Array.from(researcherLinks)
          .map(el => cleanText(el.textContent))
          .filter(name => name.length > 2 && name.length < 50);
        
        // Remove duplicates
        metadata.authors = [...new Set(names)].join(', ');
      }
    }
    
    // Year, journal, etc from citation meta
    metadata.year = getMeta('citation_publication_date')?.substring(0, 4) || 
                    getMeta('citation_year');
    metadata.journal = getMeta('citation_journal_title');
    metadata.abstract = getMeta('citation_abstract') || getMeta('description');
    metadata.doi = getMeta('citation_doi');
    
    if (metadata.doi && !metadata.doi.startsWith('http')) {
      metadata.doi = `https://doi.org/${metadata.doi}`;
    }
  }
  
  // Try standard meta tags for any site (fallback)
  if (!metadata.title) {
    metadata.title = getMeta('citation_title') || 
                     getMeta('DC.title') || 
                     getMeta('og:title') ||
                     cleanText(document.querySelector('h1')?.textContent) ||
                     document.title;
  }
  
  if (!metadata.authors) {
    // Authors from citation meta tags
    const authorMetas = document.querySelectorAll('meta[name="citation_author"], meta[name="DC.creator"], meta[name="author"]');
    if (authorMetas.length > 0) {
      const rawAuthors = Array.from(authorMetas)
        .map(meta => cleanText(meta.getAttribute('content')))
        .filter(author => author && author.length > 0);
      
      console.log('Raw authors from meta tags:', rawAuthors);
      metadata.authors = rawAuthors.join(', ');
    }
    
    // Try other common author selectors if still no authors
    if (!metadata.authors) {
      const authorSelectors = [
        '.author-name',
        '.author',
        '[class*="author"]',
        '[itemprop="author"]',
        '[rel="author"]'
      ];
      
      for (const selector of authorSelectors) {
        const authorElements = document.querySelectorAll(selector);
        if (authorElements.length > 0) {
          // Get unique authors only
          const uniqueAuthors = new Set();
          
          Array.from(authorElements).forEach(el => {
            const authorText = cleanText(el.textContent);
            
            // Filter out non-author text
            if (authorText && 
                authorText.length > 2 && 
                authorText.length < 100 &&
                !authorText.toLowerCase().includes('author') &&
                !authorText.toLowerCase().includes('affiliation') &&
                !authorText.toLowerCase().includes('university') &&
                !authorText.toLowerCase().includes('department')) {
              uniqueAuthors.add(authorText);
            }
          });
          
          console.log('Authors from selector', selector, ':', Array.from(uniqueAuthors));
          
          if (uniqueAuthors.size > 0) {
            metadata.authors = Array.from(uniqueAuthors).join(', ');
            break;
          }
        }
      }
    }
    
    // Last resort: check byline meta tag
    if (!metadata.authors) {
      metadata.authors = getMeta('article:author') || getMeta('byl');
    }
    
    // Clean up author string
    if (metadata.authors) {
      console.log('Authors before cleaning:', metadata.authors);
      
      // Remove duplicate names (case-insensitive)
      const authorArray = metadata.authors.split(',').map(a => a.trim());
      const uniqueAuthors = [];
      const seenAuthors = new Set();
      
      authorArray.forEach(author => {
        const normalizedAuthor = author.toLowerCase();
        if (!seenAuthors.has(normalizedAuthor) && author.length > 0) {
          seenAuthors.add(normalizedAuthor);
          uniqueAuthors.push(author);
        }
      });
      
      metadata.authors = uniqueAuthors.join(', ');
      
      // Remove "Authors:" prefix if present
      metadata.authors = metadata.authors.replace(/^Authors?:\s*,?\s*/i, '');
      
      console.log('Authors after cleaning:', metadata.authors);
    } else {
      console.log('No authors found on page');
    }
  }
  
  if (!metadata.year) {
    metadata.year = getMeta('citation_publication_date')?.substring(0, 4) || 
                    getMeta('citation_year') || 
                    getMeta('DC.date')?.substring(0, 4) ||
                    getMeta('article:published_time')?.substring(0, 4);
  }
  
  if (!metadata.journal) {
    metadata.journal = getMeta('citation_journal_title') || 
                       getMeta('citation_conference_title') || 
                       getMeta('DC.publisher') ||
                       getMeta('og:site_name');
  }
  
  if (!metadata.abstract) {
    metadata.abstract = getMeta('citation_abstract') || 
                        getMeta('DC.description') ||
                        getMeta('description') ||
                        getMeta('og:description');
  }
  
  if (!metadata.doi) {
    metadata.doi = getMeta('citation_doi') || 
                   getMeta('DC.identifier');
    
    if (metadata.doi && !metadata.doi.startsWith('http')) {
      metadata.doi = `https://doi.org/${metadata.doi}`;
    }
    
    // If no DOI, try to find DOI link in page
    if (!metadata.doi) {
      const doiLink = document.querySelector('a[href*="doi.org"]');
      if (doiLink) {
        metadata.doi = doiLink.href;
      }
    }
    
    // If still no DOI, use current URL
    if (!metadata.doi) {
      metadata.doi = url;
    }
  }
  
  if (!metadata.keywords) {
    metadata.keywords = getMeta('citation_keywords') || 
                        getMeta('keywords') ||
                        getMeta('article:tag');
  }
  
  // Extract volume, issue, pages from meta tags
  if (!metadata.volume) {
    const volumeStr = getMeta('citation_volume');
    // Only use if it looks like a volume number (digits only or starts with digit)
    if (volumeStr && /^\d+/.test(volumeStr)) {
      metadata.volume = volumeStr;
    }
  }
  
  if (!metadata.issue) {
    metadata.issue = getMeta('citation_issue');
  }
  
  if (!metadata.pages) {
    const firstPage = getMeta('citation_firstpage');
    const lastPage = getMeta('citation_lastpage');
    if (firstPage && lastPage) {
      metadata.pages = `${firstPage}-${lastPage}`;
    } else if (firstPage) {
      metadata.pages = firstPage;
    }
  }
  
  // Extract publisher
  if (!metadata.publisher) {
    metadata.publisher = getMeta('citation_publisher') || 
                         getMeta('DC.publisher');
  }
  
  // Determine publication type
  if (!metadata.publicationType) {
    const type = getMeta('citation_publication_type') || 
                 getMeta('citation_article_type') ||
                 getMeta('DC.type');
    
    if (type) {
      metadata.publicationType = type;
    } else if (metadata.journal && metadata.journal.toLowerCase().includes('arxiv')) {
      metadata.publicationType = 'Preprint';
    } else if (getMeta('citation_conference_title')) {
      metadata.publicationType = 'Conference Paper';
    } else if (metadata.journal) {
      metadata.publicationType = 'Journal Article';
    }
  }
  
  return metadata;
}

// Listen for messages from popup/background
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractMetadata') {
    const metadata = extractPaperMetadata();
    sendResponse({ success: true, metadata: metadata });
  }
  
  if (request.action === 'checkIfPDF') {
    sendResponse({ isPDF: isPDF(), url: window.location.href });
  }
  
  if (request.action === 'convertPDFUrl') {
    const articleUrl = pdfUrlToArticleUrl(window.location.href);
    sendResponse({ articleUrl: articleUrl });
  }
  
  return true;
});

// Auto-detect if on academic site and show page action
function checkIfAcademicSite() {
  const hostname = window.location.hostname;
  const academicSites = [
    'arxiv.org', 'ncbi.nlm.nih.gov', 'scholar.google.com',
    'springer.com', 'nature.com', 'science.org', 'sciencedirect.com',
    'jstor.org', 'wiley.com', 'ieee.org', 'acm.org'
  ];
  
  return academicSites.some(site => hostname.includes(site));
}

// Notify background script if we're on an academic site
if (checkIfAcademicSite()) {
  browser.runtime.sendMessage({ action: 'academicSiteDetected' });
}