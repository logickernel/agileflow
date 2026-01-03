#!/usr/bin/env node
'use strict';

const {
  ensureGitRepo,
  fetchTagsLocally,
  validateBranchName,
  getAllBranchCommits,
  expandCommitInfo,
  calculateNextVersionAndChangelog,
} = require('./utils');




function main(branch = 'main') {
  try {
    console.log('Starting AgileFlow versioning process...');

    ensureGitRepo();
    console.log('Git repository verified');

    validateBranchName(branch);

    console.log('Fetching tags locally (non-destructive)...');
    fetchTagsLocally();

    // Get all commits from the branch
    console.log(`\nRetrieving all commits from branch: ${branch}`);
    const allCommits = getAllBranchCommits(branch);
    console.log(`Found ${allCommits.length} commits in branch history`);

    // Expand commit info to get latest version and filtered commits
    console.log(`\nExpanding commit info...`);
    const expandedInfo = expandCommitInfo(allCommits);
    console.log(`Latest version: ${expandedInfo.latestVersion || 'none found'}`);
    console.log(`Found ${expandedInfo.commits.length} commits since latest version`);
    
    // Calculate next version and generate changelog
    console.log(`\nCalculating next version and changelog...`);
    const { nextVersion, changelog } = calculateNextVersionAndChangelog(expandedInfo);
    console.log(`Next version: ${nextVersion}`);
    console.log(`\nChangelog:\n${changelog}`); 

    // COMMENTED OUT - Refactoring in progress
    /*
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

    // LOCAL MODE: Use defaults for environment variables
    const GITLAB_USER_NAME = getEnv('GITLAB_USER_NAME', 'Test User');
    const GITLAB_USER_EMAIL = getEnv('GITLAB_USER_EMAIL', 'test@example.com');
    const CI_SERVER_HOST = getEnv('CI_SERVER_HOST', null);
    const CI_PROJECT_PATH = getEnv('CI_PROJECT_PATH', null);
    console.log('\nEnvironment variables:');
    console.log(`  GITLAB_USER_NAME: ${GITLAB_USER_NAME}`);
    console.log(`  GITLAB_USER_EMAIL: ${GITLAB_USER_EMAIL}`);
    console.log(`  CI_SERVER_HOST: ${CI_SERVER_HOST || '(not set)'}`);
    console.log(`  CI_PROJECT_PATH: ${CI_PROJECT_PATH || '(not set)'}`);

    // Configure git user
    configureUser(GITLAB_USER_NAME, GITLAB_USER_EMAIL);
    console.log(`Git user configured: ${GITLAB_USER_NAME} <${GITLAB_USER_EMAIL}>`);

    // Get commit messages since the last version for version calculation
    console.log('\nGetting commit messages since last version...');
    const currentVersion = getLatestVersion();
    console.log(`Current version detected: ${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}${currentVersion.metadata}`);
    
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
    
    console.log(`Previous tag calculated: ${previousTag || 'null (first version)'}`);
    
    // Get commit subjects since the previous tag
    const { getCommitSubjectsSince } = require('./git-utils');
    let commitMessages;
    
    if (previousTag === null) {
      // First version scenario: get all commit messages from the beginning
      console.log('First version detected - getting all commit messages from repository start...');
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
    console.log(`Previous tag used for commit analysis: ${previousTag || 'none (first version)'}`);

    // Build tag name automatically from the current branch
    // Format: v<major>.<minor>.<patch>
    console.log('\nBuilding next version tag...');
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
      console.log('\nNo version bump needed. Writing current version to VERSION file and exiting.');
      writeVersionFile(`v${currentVersionString}`);
      logCommitPipelinesUrl(CI_SERVER_HOST, CI_PROJECT_PATH);
      console.log('AgileFlow versioning completed: no version bump needed');
      process.exit(0);
    }

    // Create annotated tag message: version + summarized commits since previous tag
    console.log('\nBuilding tag message...');
    const tagMessage = buildTagMessage(tag, { 
      maxCommitLines: 100, 
      includeMergeCommits: false,
      previousTag: previousTag 
    });
    console.log(`Tag message created (${tagMessage.split('\n').length} lines)`);
    console.log('\nTag message preview (first 15 lines):');
    console.log('-'.repeat(60));
    console.log(tagMessage.split('\n').slice(0, 15).join('\n'));
    if (tagMessage.split('\n').length > 15) {
      console.log('... (truncated)');
    }
    console.log('-'.repeat(60));

    // LOCAL MODE: Create local tag instead of pushing via API
    console.log('\n[LOCAL MODE] Creating local tag (not pushing to remote)...');
    
    try {
      // Check if tag already exists locally
      try {
        runWithOutput(`git rev-parse ${tag}`);
        console.warn(`Warning: Tag ${tag} already exists locally. Skipping tag creation.`);
        console.warn('To recreate the tag, delete it first with: git tag -d ' + tag);
      } catch (tagNotFoundError) {
        // Tag doesn't exist, create it
        createAnnotatedTag(tag, tagMessage);
        console.log(`Local tag ${tag} created successfully`);
      }
    } catch (tagError) {
      console.error(`Error creating local tag: ${tagError.message}`);
      throw tagError;
    }

    // Write the version to VERSION file in VERSION=... format for GitLab CI
    writeVersionFile(tag);

    // Log commit pipelines URL at the end of all success outcomes (if CI env vars are set)
    logCommitPipelinesUrl(CI_SERVER_HOST, CI_PROJECT_PATH);
    console.log('\n' + '='.repeat(60));
    console.log(`AgileFlow versioning completed successfully: ${tag}`);
    console.log('\n[LOCAL MODE] Tag was created locally only.');
    console.log('To push the tag to remote, run: git push origin ' + tag);
    console.log('='.repeat(60));
    */
  } catch (err) {
    console.error('\nError during AgileFlow versioning:', err.message);
    if (err && err.status) {
      process.exit(err.status);
    }
    process.exit(1);
  }
}

// If called directly (not via require), parse args and call main
if (require.main === module) {
  // Parse arguments when called directly
  const args = process.argv.slice(2);
  let branch = 'main';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--branch' && i + 1 < args.length) {
      branch = args[i + 1];
      break;
    }
  }
  main(branch);
} else {
  // Export main function when required as a module
  module.exports = main;
}

