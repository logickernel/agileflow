#!/usr/bin/env node
'use strict';

const {
  ensureGitRepo,
  configureUser,
  createAnnotatedTag,
  pushTag,
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

    // Build tag name
    const TAG = `ci-test-${utcTimestamp()}`;

    // Create annotated tag
    createAnnotatedTag(TAG, `CI test tag ${TAG}`);

    // Push tag to GitLab using CI token
    const encodedToken = encodeURIComponent(CI_JOB_TOKEN);
    const remoteUrl = `https://gitlab-ci-token:${encodedToken}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git`;
    pushTag(remoteUrl, TAG);

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


