# Research Paper Tracker - User Workflow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Core Workflows](#core-workflows)
4. [Advanced Features](#advanced-features)
5. [Data Management](#data-management)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

The Research Paper Tracker system consists of two components:

1. **Browser Extension** (this project) - Captures paper metadata from academic websites
2. **Tracker Web App** - Manages and organizes your research paper library

**Data Flow**: Academic Website → Extension (Capture) → Local Storage → Export → Tracker App (Import)

---

## Initial Setup

### Step 1: Install the Extension

**Firefox**:
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select the `manifest.json` file from the extension directory
5. The extension icon will appear in your toolbar

**Chrome** (requires Manifest v3 version):
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension directory
5. The extension icon will appear in your toolbar

### Step 2: Configure the Extension

1. Click the extension icon in your toolbar
2. Click the **⚙️ Options** button in the popup
3. Enter your Tracker Web App URL:
   ```
   https://YOUR-GITHUB-USERNAME.github.io/claude4-research-tracker
   ```
4. (Optional) Enable "Automatically open tracker after saving a paper"
5. Click **💾 Save Settings**

### Step 3: Verify Setup

1. Navigate to a test paper on arXiv or PubMed
2. Click the extension icon
3. Click **📥 Capture This Page**
4. You should see a success message and the paper count should increase
5. Click **🚀 Open Tracker** to verify the tracker URL is correct

---

## Core Workflows

### Workflow 1: Capturing a Single Paper

**Use Case**: You're reading a paper and want to save it to your library

1. **Navigate** to the paper's page on any supported site:
   - arXiv, PubMed, Google Scholar, Nature, Science, Springer, ScienceDirect, JSTOR, Wiley, IEEE Xplore, ACM Digital Library

2. **Capture** the paper:
   - Click the extension icon in your toolbar
   - Click **📥 Capture This Page**
   - Wait for the success message

3. **Verify** the capture:
   - The popup shows the captured paper with extracted metadata
   - Review: title, authors, year, journal, abstract
   - Papers count increases in the extension badge

4. **Continue** browsing:
   - If auto-open is enabled, the tracker opens automatically
   - Otherwise, continue capturing more papers

**What Happens Behind the Scenes**:
```
1. Content script extracts metadata from the page
2. Extension checks for duplicates (URL matching)
3. If unique, paper is saved to browser.storage.local
4. Auto-generates keywords if missing
5. Applies default values (status: "to-read", priority: "medium")
6. Updates badge count
7. (Optional) Opens tracker app
```

---

### Workflow 2: Capturing Multiple Papers (Batch Capture)

**Use Case**: You're doing a literature review and want to capture many papers

1. **Research Session**:
   - Open multiple papers in separate tabs
   - Use Google Scholar, PubMed, or your preferred search engine

2. **Batch Capture**:
   - Go through each tab one by one
   - Click extension icon → **📥 Capture This Page**
   - Move to next tab (Ctrl+Tab or Cmd+Tab)

3. **Review Captured Papers**:
   - Click extension icon to see all captured papers
   - Papers are listed with title, authors, year, journal
   - Scroll through to verify captures

4. **Export to Tracker**:
   - See [Workflow 3](#workflow-3-exporting-to-tracker) below

**Tips for Efficiency**:
- Use keyboard shortcuts: Pin the extension and use Alt+Shift+P (configurable)
- Enable auto-open for immediate feedback
- Use the context menu: Right-click → "Save to Research Tracker"
- Capture first, review later - faster than reviewing each paper

---

### Workflow 3: Exporting to Tracker

**Use Case**: You've captured papers and want to import them into your tracker

#### Option A: JSON Export (Recommended)

1. **Export from Extension**:
   - Click extension icon
   - Click **📤 Export All Papers**
   - Choose **JSON** format
   - File downloads: `research-papers-export-YYYY-MM-DD.json`

2. **Import to Tracker**:
   - Open your Tracker Web App
   - Navigate to Import section
   - Click "Import JSON"
   - Select the downloaded file
   - Review preview
   - Click "Import Papers"

3. **Verify Import**:
   - Papers appear in your tracker library
   - Check that metadata is preserved
   - Review any papers with warnings

#### Option B: CSV Export (For Spreadsheet Users)

1. **Export from Extension**:
   - Click extension icon
   - Click **📤 Export All Papers**
   - Choose **CSV** format
   - File downloads: `research-papers-export-YYYY-MM-DD.csv`

2. **Review in Spreadsheet** (Optional):
   - Open in Excel, Google Sheets, or LibreOffice
   - Review and edit metadata
   - Add notes, priorities, ratings
   - Save as CSV

3. **Import to Tracker**:
   - Open your Tracker Web App
   - Navigate to Import section
   - Click "Import CSV"
   - Select the CSV file
   - Map columns if needed
   - Click "Import Papers"

**CSV Columns** (22 fields):
```
Item Type, Title, Authors, Year, Keywords, Journal/Venue, Volume,
Issue, Pages, DOI/URL, ISSN, Chapter/Topic, Abstract, Relevance,
Status, Priority, Rating, Date Added, Key Points, Notes, Language,
Citation, PDF
```

#### Option C: Single Paper Copy (For Quick Adds)

1. **Copy Paper JSON**:
   - Click extension icon
   - Find the paper you want to export
   - Click **📋 Copy JSON** next to the paper

2. **Paste to Tracker**:
   - Open your Tracker Web App
   - Navigate to "Add Paper" section
   - Paste JSON into the import field
   - Click "Add Paper"

**When to Use This**:
- Adding one or two papers quickly
- Testing import functionality
- Sharing a specific paper with a colleague

---

### Workflow 4: Managing Captured Papers

**Use Case**: Review, edit, or delete papers before exporting

1. **Review Captured Papers**:
   - Click extension icon
   - Papers listed in reverse chronological order (newest first)
   - Each paper shows: title, authors, year, journal

2. **Expand Paper Details**:
   - Click on a paper to expand full details
   - View: abstract, keywords, DOI, volume, issue, pages

3. **Delete Unwanted Papers**:
   - Click **🗑️ Delete** button next to a paper
   - Confirm deletion
   - Paper count updates

4. **Clear All Papers** (Use with Caution):
   - Click **🗑️ Clear All** button at bottom
   - Confirm action
   - All papers removed from local storage
   - Use this after successful export to tracker

**Best Practice**:
- Export to tracker before clearing all papers
- Use "Clear All" only after verifying import success

---

## Advanced Features

### Feature 1: PDF Detection & Handling

**Automatic PDF Page Detection**:

The extension detects when you're on a PDF page (not the article page) and automatically:

1. **Detects PDF URL patterns** for 10+ publishers:
   - Springer, Wiley, ScienceDirect, Nature, IEEE, ACM, JSTOR, SAGE, Taylor & Francis, Oxford

2. **Converts PDF URL to Article Page**:
   ```
   PDF: https://link.springer.com/content/pdf/10.1234/abc.pdf
   →
   Article: https://link.springer.com/article/10.1234/abc
   ```

3. **Scrapes Metadata from Article Page**:
   - Opens article page in hidden background tab
   - Extracts complete metadata
   - Returns enriched paper object

4. **Stores PDF Link**:
   - `pdf`: URL to PDF file
   - `hasPDF`: true
   - `pdfSource`: publisher name

**Fallback for Unsupported Sites**:
- If PDF URL conversion fails, uses filename for basic metadata
- Title extracted from filename
- Marks as `hasPDF: true` with original URL

**User Workflow**:
1. You're on a PDF page (opened from email, bookmark, etc.)
2. Click extension → Capture This Page
3. Extension automatically finds article page
4. Complete metadata extracted
5. PDF link preserved for future reference

---

### Feature 2: Keyword Auto-Generation

**When Keywords Are Missing**:

The extension automatically generates keywords using:

1. **Title Analysis**: Extract significant words
2. **Abstract Analysis**: Extract frequent terms
3. **Stop Word Removal**: Remove common words (the, and, of, etc.)
4. **Scoring Algorithm**: Rank words by frequency and significance
5. **Top 10 Keywords**: Select most relevant terms

**Algorithm**:
```javascript
1. Combine title (weighted 3x) + abstract
2. Split into words, lowercase, remove punctuation
3. Remove stop words (200+ common English words)
4. Count frequency, weight title words higher
5. Sort by score, take top 10
6. Join with semicolons
```

**Example**:
```
Title: "Machine Learning Approaches for Climate Change Prediction"
Abstract: "This study explores machine learning models..."

Generated Keywords:
"machine learning; climate change; prediction; models; neural networks;
 data analysis; temperature; algorithms; forecasting; environmental"
```

**Benefits**:
- Improves searchability in tracker
- Helps organize papers by topic
- Useful for papers without author-provided keywords

---

### Feature 3: Context Menu Integration

**Quick Capture from Anywhere**:

1. **Right-click** on any academic page
2. Select **"Save to Research Tracker"** from context menu
3. Paper captured without opening popup
4. Badge count increases
5. Notification appears (on supported browsers)

**When to Use**:
- Quickly capturing while reading
- Avoiding popup window
- Batch capturing many tabs

---

### Feature 4: Duplicate Prevention

**Automatic Duplicate Detection**:

The extension prevents duplicates by:

1. **URL Matching**: Checks if URL already exists
2. **Normalization**: Removes URL parameters and fragments
3. **Warning**: Shows message if duplicate detected
4. **Skip**: Does not save duplicate paper

**What Counts as a Duplicate**:
- Same URL (ignoring query parameters)
- Same DOI
- *(Future)* Fuzzy title matching

**User Experience**:
```
Scenario: You try to capture a paper already in your library

1. Click "Capture This Page"
2. Extension checks existing papers
3. Message: "⚠️ This paper is already in your library"
4. Paper not added again
5. Badge count unchanged
```

---

### Feature 5: Site-Specific Extraction

**Optimized Scrapers for Major Publishers**:

The extension has specialized extraction logic for:

#### arXiv
- Extract paper ID
- Parse author list
- Get abstract from specific div
- Extract categories as keywords

#### PubMed/NCBI
- Parse PubMed ID (PMID)
- Extract MeSH terms as keywords
- Get publication types
- Parse author affiliations

#### Google Scholar
- Extract citation count
- Get related articles
- Parse bibtex metadata
- Handle Google Scholar URLs

#### ScienceDirect (Recently Enhanced)
- Advanced author extraction
- Exclude "Related articles" authors
- Parse volume/issue/pages
- Extract DOI from multiple locations
- Get publisher information

#### And More...
- Nature, Science, Springer, Wiley, IEEE, ACM, JSTOR, ResearchGate

**Fallback for Other Sites**:
- Uses standard `<meta>` tags: `citation_*`, Dublin Core
- Extracts from HTML structure
- Less accurate but still functional

---

## Data Management

### Understanding the Data Structure

**What Gets Stored**:

Each captured paper contains:

```javascript
{
  // Basic Bibliographic Fields (from extraction)
  title: "Paper Title",
  authors: "John Doe; Jane Smith",
  year: "2024",
  journal: "Nature",
  abstract: "This paper describes...",
  doi: "https://doi.org/10.1234/abc",
  url: "https://nature.com/articles/abc",
  keywords: "machine learning; climate",
  volume: "123",
  issue: "4",
  pages: "45-67",
  publisher: "Nature Publishing Group",

  // Tracker-Specific Fields (defaults applied)
  itemType: "article",          // journal, conference, book, etc.
  status: "to-read",            // to-read, reading, read
  priority: "medium",           // low, medium, high
  rating: "",                   // 1-5 stars (set in tracker)
  relevance: "",                // very relevant, relevant, etc.
  chapter: "",                  // topic/chapter/category
  keyPoints: "",                // summary (fill in tracker)
  notes: "",                    // personal notes
  language: "en",               // paper language
  citation: "",                 // formatted citation

  // PDF Fields
  pdf: "https://example.com/paper.pdf",  // PDF URL
  pdfPath: "",                  // local file path
  pdfFilename: "paper.pdf",     // PDF filename
  hasPDF: true,                 // whether PDF is available
  pdfSource: "publisher",       // where PDF came from

  // System Fields
  savedAt: "2024-11-13T10:30:00.000Z",  // ISO timestamp
  dateAdded: "2024-11-13",              // YYYY-MM-DD
  id: 1                                 // unique ID
}
```

### Storage Location

**Browser Local Storage**:
- Data stored in `browser.storage.local`
- Key: `savedPapers`
- Value: Array of paper objects
- Persists until:
  - You manually clear extension data
  - You uninstall the extension
  - You click "Clear All" in popup

**Storage Limits**:
- **Firefox**: ~10MB per extension
- **Chrome**: ~10MB per extension
- **Approximate capacity**: 500-1000 papers depending on abstract length

**Checking Storage Usage**:
```javascript
// In browser console (extension popup)
browser.storage.local.get('savedPapers').then(data => {
  const size = JSON.stringify(data).length;
  console.log(`Storage used: ${(size / 1024 / 1024).toFixed(2)} MB`);
});
```

### Data Portability

**Export Formats**:

1. **JSON** - Full fidelity, all fields preserved
2. **CSV** - Spreadsheet compatible, 22 columns
3. **Individual JSON** - Single paper copy

**Future Formats** (see COMPATIBILITY_RECOMMENDATIONS.md):
- BibTeX for LaTeX users
- RIS for reference managers
- EndNote XML
- Markdown for notes apps

### Backup Strategy

**Recommended Backup Workflow**:

1. **Regular Exports**:
   - Export to JSON weekly or after major capture sessions
   - Save exports with dates: `papers-2024-11-13.json`
   - Store in cloud drive (Google Drive, Dropbox)

2. **Version Control** (Advanced):
   - Keep exports in Git repository
   - Track changes over time
   - Easy rollback if needed

3. **Redundancy**:
   - Export to tracker app (primary)
   - Keep JSON backup (secondary)
   - Keep CSV in spreadsheet (tertiary)

**Why Backup?**:
- Browser data can be lost (crashes, reinstalls)
- Extension updates may have bugs
- Accidental "Clear All" clicks
- Switching browsers

---

## Troubleshooting

### Problem: Metadata Not Extracted

**Symptoms**:
- Captured paper has only title or minimal data
- Missing authors, year, or abstract
- DOI not captured

**Causes & Solutions**:

1. **Unsupported Site**:
   - Check if site is in supported list (see options page)
   - Solution: Use fallback metadata or add site support

2. **Paywalled Content**:
   - Page shows paywall, not paper content
   - Solution: Access through institutional login first, then capture

3. **JavaScript-Heavy Site**:
   - Content loads after page load (dynamic rendering)
   - Solution: Wait for page to fully load before capturing

4. **PDF Page**:
   - You're on PDF viewer, not article page
   - Solution: Extension should auto-convert (if supported), or navigate to article page manually

**Workaround**: Edit metadata in tracker app after import

---

### Problem: Duplicate Papers Created

**Symptoms**:
- Same paper appears multiple times
- Captured from different URLs

**Causes**:
- Different URLs for same paper (PDF vs article page)
- DOI not detected
- URL parameters differ

**Prevention**:
- Check badge count before capturing
- Review captured papers before exporting

**Fix**:
- Delete duplicates in extension popup
- Or merge in tracker app after import

---

### Problem: Export/Import Fails

**Symptoms**:
- JSON file won't import to tracker
- CSV import shows errors
- Special characters corrupted

**Solutions**:

1. **Character Encoding**:
   - Ensure UTF-8 encoding
   - Excel may corrupt encoding - use Google Sheets or LibreOffice

2. **File Corruption**:
   - Try exporting again
   - Check file size is reasonable
   - Open in text editor to verify JSON is valid

3. **Version Mismatch**:
   - Update extension to latest version
   - Update tracker app to latest version
   - Check compatibility notes

4. **Browser Download Issues**:
   - Use "Save As" instead of auto-download
   - Try different browser
   - Check download folder permissions

---

### Problem: Extension Not Working

**Symptoms**:
- Icon grayed out or not clickable
- "Capture This Page" does nothing
- No metadata extracted

**Solutions**:

1. **Reload Extension**:
   - Firefox: `about:debugging` → Reload
   - Chrome: `chrome://extensions/` → Reload icon

2. **Check Permissions**:
   - Extension needs `activeTab`, `storage`, `<all_urls>`
   - May need to approve permissions

3. **Content Script Issues**:
   - Open browser console (F12)
   - Check for JavaScript errors
   - May conflict with other extensions

4. **Reinstall**:
   - Remove extension
   - Clear browser data (optional)
   - Reinstall extension
   - Note: This will clear captured papers unless exported first

---

### Problem: Papers Disappear

**Symptoms**:
- Captured papers not showing in popup
- Badge count is 0
- Previous exports still work

**Causes & Solutions**:

1. **Browser Data Cleared**:
   - Check browser history - was data cleared?
   - Solution: Import from previous export

2. **Storage Corruption**:
   - Browser storage may be corrupted
   - Solution: Clear extension storage and import backup

3. **Accidental "Clear All"**:
   - Did you or someone else click "Clear All"?
   - Solution: Import from previous export

**Prevention**: Always export before clicking "Clear All"

---

## Best Practices

### For Efficient Capturing

1. **Batch Your Work**:
   - Do focused research sessions
   - Capture 10-20 papers at once
   - Export at end of session

2. **Use Browser Tabs**:
   - Open all papers in tabs (Ctrl+Click)
   - Go through tabs capturing each
   - Use Tab key for navigation

3. **Enable Auto-Open** (Optional):
   - If you immediately import to tracker
   - Disable for batch capture sessions

4. **Check Before Capturing**:
   - Ensure page is fully loaded
   - Scroll to verify content is visible
   - Check you're on article page, not PDF

5. **Use Context Menu**:
   - Right-click → "Save to Research Tracker"
   - Faster than opening popup

---

### For Data Quality

1. **Capture from Official Sources**:
   - Prefer publisher sites over third-party aggregators
   - Better metadata quality
   - More complete information

2. **Review Captured Papers**:
   - Quickly scan captured papers before exporting
   - Delete obvious mistakes
   - Check for missing DOIs

3. **Fill In Metadata in Tracker**:
   - Extension provides basic metadata
   - Add notes, ratings, status in tracker app
   - Track reading progress

4. **Use Consistent Keywords**:
   - Review auto-generated keywords
   - Edit in tracker for consistency
   - Create keyword taxonomy

5. **Regular Maintenance**:
   - Export and clear extension regularly
   - Keep tracker as primary source of truth
   - Extension is capture tool, tracker is library

---

### For Organization

1. **Use Status Field**:
   - `to-read`: Papers to read later
   - `reading`: Currently reading
   - `read`: Finished papers

2. **Set Priorities**:
   - `high`: Must-read papers
   - `medium`: Should read eventually
   - `low`: Optional/background reading

3. **Add Notes in Tracker**:
   - Key findings
   - How paper relates to your research
   - Questions raised
   - Citations to add

4. **Tag with Keywords**:
   - Create consistent keyword taxonomy
   - Use for filtering and searching
   - Helpful for literature reviews

5. **Track PDF Locations**:
   - Extension captures PDF URLs
   - Download PDFs to organized folder
   - Update `pdfPath` in tracker

---

### For Collaboration

1. **Share Exports**:
   - Export subset of papers
   - Share JSON or CSV with colleagues
   - They can import to their tracker

2. **Standardize Workflows**:
   - Agree on keyword conventions
   - Use consistent status values
   - Share capture tips

3. **Version Control**:
   - Keep exports in shared Git repo
   - Track changes over time
   - Merge updates from multiple people

4. **Documentation**:
   - Document your research process
   - Note which databases searched
   - Track paper provenance

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESEARCH PAPER TRACKER WORKFLOW              │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │  Academic Websites   │
                    │  (arXiv, PubMed,    │
                    │   Scholar, etc.)     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   1. NAVIGATE TO     │
                    │   PAPER PAGE         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   2. CLICK EXTENSION │
                    │   ICON               │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   3. CAPTURE THIS    │
                    │   PAGE               │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Content Script      │
                    │  Extracts Metadata   │
                    │  • Title, Authors    │
                    │  • Year, Journal     │
                    │  • Abstract, DOI     │
                    │  • Keywords, etc.    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Validation &        │
                    │  Enhancement         │
                    │  • Duplicate check   │
                    │  • Generate keywords │
                    │  • Apply defaults    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  4. SAVE TO LOCAL    │
                    │  BROWSER STORAGE     │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                      │
            ▼                                      ▼
┌────────────────────────┐          ┌────────────────────────┐
│  Capture More Papers   │          │  5. REVIEW CAPTURED    │
│  (Repeat steps 1-4)    │          │  PAPERS IN POPUP       │
└────────────────────────┘          └───────────┬────────────┘
                                                 │
                                                 ▼
                                    ┌────────────────────────┐
                                    │  6. EXPORT ALL PAPERS  │
                                    │  • JSON (recommended)  │
                                    │  • CSV (spreadsheet)   │
                                    │  • Individual copy     │
                                    └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │  7. OPEN TRACKER APP   │
                                    │  (Web Application)     │
                                    └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │  8. IMPORT TO TRACKER  │
                                    │  • Select file         │
                                    │  • Preview papers      │
                                    │  • Confirm import      │
                                    └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │  9. MANAGE IN TRACKER  │
                                    │  • Add notes, ratings  │
                                    │  • Set status, priority│
                                    │  • Organize by topics  │
                                    │  • Track reading       │
                                    └────────────────────────┘

            ┌────────────────────────────────────────────┐
            │  Optional: Clear captured papers in        │
            │  extension after successful import         │
            └────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts (Future Enhancement)

Proposed shortcuts for improved efficiency:

- `Alt+Shift+C` - Capture current page
- `Alt+Shift+P` - Open extension popup
- `Alt+Shift+T` - Open tracker app
- `Alt+Shift+E` - Export all papers

*(Not yet implemented - see COMPATIBILITY_RECOMMENDATIONS.md)*

---

## Mobile Workflow (Future)

Currently, this extension is desktop-only. Mobile workflow would require:

1. Mobile browser extension support (limited)
2. Or bookmark-based capture (share to tracker)
3. Or mobile app version

See COMPATIBILITY_RECOMMENDATIONS.md for mobile compatibility plans.

---

## Integration with Other Tools

### Reference Managers

**Export to Zotero**:
1. Export papers as BibTeX (future feature)
2. Import BibTeX to Zotero
3. Or use Zotero connector directly

**Export to Mendeley**:
1. Export as RIS format (future feature)
2. Import RIS to Mendeley

**Export to EndNote**:
1. Export as EndNote XML (future feature)
2. Import to EndNote library

### Note-Taking Apps

**Export to Obsidian/Roam**:
1. Export as Markdown (future feature)
2. One note per paper
3. Include metadata frontmatter

**Export to Notion**:
1. Import CSV to Notion database
2. Use Notion's CSV import feature
3. Customize database properties

---

## Frequently Asked Questions

### Q: Can I sync papers across devices?
**A**: Not currently. Papers are stored locally per browser. Future versions may support `browser.storage.sync` (see COMPATIBILITY_RECOMMENDATIONS.md).

**Workaround**: Export JSON on device A, import to tracker, then the tracker serves as sync point.

---

### Q: What happens if I uninstall the extension?
**A**: All captured papers are deleted unless you've exported them first. Always export before uninstalling.

---

### Q: Can I edit metadata in the extension?
**A**: Not currently. Editing must be done in the tracker app after import. Future versions may add editing capability.

---

### Q: How many papers can I store?
**A**: Approximately 500-1000 papers depending on abstract length. Browser storage limit is ~10MB.

---

### Q: Can I capture papers from PDF files?
**A**: Yes, if the PDF URL matches a supported publisher pattern (Springer, Wiley, etc.). The extension converts the PDF URL to the article page URL and scrapes metadata. Otherwise, basic metadata is extracted from the filename.

---

### Q: Why are some fields empty after capture?
**A**: The page may not have that metadata, or the site isn't fully supported. You can:
1. Fill in missing fields in the tracker app
2. Try capturing from the official publisher site
3. Use DOI enrichment (future feature)

---

### Q: Is my data sent to any servers?
**A**: No. All data stays local in your browser until you explicitly export and import to your own tracker app. No telemetry or analytics.

---

### Q: Can I contribute improvements?
**A**: Yes! This is open source. See COMPATIBILITY_RECOMMENDATIONS.md for ideas, or propose your own improvements.

---

## Summary

**Typical User Journey**:

1. **Setup** (once): Install extension, configure tracker URL
2. **Research** (daily/weekly): Browse academic sites, capture papers
3. **Export** (per session): Export to JSON after research session
4. **Import** (per session): Import JSON to tracker app
5. **Manage** (ongoing): Organize, annotate, track in tracker app
6. **Clear** (per session): Clear captured papers from extension after successful import

**Key Principles**:

- Extension is a **capture tool**, not a library
- Tracker app is the **source of truth** for your research library
- Export frequently, clear regularly
- Backup your exports

**Next Steps**:

1. Read COMPATIBILITY_RECOMMENDATIONS.md for planned improvements
2. Try the extension on your favorite academic site
3. Set up a regular research + capture + export workflow
4. Provide feedback and suggestions

---

## Support & Community

- **Issues**: Report bugs or request features on GitHub
- **Documentation**: This file and COMPATIBILITY_RECOMMENDATIONS.md
- **Updates**: Check for new releases regularly

Happy researching! 📚
