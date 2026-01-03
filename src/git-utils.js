'use strict';

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Executes a shell command and returns the output.
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @returns {string} Command output
 * @throws {Error} If command fails
 */
function runWithOutput(command, options = {}) {
  try {
    return execSync(command, { stdio: 'pipe', encoding: 'utf8', ...options });
  } catch (error) {
    const captured = {
      stdout: error?.stdout ? String(error.stdout) : '',
      stderr: error?.stderr ? String(error.stderr) : '',
      message: error?.message || 'Command failed',
      status: typeof error?.status === 'number' ? error.status : 1,
    };
    try {
      Object.defineProperty(error, '_captured', { value: captured });
    } catch {
      error._captured = captured;
    }
    throw error;
  }
}

/**
 * Executes a shell command without returning output.
 * @param {string} command - The command to execute
 * @param {Object} options - Execution options
 * @throws {Error} If command fails
 */
function run(command, options = {}) {
  execSync(command, { stdio: 'pipe', ...options });
}

/**
 * Ensures the current directory is a git repository.
 * @throws {Error} If the current directory is not a git repository
 */
function ensureGitRepo() {
  if (!fs.existsSync('.git')) {
    throw new Error('Current directory is not a git repository (missing .git directory).');
  }
}

module.exports = {
  run,
  runWithOutput,
  ensureGitRepo,
};

