// Schema Validator Module
// Validates paper objects against JSON Schema and provides helpful error messages

const CURRENT_SCHEMA_VERSION = '2.0.0';

// Load schema (in real implementation, this would be imported)
// For browser extension context, we inline the critical parts
const PAPER_SCHEMA = {
  version: '2.0.0',
  required: ['_schemaVersion', 'id', 'title', 'dateAdded'],
  properties: {
    _schemaVersion: { type: 'string', pattern: /^\d+\.\d+\.\d+$/ },
    title: { type: 'string', minLength: 1 },
    authors: { type: 'array' },
    doi: { type: 'string', pattern: /^https:\/\/doi\.org\/10\.\d{4,}\/[^\s]+$/ },
    dateAdded: { type: 'string', format: 'date-time' },
    year: { type: 'string', pattern: /^\d{4}$/ },
    itemType: {
      type: 'string',
      enum: ['article', 'inproceedings', 'inbook', 'incollection', 'phdthesis', 'mastersthesis', 'techreport', 'misc', 'book', 'proceedings']
    },
    status: { type: 'string', enum: ['to-read', 'reading', 'read', 'archived'] },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    language: { type: 'string', pattern: /^[a-z]{2}$/ }
  }
};

/**
 * Validate a paper object against the schema
 * @param {Object} paper - Paper object to validate
 * @returns {Object} - { valid: boolean, errors: Array, warnings: Array }
 */
