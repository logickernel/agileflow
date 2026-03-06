'use strict';

const { execSync } = require('child_process');

/**
 * Executes a shell command and returns the output.
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @returns {string} Command output
 * @throws {Error} If command fails
 */
function runWithOutput(command, options = {}) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
  } catch (error) {
    const captured = {
      stdout: error?.stdout ? String(error.stdout) : '',
      stderr: error?.stderr ? String(error.stderr) : '',
      message: error?.message || 'Command failed',
      status: typeof error?.status === 'number' ? error.status : 1,
    };
    try {
      Object.defineProperty(error, '_captured', { value: captured });
    } catch {
      error._captured = captured;
    }
    throw error;
  }
}

/**
 * Executes a shell command without returning output.
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @throws {Error} If command fails
 */
function run(command, options = {}) {
  execSync(command, { stdio: 'pipe', ...options });
}

/**
 * Ensures the current directory is a git repository.
 * @throws {Error} If the current directory is not a git repository
 */
function ensureGitRepo() {
  try {
    runWithOutput('git rev-parse --is-inside-work-tree');
  } catch {
    throw new Error('Current directory is not a git repository.');
  }
}

/**
 * Gets the current branch name.
 * @returns {string} Current branch name
 * @throws {Error} If in detached HEAD state and no CI environment variable is available
 */
function getCurrentBranch() {
  const branch = runWithOutput('git branch --show-current').trim();
  if (branch) {
    return branch;
  }
  
  // Handle detached HEAD state (common in CI environments)
  // GitLab CI provides CI_COMMIT_BRANCH (for branches) or CI_COMMIT_REF_NAME (for branches/tags)
  // GitHub Actions provides GITHUB_REF_NAME (for branches/tags)
  const ciBranch = process.env.CI_COMMIT_BRANCH || process.env.CI_COMMIT_REF_NAME || process.env.GITHUB_REF_NAME;
  if (ciBranch) {
    return ciBranch;
  }
  
  throw new Error('Repository is in a detached HEAD state. Please check out a branch and try again.');
}

