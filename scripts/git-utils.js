'use strict';

const { execSync } = require('child_process');
const fs = require('fs');

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

function ensureGitRepo() {
  if (!fs.existsSync('.git')) {
    throw new Error('Current directory is not a git repository (missing .git directory).');
  }
}

function configureUser(name, email) {
  const safeName = String(name).replace(/"/g, '\\"');
  const safeEmail = String(email).replace(/"/g, '\\"');
  run(`git config user.name "${safeName}"`);
  run(`git config user.email "${safeEmail}"`);
}

function createAnnotatedTag(tagName, message) {
  const safeTag = String(tagName).replace(/"/g, '\\"');
  const safeMsg = String(message).replace(/"/g, '\\"');
  run(`git tag -a "${safeTag}" -m "${safeMsg}"`);
}

function pushTag(remoteUrl, tagName) {
  const safeRemote = String(remoteUrl).replace(/"/g, '\\"');
  const safeTag = String(tagName).replace(/"/g, '\\"');
  run(`git push "${safeRemote}" "${safeTag}"`);
}

module.exports = {
  run,
  ensureGitRepo,
  configureUser,
  createAnnotatedTag,
  pushTag,
};


