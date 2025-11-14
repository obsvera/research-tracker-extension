# Schema System Documentation

## Overview

The Research Paper Tracker extension uses a versioned data schema system to ensure data consistency, enable safe evolution of the data format over time, and provide validation for data integrity.

**Current Schema Version**: `2.0.0`

---

## Key Features

### 1. **Schema Versioning**
Every paper object includes a `_schemaVersion` field (semantic versioning: MAJOR.MINOR.PATCH)

### 2. **Automatic Migration**
Papers are automatically migrated to the latest schema version when the extension starts or updates

### 3. **Standardized Field Formats**
- **Authors**: Array of objects with `{fullName, firstName, lastName}`
- **DOI**: Always full URL format (`https://doi.org/10.xxxx/xxxxx`)
- **Dates**: ISO 8601 format (`2024-11-14T10:30:00.000Z`)
- **Keywords**: Array of strings
- **Year**: 4-digit string

### 4. **JSON Schema Validation**
Built-in validation ensures data integrity before export

### 5. **AI-Assisted Error Recovery**
When validation fails, the system generates an AI prompt users can paste into ChatGPT/Claude to fix their data

### 6. **Tracker App Detection**
Extension can detect if the Research Tracker web app is open for potential real-time sync

---

## Paper Object Schema (v2.0.0)

### Required Fields

```javascript
{
  "_schemaVersion": "2.0.0",       // Schema version
  "id": 1,                         // Unique identifier
  "title": "Paper Title",          // Title (required)
  "dateAdded": "2024-11-14T10:30:00.000Z"  // ISO 8601 timestamp
}
```

### Author Format

```javascript
{
  "authors": [
    {
      "fullName": "John Doe",      // Required
      "firstName": "John",         // Optional but recommended
      "lastName": "Doe",           // Optional but recommended
      "affiliation": "MIT",        // Optional
      "orcid": "https://orcid.org/0000-0001-2345-6789"  // Optional
    }
  ]
}
```

### Complete Field List

```javascript
{
  // System fields
  "_schemaVersion": "2.0.0",
  "_lastModified": "2024-11-14T10:30:00.000Z",

  // Required fields
  "id": 1,
  "title": "Research Paper Title",
  "dateAdded": "2024-11-14T10:30:00.000Z",

  // Bibliographic fields
  "authors": [{fullName, firstName, lastName, affiliation, orcid}],
  "year": "2024",
  "doi": "https://doi.org/10.1234/example",
  "url": "https://example.com/paper",
  "abstract": "Paper abstract...",
  "keywords": ["keyword1", "keyword2"],

  // Publication details
  "journal": "Nature",
  "volume": "123",
  "issue": "4",
  "pages": "45-67",
  "publisher": "Nature Publishing Group",
  "itemType": "article",  // article|inproceedings|book|inbook|phdthesis|etc.
  "issn": "1234-5678",
  "isbn": "978-1234567890",

  // Organization fields
  "chapter": "Introduction",  // Topic/category
  "status": "to-read",       // to-read|reading|read|archived
  "priority": "medium",      // low|medium|high
  "rating": 4,              // 0-5
  "relevance": "high",
  "tags": ["ml", "nlp"],
  "collections": ["PhD Research"],

  // User fields
  "keyPoints": "Key findings...",
  "notes": "Personal notes...",
  "citation": "Formatted citation",

  // PDF fields
  "pdf": "https://example.com/paper.pdf",
  "pdfPath": "/path/to/local/file.pdf",
  "pdfFilename": "paper.pdf",
  "hasPDF": true,
  "pdfSource": "publisher",

  // Metadata
  "language": "en",  // ISO 639-1 code
  "savedAt": "2024-11-14T10:30:00.000Z"  // Legacy field
}
```

---

## Migration System

### Automatic Migration

The extension automatically migrates papers when:
1. **Extension is installed** for the first time
2. **Extension is updated** to a new version
3. **Extension starts up** (checks on every browser startup)

### Migration Process

```
1. Detect current schema version in storage
2. Check if any papers need migration
3. For each paper:
   - Detect paper's schema version
   - Apply appropriate migration function
   - Normalize field formats
4. Save migrated papers
5. Update storage schema version
6. Show notification to user
```

