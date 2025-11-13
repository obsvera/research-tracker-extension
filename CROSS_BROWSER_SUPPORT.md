# Cross-Browser Support Guide

## Overview

The Research Paper Tracker extension now supports **all major browsers**:

- 🦊 **Firefox** (Manifest v2)
- 🌐 **Chrome** (Manifest v3)
- 🔷 **Microsoft Edge** (Manifest v3)
- 🔴 **Opera** (Manifest v3)
- 🦁 **Brave** (Manifest v3)
- 🧭 **Safari** (Experimental - Manifest v3)

## Architecture

### Dual Manifest System

We maintain two manifest files to support different browser requirements:

1. **`manifest.json`** (Manifest v2) - For Firefox
2. **`manifest-v3.json`** (Manifest v3) - For Chromium-based browsers (Chrome, Edge, Opera, Brave)

### Dual Background Script System

Similarly, we have two background scripts:

1. **`background.js`** - For Firefox (Manifest v2 with persistent background page)
2. **`background-v3.js`** - For Chromium browsers (Manifest v3 service worker)

### Key Differences: Manifest v2 vs v3

| Feature | Manifest v2 (Firefox) | Manifest v3 (Chromium) |
|---------|----------------------|------------------------|
| Background | Persistent page with `background.scripts` | Service worker with `background.service_worker` |
| API Namespace | `browser.*` (Promise-based) | `chrome.*` (Callback-based) |
| Action API | `browser_action` | `action` |
| Permissions | Listed in `permissions` | Split between `permissions` and `host_permissions` |
| Web Resources | Array of patterns | Array of objects with `resources` and `matches` |
| Content Security | More permissive | Stricter (no remote code, no eval) |

## WebExtension Polyfill

### What is it?

The `browser-polyfill.min.js` provides cross-browser compatibility by:

1. **Firefox**: Does nothing (Firefox already has `browser` API)
2. **Chrome/Edge/Opera/Brave**: Wraps `chrome.*` callbacks as Promises and exposes as `browser.*`

### How it works

```javascript
// Without polyfill - Chrome (callback-based)
chrome.storage.local.get(['key'], (result) => {
  console.log(result.key);
});

// With polyfill - Works in all browsers (Promise-based)
const result = await browser.storage.local.get(['key']);
console.log(result.key);
```

### Integration

The polyfill is loaded before all other scripts:

- **Content Scripts**: Injected via manifest (`browser-polyfill.min.js` before `content-script.js`)
- **Popup/Options**: Loaded via `<script>` tag in HTML
- **Background (v3)**: Imported via `importScripts()` in service worker

## Browser-Specific Features

### Firefox

**Advantages:**
- Native `browser` API with Promises
- Manifest v2 allows persistent background pages
- More permissive content security policy
- Excellent developer tools

**Limitations:**
- Manifest v2 (Chrome is phasing it out)
- No service workers for background scripts (yet)

**Installation:**
1. Open `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `dist/firefox/manifest.json`

---

### Chrome

**Advantages:**
- Manifest v3 is the future standard
- Service workers are more efficient
- Largest user base

**Limitations:**
- Callback-based API (polyfill needed)
- Stricter security policies in v3

**Installation:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/chrome/` directory

**Publishing:**
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- One-time $5 registration fee
- Review takes 1-3 days

---

### Microsoft Edge

**Advantages:**
- Built on Chromium (same as Chrome)
- Seamless compatibility
- Growing user base
- Free developer account

**Limitations:**
- Same as Chrome (callback-based API, strict v3 policies)

**Installation:**
1. Open `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/edge/` directory

