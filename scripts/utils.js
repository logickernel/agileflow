'use strict';

const fs = require('fs');
const { run, runWithOutput } = require('./git-utils');

/**
 * Ensures the current directory is a git repository.
 * @throws {Error} If the current directory is not a git repository
 */
function ensureGitRepo() {
  if (!fs.existsSync('.git')) {
    throw new Error('Current directory is not a git repository (missing .git directory).');
  }
}

/**
 * Fetches tags from remote (non-destructive) if a remote is configured.
 * This is a safe operation that doesn't modify the working directory.
 */
function fetchTagsLocally() {
  try {
    // Only fetch if we have a remote configured
    const remotes = runWithOutput('git remote').trim();
    if (remotes) {
      run('git fetch --tags --prune --prune-tags', { stdio: 'ignore' });
      return true;
    } else {
      console.log('No remote configured, using local tags only');
      return false;
    }
  } catch (fetchError) {
    console.warn('Warning: Could not fetch tags:', fetchError.message);
    console.warn('Continuing with local tags only...');
    return false;
  }
}

/**
 * Validates that the current branch is the expected name.
 * @param {string} expectedName - The expected name of the branch
 * @throws {Error} If the current branch is not the expected name
 */
function validateBranchName(expectedName) {
  const branch = runWithOutput('git branch --show-current').trim();
  if (branch === "") {
    console.error("Repository is in a detached HEAD state. Please check out a branch and try again.");
    process.exit(1);
  }
  if (branch !== expectedName) {
    console.log('Current branch is not ' + expectedName + '. Switch to ' + expectedName + ' branch or use --branch ' + branch + ' and try again. Exiting...');
    process.exit(0);
  }
}

/**
 * Gets all tags pointing to a specific commit.
 * @param {string} commitSha - The commit SHA to check for tags
 * @returns {Array<string>} Array of tag names, empty array if none
 */
