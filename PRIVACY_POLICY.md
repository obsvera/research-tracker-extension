# Privacy Policy for Research Paper Tracker Extension

**Last Updated**: November 14, 2024
**Effective Date**: November 14, 2024

## Overview

Research Paper Tracker is a browser extension that helps researchers capture and organize academic paper metadata from websites. This privacy policy explains what data the extension collects, how it's used, and how it's protected.

## Our Commitment to Privacy

**We do NOT collect, transmit, or sell any of your data.**

This extension is designed with privacy as a core principle. All data stays on your device and under your control.

## What Data is Collected

### Data Stored Locally on Your Device

The extension stores the following data **locally in your browser**:

1. **Paper Metadata** you capture:
   - Title, authors, publication year
   - Journal name, volume, issue, page numbers
   - Abstract, keywords, DOI
   - URL of the page where you captured the paper
   - Date and time when you saved the paper

2. **Extension Settings**:
   - Your Research Tracker web app URL (if you configure one)
   - Auto-open preference (whether to open tracker after capturing)

### How Data is Stored

- All data is stored using the browser's `storage.local` API
- Data remains on your device only
- Data is NOT synchronized across devices (unless you manually export/import)
- Data is NOT sent to any external servers
- We (the extension developers) cannot access your data

## What Data is NOT Collected

We explicitly DO NOT collect, store, or transmit:

- ❌ Personal identifiable information (PII)
- ❌ Browsing history
- ❌ Login credentials or passwords
- ❌ Credit card information
- ❌ Email addresses or contact information
- ❌ IP addresses
- ❌ Location data
- ❌ Cookies (beyond browser's built-in storage)
- ❌ Analytics or usage statistics
- ❌ Crash reports or error logs

## How Your Data is Used

### Used Locally By You

The data you capture is used exclusively by you for:

1. **Viewing** your saved papers in the extension popup
2. **Organizing** your research library
3. **Exporting** to your personal Research Paper Tracker web app
4. **Managing** your paper collection

### Not Used By Us

We do NOT use your data for:

- ❌ Advertising
- ❌ Analytics
- ❌ Product improvement
- ❌ Research
- ❌ Machine learning training
- ❌ Selling to third parties
- ❌ Any other purpose

## Data Sharing and Transmission

### No Third-Party Sharing

- We do NOT share your data with any third parties
- We do NOT sell your data
- We do NOT transmit your data to external servers
- We do NOT use tracking or analytics services

### Your Export is Your Control

When you click "Export JSON" or "Export CSV":

- Data is downloaded to a file on your device
- YOU choose where to save it
- YOU control what you do with it
- YOU decide if/when to import it to your tracker app

### Your Tracker App

If you configure a tracker app URL and use the auto-open feature:

- The extension opens your specified URL in a new tab
- No data is sent automatically to that URL
- YOU manually import your exported data
- The tracker app is hosted by YOU (typically on GitHub Pages)
- We have no access to or control over your tracker app

## Permissions Explained

The extension requests certain browser permissions. Here's why:

### Required Permissions

| Permission | Why We Need It | What It Does NOT Do |
|------------|----------------|---------------------|
| `activeTab` | Access the current tab to extract paper metadata when you click the extension icon | Does NOT monitor all tabs or browsing history |
| `storage` | Store your captured papers locally in your browser | Does NOT send data to external servers |
| `<all_urls>` (Firefox) / `host_permissions` (Chrome) | Access academic websites to extract paper metadata | Does NOT run automatically; only when you click the extension icon |
| `contextMenus` | Add "Save to Research Tracker" to right-click menu | Only adds a menu item |
| `downloads` | Allow you to export your papers as CSV files | Only downloads files you explicitly request |
| `clipboardWrite` | Copy JSON data to clipboard when you click "Copy JSON" | Only writes when you click the button |
| `notifications` (v3) | Show confirmation when a paper is saved | Only for user feedback |

### Why `<all_urls>`?

Academic papers are published on thousands of different websites worldwide (arxiv.org, pubmed.gov, nature.com, ieee.org, springer.com, and 10,000+ others). To work on all academic sites:

- We need permission to access any URL
- The extension ONLY activates when YOU click the icon or context menu
- It does NOT run automatically on pages you visit
- It does NOT monitor your browsing

### What We Do NOT Do With These Permissions

- We do NOT track which websites you visit
- We do NOT read sensitive information (passwords, credit cards, etc.)
- We do NOT modify web pages
- We do NOT inject ads
- We do NOT collect browsing history

## Data Security

### Local Storage Security

- Data is stored using browser's secure storage API
- Data is isolated per browser profile
- Data is protected by browser's security model

### No Server-Side Storage

- We do NOT have servers to store your data
- We cannot be hacked because we don't store data
- Your data cannot leak from our servers (we don't have any)

### No Network Transmission

- Extension code does NOT contain any `fetch()` or network requests
- No data is transmitted over the internet
- All processing happens locally in your browser

## Your Data Rights

You have complete control over your data:

### You Can:

- ✅ **View** all captured papers anytime in the extension popup
- ✅ **Export** your data as JSON or CSV files
- ✅ **Delete** individual papers
- ✅ **Clear** all papers at once
- ✅ **Uninstall** the extension (removes all data)

### How to Delete Your Data

**Delete Individual Papers:**
1. Click the extension icon
2. Click "Delete" next to any paper

**Delete All Papers:**
1. Click the extension icon
2. Click "Clear All" button
3. Confirm deletion

**Remove All Extension Data:**
1. Uninstall the extension from your browser
2. All data is automatically removed

## Children's Privacy

This extension is designed for academic researchers and is not intended for children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy from time to time. When we do:

- We'll update the "Last Updated" date at the top
- For significant changes, we'll update the extension version
- Continued use of the extension constitutes acceptance of changes

## Third-Party Services

### This Extension Does NOT Use:

- ❌ Google Analytics or any analytics service
- ❌ Advertising networks
- ❌ Social media trackers
- ❌ CDN for loading scripts
- ❌ Error reporting services
- ❌ A/B testing services
- ❌ Any third-party libraries that collect data

### Browser APIs Only

- We only use standard browser APIs (storage, tabs, downloads, etc.)
- All code runs locally in your browser
- No external dependencies

## Open Source

This extension is open source:

- Source code is publicly available on GitHub
- Anyone can audit our code
- Anyone can verify our privacy claims
- No obfuscated or hidden code

**Repository**: [GitHub - research-tracker-extension]

## Compliance

### GDPR Compliance

For users in the European Union:

- ✅ **Data Minimization**: We collect only what you explicitly save
- ✅ **Purpose Limitation**: Data used only for organizing papers
- ✅ **Storage Limitation**: You control data retention
- ✅ **Data Portability**: Export to JSON/CSV anytime
- ✅ **Right to Erasure**: Delete papers or uninstall anytime
- ✅ **Privacy by Design**: No data collection by default

### CCPA Compliance

For users in California:

- ✅ We do NOT sell your data
- ✅ We do NOT share your data
- ✅ We do NOT collect personal information for business purposes
- ✅ You have full control over your data

## Browser Store Requirements

This privacy policy complies with:

- ✅ Chrome Web Store Developer Program Policies
- ✅ Microsoft Edge Add-ons Policies
- ✅ Firefox Add-on Policies
- ✅ Opera Add-ons Policies

## Contact

### For Privacy Concerns

If you have questions about this privacy policy or how your data is handled:

**GitHub Issues**: [Create an issue]
**Email**: [Your contact email]

### Data Requests

Since we don't collect or store your data, we cannot:

- Provide you with data (you already have it locally)
- Delete your data (you control it)
- Port your data (use the export feature)

## Transparency

### What This Extension Does:

1. ✅ Extracts paper metadata from web pages when YOU click the icon
2. ✅ Stores metadata locally in YOUR browser
3. ✅ Lets YOU export data to files
4. ✅ Lets YOU manage your paper collection

### What This Extension Does NOT Do:

1. ❌ Track your browsing
2. ❌ Collect personal information
3. ❌ Send data to external servers
4. ❌ Display ads
5. ❌ Modify web pages
6. ❌ Use analytics or telemetry

## Summary

**In Plain English:**

- This extension helps you save paper information
- Everything stays on your device
- We can't see what you save
- No ads, no tracking, no data collection
- You're in complete control
- Open source and auditable

---

## Acknowledgment

By installing and using this extension, you acknowledge that you have read and understood this privacy policy.

**Questions?** Please reach out via GitHub issues.

---

**Privacy Policy Version**: 1.0
**Extension Version**: 1.0.0
**Policy Effective**: November 14, 2024
