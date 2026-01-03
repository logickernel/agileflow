'use strict';

const { run } = require('./utils');

/**
 * Creates an annotated tag and pushes it to the remote repository.
 * Uses native git commands - requires git credentials to be configured.
 * @param {string} tagName - The tag name (e.g., "v1.2.3")
 * @param {string} message - The tag message (changelog)
 * @returns {Promise<void>}
 */
async function pushTag(tagName, message) {
  const safeTag = String(tagName).replace(/"/g, '\\"');
  const safeMsg = String(message).replace(/"/g, '\\"');
  
  // Create annotated tag
  run(`git tag -a "${safeTag}" -m "${safeMsg}"`);
  
  // Push to origin
  run(`git push origin "${safeTag}"`);
}

module.exports = {
  pushTag,
};