function getTagsForCommit(commitSha) {
  try {
    const tagsOutput = runWithOutput(`git tag --points-at ${commitSha}`).trim();
    if (!tagsOutput) return [];
    return tagsOutput.split('\n').map(t => t.trim()).filter(Boolean);
  } catch (error) {
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
  if (!commits || commits.length === 0) {
    return { latestVersion: null, commits: [] };
  }
  
  // Find the index of the latest commit (first in array) that has a semver tag
  let latestSemverTagIndex = -1;
  let latestSemverTag = null;
  const semverPattern = /^v\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  
  for (let i = 0; i < commits.length; i++) {
    const commitTags = commits[i].tags || [];
    const semverTag = commitTags.find(tag => semverPattern.test(tag));
    if (semverTag) {
      latestSemverTagIndex = i;
      latestSemverTag = semverTag;
      break; // Found the latest (newest) semver-tagged commit
    }
  }
  
  // Get filtered commits (from start up to and including latest semver-tagged commit)
  let filteredCommits;
  if (latestSemverTagIndex === -1) {
    filteredCommits = commits;
  } else {
    filteredCommits = commits.slice(0, latestSemverTagIndex + 1);
  }
  
  return {
    latestVersion: latestSemverTag || null,
    commits: filteredCommits,
  };
}

/**
 * Extracts issue reference from commit message (e.g., #123 or (#123)).
 * @param {string} message - The commit message
 * @returns {string|null} Issue reference like "(#123)" or null if not found
 */
function extractIssueReference(message) {
  if (!message) return null;
  
  // Look for patterns like #123 or (#123) anywhere in the message
  const issuePattern = /\(?#(\d+)\)?/;
  const match = message.match(issuePattern);
  if (match) {
    return `(#${match[1]})`;
  }
  return null;
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
 * Calculates the next version and generates a changelog from expanded commit info.
 * @param {{latestVersion: string|null, commits: Array}} expandedInfo - Output from expandCommitInfo
 * @returns {{nextVersion: string, changelog: string}} Object with nextVersion and changelog
 */
function calculateNextVersionAndChangelog(expandedInfo) {
  const { latestVersion, commits } = expandedInfo;
  
  // Parse current version
  let currentMajor = 0;
  let currentMinor = 0;
  let currentPatch = 0;
  
  if (latestVersion) {
    const versionMatch = latestVersion.match(/^v(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/);
    if (versionMatch) {
      currentMajor = Number(versionMatch[1]);
      currentMinor = Number(versionMatch[2]);
      currentPatch = Number(versionMatch[3]);
    }
  }
  
  const isPreOneZero = currentMajor === 0;
  
  // Analyze commits to determine version bump
  let hasBreaking = false;
  let hasFeat = false;
  let hasPatchTypes = false; // fix, perf, refactor, test, build, ci, revert
  let hasNoBumpTypes = false; // style, docs, chore
  
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'style', 'test', 'docs', 'build', 'ci', 'chore', 'revert'];
  const patchTypes = ['fix', 'perf', 'refactor', 'test', 'build', 'ci', 'revert'];
  const noBumpTypes = ['style', 'docs', 'chore'];
  
  // Group commits by type for changelog
  const commitsByType = {};
  for (const type of typeOrder) {
    commitsByType[type] = [];
  }
  
  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.message);
    if (parsed) {
      const type = parsed.type;
      
      // Check for breaking changes (both ! indicator and BREAKING CHANGE: in body)
      const isBreaking = parsed.breaking || /BREAKING CHANGE:/i.test(commit.message);
      if (isBreaking) {
        hasBreaking = true;
      }
      
      // Track commit types
      if (type === 'feat') {
        hasFeat = true;
      } else if (patchTypes.includes(type)) {
        hasPatchTypes = true;
      } else if (noBumpTypes.includes(type)) {
        hasNoBumpTypes = true;
      }
      
      // Group for changelog
      if (commitsByType[type]) {
        commitsByType[type].push(commit);
      }
    }
  }
  
  // Determine version bump
  let versionBump = 'none';
  if (isPreOneZero) {
    // For 0.x.x versions
    if (hasBreaking) {
      versionBump = 'minor'; // 0.y.z → 0.(y+1).0
    } else if (hasFeat) {
      versionBump = 'minor'; // 0.y.z → 0.(y+1).0
    } else if (hasPatchTypes) {
      versionBump = 'patch'; // 0.y.z → 0.y.(z+1)
    }
    // style/docs/chore don't bump version
  } else {
    // For 1.x.x+ versions
    if (hasBreaking) {
      versionBump = 'major'; // X.y.z → (X+1).0.0
    } else if (hasFeat) {
      versionBump = 'minor'; // X.y.z → X.(y+1).0
    } else if (hasPatchTypes) {
      versionBump = 'patch'; // X.y.z → X.y.(z+1)
    }
    // style/docs/chore don't bump version
  }
  
  // Calculate next version
  let nextMajor = currentMajor;
  let nextMinor = currentMinor;
  let nextPatch = currentPatch;
  
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
  
  const nextVersion = `v${nextMajor}.${nextMinor}.${nextPatch}`;
  
  // Generate changelog
  const changelogLines = [];
  
  for (const type of typeOrder) {
    const typeCommits = commitsByType[type];
    if (!typeCommits || typeCommits.length === 0) continue;
    
    changelogLines.push(`### ${type}`);
    
    // Group by scope
    const byScope = {};
    const noScope = [];
    
    for (const commit of typeCommits) {
      const parsed = parseConventionalCommit(commit.message);
      if (!parsed) continue;
      
      const scope = parsed.scope;
      const issueRef = extractIssueReference(commit.message);
      const subject = commit.message.split('\n')[0].trim();
      
      // Format description from subject, removing type prefix
      const description = formatChangelogDescription(subject, parsed, commit.message);
      
      const entry = {
        scope: scope,
        description: description,
        issueRef: issueRef,
      };
      
      if (scope) {
        if (!byScope[scope]) {
          byScope[scope] = [];
        }
        byScope[scope].push(entry);
      } else {
        noScope.push(entry);
      }
    }
    
    // Add commits without scope first
    for (const entry of noScope) {
      const issuePart = entry.issueRef || '';
      changelogLines.push(`- ${entry.description}${issuePart}`);
    }
    
    // Add commits with scope, sorted by scope name
    const scopes = Object.keys(byScope).sort();
    for (const scope of scopes) {
      for (const entry of byScope[scope]) {
        const issuePart = entry.issueRef || '';
        changelogLines.push(`- **${scope}**: ${entry.description}${issuePart}`);
      }
    }
    
    changelogLines.push(''); // Empty line between sections
  }
  
  // Remove trailing empty line
  if (changelogLines.length > 0 && changelogLines[changelogLines.length - 1] === '') {
    changelogLines.pop();
  }
  
  const changelog = changelogLines.join('\n');
  
  return {
    nextVersion,
    changelog,
  };
}

/**
 * Processes version information for a branch, returning version details and changelog.
 * @param {string} branch - The branch to process
 * @returns {Promise<{previousVersion: string|null, nextVersion: string, commits: Array, conventionalCommits: Object, changelog: string}>} Promise resolving to version info
 */
async function processVersionInfo(branch) {
  try {
    // Validate git repository
    ensureGitRepo();
    
    // Validate branch name
    validateBranchName(branch);
    
    // Fetch tags locally
    fetchTagsLocally();
    
    // Get all commits from the branch
    const allCommits = getAllBranchCommits(branch);
    
    // Expand commit info to get latest version and filtered commits
    const expandedInfo = expandCommitInfo(allCommits);
    const { latestVersion, commits } = expandedInfo;
    
    // Generate conventionalCommits by grouping filtered commits by type
    const conventionalCommits = {};
    const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'style', 'test', 'docs', 'build', 'ci', 'chore', 'revert'];
    
    for (const type of typeOrder) {
      conventionalCommits[type] = [];
    }
    
    for (const commit of commits) {
      const parsed = parseConventionalCommit(commit.message);
      if (parsed) {
        const type = parsed.type;
        if (conventionalCommits[type]) {
          conventionalCommits[type].push({
            ...commit,
            conventional: parsed,
          });
        }
      }
    }
    
    // Calculate next version and generate changelog
    const { nextVersion, changelog } = calculateNextVersionAndChangelog(expandedInfo);
    
    return {
      previousVersion: latestVersion,
      nextVersion,
      commits,
      conventionalCommits,
      changelog,
    };
  } catch (error) {
    throw new Error(`Failed to process version info: ${error.message}`);
  }
}

