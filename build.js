#!/usr/bin/env node

/**
 * Build script for cross-browser extension
 * Builds extension packages for Firefox, Chrome, Edge, Opera, and Brave
 */

const fs = require('fs');
const path = require('path');

const BUILD_TARGETS = {
  firefox: {
    name: 'Firefox',
    manifest: 'manifest.json',
    background: 'background.js',
    manifestVersion: 2
  },
  chrome: {
    name: 'Chrome',
    manifest: 'manifest-v3.json',
    background: 'background-v3.js',
    manifestVersion: 3
  },
  edge: {
    name: 'Microsoft Edge',
    manifest: 'manifest-v3.json',
    background: 'background-v3.js',
    manifestVersion: 3
  },
  opera: {
    name: 'Opera',
    manifest: 'manifest-v3.json',
    background: 'background-v3.js',
    manifestVersion: 3
  },
  brave: {
    name: 'Brave',
    manifest: 'manifest-v3.json',
    background: 'background-v3.js',
    manifestVersion: 3
  }
};

// Files to include in all builds
const COMMON_FILES = [
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'content-script.js',
  'browser-polyfill.min.js',
  'schema-validator.js',
  'migration.js',
  'tracker-detection.js',
  'icons/'
];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function buildForTarget(target) {
  const config = BUILD_TARGETS[target];
  if (!config) {
    console.error(`❌ Unknown target: ${target}`);
    console.log(`Available targets: ${Object.keys(BUILD_TARGETS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📦 Building for ${config.name}...`);

  const distDir = path.join('dist', target);

  // Clean dist directory for this target
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }

  // Create dist directory
  fs.mkdirSync(distDir, { recursive: true });

  // Copy common files
  for (const file of COMMON_FILES) {
    const srcPath = path.join('.', file);
    const destPath = path.join(distDir, file);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  File not found: ${srcPath}`);
      continue;
    }

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
      console.log(`  ✓ Copied directory: ${file}`);
    } else {
      copyFile(srcPath, destPath);
      console.log(`  ✓ Copied: ${file}`);
    }
  }

  // Copy manifest (rename to manifest.json)
  const manifestSrc = path.join('.', config.manifest);
  const manifestDest = path.join(distDir, 'manifest.json');
  copyFile(manifestSrc, manifestDest);
  console.log(`  ✓ Copied manifest: ${config.manifest} → manifest.json`);

  // Copy background script (rename to background.js)
  const backgroundSrc = path.join('.', config.background);
  const backgroundDest = path.join(distDir, 'background.js');
  copyFile(backgroundSrc, backgroundDest);
  console.log(`  ✓ Copied background: ${config.background} → background.js`);

  // Update manifest to point to background.js
  const manifest = JSON.parse(fs.readFileSync(manifestDest, 'utf8'));

  if (config.manifestVersion === 2) {
    manifest.background.scripts = ['background.js'];
  } else {
    manifest.background.service_worker = 'background.js';
  }

  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));

  console.log(`✅ Build complete for ${config.name}: dist/${target}/`);
}

function buildAll() {
  console.log('🚀 Building for all browsers...\n');
  for (const target of Object.keys(BUILD_TARGETS)) {
    buildForTarget(target);
  }
  console.log('\n✅ All builds complete!');
  console.log('\nBuild outputs:');
  for (const target of Object.keys(BUILD_TARGETS)) {
    console.log(`  • ${BUILD_TARGETS[target].name}: dist/${target}/`);
  }
}

// Main
const args = process.argv.slice(2);
const target = args[0];

if (!target) {
  console.error('❌ No target specified');
  console.log('\nUsage: node build.js <target>');
  console.log(`\nAvailable targets: ${Object.keys(BUILD_TARGETS).join(', ')}, all`);
  process.exit(1);
}

if (target === 'all') {
  buildAll();
} else {
  buildForTarget(target);
}
