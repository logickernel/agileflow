'use strict';

const { execSync } = require('child_process');
const fs = require('fs');

function run(command, options = {}) {
  execSync(command, { stdio: 'pipe', ...options });
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
    // Don't output anything - keep it silent
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

  // If no subjects, keep the simple message
  if (subjects.length === 0) {
    return String(tagName).trim();
  }

  // Conventional commit parser: type[!]?(scope)?: description
  const parseConventional = (subject) => {
    const match = subject.match(/^(\w+)(!)?(?:\(([^)]+)\))?:\s+(.+)$/);
    if (!match) return null;
    return {
      type: match[1].toLowerCase(),
      breaking: Boolean(match[2]),
      scope: match[3] ? String(match[3]).trim() : '',
      description: String(match[4]).trim(),
    };
  };

  // Section titles with stable ordering
  const sectionOrder = [
    'feat',
    'fix',
    'perf',
    'refactor',
    'docs',
    'build',
    'ci',
    'chore',
    'test',
    'style',
    'revert',
  ];
  const sectionTitles = {
    feat: 'Features',
    fix: 'Bug fixes',
    perf: 'Performance improvements',
    refactor: 'Refactors',
    docs: 'Documentation',
    build: 'Build system',
    ci: 'CI',
    chore: 'Chores',
    test: 'Tests',
    style: 'Code style',
    revert: 'Reverts',
  };

  // Group by conventional type; non-matching go to "others"
  const groups = { others: [] };
  for (const type of sectionOrder) groups[type] = [];

  let hasAtLeastOneConventional = false;
  for (const subject of subjects) {
    const parsed = parseConventional(subject);
    if (parsed && (sectionOrder.includes(parsed.type) || parsed.type)) {
      hasAtLeastOneConventional = true;
      const targetKey = sectionOrder.includes(parsed.type) ? parsed.type : 'others';
      const prefix = parsed.breaking ? 'BREAKING: ' : '';
      const scopePart = parsed.scope ? `${parsed.scope}: ` : '';
      groups[targetKey].push(`- ${prefix}${scopePart}${parsed.description}`);
    } else {
      groups.others.push(`- ${subject}`);
    }
  }

  // If nothing parsed as conventional, fallback to flat list (legacy behavior)
  if (!hasAtLeastOneConventional) {
    const flat = [String(tagName).trim()];
    for (const s of subjects) flat.push(`- ${s}`);
    return flat.join('\n');
  }

  // Build grouped message
  const lines = [String(tagName).trim(), ''];
  for (const type of sectionOrder) {
    const items = groups[type];
    if (items && items.length > 0) {
      lines.push(`${sectionTitles[type]}:`);
      lines.push(...items);
      lines.push('');
    }
  }
  if (groups.others.length > 0) {
    lines.push('Other changes:');
    lines.push(...groups.others);
    lines.push('');
  }
  // Trim possible trailing blank line
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
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
  getCommitSubjectsSince,
};


