# AGENTS.md - Shared Utilities

This file documents the purpose and organization of shared utility functions in the AgileFlow scripts.

## Purpose

The `utils.js` file contains functions that are **common to any environment** (local, CI, etc.). These are utility functions that can be used across different execution contexts without modification.

## File Organization

- **`utils.js`** - Functions common to all environments (local, CI, etc.)
- **`git-utils.js`** - Git-specific operations and utilities
- **`local.js`** - Local testing implementation
- **`gitlab-ci.js`** - GitLab CI implementation

## Guidelines

When adding new functions:

1. **Is it environment-agnostic?** → Add to `utils.js`
2. **Does it depend on CI-specific variables or operations?** → Add to environment-specific file (`local.js` or `gitlab-ci.js`)
3. **Is it a git operation that works in any environment?** → Add to `git-utils.js`

## For AI Agents

When refactoring or adding new functionality:

- Check `utils.js` first for common utilities
- Use functions from `utils.js` in both `local.js` and `gitlab-ci.js` to maintain consistency
- Keep `utils.js` free of environment-specific logic (no CI variables, no local-only behavior)
- When in doubt, prefer adding to environment-specific files rather than polluting `utils.js`

