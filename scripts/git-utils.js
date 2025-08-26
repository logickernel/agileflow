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
  
  // Get all version tags sorted chronologically (oldest first)
  const out = runWithOutput('git tag --list "v*" --sort=v:refname') || '';
  const allTags = out.split('\n').map((s) => s.trim()).filter(Boolean);
  
  if (allTags.length === 0) return null;
  
  // Find the target tag in the sorted list
  const targetTagIndex = allTags.findIndex(tag => tag === tagName);
  if (targetTagIndex === -1) return null;
  
  // If this is the first tag, there's no previous tag
  if (targetTagIndex === 0) return null;
  
  // Return the tag that comes before the target tag
  return allTags[targetTagIndex - 1];
}

function getCommitSubjectsSince(fromTagExclusive, maxCount = 50) {
  if (!fromTagExclusive) {
    // When no previous tag, get all commits from the beginning
    const logCmd = `git log --pretty=format:%s -n ${Number(maxCount)}`;
    const out = runWithOutput(logCmd) || '';
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  
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

function determineVersionBump(commitMessages, currentVersion = { major: 0, minor: 0, patch: 0 }) {
  if (!commitMessages || commitMessages.length === 0) {
    console.log('No commit messages provided for version bump analysis');
    return 'none';
  }
  
  console.log(`Analyzing ${commitMessages.length} commit messages for version bump from ${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`);

  // Check for breaking changes according to conventional commit standards:
  // 1. feat!, feat(scope)!, fix!, fix(scope)!, etc.
  // 2. BREAKING CHANGE: in commit message
  const containsBreakingChanges = commitMessages.some(message => {
    const trimmed = message.trim();
    // Check for breaking change indicator in commit type (e.g., feat!, feat(scope)!)
    const hasBreakingIndicator = /^(\w+)(!|\([^)]+\)!):\s+(.+)$/i.test(trimmed);
    // Check for BREAKING CHANGE in the message
    const hasBreakingChangeComment = /BREAKING CHANGE:/i.test(trimmed);
    return hasBreakingIndicator || hasBreakingChangeComment;
  });
  
  // Check for feature commits (feat: or feat!)
  const containsFeatures = commitMessages.some(message => /^feat(!|\([^)]+\)!|:)/i.test(message.trim()));
  
  // Check for fix commits (fix: or fix!)
  const containsFixes = commitMessages.some(message => /^fix(!|\([^)]+\)!|:)/i.test(message.trim()));
  
  // Check for performance commits (perf: or perf!)
  const containsPerformance = commitMessages.some(message => /^perf(!|\([^)]+\)!|:)/i.test(message.trim()));

  // Check for build system commits (build: or build!)
  const containsBuild = commitMessages.some(message => /^build(!|\([^)]+\)!|:)/i.test(message.trim()));
  
  // Log what we found for debugging
  console.log(`Commit analysis results:`);
  console.log(`  - Breaking changes: ${containsBreakingChanges}`);
  console.log(`  - Features: ${containsFeatures}`);
  console.log(`  - Fixes: ${containsFixes}`);
  console.log(`  - Performance: ${containsPerformance}`);
  console.log(`  - Build: ${containsBuild}`);

  // Determine version bump based on current version and commit types
  if (currentVersion.major > 0) {
    // For 1.x.x and above versions
    if (containsBreakingChanges) {
      console.log('Major version bump: breaking changes detected');
      return 'major';
    } else if (containsFeatures) {
      console.log('Minor version bump: features detected');
      return 'minor';
    } else if (containsFixes || containsPerformance || containsBuild) {
      console.log('Patch version bump: fixes/performance/build changes detected');
      return 'patch';
    }
  } else {
    // For 0.x.x versions, breaking changes bump minor, features bump patch
    if (containsBreakingChanges) {
      console.log('Minor version bump (0.x.x): breaking changes detected');
      return 'minor';
    } else if (containsFeatures || containsFixes || containsPerformance || containsBuild) {
      console.log('Patch version bump (0.x.x): features/fixes/performance/build changes detected');
      return 'patch';
    }
  }
  
  console.log('No version bump needed: no significant changes detected');
  return 'none';
}

function calculateNextVersion(commitMessages, currentVersion = { major: 0, minor: 0, patch: 0 }) {
  const versionBump = determineVersionBump(commitMessages, currentVersion);
  
  // Apply version bump
  let nextMajor = currentVersion.major;
  let nextMinor = currentVersion.minor;
  let nextPatch = currentVersion.patch;
  
  switch (versionBump) {
    case 'major':
      nextMajor += 1;
      nextMinor = 0;
      nextPatch = 0;
      break;
    case 'minor':
      nextMinor += 1;
      nextPatch = 0;
      break;
    case 'patch':
      nextPatch += 1;
      break;
    case 'none':
    default:
      break;
  }
  
  const tag = `v${nextMajor}.${nextMinor}.${nextPatch}${currentVersion.metadata || ''}`;
  return { 
    tag, 
    versionBump, 
    currentVersion: `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`,
    nextVersion: { major: nextMajor, minor: nextMinor, patch: nextPatch }
  };
}

function analyzeCommitMessages(commitMessages) {
  if (!commitMessages || commitMessages.length === 0) {
    return {
      total: 0,
      breakingChanges: [],
      features: [],
      fixes: [],
      performance: [],
      build: [],
      other: []
    };
  }

  const analysis = {
    total: commitMessages.length,
    breakingChanges: [],
    features: [],
    fixes: [],
    performance: [],
    build: [],
    other: []
  };

  for (const message of commitMessages) {
    const trimmed = message.trim();
    
    // Check for breaking changes
    const hasBreakingIndicator = /^(\w+)(!)(?:\(([^)]+)\))?:\s+(.+)$/i.test(trimmed);
    const hasBreakingChangeComment = /BREAKING CHANGE:/i.test(trimmed);
    
    if (hasBreakingIndicator || hasBreakingChangeComment) {
      analysis.breakingChanges.push(message);
      continue;
    }
    
    // Check for conventional commit types
    if (/^feat(!|\([^)]+\)!|:)/i.test(trimmed)) {
      analysis.features.push(message);
    } else if (/^fix(!|\([^)]+\)!|:)/i.test(trimmed)) {
      analysis.fixes.push(message);
    } else if (/^perf(!|\([^)]+\)!|:)/i.test(trimmed)) {
      analysis.performance.push(message);
    } else if (/^build(!|\([^)]+\)!|:)/i.test(trimmed)) {
      analysis.build.push(message);
    } else {
      analysis.other.push(message);
    }
  }

  return analysis;
}

function getLatestVersion() {
  // Get the latest version tag from the current branch
  const out = runWithOutput('git tag --list "v*" --sort=v:refname') || '';
  const tags = out.split('\n').map((s) => s.trim()).filter(Boolean);
  if (tags.length === 0) return { major: 0, minor: 0, patch: 0 };
  
  const lastTag = tags[tags.length - 1];
  const m = lastTag.match(/^v(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/);
  if (!m) return { major: 0, minor: 0, patch: 0 };
  
  return { 
    major: Number(m[1]), 
    minor: Number(m[2]), 
    patch: Number(m[3]),
    metadata: m[4] || '',
  };
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
  determineVersionBump,
  calculateNextVersion,
  analyzeCommitMessages,
  getLatestVersion,
  parseSemverTag,
};


