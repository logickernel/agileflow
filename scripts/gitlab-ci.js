#!/usr/bin/env node
'use strict';

const fs = require('fs');
const {
  ensureGitRepo,
  configureUser,
  createAnnotatedTag,
  pushTag,
  runWithOutput,
  run,
  buildTagMessage,
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

function calculateNextVersion(commitMessages = []) {
  const currentVersion = getLatestVersion();

  let versionBump = 'none';

  if (commitMessages && commitMessages.length > 0) {
    console.log(`Analyzing ${commitMessages.length} commit messages for version bump...`);
    
    // Log first few commit messages for debugging
    const sampleMessages = commitMessages.slice(0, 5);
    console.log(`Sample commit messages: ${sampleMessages.map(m => `"${m}"`).join(', ')}`);
    
    // Check for breaking changes according to conventional commit standards:
    // 1. feat!, feat(scope)!, fix!, fix(scope)!, etc.
    // 2. BREAKING CHANGE: in commit body
    const containsBreakingChanges = commitMessages.some(message => {
      const trimmed = message.trim();
      // Check for breaking change indicator in commit type (e.g., feat!, feat(scope)!)
      // Use the same regex pattern as git-utils.js for consistency
      const hasBreakingIndicator = /^(\w+)(!)(?:\(([^)]+)\))?:\s+(.+)$/i.test(trimmed);
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

    // Debug logging
    console.log(`Breaking changes detected: ${containsBreakingChanges}`);
    console.log(`Features detected: ${containsFeatures}`);
    console.log(`Fixes detected: ${containsFixes}`);
    console.log(`Performance changes detected: ${containsPerformance}`);
    
    // Show examples of breaking changes if any are detected
    if (containsBreakingChanges) {
      const breakingExamples = commitMessages.filter(message => {
        const trimmed = message.trim();
        const hasBreakingIndicator = /^(\w+)(!)(?:\(([^)]+)\))?:\s+(.+)$/i.test(trimmed);
        const hasBreakingChangeComment = /BREAKING CHANGE:/i.test(trimmed);
        return hasBreakingIndicator || hasBreakingChangeComment;
      });
      console.log(`Breaking change examples: ${breakingExamples.map(m => `"${m}"`).join(', ')}`);
    }

    if (currentVersion.major > 0) {
      if (containsBreakingChanges) {
        versionBump = 'major';
      } else if (containsFeatures) {
        versionBump = 'minor';
      } else if (containsFixes || containsPerformance) {
        versionBump = 'patch';
      }
    } else {
      // For 0.x.x versions, breaking changes bump minor, features bump patch
      if (containsBreakingChanges) {
        versionBump = 'minor';
      } else if (containsFeatures || containsFixes || containsPerformance) {
        versionBump = 'patch';
      }
    }
  }
  
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
  
  const tag = `v${nextMajor}.${nextMinor}.${nextPatch}${currentVersion.metadata}`;
  console.log(`Version bump: ${versionBump} (${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch} → ${nextMajor}.${nextMinor}.${nextPatch})`);
  return { tag, versionBump, currentVersion: `${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}` };
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

    // Fetch all tags and refs first before any tag operations
    console.log('Fetching all tags and refs...');
    try {
      run('git fetch --all --tags --prune --prune-tags');
      console.log('All tags and refs fetched successfully');
    } catch (fetchError) {
      console.warn('Warning: Failed to fetch all tags:', fetchError.message);
      console.warn('Continuing with locally available tags...');
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
    const CI_JOB_TOKEN = requireEnv('CI_JOB_TOKEN');
    const CI_SERVER_HOST = requireEnv('CI_SERVER_HOST');
    const CI_PROJECT_PATH = requireEnv('CI_PROJECT_PATH');
    console.log('Environment variables loaded');

    // Configure git user
    configureUser(GITLAB_USER_NAME, GITLAB_USER_EMAIL);
    console.log(`Git user configured: ${GITLAB_USER_NAME} <${GITLAB_USER_EMAIL}>`);

    // Get commit messages since the last version for version calculation
    console.log('Getting commit messages since last version...');
    const currentVersion = getLatestVersion();
    const previousTag = currentVersion.major === 0 && currentVersion.minor === 0 && currentVersion.patch === 0 
      ? null 
      : `v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}${currentVersion.metadata}`;
    
    // Get commit subjects since the previous tag
    const { getCommitSubjectsSince } = require('./git-utils');
    const commitMessages = getCommitSubjectsSince(previousTag, 100);
    console.log(`Found ${commitMessages.length} commit messages since last version`);

    // Build tag name automatically from the current branch
    // Format: v<major>.<minor>.<patch>
    console.log('Building next version tag...');
    const { tag, versionBump, currentVersion: currentVersionString } = calculateNextVersion(commitMessages);
    console.log(`Next version tag: ${tag}`);

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
    const tagMessage = buildTagMessage(tag, { maxCommitLines: 100, includeMergeCommits: false });
    console.log(`Tag message created (${tagMessage.split('\n').length} lines)`);
    
    console.log('Creating annotated tag...');
    createAnnotatedTag(tag, tagMessage);
    console.log(`Tag ${tag} created locally`);

    // Push tag to GitLab using CI token
    console.log('Pushing tag to GitLab...');
    const encodedToken = encodeURIComponent(CI_JOB_TOKEN);
    const remoteUrl = `https://gitlab-ci-token:${encodedToken}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git`;
    try {
      pushTag(remoteUrl, tag);
      console.log(`Tag ${tag} pushed successfully to GitLab`);
    } catch (pushError) {
      const captured = pushError && pushError._captured ? pushError._captured : {};
      const combined = `${captured.stdout || ''}\n${captured.stderr || ''}\n${pushError.message || ''}`;
      const normalized = combined.toLowerCase();

      const has403 = /\b403\b/.test(normalized) || /requested url returned error: 403/.test(normalized);
      const deniesPush = normalized.includes('you are not allowed to push') || normalized.includes('not allowed to push code');

      if (has403 && deniesPush) {
        console.error('The CI_JOB_TOKEN job token is not permitted to push to the repository.');
        console.error('\nHow to fix:');
        console.error('- Ensure the feature flag "allow_push_repository_for_job_token" is enabled.\n');
        console.error('- Then in your project, go to Settings > CI/CD > Job token permissions (Token Access)\n');
        console.error(`  https://${CI_SERVER_HOST}/${CI_PROJECT_PATH}/-/settings/ci_cd`);
        console.error('\n');
        console.error('\nSee:'); 
        console.error('\n - https://docs.gitlab.com/ee/ci/jobs/ci_job_token.html#git-push-to-your-project-repository');
        console.error('\n - https://docs.gitlab.com/ee/administration/feature_flags.html');
        console.error('\nAfter enabling, retry this pipeline.');
        process.exit(1);
      }
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


