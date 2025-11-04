// Options Script - Handles extension settings

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
});

// Load current settings
async function loadSettings() {
  try {
    const result = await browser.storage.local.get(['trackerUrl', 'autoOpen']);
    
    document.getElementById('trackerUrl').value = result.trackerUrl || 
      'https://yourusername.github.io/claude4-research-tracker';
    
    document.getElementById('autoOpen').checked = result.autoOpen !== false; // Default true
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings
async function saveSettings() {
  const trackerUrl = document.getElementById('trackerUrl').value.trim();
  const autoOpen = document.getElementById('autoOpen').checked;
  
  // Validate URL
  if (trackerUrl && !isValidUrl(trackerUrl)) {
    showStatus('Please enter a valid URL starting with https://', false);
    return;
  }
  
  try {
    await browser.storage.local.set({
      trackerUrl: trackerUrl,
      autoOpen: autoOpen
    });
    
    showStatus('Settings saved successfully! ✓', true);
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', false);
  }
}

// Reset to defaults
async function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    try {
      await browser.storage.local.set({
        trackerUrl: 'https://yourusername.github.io/claude4-research-tracker',
        autoOpen: true
      });
      
      loadSettings();
      showStatus('Settings reset to defaults', true);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }
}

// Validate URL
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
}

// Show status message
function showStatus(message, isSuccess) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${isSuccess ? 'success' : 'error'}`;
  statusEl.style.display = 'block';
  
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}