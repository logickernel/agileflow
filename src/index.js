'use strict';

const { version } = require('../package.json');

function printHelp() {
  console.log(`agileflow - Automatic semantic versioning and changelog generation

Usage:
  agileflow [options]
  agileflow <command>

Commands:
  gitlab-ci       Configure git, compute semver tag, and push to GitLab (CI mode)

Options:
  --branch <name>  Allow running on specified branch (default: main)
  -h, --help       Show this help message
  -v, --version    Show version number

Examples:
  agileflow                   # Run on main branch
  agileflow --branch develop  # Run on develop branch
  agileflow gitlab-ci

For more information, visit: https://code.logickernel.com/kernel/agileflow
`);
}

function parseArgs(args) {
  const parsed = { branch: 'main' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--branch' && i + 1 < args.length) {
      parsed.branch = args[i + 1];
      i++;
    }
  }
  return parsed;
}

async function runLocal(args) {
  const { branch } = parseArgs(args);
  const localMain = require('./local.js');
  await localMain(branch);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;

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

  // Handle gitlab-ci command
  if (cmd === 'gitlab-ci') {
    console.error('Error: gitlab-ci command is not yet implemented');
    console.error('This feature will be available in a future release.');
    process.exit(1);
  }

  // Unknown command
  if (cmd && !cmd.startsWith('--')) {
    console.error(`Error: Unknown command "${cmd}"`);
    console.error();
    printHelp();
    process.exit(1);
  }

  // Default: run version calculation
  await runLocal(cmd ? [cmd, ...rest] : rest);
}

process.on('unhandledRejection', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(err.status || 1);
});
