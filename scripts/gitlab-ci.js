#!/usr/bin/env node
'use strict';

const fs = require('fs');
const {
  ensureGitRepo,
  configureUser,
  createAnnotatedTag,
  pushTag,
  buildTagMessage,
  getLatestVersion,
} = require('./git-utils');

function requireEnv(varName) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
  return value;
}

function logCommitPipelinesUrl(ciServerHost, ciProjectPath) {
  // Use env variables to calculate the URL of the commit pipelines based on https://code.logickernel.com/kernel/agileflow/-/commit/d8312b0afc11356cec9b84bdfdc322314650717e/pipelines
  const commitUrl = `https://${ciServerHost}/${ciProjectPath}/-/commit/${process.env.CI_COMMIT_SHA}/pipelines`;
  console.log(`Commit pipelines URL: ${commitUrl}`);
}




function calculateNextVersion(commitMessages = []) {
  // Use the new functions from git-utils.js
  const { calculateNextVersion: calculateNextVersionFromUtils, analyzeCommitMessages, getLatestVersion } = require('./git-utils');
  
  const currentVersion = getLatestVersion();
  
  // Analyze commit messages for debugging
  if (commitMessages && commitMessages.length > 0) {
    console.log(`Analyzing ${commitMessages.length} commit messages for version bump...`);
    const analysis = analyzeCommitMessages(commitMessages);
    
    // Log first few commit messages for debugging
    const sampleMessages = commitMessages.slice(0, 5);
    console.log(`Sample commit messages: ${sampleMessages.map(m => `"${m}"`).join(', ')}`);
    
    // Log analysis results
    console.log(`Breaking changes detected: ${analysis.breakingChanges.length > 0} (${analysis.breakingChanges.length})`);
    console.log(`Features detected: ${analysis.features.length > 0} (${analysis.features.length})`);
    console.log(`Fixes detected: ${analysis.fixes.length > 0} (${analysis.fixes.length})`);
    console.log(`Performance changes detected: ${analysis.performance.length > 0} (${analysis.performance.length})`);
    console.log(`Build changes detected: ${analysis.build.length > 0} (${analysis.build.length})`);
    
    // Show examples of breaking changes if any are detected
    if (analysis.breakingChanges.length > 0) {
      console.log(`Breaking change examples: ${analysis.breakingChanges.map(m => `"${m}"`).join(', ')}`);
    }
  }
  
  const result = calculateNextVersionFromUtils(commitMessages, currentVersion);
  
  // Log the version bump for debugging
  console.log(`Version bump: ${result.versionBump} (${result.currentVersion} → ${result.nextVersion.major}.${result.nextVersion.minor}.${result.nextVersion.patch})`);
  
  return result;
}

function writeVersionFile(version) {
  // Remove the 'v' prefix if present for the VERSION file
  const versionWithoutV = version.replace(/^v/, '');
  console.log(`Writing version ${versionWithoutV} to VERSION file`);
  fs.writeFileSync('VERSION', `VERSION=${versionWithoutV}\n`);
  console.log('Version environment file created successfully');
}

