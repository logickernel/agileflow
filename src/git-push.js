'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Creates an annotated tag and pushes it to the remote repository.
 * Uses native git commands - requires git credentials to be configured.
 * @param {string} tagName - The tag name (e.g., "v1.2.3")
 * @param {string} message - The tag message (changelog)
 * @param {boolean} quiet - If true, suppress success message
 * @returns {Promise<void>}
 */
async function pushTag(tagName, message, quiet = false) {
  const safeTag = String(tagName).replace(/"/g, '\\"');
  
  // Write message to a temp file to avoid shell escaping issues with special characters
  const tempFile = path.join(os.tmpdir(), `agileflow-tag-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tempFile, message, 'utf8');
    
    // Create annotated tag using -F to read message from file
    execSync(`git tag -a "${safeTag}" -F "${tempFile}"`, { stdio: 'pipe' });
    
    // Push to origin
    execSync(`git push origin "${safeTag}"`, { stdio: 'pipe' });
    
    if (!quiet) {
      console.log(`Tag ${tagName} created and pushed successfully.`);
    }
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

module.exports = {
  pushTag,
};
