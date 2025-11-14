// Data Migration System
// Handles migration of paper data from old schema versions to new versions

const CURRENT_SCHEMA_VERSION = '2.0.0';

/**
 * Parse author string into structured object
 * Examples:
 *   "John Doe" -> {fullName: "John Doe", firstName: "John", lastName: "Doe"}
 *   "Doe, John" -> {fullName: "John Doe", firstName: "John", lastName: "Doe"}
 *   "J. Doe" -> {fullName: "J. Doe", lastName: "Doe", firstName: "J."}
 */
function parseAuthorName(authorString) {
  if (!authorString || typeof authorString !== 'string') {
    return null;
  }

  const trimmed = authorString.trim();

  // Handle "Last, First" format
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim());
    return {
      fullName: `${parts[1]} ${parts[0]}`,
      firstName: parts[1],
      lastName: parts[0]
    };
  }

  // Handle "First Last" or "First Middle Last" format
  const words = trimmed.split(/\s+/);

  if (words.length === 1) {
    // Single name (probably last name or organization)
    return {
      fullName: trimmed,
      lastName: trimmed
    };
  } else if (words.length === 2) {
    // First Last
    return {
      fullName: trimmed,
      firstName: words[0],
      lastName: words[1]
    };
  } else {
    // First Middle... Last (take first and last word)
    return {
      fullName: trimmed,
      firstName: words[0],
      lastName: words[words.length - 1]
    };
  }
}

/**
 * Convert authors field to array of objects
 * Handles: string (semicolon-separated), array of strings, array of objects
 */
function normalizeAuthors(authorsInput) {
  if (!authorsInput) {
    return [];
  }

  // Already array of objects
  if (Array.isArray(authorsInput) && authorsInput.length > 0 && typeof authorsInput[0] === 'object') {
    // Validate each object has fullName
    return authorsInput.map(author => {
      if (!author.fullName && (author.firstName || author.lastName)) {
        author.fullName = `${author.firstName || ''} ${author.lastName || ''}`.trim();
      }
      return author;
    }).filter(a => a.fullName);
  }

  // Array of strings
  if (Array.isArray(authorsInput)) {
    return authorsInput
      .map(author => parseAuthorName(author))
      .filter(a => a !== null);
  }

  // String (semicolon or "and" separated)
  if (typeof authorsInput === 'string') {
    // Split by semicolon, comma+and, or just "and"
    const authorList = authorsInput.split(/;\s*|,\s*and\s+|\s+and\s+/i);
    return authorList
      .map(author => parseAuthorName(author))
      .filter(a => a !== null);
  }

  return [];
}

/**
 * Normalize DOI to full URL format
 */