### Field Normalization

#### Authors
**Before (v1.x.x)**:
```javascript
"authors": "John Doe; Jane Smith"
```

**After (v2.0.0)**:
```javascript
"authors": [
  {"fullName": "John Doe", "firstName": "John", "lastName": "Doe"},
  {"fullName": "Jane Smith", "firstName": "Jane", "lastName": "Smith"}
]
```

#### DOI
**Before**:
```javascript
"doi": "10.1234/example"
"doi": "doi:10.1234/example"
"doi": "http://dx.doi.org/10.1234/example"
```

**After**:
```javascript
"doi": "https://doi.org/10.1234/example"
```

#### Dates
**Before**:
```javascript
"savedAt": "2024-11-14"
"savedAt": "Nov 14, 2024"
```

**After**:
```javascript
"dateAdded": "2024-11-14T10:30:00.000Z"
"savedAt": "2024-11-14T10:30:00.000Z"
```

#### Keywords
**Before**:
```javascript
"keywords": "machine learning; neural networks; AI"
```

**After**:
```javascript
"keywords": ["machine learning", "neural networks", "AI"]
```

---

## Validation System

### Validation Levels

1. **Errors** (must fix): Required fields missing, invalid formats
2. **Warnings** (recommended): Missing recommended fields like abstract or keywords

### Using the Validator

```javascript
// In extension code
const validation = validateWithFeedback(paper);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);

  // Show AI prompt to user
  if (validation.aiPrompt) {
    showAIPromptDialog(validation.aiPrompt);
  }
}

if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}
```

### Validation Output

```javascript
{
  valid: false,
  errors: [
    {
      field: "doi",
      message: "DOI must be in full URL format (https://doi.org/...)",
      value: "10.1234/example",
      suggestion: "https://doi.org/10.1234/example",
      severity: "error"
    }
  ],
  warnings: [
    {
      field: "abstract",
      message: "Abstract is recommended",
      severity: "warning"
    }
  ],
  summary: {
    status: "error",
    message: "❌ Paper has 1 error(s) that should be fixed.",
    details: "doi: DOI must be in full URL format..."
  },
  aiPrompt: "I have a research paper metadata object that needs..."
}
```

### AI-Assisted Error Recovery

When validation fails, the system generates a prompt users can paste into ChatGPT, Claude, or any AI assistant:

```
I have a research paper metadata object that needs to be fixed to match the required schema. Please help me correct the following issues:

**Current Paper Data:**
```json
{
  "title": "Example Paper",
  "doi": "10.1234/example",
  ...
}
```

**Errors (must fix):**
1. Field "doi": DOI must be in full URL format (https://doi.org/...)
   Current value: "10.1234/example"
   Suggested fix: "https://doi.org/10.1234/example"

**Requirements:**
- _schemaVersion must be "2.0.0"
- authors must be an array of objects like [{"fullName": "John Doe", ...}]
- doi must be full URL format: "https://doi.org/10.xxxx/xxxxx"
- dateAdded must be ISO 8601 format: "2024-11-14T10:30:00.000Z"
...

Please return the corrected JSON object that passes all validation requirements.
```

---

## Tracker App Detection

The extension can detect if the Research Tracker web app is open in any browser tab.

### Usage

```javascript
// Check if tracker is open
const status = await getTrackerStatus();

if (status.status === 'open') {
  console.log(`Tracker is open in ${status.tabs.length} tab(s)`);
  // Could enable real-time sync here
}

// Open or focus tracker
const result = await openOrFocusTracker();
if (result.action === 'focused') {
  console.log('Focused existing tracker tab');
} else if (result.action === 'opened') {
  console.log('Opened new tracker tab');
}
```

### Future: Real-Time Sync

The tracker detection system enables future features:
- **Auto-sync**: Automatically push new papers to tracker when it's open
- **Bi-directional sync**: Sync changes from tracker back to extension
- **Live updates**: Show real-time paper count in both extension and tracker

---

## Files in Schema System

### Core Files

1. **schema.json** (180 lines)
   - JSON Schema definition for paper objects
   - Defines all fields, types, and constraints
   - Used for documentation and validation

