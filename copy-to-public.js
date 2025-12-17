#!/usr/bin/env node

/**
 * Copy bundled files to public directory
 * Cross-platform compatible script
 */

const fs = require('fs');
const path = require('path');

const files = ['contextfree.js', 'cfdg.js'];
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy each file
files.forEach(file => {
  const source = path.join(__dirname, file);
  const dest = path.join(publicDir, file);
  
  try {
    fs.copyFileSync(source, dest);
    console.log(`Copied ${file} to public/`);
  } catch (err) {
    console.error(`Error copying ${file}:`, err.message);
    process.exit(1);
  }
});

console.log('Successfully copied bundled files to public directory');
