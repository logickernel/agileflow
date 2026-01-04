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
  push     Push a semantic version tag to the remote repository (native git)
  gitlab   Push a semantic version tag via GitLab API (for GitLab CI)
  github   Push a semantic version tag via GitHub API (for GitHub Actions)

Options:
  --quiet        Only output the next version (or empty if no bump)
  -h, --help     Show this help message
  -v, --version  Show version number

For more information, visit: https://code.logickernel.com/tools/agileflow
`);
}

/**
 * Parses command line arguments.
 * @param {Array<string>} args - Command line arguments
 * @returns {{quiet: boolean}}
 */
function parseArgs(args) {
  return {
    quiet: args.includes('--quiet'),
  };
}

/**
 * Displays version info to the console.
 * @param {{currentVersion: string|null, newVersion: string|null, commits: Array, changelog: string}} info
 * @param {boolean} quiet - Only output the new version
 */
function displayVersionInfo(info, quiet) {
  const { currentVersion, newVersion, commits, changelog } = info;
  
  if (quiet) {
    if (newVersion) {
      console.log(newVersion);
    }
    return;
  }
  
  
  // List commits
  console.log(`Commits since current version (${commits.length}):`);
  for (const commit of commits) {
    const subject = commit.message.split('\n')[0].trim();
    const shortHash = commit.hash.substring(0, 7);
    console.log(`  ${shortHash} ${subject}`);
  }
  
  console.log(`\nCurrent version: ${currentVersion || 'none'}`);
  console.log(`New version: ${newVersion || 'no bump needed'}`);
  if (changelog) {
    console.log(`\nChangelog:\n\n${changelog}`);
  }
}

/**
 * Handles a push command.
 * @param {string} pushType - 'push', 'gitlab', or 'github'
 * @param {{quiet: boolean}} options
 */
async function handlePushCommand(pushType, options) {
  const info = await processVersionInfo();
  
  // Display version info
  displayVersionInfo(info, options.quiet);
  
  // Skip push if no version bump needed
  if (!info.newVersion) {
    return;
  }
  
  // Get the appropriate push module
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
  
  // Create tag message from changelog
  const tagMessage = info.changelog || info.newVersion;
  
  if (!options.quiet) {
    console.log(`\nCreating tag ${info.newVersion}...`);
  }
  
  await pushModule.pushTag(info.newVersion, tagMessage);
  
  if (!options.quiet) {
    console.log(`Tag ${info.newVersion} created and pushed successfully.`);
  }
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const options = parseArgs(cmd ? [cmd, ...rest] : rest);

  // Handle help
  if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
    printHelp();
    process.exit(0);
  }

  // Handle version
  if (cmd === '-v' || cmd === '--version' || cmd === 'version') {
    console.log(version);
    process.exit(0);
  }

  // Handle push commands
  if (cmd === 'push' || cmd === 'gitlab' || cmd === 'github') {
    await handlePushCommand(cmd, options);
    return;
  }

  // Unknown command (not an option)
  if (cmd && !cmd.startsWith('--')) {
    console.error(`Error: Unknown command "${cmd}"`);
    console.error();
    printHelp();
    process.exit(1);
  }

  // Default: show version info
  const info = await processVersionInfo();
  displayVersionInfo(info, options.quiet);
}

process.on('unhandledRejection', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(err.status || 1);
});