function normalizeDOI(doi) {
  if (!doi) return '';

  // Already correct format
  if (doi.startsWith('https://doi.org/')) {
    return doi;
  }

  // Remove common prefixes
  doi = doi.replace(/^(doi:|DOI:)/i, '').trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');

  // Handle doi.org URLs without https
  if (doi.startsWith('doi.org/')) {
    doi = doi.replace(/^doi\.org\//, '');
  }

  // Add standard prefix
  return `https://doi.org/${doi}`;
}

/**
 * Normalize keywords to array of strings
 */
function normalizeKeywords(keywordsInput) {
  if (!keywordsInput) {
    return [];
  }

  // Already array
  if (Array.isArray(keywordsInput)) {
    return keywordsInput.filter(k => k && typeof k === 'string' && k.trim());
  }

  // String (semicolon or comma separated)
  if (typeof keywordsInput === 'string') {
    return keywordsInput
      .split(/[;,]\s*/)
      .map(k => k.trim())
      .filter(k => k);
  }

  return [];
}

/**
 * Normalize date to ISO 8601 format
 */
function normalizeDate(dateInput) {
  if (!dateInput) {
    return new Date().toISOString();
  }

  // Already ISO 8601
  if (typeof dateInput === 'string' && dateInput.includes('T')) {
    return dateInput;
  }

  // Try to parse and convert
  try {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    // Invalid date, return current
  }

  return new Date().toISOString();
}

/**
 * Migrate paper from v1.x.x to v2.0.0
 */
function migratePaperTo2_0_0(oldPaper) {
  const newPaper = {
    _schemaVersion: '2.0.0',
    _lastModified: new Date().toISOString()
  };

  // Copy basic fields
  newPaper.id = oldPaper.id;
  newPaper.title = oldPaper.title || '';

  // Normalize authors
  newPaper.authors = normalizeAuthors(oldPaper.authors);

  // Normalize DOI
  if (oldPaper.doi) {
    newPaper.doi = normalizeDOI(oldPaper.doi);
  }

  // Normalize dates
  newPaper.dateAdded = normalizeDate(oldPaper.savedAt || oldPaper.dateAdded);
  newPaper.savedAt = newPaper.dateAdded; // Keep for backward compatibility

  // Normalize year
  if (oldPaper.year) {
    newPaper.year = String(oldPaper.year);
  }

  // Normalize keywords
  newPaper.keywords = normalizeKeywords(oldPaper.keywords);

  // Copy other fields as-is
  const fieldsToKeep = [
    'url', 'abstract', 'journal', 'volume', 'issue', 'pages',
    'publisher', 'issn', 'isbn', 'chapter', 'status', 'priority',
    'rating', 'relevance', 'keyPoints', 'notes', 'language',
    'citation', 'pdf', 'pdfPath', 'pdfFilename', 'hasPDF', 'pdfSource',
    'tags', 'collections'
  ];

  fieldsToKeep.forEach(field => {
    if (oldPaper[field] !== undefined && oldPaper[field] !== null) {
      newPaper[field] = oldPaper[field];
    }
  });

  // Handle itemType (prefer over publicationType)
  if (oldPaper.itemType) {
    newPaper.itemType = oldPaper.itemType;
  } else if (oldPaper.publicationType) {
    // Map old publicationType to itemType
    newPaper.itemType = inferItemType(oldPaper.publicationType);
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

/**
 * Infer itemType from publicationType or other fields
 */
function inferItemType(publicationType) {
  if (!publicationType) return 'article';

  const type = publicationType.toLowerCase();

  const typeMap = {
    'conference': 'inproceedings',
    'conference paper': 'inproceedings',
    'book': 'book',
    'book chapter': 'inbook',
    'chapter': 'incollection',
    'thesis': 'phdthesis',
    'phd thesis': 'phdthesis',
    'dissertation': 'phdthesis',
    'masters thesis': 'mastersthesis',
    'report': 'techreport',
    'technical report': 'techreport',
    'preprint': 'misc',
    'working paper': 'misc',
    'journal': 'article',
    'journal article': 'article',
    'article': 'article'
  };

  return typeMap[type] || 'article';
}

/**
 * Detect schema version of a paper object
 */
function detectSchemaVersion(paper) {
  if (paper._schemaVersion) {
    return paper._schemaVersion;
  }

  // No schema version = v1.0.0 (legacy)
  return '1.0.0';
}

/**
 * Migrate a single paper to current schema version
 */
function migratePaper(paper) {
  const version = detectSchemaVersion(paper);

  // Already current version
  if (version === CURRENT_SCHEMA_VERSION) {
    return paper;
  }

  // Version 1.x.x to 2.0.0
  if (version.startsWith('1.')) {
    return migratePaperTo2_0_0(paper);
  }

  // Unknown version - try to migrate as v1
  console.warn(`Unknown schema version ${version}, attempting migration from v1`);
  return migratePaperTo2_0_0(paper);
}

/**
 * Migrate array of papers
 */
function migratePapers(papers) {
  if (!Array.isArray(papers)) {
    return [];
  }

  return papers.map((paper, index) => {
    try {
      return migratePaper(paper);
    } catch (error) {
      console.error(`Error migrating paper at index ${index}:`, error);
      // Return original paper if migration fails
      return paper;
    }
  });
}

/**
 * Check if migration is needed for storage
 */
async function checkMigrationNeeded() {
  try {
    const result = await browser.storage.local.get(['savedPapers', 'schemaVersion']);

    const currentStorageVersion = result.schemaVersion || '1.0.0';
    const papers = result.savedPapers || [];

    if (currentStorageVersion !== CURRENT_SCHEMA_VERSION) {
      return {
        needed: true,
        from: currentStorageVersion,
        to: CURRENT_SCHEMA_VERSION,
        paperCount: papers.length
      };
    }

    // Check if any papers need migration
    const needsMigration = papers.some(paper => {
      const version = detectSchemaVersion(paper);
      return version !== CURRENT_SCHEMA_VERSION;
    });

    return {
      needed: needsMigration,
      from: needsMigration ? 'mixed' : CURRENT_SCHEMA_VERSION,
      to: CURRENT_SCHEMA_VERSION,
      paperCount: papers.length
    };
  } catch (error) {
    console.error('Error checking migration:', error);
    return { needed: false, error };
  }
}

/**
 * Perform migration on stored papers
 */
async function migrateStoredPapers() {
  try {
    const result = await browser.storage.local.get(['savedPapers']);
    const oldPapers = result.savedPapers || [];

    console.log(`Migrating ${oldPapers.length} papers to schema v${CURRENT_SCHEMA_VERSION}`);

    const migratedPapers = migratePapers(oldPapers);

    // Save migrated papers
    await browser.storage.local.set({
      savedPapers: migratedPapers,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastMigration: new Date().toISOString()
    });

    console.log(`Migration complete: ${migratedPapers.length} papers migrated`);

    return {
      success: true,
      count: migratedPapers.length,
      version: CURRENT_SCHEMA_VERSION
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    migratePaper,
    migratePapers,
    migrateStoredPapers,
    checkMigrationNeeded,
    normalizeAuthors,
    normalizeDOI,
    normalizeKeywords,
    normalizeDate,
    parseAuthorName,
    detectSchemaVersion,
    CURRENT_SCHEMA_VERSION
  };
}
