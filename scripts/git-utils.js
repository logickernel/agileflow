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

// --- Tag message builder (externalized) ---

function parseSemverTag(tagName) {
  const m = String(tagName).trim().match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function listTagsForRelease(major, minor) {
  const pattern = `v${major}.${minor}.*`;
  const out = runWithOutput(`git tag --list "${pattern}" --sort=v:refname`) || '';
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getPreviousTagForTarget(tagName) {
  const parsed = parseSemverTag(tagName);
  if (!parsed) return null;
  const tags = listTagsForRelease(parsed.major, parsed.minor);
  if (tags.length === 0) return null;
  return tags[tags.length - 1] || null;
}

function getCommitSubjectsSince(fromTagExclusive, maxCount = 50) {
  if (!fromTagExclusive) return [];
  const logCmd = `git log ${fromTagExclusive}..HEAD --pretty=format:%s -n ${Number(maxCount)}`;
  const out = runWithOutput(logCmd) || '';
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildTagMessage(tagName, options = {}) {
  const { maxCommitLines = 50, includeMergeCommits = false } = options;
  const previousTag = getPreviousTagForTarget(tagName);
  let subjects = getCommitSubjectsSince(previousTag, maxCommitLines);
  if (!includeMergeCommits) {
    subjects = subjects.filter((s) => !/^merge /i.test(s));
  }
  const lines = [String(tagName).trim()];
  if (subjects.length > 0) {
    for (const s of subjects) {
      lines.push(`- ${s}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  run,
  runWithOutput,
  ensureGitRepo,
  configureUser,
  createAnnotatedTag,
  pushTag,
  buildTagMessage,
};


