'use strict';

const { version } = require('../package.json');
const { processVersionInfo } = require('./utils');

function printHelp() {
  console.log(`agileflow - Automatic semantic versioning and changelog generation tool.

Usage:
  agileflow [options]
  agileflow <command>

Commands:
  <none>   Prints the current version, next version, commits, and changelog
  push [remote]  Push a semantic version tag to the remote repository (default: origin)
  gitlab   Create a semantic version tag via GitLab API (for GitLab CI)
  github   Create a semantic version tag via GitHub API (for GitHub Actions)
  version  Print the agileflow tool version

Options:
  -h, --help     Show this help message

For more information, visit: https://code.logickernel.com/tools/agileflow
`);
}

/**
 * Valid options that can be passed to commands.
 */
const VALID_OPTIONS = ['--help', '-h'];

/**
 * Valid commands.
 */
const VALID_COMMANDS = ['push', 'gitlab', 'github', 'version'];

/**
 * Parses command line arguments and validates them.
 * @param {Array<string>} args - Command line arguments
 * @throws {Error} If invalid options are found
 */
function parseArgs(args) {
  for (const arg of args) {
    if (arg.startsWith('--') && !VALID_OPTIONS.includes(arg)) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (arg.startsWith('-') && !arg.startsWith('--') && !VALID_OPTIONS.includes(arg)) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
}

/**
 * Displays version info to the console.
 * @param {{currentVersion: string|null, newVersion: string|null, commits: Array, changelog: string}} info
 */
function displayVersionInfo(info) {
  const { currentVersion, newVersion, commits, changelog } = info;

  // List commits
  console.log(`Commits since current version (${commits.length}):`);
  for (const commit of commits) {
    const subject = commit.message.split('\n')[0].trim();
    const shortHash = commit.hash.substring(0, 7);
    console.log(`  ${shortHash} ${subject}`);
  }
  
  console.log(`\nCurrent version: ${currentVersion || 'none'}`);
  console.log(`New version:     ${newVersion || 'no bump needed'}`);
  if (changelog) {
    console.log(`\nChangelog:\n\n${changelog}`);
  }
}

/**
 * Handles a push command.
 * @param {string} pushType - 'push', 'gitlab', or 'github'
 * @param {string} remote
 */
async function handlePushCommand(pushType, remote = 'origin') {
  const info = await processVersionInfo();

  displayVersionInfo(info);

  if (!info.newVersion) {
    return;
  }

  let pushModule;
  switch (pushType) {
    case 'push':
      pushModule = require('./git-push');
      break;
    case 'gitlab':
      pushModule = require('./gitlab-push');
      break;
    case 'github':
      pushModule = require('./github-push');
      break;
  }

  const tagMessage = info.changelog || info.newVersion;

  console.log(`\nCreating tag ${info.newVersion}...`);

  await pushModule.pushTag(info.newVersion, tagMessage, remote);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  
  try {
    parseArgs(cmd ? [cmd, ...rest] : rest);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error();
    printHelp();
    process.exit(1);
    return;
  }

  // Handle help
  if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
    printHelp();
    process.exit(0);
  }

  // Handle version
  if (cmd === 'version') {
    console.log(version);
    process.exit(0);
  }

  // Handle push commands
  if (cmd === 'push' || cmd === 'gitlab' || cmd === 'github') {
    const remote = rest.find(arg => !arg.startsWith('-')) || 'origin';
    await handlePushCommand(cmd, remote);
    return;
  }

  // Unknown command (not an option)
  if (cmd && !cmd.startsWith('--') && !cmd.startsWith('-')) {
    console.error(`Error: Unknown command "${cmd}"`);
    console.error();
    printHelp();
    process.exit(1);
  }

  // Invalid option (starts with -- but not valid)
  if (cmd && cmd.startsWith('--') && !VALID_OPTIONS.includes(cmd)) {
    console.error(`Error: Unknown option "${cmd}"`);
    console.error();
    printHelp();
    process.exit(1);
    return;
  }

  // Default: show version info
  const info = await processVersionInfo();
  displayVersionInfo(info);
}

process.on('unhandledRejection', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(err.status || 1);
});