2. **schema-validator.js** (250 lines)
   - Validates paper objects against schema
   - Generates user-friendly error messages
   - Creates AI prompts for error recovery
   - Used in: popup.js, export functions

3. **migration.js** (350 lines)
   - Migrates papers between schema versions
   - Normalizes field formats (authors, DOI, dates)
   - Detects schema versions
   - Used in: background.js, background-v3.js

4. **tracker-detection.js** (180 lines)
   - Detects if tracker app is open
   - Opens or focuses tracker tab
   - Enables future real-time sync
   - Used in: popup.js

### Integration Files

- **background.js**: Runs migration on startup/update
- **background-v3.js**: Same as background.js for Manifest v3
- **popup.html**: Loads all schema modules
- **popup.js**: Uses validation when saving/exporting papers

---

## Migration Examples

### Example 1: Simple Field Update

**Before (v1.0.0)**:
```javascript
{
  "title": "Example Paper",
  "authors": "John Doe",
  "doi": "10.1234/example",
  "savedAt": "2024-11-14"
}
```

**After (v2.0.0)**:
```javascript
{
  "_schemaVersion": "2.0.0",
  "_lastModified": "2024-11-14T15:30:00.000Z",
  "id": 1,
  "title": "Example Paper",
  "authors": [
    {"fullName": "John Doe"}
  ],
  "doi": "https://doi.org/10.1234/example",
  "dateAdded": "2024-11-14T00:00:00.000Z",
  "savedAt": "2024-11-14T00:00:00.000Z",
  "status": "to-read",
  "priority": "medium",
  "language": "en",
  "itemType": "article"
}
```

### Example 2: Complex Author Parsing

**Input**:
```javascript
"authors": "Doe, John; Smith, Jane A.; Brown, Robert"
```

**Output**:
```javascript
"authors": [
  {"fullName": "John Doe", "firstName": "John", "lastName": "Doe"},
  {"fullName": "Jane A. Smith", "firstName": "Jane A.", "lastName": "Smith"},
  {"fullName": "Robert Brown", "firstName": "Robert", "lastName": "Brown"}
]
```

---

## Best Practices

### For Extension Developers

1. **Always use schema version**: Include `_schemaVersion` in all new papers
2. **Validate before export**: Run validation before exporting to catch issues
3. **Normalize on capture**: Use normalization functions when capturing new papers
4. **Handle validation errors**: Show AI prompt to users for complex errors
5. **Test migrations**: Test with old data format before releasing updates

### For Extension Users

1. **Keep extension updated**: Ensures you have latest schema version
2. **Export regularly**: Export papers to tracker app frequently
3. **Review validation warnings**: Fix recommended fields for better data quality
4. **Use AI prompts**: If validation fails, paste AI prompt into ChatGPT to fix
5. **Don't manually edit storage**: Let the extension handle data format

### For Tracker App Developers

1. **Support schema versions**: Check `_schemaVersion` on import
2. **Handle both formats**: Support v1.x.x and v2.x.x during transition
3. **Validate on import**: Use same JSON Schema for validation
4. **Normalize on display**: Convert formats for display (e.g., authors array to string)
5. **Export in v2 format**: Always export in latest schema format

---

## Troubleshooting

### Papers not migrating

**Symptoms**: Papers still have old format after update

**Solution**:
1. Check browser console for migration errors
2. Manually trigger migration by reloading extension
3. Check storage: `browser.storage.local.get(['schemaVersion'])`
4. If needed, export papers and re-import

### Validation failing for valid data

**Symptoms**: Validation errors for seemingly correct data

**Solutions**:
1. Check DOI format (must start with `https://doi.org/`)
2. Check authors format (must be array of objects)
3. Check dates (must be ISO 8601 with time)
4. Use AI prompt to fix complex issues

### Tracker app not detected

**Symptoms**: Extension says tracker is not open when it is

**Solutions**:
1. Check tracker URL in options matches actual URL
2. Ensure tracker URL includes protocol (`https://`)
3. Reload tracker tab
4. Check browser console for errors

---

## Future Enhancements

### Planned for v2.1.0

