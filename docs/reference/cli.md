# CLI Reference

## Installation

Run without installing:
```bash
npx @logickernel/agileflow
```

Or install globally:
```bash
npm install -g @logickernel/agileflow
```

---

## Commands

### `agileflow` (no command)

Analyzes the repository and prints the current version, next version, commits, and changelog. Does not create or modify anything.

```bash
agileflow
```

```
Commits since current version (3):
  a1b2c3d feat: add dark mode
  d4e5f6a fix: resolve login timeout
  7g8h9i0 docs: update README

Current version: v1.4.2
New version:     v1.5.0

Changelog:

### Features
- add dark mode

### Bug fixes
- resolve login timeout
```

If no bump is needed, `New version` shows `no bump needed` and no changelog is printed.

---

### `agileflow push [remote]`

Creates an annotated git tag and pushes it to the specified remote. Uses standard git commands — requires git credentials to be configured.

```bash
agileflow push           # pushes to origin
agileflow push upstream  # pushes to a different remote
```

If no bump is needed, exits without creating a tag.

---

### `agileflow gitlab`

Creates a version tag via the GitLab API. Designed for GitLab CI pipelines.

```bash
agileflow gitlab
```

**Required environment variable:**
- `AGILEFLOW_TOKEN` — GitLab access token with `api` scope and `Maintainer` role

**Provided automatically by GitLab CI:**
- `CI_SERVER_HOST` — GitLab server hostname
- `CI_PROJECT_PATH` — Project path (e.g., `group/project`)
- `CI_COMMIT_SHA` — Commit to tag

---

### `agileflow github`

Creates a version tag via the GitHub API. Designed for GitHub Actions workflows.

```bash
agileflow github
```

**Required environment variable:**
- `AGILEFLOW_TOKEN` — GitHub Personal Access Token with `Contents: Read and write` permission

**Provided automatically by GitHub Actions:**
- `GITHUB_REPOSITORY` — Repository (e.g., `owner/repo`)
- `GITHUB_SHA` — Commit to tag

---

### `agileflow version`

Prints the AgileFlow tool version.

```bash
agileflow version
# 0.17.0
```

---

### `agileflow --help`

Prints usage information.

```bash
agileflow --help
agileflow -h
```

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success (including "no bump needed") |
| `1` | Error (authentication failure, git error, API error, unknown command) |
