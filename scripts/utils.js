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
      console.log('Tags fetched successfully');
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
 * Processes commits to find the latest version and group by conventional commit types.
 * Filters out commits that are older than the latest commit with a semver tag.
 * Commits are expected to be ordered from newest to oldest.
 * @param {Array<{hash: string, datetime: string, author: string, message: string, tags: Array<string>}>} commits - Array of commit objects
 * @returns {{latestVersion: string|null, commits: Array, conventionalCommits: Object}} Object with latestVersion, filtered commits array, and conventional commits grouped by type
 */
function processCurrentVersion(commits) {
  if (!commits || commits.length === 0) {
    return { latestVersion: null, commits: [], conventionalCommits: {} };
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
  
  // Group commits by conventional commit type
  const conventionalCommits = {};
  
  for (const commit of filteredCommits) {
    const parsed = parseConventionalCommit(commit.message);
    if (parsed) {
      const type = parsed.type;
      if (!conventionalCommits[type]) {
        conventionalCommits[type] = [];
      }
      conventionalCommits[type].push({
        ...commit,
        conventional: parsed,
      });
    }
  }
  
  return {
    latestVersion: latestSemverTag || null,
    commits: filteredCommits,
    conventionalCommits: conventionalCommits,
  };
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
  processCurrentVersion,
  parseConventionalCommit,
};