**Publishing:**
- [Microsoft Edge Add-ons Dashboard](https://partner.microsoft.com/dashboard/microsoftedge)
- Free registration
- Review takes 1-3 days
- Can import from Chrome Web Store

---

### Opera

**Advantages:**
- Built on Chromium
- Large European user base
- Same codebase as Chrome/Edge

**Limitations:**
- Same as Chrome
- Smaller market share than Chrome/Edge

**Installation:**
1. Open `opera://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select `dist/opera/` directory

**Publishing:**
- [Opera Add-ons Developer Portal](https://addons.opera.com/developer/)
- Free registration
- Can submit Chrome extensions directly
- Fast review (< 24 hours typically)

---

### Brave

**Advantages:**
- Built on Chromium
- Privacy-focused user base (perfect for academic users!)
- Same codebase as Chrome/Edge/Opera
- Can install from Chrome Web Store

**Limitations:**
- Same as Chrome
- No separate store (uses Chrome Web Store)

**Installation:**
1. Open `brave://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/brave/` directory

**Publishing:**
- No separate store required
- Publish to Chrome Web Store
- Brave users can install from there

---

### Safari (Experimental)

**Advantages:**
- Native macOS/iOS integration
- Growing support for WebExtensions

**Limitations:**
- Requires Xcode to convert extension
- Different signing/notarization process
- Manifest v3 support is still evolving
- More restrictive than other browsers

**Installation:**
1. Convert using `xcrun safari-web-extension-converter`
2. Build in Xcode
3. Sign with Apple Developer certificate
4. Install via Xcode

**Publishing:**
- Requires Apple Developer account ($99/year)
- Submit via App Store Connect
- Review takes 1-7 days

---

## Building for Browsers

### Prerequisites

- Node.js 14+ installed
- Git (for version control)

### Build Commands

```bash
# Build for a specific browser
npm run build:firefox
npm run build:chrome
npm run build:edge
npm run build:opera
npm run build:brave

# Build for all browsers
npm run build:all

# Clean build directory
npm run clean
```

### Build Output

```
dist/
├── firefox/          # Firefox (Manifest v2)
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── content-script.js
│   ├── browser-polyfill.min.js
│   └── icons/
├── chrome/           # Chrome (Manifest v3)
│   └── [same structure]
├── edge/             # Edge (Manifest v3)
│   └── [same structure]
├── opera/            # Opera (Manifest v3)
│   └── [same structure]
└── brave/            # Brave (Manifest v3)
    └── [same structure]
```

### Manual Build (without npm)

```bash
# For Firefox
node build.js firefox

# For Chrome
node build.js chrome

# For all browsers
node build.js all
```

## Testing Across Browsers

### Automated Testing Strategy

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test browser APIs
3. **End-to-End Tests**: Test full workflows

### Manual Testing Checklist

For each browser, verify:

- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Popup opens correctly
- [ ] Capture button works
- [ ] Metadata extraction works on test sites:
  - arXiv
  - PubMed
  - Google Scholar
  - ScienceDirect
- [ ] Papers saved to storage
- [ ] Badge count updates
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] Options page saves settings
- [ ] Context menu appears
- [ ] Context menu saves papers
- [ ] Auto-open tracker works
- [ ] Duplicate detection works
- [ ] PDF detection and conversion works

### Browser-Specific Issues

#### Chrome/Edge/Opera/Brave

**Issue**: `browser is not defined`
- **Cause**: Polyfill not loaded
- **Fix**: Ensure `browser-polyfill.min.js` is loaded first

**Issue**: Service worker stops after 30 seconds
- **Cause**: Manifest v3 limitation
- **Fix**: Use persistent storage, minimize background logic

**Issue**: Content script injection fails
- **Cause**: `host_permissions` not granted
- **Fix**: Ensure permissions are declared in manifest v3

#### Firefox

**Issue**: `chrome is not defined`
- **Cause**: Using `chrome` instead of `browser`
- **Fix**: Use polyfill or always use `browser` API

**Issue**: Temporary add-on expires
- **Cause**: Firefox removes temporary add-ons on restart
- **Fix**: Sign extension for permanent installation

## API Compatibility Matrix

| API | Firefox v2 | Chrome v3 | Notes |
|-----|-----------|-----------|-------|
| `storage.local` | ✅ | ✅ | Works with polyfill |
| `storage.sync` | ✅ | ✅ | Works with polyfill |
| `tabs.query` | ✅ | ✅ | Works with polyfill |
| `tabs.sendMessage` | ✅ | ✅ | Works with polyfill |
| `contextMenus` | ✅ | ✅ | Works with polyfill |
| `downloads` | ✅ | ✅ | Works with polyfill |
| `notifications` | ✅ | ✅ | Works with polyfill |
| `browserAction` | ✅ | ⚠️ | Use `action` in v3, polyfill handles it |
| `action` | ⚠️ | ✅ | v3 only, polyfill provides fallback |
| `scripting` | ❌ | ✅ | v3 only, not needed for this extension |

Legend:
- ✅ Fully supported
- ⚠️ Supported with polyfill or workaround
- ❌ Not supported

## Development Workflow

### Recommended Setup

1. **Primary Development**: Firefox (easier debugging, faster iteration)
2. **Regular Testing**: Chrome (largest user base)
3. **Pre-Release Testing**: All browsers