// Conventional commit type configuration
const TYPE_ORDER = ['feat', 'fix', 'perf', 'refactor', 'style', 'test', 'build', 'ci', 'docs', 'revert'];
const SEMVER_PATTERN = /^v(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/;

// Friendly header names for changelog
const TYPE_HEADERS = {
  feat: 'Features:',
  fix: 'Fixes:',
  perf: 'Performance:',
  refactor: 'Refactors:',
  style: 'Style:',
  test: 'Tests:',
  docs: 'Documentation:',
  build: 'Build:',
  ci: 'CI:',
  revert: 'Reverts:',
};

/**
 * Fetches tags from remote (non-destructive) if a remote is configured.
 * @returns {boolean} True if tags were fetched, false if using local tags only
 */
function fetchTags() {
  try {
    const remotes = runWithOutput('git remote').trim();
    if (!remotes) return false;
    runWithOutput('git fetch --tags --prune --prune-tags');
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds a map of commit SHA → tag names for all tags in the repository.
 * Uses a single git call instead of one per commit.
 * @returns {Map<string, string[]>}
 */
function buildTagMap() {
  try {
    const output = runWithOutput('git tag --format=%(refname:short)|%(*objectname)|%(objectname)').trim();
    if (!output) return new Map();
    const map = new Map();
    for (const line of output.split('\n')) {
      const [name, deref, obj] = line.split('|');
      // Annotated tags dereference to the commit via %(*objectname);
      // lightweight tags point directly via %(objectname).
      const sha = (deref || obj || '').trim();
      const tagName = (name || '').trim();
      if (!sha || !tagName) continue;
      if (!map.has(sha)) map.set(sha, []);
      map.get(sha).push(tagName);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Parses a conventional commit message.
 * @param {string} message - The commit message to parse
 * @returns {{type: string, breaking: boolean, scope: string, description: string}|null}
 */
function parseConventionalCommit(message) {
  if (!message) return null;
  const subject = message.split('\n')[0].trim();
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/);
  if (!match) return null;
  return {
    type: match[1].toLowerCase(),
    breaking: Boolean(match[3]),
    scope: match[2] ? String(match[2]).trim() : '',
    description: String(match[4]).trim(),
  };
}

/**
 * Expands commit information by finding the latest version and filtering commits.
 * @param {Array} commits - Array of commit objects (newest to oldest)
 * @returns {{latestVersion: string|null, commits: Array}} Filtered commits since last version
 */
function expandCommitInfo(commits) {
  if (!commits?.length) {
    return { latestVersion: null, commits: [] };
  }
  
  const taggedIndex = commits.findIndex(commit => 
    commit.tags?.some(tag => SEMVER_PATTERN.test(tag))
  );
  
  if (taggedIndex === -1) {
    return { latestVersion: null, commits };
  }
  
  const latestVersion = commits[taggedIndex].tags
    .filter(tag => SEMVER_PATTERN.test(tag))
    .sort((a, b) => {
      const pa = parseVersion(a);
      const pb = parseVersion(b);
      if (pb.major !== pa.major) return pb.major - pa.major;
      if (pb.minor !== pa.minor) return pb.minor - pa.minor;
      return pb.patch - pa.patch;
    })[0];
  // Exclude the tagged commit itself - only return commits since the tag
  return {
    latestVersion,
    commits: commits.slice(0, taggedIndex),
  };
}

/**
 * Extracts issue reference from commit message.
 * @param {string} message - The commit message
 * @returns {string|null} Issue reference like "(#123)" or null
 */
function extractIssueReference(message) {
  const match = message?.match(/\(?#(\d+)\)?/);
  return match ? `(#${match[1]})` : null;
}

/**
 * Formats commit description for changelog.
 * @param {string} subject - First line of commit message
 * @param {Object} parsed - Parsed conventional commit info
 * @param {string} fullMessage - Full commit message
 * @param {boolean} isBreakingSection - Whether this is for the breaking changes section
 * @returns {string} Formatted description
 */
function formatChangelogDescription(subject, parsed, fullMessage, isBreakingSection = false) {
  if (!parsed) return subject;
  let description = parsed.description;
  const isBreaking = parsed.breaking || /BREAKING CHANGE:/i.test(fullMessage);
  
  // Only add BREAKING prefix if not in breaking changes section
  if (isBreaking && !isBreakingSection) {
    description = `BREAKING: ${description}`;
  }
  return description;
}

/**
 * Parses a semver version string into components.
 * @param {string|null} version - Version string like "v1.2.3"
 * @returns {{major: number, minor: number, patch: number}}
 */
function parseVersion(version) {
  if (!version) return { major: 0, minor: 0, patch: 0 };
  const match = version.match(SEMVER_PATTERN);
  if (!match) return { major: 0, minor: 0, patch: 0 };
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/**
 * Determines version bump type based on commit analysis.
 * @param {{hasBreaking: boolean, hasFeat: boolean, hasFix: boolean}} analysis
 * @param {boolean} isPreOneZero - Whether current version is 0.x.x
 * @returns {'major'|'minor'|'patch'|'none'}
 */
function determineVersionBumpType(analysis, isPreOneZero) {
  const { hasBreaking, hasFeat, hasFix } = analysis;
  if (isPreOneZero) {
    if (hasBreaking || hasFeat) return 'minor';
    if (hasFix) return 'patch';
  } else {
    if (hasBreaking) return 'major';
    if (hasFeat) return 'minor';
    if (hasFix) return 'patch';
  }
  return 'none';
}

/**
 * Applies a version bump to the current version.
 * @param {{major: number, minor: number, patch: number}} current
 * @param {'major'|'minor'|'patch'|'none'} bump
 * @returns {string|null} Next version string or null if no bump
 */
function applyVersionBump(current, bump) {
  const { major, minor, patch } = current;
  switch (bump) {
    case 'major': return `v${major + 1}.0.0`;
    case 'minor': return `v${major}.${minor + 1}.0`;
    case 'patch': return `v${major}.${minor}.${patch + 1}`;
    default: return null;
  }
}

/**
 * Checks if a commit is a breaking change.
 * @param {Object} commit - Commit object
 * @param {Object} parsed - Parsed conventional commit info
 * @returns {boolean}
 */
function isBreakingChange(commit, parsed) {
  if (!parsed) return false;
  return parsed.breaking || /BREAKING CHANGE:/i.test(commit.message);
}

/**
 * Analyzes commits to determine version bump requirements.
 * @param {Array} commits - Array of commit objects
 * @returns {{hasBreaking: boolean, hasFeat: boolean, hasFix: boolean, commitsByType: Object, breakingCommits: Array}}
 */
function analyzeCommitsForVersioning(commits) {
  const commitsByType = Object.fromEntries(TYPE_ORDER.map(t => [t, []]));
  const breakingCommits = [];
  let hasBreaking = false, hasFeat = false, hasFix = false;
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (!parsed) continue;
    
    const { type, breaking } = parsed;
    const isBreaking = isBreakingChange(commit, parsed);
    
    if (isBreaking) {
      hasBreaking = true;
      breakingCommits.push(commit);
    } else {
      // Only add to type sections if not breaking
      if (type === 'feat') hasFeat = true;
      else if (type === 'fix') hasFix = true;
      
      if (commitsByType[type]) {
        commitsByType[type].push(commit);
      }
    }
  }
  
  return { hasBreaking, hasFeat, hasFix, commitsByType, breakingCommits };
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates changelog entries for a commit type section.
 * @param {Array} commits - Commits of this type
 * @param {boolean} isBreakingSection - Whether this is for the breaking changes section
 * @returns {Array<string>} Changelog lines
 */
function generateTypeChangelog(commits, isBreakingSection = false) {
  const byScope = {};
  const noScope = [];
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (!parsed) continue;
    
    const subject = commit.message.split('\n')[0].trim();
    const entry = {
      scope: parsed.scope,
      description: formatChangelogDescription(subject, parsed, commit.message, isBreakingSection),
      issueRef: extractIssueReference(commit.message) || '',
    };
    
    if (parsed.scope) {
      (byScope[parsed.scope] ??= []).push(entry);
    } else {
      noScope.push(entry);
    }
  }
  
  const lines = [];
  for (const entry of noScope) {
    const ref = entry.issueRef ? ` ${entry.issueRef}` : '';
    lines.push(`- ${capitalize(entry.description)}${ref}`);
  }
  for (const scope of Object.keys(byScope).sort()) {
    for (const entry of byScope[scope]) {
      const ref = entry.issueRef ? ` ${entry.issueRef}` : '';
      lines.push(`- ${scope}: ${capitalize(entry.description)}${ref}`);
    }
  }
  return lines;
}

/**
 * Calculates the new version and generates a changelog.
 * @param {{latestVersion: string|null, commits: Array}} expandedInfo
 * @returns {{newVersion: string|null, changelog: string}}
 */
function calculateNextVersionAndChangelog(expandedInfo) {
  const { latestVersion, commits } = expandedInfo;
  const current = parseVersion(latestVersion);
  const analysis = analyzeCommitsForVersioning(commits);
  
  const bump = determineVersionBumpType(analysis, current.major === 0);
  const newVersion = applyVersionBump(current, bump);
  
  // Generate changelog
  const changelogLines = [];
  
  // Add breaking changes section first if any
  if (analysis.breakingCommits.length > 0) {
    changelogLines.push('BREAKING CHANGES:');
    changelogLines.push(...generateTypeChangelog(analysis.breakingCommits, true));
    changelogLines.push('');
  }
  
  // Add regular type sections
  for (const type of TYPE_ORDER) {
    const typeCommits = analysis.commitsByType[type];
    if (!typeCommits?.length) continue;
    
    changelogLines.push(TYPE_HEADERS[type] || `${capitalize(type)}:`);
    changelogLines.push(...generateTypeChangelog(typeCommits));
    changelogLines.push('');
  }
  
  if (changelogLines.at(-1) === '') {
    changelogLines.pop();
  }
  
  return { newVersion, changelog: changelogLines.join('\n') };
}

/**
 * Retrieves all commits in the history of the specified branch.
 * @param {string} branch - The branch to get commits from
 * @returns {Array<{hash: string, datetime: string, author: string, message: string, tags: Array<string>}>}
 */
function getAllBranchCommits(branch) {
  // Resolve the branch to a SHA to avoid shell injection when the branch
  // name originates from a CI environment variable.
  let resolvedSha;
  try {
    resolvedSha = runWithOutput(`git rev-parse --verify -- ${branch}`).trim();
  } catch {
    // Try with origin/ prefix (common in CI environments where local branch doesn't exist)
    try {
      resolvedSha = runWithOutput(`git rev-parse --verify -- origin/${branch}`).trim();
    } catch {
      return [];
    }
  }

  const tagMap = buildTagMap();
  const RS = '\x1E';
  const COMMIT_SEP = `${RS}${RS}`;

  try {
    const logCmd = `git log --format=%H${RS}%ai${RS}%an${RS}%B${COMMIT_SEP} ${resolvedSha}`;
    const output = runWithOutput(logCmd).trim();
    if (!output) return [];

    return output
      .split(COMMIT_SEP)
      .filter(block => block.trim())
      .map(block => {
        const parts = block.split(RS);
        if (parts.length < 4) return null;
        const hash = parts[0].trim();
        return {
          hash,
          datetime: parts[1].trim(),
          author: parts[2].trim(),
          message: parts.slice(3).join(RS).trim(),
          tags: tagMap.get(hash) || [],
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Processes version information for the current branch.
 * @returns {Promise<{currentVersion: string|null, newVersion: string|null, commits: Array, changelog: string}>}
 */
async function processVersionInfo() {
  ensureGitRepo();
  const branch = getCurrentBranch();
  fetchTags();
  
  const allCommits = getAllBranchCommits(branch);
  const expandedInfo = expandCommitInfo(allCommits);
  const { latestVersion, commits } = expandedInfo;
  const { newVersion, changelog } = calculateNextVersionAndChangelog(expandedInfo);
  
  return {
    currentVersion: latestVersion,
    newVersion,
    commits,
    changelog,
  };
}

module.exports = {
  run,
  runWithOutput,
  ensureGitRepo,
  getCurrentBranch,
  fetchTags,
  getAllBranchCommits,
  expandCommitInfo,
  calculateNextVersionAndChangelog,
  processVersionInfo,
  parseConventionalCommit,
};
