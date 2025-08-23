#!/usr/bin/env node
'use strict';

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



function getCurrentBranchName() {
  // Prefer CI-provided ref name when available (handles detached HEAD)
  const envName = process.env.CI_COMMIT_REF_NAME;
  if (envName && envName.trim() !== '') return envName.trim();
  const name = runWithOutput('git rev-parse --abbrev-ref HEAD').trim();
  return name;
}

function getLatestVersion() {
  // Get the latest version tag from the current branch
  const out = runWithOutput('git tag --list "v*" --sort=v:refname') || '';
  const tags = out.split('\n').map((s) => s.trim()).filter(Boolean);
  if (tags.length === 0) return { major: 0, minor: 0, patch: 0 };
  
  const lastTag = tags[tags.length - 1];
  const m = lastTag.match(/^v\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/);
  if (!m) return { major: 0, minor: 0, patch: 0 };
  
  return { 
    major: Number(m[1]), 
    minor: Number(m[2]), 
    patch: Number(m[3]) 
  };
}

function buildNextTag() {
  // Ensure we see all tags before computing next version
  try {
    run('git fetch --all --tags --prune --prune-tags');
  } catch (_) {
    // Non-fatal; continue with whatever tags are present locally
  }
  
  const currentVersion = getLatestVersion();
  const nextPatch = currentVersion.patch + 1;
  const tag = `v${currentVersion.major}.${currentVersion.minor}.${nextPatch}`;
  return tag;
}

function main() {
  try {
    // Check if we're running on a tag and handle semver output
    const CI_COMMIT_TAG = process.env.CI_COMMIT_TAG;
    if (CI_COMMIT_TAG && CI_COMMIT_TAG.trim() !== '') {
      const tag = CI_COMMIT_TAG.trim();
      // Check if it's a semver tag starting with 'v'
      const semverMatch = tag.match(/^v(\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?)$/);
      if (semverMatch) {
        // Print version without 'v' prefix and exit successfully
        console.log(semverMatch[1]);
        process.exit(0);
      }
    }

    ensureGitRepo();

    const GITLAB_USER_NAME = requireEnv('GITLAB_USER_NAME');
    const GITLAB_USER_EMAIL = requireEnv('GITLAB_USER_EMAIL');
    const CI_JOB_TOKEN = requireEnv('CI_JOB_TOKEN');
    const CI_SERVER_HOST = requireEnv('CI_SERVER_HOST');
    const CI_PROJECT_PATH = requireEnv('CI_PROJECT_PATH');

    // Configure git user
    configureUser(GITLAB_USER_NAME, GITLAB_USER_EMAIL);

    // Build tag name automatically from the current branch
    // Format: v<major>.<minor>.<patch>
    const TAG = buildNextTag();

    // Create annotated tag message: version + summarized commits since previous tag
    const tagMessage = buildTagMessage(TAG, { maxCommitLines: 100, includeMergeCommits: false });
    createAnnotatedTag(TAG, tagMessage);

    // Push tag to GitLab using CI token
    const encodedToken = encodeURIComponent(CI_JOB_TOKEN);
    const remoteUrl = `https://gitlab-ci-token:${encodedToken}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git`;
    try {
      pushTag(remoteUrl, TAG);
    } catch (pushError) {
      const captured = pushError && pushError._captured ? pushError._captured : {};
      const combined = `${captured.stdout || ''}\n${captured.stderr || ''}\n${pushError.message || ''}`;
      const normalized = combined.toLowerCase();

      const has403 = /\b403\b/.test(normalized) || /requested url returned error: 403/.test(normalized);
      const deniesPush = normalized.includes('you are not allowed to push') || normalized.includes('not allowed to push code');

      if (has403 && deniesPush) {
        console.error('\nGit push denied for CI_JOB_TOKEN (403).');
        console.error('The CI_JOB_TOKEN job token is not permitted to push to the repository.');
        console.error('\nHow to fix:');
        console.error('- Ensure the feature flag "allow_push_repository_for_job_token" is enabled. See: https://archives.docs.gitlab.com/ee/administration/feature_flags.html');
        console.error('- Then in your project, go to Settings > CI/CD > Job token permissions (Token Access)\n');
        console.error(`  https://${CI_SERVER_HOST}/${CI_PROJECT_PATH}/-/settings/ci_cd`);
        console.error('  and enable "Allow Git push requests to the repository".');
        console.error('\nDocs: https://docs.gitlab.com/ee/ci/jobs/ci_job_token.html#git-push-to-your-project-repository');
        console.error('\nAfter enabling, retry this pipeline.');
        process.exit(1);
      }
      throw pushError;
    }

    // Only print the version on success (without 'v' prefix)
    const versionWithoutV = TAG.replace(/^v/, '');
    console.log(versionWithoutV);
  } catch (err) {
    if (err && err.status) {
      process.exit(err.status);
    }
    process.exit(1);
  }
}

main();