### Debugging

#### Firefox
- Open `about:debugging`
- Click "Inspect" on your extension
- Use Firefox DevTools (best in class)

#### Chrome/Edge/Opera/Brave
- Right-click extension icon → "Inspect popup"
- Go to `chrome://extensions/` → "background page" (if available)
- Use Chrome DevTools

#### Console Logging

```javascript
// Use browser API for compatibility
console.log('From extension:', browser.runtime.id);

// Background service worker logs
// Chrome: chrome://extensions/ → "service worker" → "inspect"
// Firefox: about:debugging → "Inspect" → Console
```

## Publishing Checklist

Before publishing to each store:

### All Browsers
- [ ] Test thoroughly on target browser
- [ ] Update version in both manifests
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Take screenshots (1280x800 recommended)
- [ ] Prepare promotional images (if required)
- [ ] Write compelling description
- [ ] Tag with relevant keywords

### Chrome Web Store
- [ ] Build with `npm run build:chrome`
- [ ] Zip the `dist/chrome/` directory
- [ ] Upload to Chrome Web Store Developer Dashboard
- [ ] Add privacy policy URL (required)
- [ ] Verify permissions justification
- [ ] Submit for review

### Firefox Add-ons (AMO)
- [ ] Build with `npm run build:firefox`
- [ ] Sign extension at addons.mozilla.org
- [ ] Submit for review
- [ ] Add privacy policy (recommended)
- [ ] Respond to reviewer questions promptly

### Microsoft Edge Add-ons
- [ ] Build with `npm run build:edge`
- [ ] Zip the `dist/edge/` directory
- [ ] Upload to Partner Center
- [ ] Can import from Chrome Web Store listing
- [ ] Submit for review

### Opera Add-ons
- [ ] Build with `npm run build:opera`
- [ ] Zip the `dist/opera/` directory
- [ ] Upload to Opera Developer Portal
- [ ] Submit for review (usually fast)

## Future Enhancements

### Planned Improvements

1. **Safari Support**
   - Create Safari-specific build
   - Test on macOS/iOS
   - Submit to App Store

2. **Automated Testing**
   - Add Playwright for cross-browser testing
   - Add Jest for unit tests
   - Add CI/CD pipeline

3. **Advanced Polyfill Features**
   - Better error handling
   - Performance monitoring
   - Automatic retry for failed API calls

4. **Browser-Specific Optimizations**
   - Use native APIs when available
   - Optimize for each browser's strengths

## Troubleshooting

### Build Issues

**Problem**: `node: command not found`
- **Solution**: Install Node.js from nodejs.org

**Problem**: `Permission denied: build.js`
- **Solution**: Make script executable: `chmod +x build.js`

**Problem**: Build fails with file not found
- **Solution**: Ensure all source files exist, check paths

### Runtime Issues

**Problem**: Extension not loading
- **Solution**: Check browser console for errors, verify manifest syntax

**Problem**: Polyfill not working
- **Solution**: Ensure polyfill loads first, check script order in HTML/manifest

**Problem**: API calls failing
- **Solution**: Check permissions in manifest, verify API usage

### Testing Issues

**Problem**: Extension works in Firefox but not Chrome
- **Solution**: Check for Firefox-specific APIs, ensure v3 compatibility

**Problem**: Service worker stops working
- **Solution**: Chrome v3 limitation, minimize background logic

## Resources

### Documentation
- [MDN WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest v3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

### Tools
- [WebExtension Polyfill (Mozilla)](https://github.com/mozilla/webextension-polyfill)
- [Extension Test Suite](https://github.com/web-ext/web-ext)
- [Playwright for Testing](https://playwright.dev/)

### Communities
- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [Chrome Extension Google Group](https://groups.google.com/a/chromium.org/g/chromium-extensions)
- [Reddit r/webextensions](https://reddit.com/r/webextensions)

## Contributing

When contributing cross-browser features:

1. Test on **both** Firefox and Chrome minimum
2. Update **both** manifest files
3. Update **both** background scripts if needed
4. Use **browser API** (not `chrome`) in new code
5. Add to testing checklist
6. Document browser-specific quirks

## License

This extension is open source and available under the MIT License.

---

**Questions or Issues?**

Open an issue on GitHub or check existing documentation:
- `USER_WORKFLOW.md` - User guide
- `COMPATIBILITY_RECOMMENDATIONS.md` - Future enhancements
- `README.md` - Project overview