function validatePaper(paper) {
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!paper._schemaVersion) {
    errors.push({
      field: '_schemaVersion',
      message: 'Schema version is required',
      severity: 'error'
    });
  }

  if (!paper.id && paper.id !== 0) {
    errors.push({
      field: 'id',
      message: 'Paper ID is required',
      severity: 'error'
    });
  }

  if (!paper.title || paper.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Title is required and cannot be empty',
      severity: 'error'
    });
  }

  if (!paper.dateAdded) {
    errors.push({
      field: 'dateAdded',
      message: 'Date added is required',
      severity: 'error'
    });
  } else if (!isValidISO8601(paper.dateAdded)) {
    errors.push({
      field: 'dateAdded',
      message: 'Date added must be in ISO 8601 format',
      value: paper.dateAdded,
      severity: 'error'
    });
  }

  // Validate authors format
  if (paper.authors) {
    if (!Array.isArray(paper.authors)) {
      errors.push({
        field: 'authors',
        message: 'Authors must be an array of objects',
        value: paper.authors,
        severity: 'error'
      });
    } else {
      paper.authors.forEach((author, index) => {
        if (typeof author !== 'object') {
          errors.push({
            field: `authors[${index}]`,
            message: 'Each author must be an object with at least a fullName field',
            value: author,
            severity: 'error'
          });
        } else if (!author.fullName || author.fullName.trim() === '') {
          errors.push({
            field: `authors[${index}].fullName`,
            message: 'Author fullName is required',
            severity: 'error'
          });
        }
      });
    }
  } else {
    warnings.push({
      field: 'authors',
      message: 'Authors field is missing (recommended)',
      severity: 'warning'
    });
  }

  // Validate DOI format
  if (paper.doi) {
    if (!paper.doi.startsWith('https://doi.org/')) {
      errors.push({
        field: 'doi',
        message: 'DOI must be in full URL format (https://doi.org/...)',
        value: paper.doi,
        suggestion: normalizeDOI(paper.doi),
        severity: 'error'
      });
    } else if (!paper.doi.match(/^https:\/\/doi\.org\/10\.\d{4,}\/[^\s]+$/)) {
      warnings.push({
        field: 'doi',
        message: 'DOI format may be invalid',
        value: paper.doi,
        severity: 'warning'
      });
    }
  }

  // Validate year format
  if (paper.year && !paper.year.match(/^\d{4}$/)) {
    errors.push({
      field: 'year',
      message: 'Year must be in YYYY format',
      value: paper.year,
      severity: 'error'
    });
  }

  // Validate itemType
  if (paper.itemType && !PAPER_SCHEMA.properties.itemType.enum.includes(paper.itemType)) {
    errors.push({
      field: 'itemType',
      message: `Invalid itemType. Must be one of: ${PAPER_SCHEMA.properties.itemType.enum.join(', ')}`,
      value: paper.itemType,
      severity: 'error'
    });
  }

  // Validate status
  if (paper.status && !PAPER_SCHEMA.properties.status.enum.includes(paper.status)) {
    errors.push({
      field: 'status',
      message: `Invalid status. Must be one of: ${PAPER_SCHEMA.properties.status.enum.join(', ')}`,
      value: paper.status,
      severity: 'error'
    });
  }

  // Validate priority
  if (paper.priority && !PAPER_SCHEMA.properties.priority.enum.includes(paper.priority)) {
    errors.push({
      field: 'priority',
      message: `Invalid priority. Must be one of: ${PAPER_SCHEMA.properties.priority.enum.join(', ')}`,
      value: paper.priority,
      severity: 'error'
    });
  }

  // Validate language code
  if (paper.language && !paper.language.match(/^[a-z]{2}$/)) {
    warnings.push({
      field: 'language',
      message: 'Language should be a 2-letter ISO 639-1 code (e.g., "en", "fr")',
      value: paper.language,
      severity: 'warning'
    });
  }

  // Check for recommended fields
  if (!paper.year) {
    warnings.push({
      field: 'year',
      message: 'Publication year is recommended',
      severity: 'warning'
    });
  }

  if (!paper.abstract) {
    warnings.push({
      field: 'abstract',
      message: 'Abstract is recommended',
      severity: 'warning'
    });
  }

  if (!paper.keywords || (Array.isArray(paper.keywords) && paper.keywords.length === 0)) {
    warnings.push({
      field: 'keywords',
      message: 'Keywords are recommended for better organization',
      severity: 'warning'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}

/**
 * Check if a string is valid ISO 8601 date-time
 */
function isValidISO8601(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.includes('T');
}

/**
 * Normalize DOI to full URL format
 */
function normalizeDOI(doi) {
  if (!doi) return '';

  // Already in correct format
  if (doi.startsWith('https://doi.org/')) {
    return doi;
  }

  // Remove common prefixes
  doi = doi.replace(/^(doi:|DOI:)/i, '').trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');

  // Add standard prefix
  return `https://doi.org/${doi}`;
}

/**
 * Generate AI prompt for fixing validation errors
 * User can paste this into ChatGPT, Claude, or any AI assistant
 */
function generateAIPrompt(paper, validationResult) {
  const { errors, warnings } = validationResult;

  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  let prompt = `I have a research paper metadata object that needs to be fixed to match the required schema. Please help me correct the following issues:\n\n`;

  prompt += `**Current Paper Data:**\n\`\`\`json\n${JSON.stringify(paper, null, 2)}\n\`\`\`\n\n`;

  if (errors.length > 0) {
    prompt += `**Errors (must fix):**\n`;
    errors.forEach((error, i) => {
      prompt += `${i + 1}. Field "${error.field}": ${error.message}\n`;
      if (error.value !== undefined) {
        prompt += `   Current value: ${JSON.stringify(error.value)}\n`;
      }
      if (error.suggestion) {
        prompt += `   Suggested fix: ${JSON.stringify(error.suggestion)}\n`;
      }
    });
    prompt += `\n`;
  }

  if (warnings.length > 0) {
    prompt += `**Warnings (recommended to fix):**\n`;
    warnings.forEach((warning, i) => {
      prompt += `${i + 1}. Field "${warning.field}": ${warning.message}\n`;
      if (warning.value !== undefined) {
        prompt += `   Current value: ${JSON.stringify(warning.value)}\n`;
      }
    });
    prompt += `\n`;
  }

  prompt += `**Requirements:**\n`;
  prompt += `- _schemaVersion must be "${CURRENT_SCHEMA_VERSION}"\n`;
  prompt += `- authors must be an array of objects like [{"fullName": "John Doe", "firstName": "John", "lastName": "Doe"}]\n`;
  prompt += `- doi must be full URL format: "https://doi.org/10.xxxx/xxxxx"\n`;
  prompt += `- dateAdded must be ISO 8601 format: "2024-11-14T10:30:00.000Z"\n`;
  prompt += `- year must be 4-digit string: "2024"\n`;
  prompt += `- itemType must be one of: article, inproceedings, inbook, incollection, phdthesis, mastersthesis, techreport, misc, book, proceedings\n`;
  prompt += `- keywords should be an array of strings: ["machine learning", "neural networks"]\n\n`;

  prompt += `Please return the corrected JSON object that passes all validation requirements.`;

  return prompt;
}

/**
 * Generate user-friendly validation summary
 */
function getValidationSummary(validationResult) {
  const { valid, errors, warnings } = validationResult;

  if (valid && warnings.length === 0) {
    return {
      status: 'success',
      message: '✅ Paper data is valid and complete'
    };
  }

  if (valid && warnings.length > 0) {
    return {
      status: 'warning',
      message: `⚠️ Paper saved with ${warnings.length} warning(s). Data is valid but some recommended fields are missing.`,
      details: warnings.map(w => `${w.field}: ${w.message}`).join('\n')
    };
  }

  return {
    status: 'error',
    message: `❌ Paper has ${errors.length} error(s) that should be fixed.`,
    details: errors.map(e => `${e.field}: ${e.message}`).join('\n')
  };
}

/**
 * Validate and provide feedback
 * This is the main function to use in the extension
 */
function validateWithFeedback(paper) {
  const result = validatePaper(paper);
  const summary = getValidationSummary(result);

  return {
    ...result,
    summary,
    aiPrompt: generateAIPrompt(paper, result)
  };
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validatePaper,
    validateWithFeedback,
    generateAIPrompt,
    getValidationSummary,
    normalizeDOI,
    CURRENT_SCHEMA_VERSION
  };
}
