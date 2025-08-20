'use strict';

const { execSync } = require('child_process');
const fs = require('fs');

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

function runWithOutput(command, options = {}) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
  } catch (error) {
    const captured = {
      stdout: error && error.stdout ? String(error.stdout) : '',
      stderr: error && error.stderr ? String(error.stderr) : '',
      message: error && error.message ? String(error.message) : 'Command failed',
      status: error && typeof error.status === 'number' ? error.status : 1,
    };
    // Attach captured IO for higher-level handlers
    try {
      // Non-enumerable to avoid noisy default logging
      Object.defineProperty(error, '_captured', { value: captured });
    } catch (_) {
      // Fallback if defineProperty fails
      error._captured = captured; // eslint-disable-line no-param-reassign
    }
    throw error;
  }
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
  try {
    const output = runWithOutput(`git push "${safeRemote}" "${safeTag}"`);
    if (output && output.length > 0) {
      process.stdout.write(output);
    }
  } catch (error) {
    // Re-throw after ensuring error carries captured IO
    throw error;
  }
}

module.exports = {
  run,
  runWithOutput,
  ensureGitRepo,
  configureUser,
  createAnnotatedTag,
  pushTag,
};