- [ ] **Partial validation**: Validate only changed fields
- [ ] **Validation on capture**: Validate immediately when capturing
- [ ] **Better error UI**: Show validation errors in popup
- [ ] **Bulk re-validation**: Re-validate all stored papers
- [ ] **Schema evolution tools**: Tools to help add new fields

### Planned for v3.0.0

- [ ] **Real-time sync**: Auto-sync when tracker app is open
- [ ] **Conflict resolution**: Handle concurrent edits gracefully
- [ ] **Incremental migration**: Migrate papers on-demand vs all at once
- [ ] **Custom schemas**: Allow users to add custom fields
- [ ] **Schema registry**: Support multiple schema versions simultaneously

---

## API Reference

### Validation Functions

```javascript
// Validate a paper object
validatePaper(paper) → {valid, errors, warnings}

// Validate with user-friendly feedback
validateWithFeedback(paper) → {valid, errors, warnings, summary, aiPrompt}

// Generate AI prompt for errors
generateAIPrompt(paper, validationResult) → string

// Get validation summary
getValidationSummary(validationResult) → {status, message, details}
```

### Migration Functions

```javascript
// Migrate a single paper
migratePaper(paper) → migratedPaper

// Migrate array of papers
migratePapers(papers) → migratedPapers[]

// Check if migration needed
checkMigrationNeeded() → {needed, from, to, paperCount}

// Perform storage migration
migrateStoredPapers() → {success, count, version}

// Detect schema version
detectSchemaVersion(paper) → versionString
```

### Normalization Functions

```javascript
// Normalize authors to array of objects
normalizeAuthors(authorsInput) → authors[]

// Normalize DOI to full URL
normalizeDOI(doi) → "https://doi.org/..."

// Normalize date to ISO 8601
normalizeDate(dateInput) → "2024-11-14T10:30:00.000Z"

// Normalize keywords to array
normalizeKeywords(keywordsInput) → keywords[]

// Parse author name
parseAuthorName(authorString) → {fullName, firstName, lastName}
```

### Tracker Detection Functions

```javascript
// Check if tracker app is open
isTrackerAppOpen() → {isOpen, tabs, configured, trackerUrl}

// Get active tracker tab
getTrackerTab() → tab | null

// Open or focus tracker
openOrFocusTracker() → {action, tab}

// Send message to tracker
sendToTracker(message) → {success, response}

// Get tracker status
getTrackerStatus() → {status, message, icon, tabs}
```

---

## Schema Version History

### v2.0.0 (Current) - November 2024

**New Features**:
- Schema versioning system
- Automatic migration
- Standardized field formats (authors, DOI, dates)
- JSON Schema validation
- AI-assisted error recovery
- Tracker app detection

**Breaking Changes**:
- Authors now array of objects (was string)
- DOI now full URL (was bare identifier)
- Dates now ISO 8601 (was various formats)
- Keywords now array (was semicolon-separated string)

**Migration**: Automatic on extension update

### v1.0.0 (Legacy) - Pre-November 2024

**Format**:
- No `_schemaVersion` field
- Authors as string
- DOI as bare identifier
- Dates in various formats
- Keywords as string

**Status**: Automatically migrated to v2.0.0

---

## Contributing

When adding new fields or changing schema:

1. **Update schema.json**: Add field definition with type and constraints
2. **Update migration.js**: Add migration logic if field format changes
3. **Update schema-validator.js**: Add validation rules
4. **Update this documentation**: Document new field and migration
5. **Increment version**: Use semantic versioning
   - MAJOR: Breaking changes (require migration)
   - MINOR: New fields (backward compatible)
   - PATCH: Bug fixes (no schema changes)
6. **Test migration**: Test with old data format
7. **Update CHANGELOG**: Document changes

---

## Resources

- **JSON Schema Specification**: https://json-schema.org/
- **ISO 8601 Date Format**: https://en.wikipedia.org/wiki/ISO_8601
- **Semantic Versioning**: https://semver.org/
- **DOI System**: https://www.doi.org/
- **BibTeX Entry Types**: http://www.bibtex.org/Format/

---

**Schema Documentation Version**: 1.0
**Last Updated**: November 14, 2024
**Schema Version**: 2.0.0