/**
 * Retrieves all commits in the history of the specified branch, including merged commits.
 * Returns a simplified array with commit hash, datetime, author, commit message, and tags.
 * This includes all commits reachable from the branch, including those from merged branches.
 * @param {string} branch - The branch to get commits from
 * @returns {Array<{hash: string, datetime: string, author: string, message: string, tags: Array<string>}>} Array of commit objects
 */
function getAllBranchCommits(branch) {
  try {
    // First verify the branch exists
    try {
      runWithOutput(`git rev-parse --verify ${branch}`);
    } catch (branchError) {
      console.warn(`Warning: Branch ${branch} does not exist or cannot be accessed`);
      return [];
    }
    
    // Use a record separator to split commits (since messages can be multi-line)
    // Format: hash<RS>datetime<RS>author<RS>message<RS><RS> (double RS separates commits)
    const recordSeparator = '\x1E'; // ASCII 30 - Record Separator
    const commitSeparator = `${recordSeparator}${recordSeparator}`; // Double RS to separate commits
    const fieldSeparator = recordSeparator; // Single RS to separate fields within a commit
    
    // Use %B for full commit message (subject + body), %n for newlines
    const logCmd = `git log --format=%H${fieldSeparator}%ai${fieldSeparator}%an${fieldSeparator}%B${commitSeparator} ${branch}`;
    const commitsOutput = runWithOutput(logCmd).trim();
    
    if (!commitsOutput) {
      console.warn(`Warning: No commits found for branch ${branch}`);
      return [];
    }
    
    // Split by double record separator to get individual commits
    const commitBlocks = commitsOutput.split(commitSeparator).filter(block => block.trim());
    const commits = [];
    
    for (const block of commitBlocks) {
      const parts = block.split(fieldSeparator);
      if (parts.length >= 4) {
        const hash = parts[0].trim();
        const tags = getTagsForCommit(hash);
        // The message is everything after the third field separator
        // It may contain the field separator, so we need to rejoin
        const message = parts.slice(3).join(fieldSeparator).trim();
        commits.push({
          hash: hash,
          datetime: parts[1].trim(),
          author: parts[2].trim(),
          message: message,
          tags: tags,
        });
      } else {
        // Log parsing issues for debugging
        console.error(`Error: Could not parse commit block (expected at least 4 parts, got ${parts.length}): ${block.substring(0, 80)}...`);
      }
    }
    
    return commits;
  } catch (error) {
    // Log the error for debugging
    console.warn(`Error retrieving commits for branch ${branch}:`, error.message);
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