function main() {
  try {
    console.log('Starting AgileFlow versioning process...');
    ensureGitRepo();
    console.log('Git repository verified');

    // Clean and sync repository with remote
    console.log('Cleaning and syncing repository...');
    try {
      // Reset any local changes and ensure clean state
      run('git reset --hard HEAD');
      run('git clean -fd');
      
      // Fetch all tags and refs with pruning
      run('git fetch --all --tags --prune --prune-tags');
      console.log('Repository cleaned and synced successfully');
      
      // Debug: show what tags are available after cleanup
      try {
        const availableTags = runWithOutput('git tag --list "v*" --sort=v:refname') || '';
        const tags = availableTags.split('\n').map(s => s.trim()).filter(Boolean);
        console.log(`Debug: Available version tags after cleanup: ${tags.join(', ')}`);
      } catch (tagError) {
        console.warn('Debug: Could not list tags:', tagError.message);
      }
    } catch (cleanupError) {
      console.warn('Warning: Failed to clean repository:', cleanupError.message);
      console.warn('Continuing with current state...');
    }

    // Check if we're running on a tag and handle semver output
    const CI_COMMIT_TAG = process.env.CI_COMMIT_TAG;
    if (CI_COMMIT_TAG && CI_COMMIT_TAG.trim() !== '') {
      const tag = CI_COMMIT_TAG.trim();
      console.log(`Running on existing version tag provided by CI_COMMIT_TAG=${tag}`);
      // Check if it's a semver tag starting with 'v'
      const semverMatch = tag.match(/^v(\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?)$/);
      if (semverMatch) {
        // Write version to VERSION file in VERSION=... format and exit successfully
        const version = semverMatch[1];
        writeVersionFile(version);
        logCommitPipelinesUrl(process.env.CI_SERVER_HOST, process.env.CI_PROJECT_PATH);
        console.log('AgileFlow versioning completed: existing tag detected');
        process.exit(0);
      }
      console.log('Tag is not a valid semver tag, proceeding with normal flow');
    }

    const GITLAB_USER_NAME = requireEnv('GITLAB_USER_NAME');
    const GITLAB_USER_EMAIL = requireEnv('GITLAB_USER_EMAIL');
    const CI_SERVER_HOST = requireEnv('CI_SERVER_HOST');
    const CI_PROJECT_PATH = requireEnv('CI_PROJECT_PATH');
    console.log('Environment variables loaded');

    // Configure git user
    configureUser(GITLAB_USER_NAME, GITLAB_USER_EMAIL);
    console.log(`Git user configured: ${GITLAB_USER_NAME} <${GITLAB_USER_EMAIL}>`);

    // Get commit messages since the last version for version calculation
    console.log('Getting commit messages since last version...');
    const currentVersion = getLatestVersion();
    console.log(`Debug: Current version detected: ${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}${currentVersion.metadata}`);
    
    // Check if this is an empty repository
    try {
      const hasCommits = runWithOutput('git rev-list --count HEAD') || '0';
      if (hasCommits === '0') {
        console.error('Error: Repository has no commits. Cannot proceed with versioning.');
        console.error('Please make at least one commit before running AgileFlow.');
        process.exit(1);
      }
    } catch (error) {
      console.warn('Warning: Could not verify commit count:', error.message);
    }
    
    const previousTag = currentVersion.major === 0 && currentVersion.minor === 0 && currentVersion.patch === 0 
      ? null 
      : `v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}${currentVersion.metadata}`;
    
    console.log(`Debug: Previous tag calculated: ${previousTag || 'null (first push)'}`);
    
    // Get commit subjects since the previous tag
    const { getCommitSubjectsSince } = require('./git-utils');
    let commitMessages;
    
    if (previousTag === null) {
      // First push scenario: get all commit messages from the beginning
      console.log('First push detected - getting all commit messages from repository start...');
      commitMessages = getCommitSubjectsSince(null, 100);
      
      // If still no commit messages, try to get them from the beginning of the branch
      if (commitMessages.length === 0) {
        console.log('No commit messages found with previous method, trying alternative approach...');
        try {
          const allCommits = runWithOutput('git log --pretty=format:%s -n 100') || '';
          commitMessages = allCommits.split('\n').map(s => s.trim()).filter(Boolean);
          console.log(`Found ${commitMessages.length} commit messages using alternative method`);
        } catch (error) {
          console.warn('Alternative commit retrieval failed:', error.message);
          commitMessages = [];
        }
      }
      
      // Final check: if we still have no commits, this might be an empty repository
      if (commitMessages.length === 0) {
        console.warn('Warning: No commits found in repository. This might be an empty repository.');
        console.warn('Proceeding with empty commit messages array - version will remain 0.0.0');
      }
    } else {
      console.log(`Getting commit messages since previous tag: ${previousTag}`);
      commitMessages = getCommitSubjectsSince(previousTag, 100);
    }
    
    console.log(`Found ${commitMessages.length} commit messages since last version`);
    console.log(`Previous tag used for commit analysis: ${previousTag || 'none (first push)'}`);

    // Build tag name automatically from the current branch
    // Format: v<major>.<minor>.<patch>
    console.log('Building next version tag...');
    console.log(`Current version: ${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`);
    console.log(`Commit messages to analyze: ${commitMessages.length}`);
    if (commitMessages.length > 0) {
      console.log(`Sample commit messages: ${commitMessages.slice(0, 3).map(m => `"${m}"`).join(', ')}`);
    }
    
    const { tag, versionBump, currentVersion: currentVersionString } = calculateNextVersion(commitMessages);
    console.log(`Next version tag: ${tag}`);
    console.log(`Version bump type: ${versionBump}`);

    // Check if version bump is needed
    if (versionBump === 'none') {
      console.log('No version bump needed. Writing current version to VERSION file and exiting.');
      writeVersionFile(`v${currentVersionString}`);
      logCommitPipelinesUrl(CI_SERVER_HOST, CI_PROJECT_PATH);
      console.log('AgileFlow versioning completed: no version bump needed');
      process.exit(0);
    }

    // Create annotated tag message: version + summarized commits since previous tag
    console.log('Building tag message...');
    const tagMessage = buildTagMessage(tag, { 
      maxCommitLines: 100, 
      includeMergeCommits: false,
      previousTag: previousTag 
    });
    console.log(`Tag message created (${tagMessage.split('\n').length} lines)`);
    console.log('Tag message preview (first 10 lines):');
    console.log(tagMessage.split('\n').slice(0, 10).join('\n'));
    if (tagMessage.split('\n').length > 10) {
      console.log('... (truncated)');
    }

    // Push tag to GitLab using AGILEFLOW_TOKEN (creates tag remotely)
    console.log('Pushing tag to GitLab...');
    
    const AGILEFLOW_TOKEN = process.env.AGILEFLOW_TOKEN;
    
    try {
      pushTag(CI_PROJECT_PATH, CI_SERVER_HOST, AGILEFLOW_TOKEN, tag, tagMessage);
      console.log(`Tag ${tag} created successfully via GitLab API`);
    } catch (pushError) {
      // Don't log the error here since it will be logged by the main error handler
      throw pushError;
    }

    // Write the version to VERSION file in VERSION=... format for GitLab CI
    writeVersionFile(tag);

    // Log commit pipelines URL at the end of all success outcomes
    logCommitPipelinesUrl(CI_SERVER_HOST, CI_PROJECT_PATH);
    console.log(`AgileFlow versioning completed successfully: ${tag}`);
  } catch (err) {
    console.error('Error during AgileFlow versioning:', err.message);
    if (err && err.status) {
      process.exit(err.status);
    }
    process.exit(1);
  }
}

main();


