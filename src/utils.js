'use strict';

const { runWithOutput, ensureGitRepo } = require('./git-utils');

// Conventional commit type configuration
const TYPE_ORDER = ['feat', 'fix', 'perf', 'refactor', 'style', 'test', 'docs', 'build', 'ci', 'chore', 'revert'];
const PATCH_TYPES = ['fix', 'perf', 'refactor', 'test', 'build', 'ci', 'revert'];
const SEMVER_PATTERN = /^v(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/;

/**
 * Fetches tags from remote (non-destructive) if a remote is configured.
 * This is a safe operation that doesn't modify the working directory.
 * @returns {boolean} True if tags were fetched, false if using local tags only
 */
function fetchTagsLocally() {
  try {
    const remotes = runWithOutput('git remote').trim();
    if (!remotes) {
      return false;
    }
    runWithOutput('git fetch --tags --prune --prune-tags');
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that the current branch is the expected name.
 * @param {string} expectedName - The expected name of the branch
 * @throws {Error} If the current branch is not the expected name or in detached HEAD state
 */
function validateBranchName(expectedName) {
  const branch = runWithOutput('git branch --show-current').trim();
  if (!branch) {
    throw new Error('Repository is in a detached HEAD state. Please check out a branch and try again.');
  }
  if (branch !== expectedName) {
    throw new Error(`Current branch is "${branch}", not "${expectedName}". Switch to ${expectedName} or use --branch ${branch}.`);
  }
}

/**
 * Gets all tags pointing to a specific commit.
 * @param {string} commitSha - The commit SHA to check for tags
 * @returns {Array<string>} Array of tag names, empty array if none
 */
function getTagsForCommit(commitSha) {
  try {
    const output = runWithOutput(`git tag --points-at ${commitSha}`).trim();
    return output ? output.split('\n').map(t => t.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Parses a conventional commit message.
 * @param {string} message - The commit message to parse
 * @returns {{type: string, breaking: boolean, scope: string, description: string}|null} Parsed commit or null if not conventional
 */
function parseConventionalCommit(message) {
  if (!message) return null;
  
  // Get the first line (subject) of the commit message
  const subject = message.split('\n')[0].trim();
  
  // Conventional commit pattern: type[!]?(scope)?: description
  const match = subject.match(/^(\w+)(!)?(?:\(([^)]+)\))?:\s+(.+)$/);
  if (!match) return null;
  
  return {
    type: match[1].toLowerCase(),
    breaking: Boolean(match[2]),
    scope: match[3] ? String(match[3]).trim() : '',
    description: String(match[4]).trim(),
  };
}

/**
 * Expands commit information by finding the latest version and filtering commits.
 * Filters out commits that are older than the latest commit with a semver tag.
 * Commits are expected to be ordered from newest to oldest.
 * @param {Array<{hash: string, datetime: string, author: string, message: string, tags: Array<string>}>} commits - Array of commit objects
 * @returns {{latestVersion: string|null, commits: Array}} Object with latestVersion and filtered commits array
 */
function expandCommitInfo(commits) {
  if (!commits?.length) {
    return { latestVersion: null, commits: [] };
  }
  
  // Find the first commit (newest) that has a semver tag
  const taggedIndex = commits.findIndex(commit => 
    commit.tags?.some(tag => SEMVER_PATTERN.test(tag))
  );
  
  if (taggedIndex === -1) {
    return { latestVersion: null, commits };
  }
  
  const latestVersion = commits[taggedIndex].tags.find(tag => SEMVER_PATTERN.test(tag));
  return {
    latestVersion,
    commits: commits.slice(0, taggedIndex + 1),
  };
}

/**
 * Extracts issue reference from commit message (e.g., #123 or (#123)).
 * @param {string} message - The commit message
 * @returns {string|null} Issue reference like "(#123)" or null if not found
 */
function extractIssueReference(message) {
  const match = message?.match(/\(?#(\d+)\)?/);
  return match ? `(#${match[1]})` : null;
}

/**
 * Formats the first line of commit message for changelog, removing the type prefix.
 * @param {string} subject - The first line of the commit message
 * @param {Object} parsed - Parsed conventional commit info
 * @param {string} fullMessage - Full commit message to check for BREAKING CHANGE:
 * @returns {string} Formatted description
 */
function formatChangelogDescription(subject, parsed, fullMessage) {
  if (!parsed) {
    // Not a conventional commit, use subject as-is
    return subject;
  }
  
  let description = parsed.description;
  
  // Add BREAKING prefix if it's a breaking change (check both ! and BREAKING CHANGE:)
  const isBreaking = parsed.breaking || /BREAKING CHANGE:/i.test(fullMessage);
  if (isBreaking) {
    description = `BREAKING: ${description}`;
  }
  
  return description;
}

/**
 * Parses a semver version string into its components.
 * @param {string|null} version - Version string like "v1.2.3" or "v1.2.3-beta"
 * @returns {{major: number, minor: number, patch: number}} Parsed version or {0,0,0} if invalid
 */
function parseVersion(version) {
  if (!version) return { major: 0, minor: 0, patch: 0 };
  const match = version.match(SEMVER_PATTERN);
  if (!match) return { major: 0, minor: 0, patch: 0 };
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/**
 * Determines the version bump type based on commit analysis.
 * @param {{hasBreaking: boolean, hasFeat: boolean, hasPatchTypes: boolean}} analysis - Commit analysis
 * @param {boolean} isPreOneZero - Whether current version is 0.x.x
 * @returns {'major'|'minor'|'patch'|'none'} The version bump type
 */
function determineVersionBumpType(analysis, isPreOneZero) {
  const { hasBreaking, hasFeat, hasPatchTypes } = analysis;
  
  if (isPreOneZero) {
    if (hasBreaking || hasFeat) return 'minor';
    if (hasPatchTypes) return 'patch';
  } else {
    if (hasBreaking) return 'major';
    if (hasFeat) return 'minor';
    if (hasPatchTypes) return 'patch';
  }
  return 'none';
}

/**
 * Applies a version bump to the current version.
 * @param {{major: number, minor: number, patch: number}} current - Current version
 * @param {'major'|'minor'|'patch'|'none'} bump - Bump type
 * @returns {string} Next version string like "v1.2.3"
 */
function applyVersionBump(current, bump) {
  let { major, minor, patch } = current;
  switch (bump) {
    case 'major': return `v${major + 1}.0.0`;
    case 'minor': return `v${major}.${minor + 1}.0`;
    case 'patch': return `v${major}.${minor}.${patch + 1}`;
    default: return `v${major}.${minor}.${patch}`;
  }
}

/**
 * Analyzes commits to determine version bump requirements.
 * @param {Array} commits - Array of commit objects
 * @returns {{hasBreaking: boolean, hasFeat: boolean, hasPatchTypes: boolean, commitsByType: Object}}
 */
function analyzeCommitsForVersioning(commits) {
  const commitsByType = Object.fromEntries(TYPE_ORDER.map(t => [t, []]));
  let hasBreaking = false, hasFeat = false, hasPatchTypes = false;
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (!parsed) continue;
    
    const { type, breaking } = parsed;
    const isBreaking = breaking || /BREAKING CHANGE:/i.test(commit.message);
    
    if (isBreaking) hasBreaking = true;
    if (type === 'feat') hasFeat = true;
    else if (PATCH_TYPES.includes(type)) hasPatchTypes = true;
    
    if (commitsByType[type]) {
      commitsByType[type].push(commit);
    }
  }
  
  return { hasBreaking, hasFeat, hasPatchTypes, commitsByType };
}

/**
 * Generates changelog entries for a commit type section.
 * @param {Array} commits - Commits of this type
 * @returns {Array<string>} Changelog lines
 */
function generateTypeChangelog(commits) {
  const byScope = {};
  const noScope = [];
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (!parsed) continue;
    
    const subject = commit.message.split('\n')[0].trim();
    const entry = {
      scope: parsed.scope,
      description: formatChangelogDescription(subject, parsed, commit.message),
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
    lines.push(`- ${entry.description}${entry.issueRef}`);
  }
  for (const scope of Object.keys(byScope).sort()) {
    for (const entry of byScope[scope]) {
      lines.push(`- **${scope}**: ${entry.description}${entry.issueRef}`);
    }
  }
  return lines;
}

/**
 * Calculates the next version and generates a changelog from expanded commit info.
 * @param {{latestVersion: string|null, commits: Array}} expandedInfo - Output from expandCommitInfo
 * @returns {{nextVersion: string, changelog: string}} Object with nextVersion and changelog
 */
function calculateNextVersionAndChangelog(expandedInfo) {
  const { latestVersion, commits } = expandedInfo;
  const current = parseVersion(latestVersion);
  const analysis = analyzeCommitsForVersioning(commits);
  
  const bump = determineVersionBumpType(analysis, current.major === 0);
  const nextVersion = applyVersionBump(current, bump);
  
  // Generate changelog
  const changelogLines = [];
  for (const type of TYPE_ORDER) {
    const typeCommits = analysis.commitsByType[type];
    if (!typeCommits?.length) continue;
    
    changelogLines.push(`### ${type}`);
    changelogLines.push(...generateTypeChangelog(typeCommits));
    changelogLines.push('');
  }
  
  // Remove trailing empty line
  if (changelogLines.at(-1) === '') {
    changelogLines.pop();
  }
  
  return { nextVersion, changelog: changelogLines.join('\n') };
}

/**
 * Processes version information for a branch, returning version details and changelog.
 * @param {string} branch - The branch to process
 * @returns {Promise<{previousVersion: string|null, nextVersion: string, commits: Array, conventionalCommits: Object, changelog: string}>} Promise resolving to version info
 */
async function processVersionInfo(branch) {
  ensureGitRepo();
  validateBranchName(branch);
  fetchTagsLocally();
  
  const allCommits = getAllBranchCommits(branch);
  const expandedInfo = expandCommitInfo(allCommits);
  const { latestVersion, commits } = expandedInfo;
  
  // Group commits by conventional type
  const conventionalCommits = Object.fromEntries(TYPE_ORDER.map(t => [t, []]));
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (parsed && conventionalCommits[parsed.type]) {
      conventionalCommits[parsed.type].push({ ...commit, conventional: parsed });
    }
  }
  
  const { nextVersion, changelog } = calculateNextVersionAndChangelog(expandedInfo);
  
  return {
    previousVersion: latestVersion,
    nextVersion,
    commits,
    conventionalCommits,
    changelog,
  };
}

/**
 * Retrieves all commits in the history of the specified branch, including merged commits.
 * Returns a simplified array with commit hash, datetime, author, commit message, and tags.
 * @param {string} branch - The branch to get commits from
 * @returns {Array<{hash: string, datetime: string, author: string, message: string, tags: Array<string>}>} Array of commit objects
 */
function getAllBranchCommits(branch) {
  try {
    // Verify the branch exists
    runWithOutput(`git rev-parse --verify ${branch}`);
  } catch {
    return [];
  }
  
  const RS = '\x1E'; // Record Separator
  const COMMIT_SEP = `${RS}${RS}`;
  
  try {
    const logCmd = `git log --format=%H${RS}%ai${RS}%an${RS}%B${COMMIT_SEP} ${branch}`;
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
          tags: getTagsForCommit(hash),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = {
  ensureGitRepo,
  fetchTagsLocally,
  validateBranchName,
  getAllBranchCommits,
  expandCommitInfo,
  calculateNextVersionAndChangelog,
  processVersionInfo,
  parseConventionalCommit,
};

