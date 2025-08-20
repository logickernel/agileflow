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

function utcTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function parseReleaseBranchName(branchName) {
  // Expected formats: release/X.Y or origin/release/X.Y
  const match = branchName.match(/(?:^|\/)release\/(\d+)\.(\d+)$/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]) };
}

function getCurrentBranchName() {
  // Prefer CI-provided ref name when available (handles detached HEAD)
  const envName = process.env.CI_COMMIT_REF_NAME;
  if (envName && envName.trim() !== '') return envName.trim();
  const name = runWithOutput('git rev-parse --abbrev-ref HEAD').trim();
  return name;
}

function getLatestPatchForRelease(major, minor) {
  // List tags matching vMAJOR.MINOR.PATCH, sort by version, take highest patch
  // Using git tag --list 'vM.N.*' with --sort=v:refname gives natural version sort (requires v prefix)
  const pattern = `v${major}.${minor}.*`;
  const out = runWithOutput(`git tag --list "${pattern}" --sort=v:refname`) || '';
  const tags = out.split('\n').map((s) => s.trim()).filter(Boolean);
  if (tags.length === 0) return -1;
  const last = tags[tags.length - 1];
  const m = last.match(/^v\d+\.\d+\.(\d+)$/);
  return m ? Number(m[1]) : -1;
}

function buildNextTagFromReleaseBranch() {
  // Ensure we see all tags before computing next patch
  try {
    run('git fetch --all --tags --prune --prune-tags');
  } catch (_) {
    // Non-fatal; continue with whatever tags are present locally
  }
  const branch = getCurrentBranchName();
  const parsed = parseReleaseBranchName(branch);
  if (!parsed) {
    throw new Error(`Current branch '${branch}' is not a release branch (expected 'release/X.Y').`);
  }
  const { major, minor } = parsed;
  const latestPatch = getLatestPatchForRelease(major, minor);
  const nextPatch = latestPatch + 1;
  return `v${major}.${minor}.${nextPatch}`;
}

function main() {
  try {
    ensureGitRepo();

    const GITLAB_USER_NAME = requireEnv('GITLAB_USER_NAME');
    const GITLAB_USER_EMAIL = requireEnv('GITLAB_USER_EMAIL');
    const CI_JOB_TOKEN = requireEnv('CI_JOB_TOKEN');
    const CI_SERVER_HOST = requireEnv('CI_SERVER_HOST');
    const CI_PROJECT_PATH = requireEnv('CI_PROJECT_PATH');

    // Configure git user
    configureUser(GITLAB_USER_NAME, GITLAB_USER_EMAIL);

    // Build tag name automatically from current release branch
    // Format: v<major>.<minor>.<patch>
    const TAG = buildNextTagFromReleaseBranch();

    // Create annotated tag message: version + summarized commits since previous tag on same release line
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
        console.error('- Ensure the feature flag "allow_push_repository_for_job_token" is enabled. See: https://archives.docs.gitlab.com/17.4/ee/administration/feature_flags.html');
        console.error('- Then in your project, go to Settings > CI/CD > Job token permissions (Token Access)\n');
        console.error(`  https://${CI_SERVER_HOST}/${CI_PROJECT_PATH}/-/settings/ci_cd`);
        console.error('  and enable "Allow Git push requests to the repository".');
        console.error('\nDocs: https://archives.docs.gitlab.com/17.4/ee/ci/jobs/ci_job_token.html#git-push-to-your-project-repository');
        console.error('\nAfter enabling, retry this pipeline.');
        process.exit(1);
      }
      throw pushError;
    }

    console.log(`Created and pushed tag: ${TAG}`);
  } catch (err) {
    if (err && err.status) {
      process.exit(err.status);
    }
    console.error(err);
    process.exit(1);
  }
}

main();


