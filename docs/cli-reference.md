# CLI Reference

AgileFlow provides a simple command-line interface for automatic semantic versioning and changelog generation.

## Installation

AgileFlow can be run directly with npx (no installation required):

```bash
npx @logickernel/agileflow
```

Or install globally:

```bash
npm install -g @logickernel/agileflow
agileflow
```

## Usage

```bash
agileflow [options]
agileflow <command>
```

## Commands

### Default (no command)

Analyzes the current branch and displays version information without creating any tags.

```bash
agileflow
```

**Output:**
```
Current version: v1.2.3
Next version: v1.2.4
Commits since current version: 3

Changelog:
### fix
- resolve authentication issue

### feat
- add new login flow
```

### push

Creates an annotated git tag and pushes it to the origin remote using native git commands.

```bash
agileflow push
```

**Requirements:**
- Git credentials configured for push access
- No additional environment variables needed

**Behavior:**
- Calculates the next version
- Creates an annotated tag with the changelog as the message
- Pushes the tag to origin
- If no version bump is needed, skips tag creation

### gitlab

Creates a version tag via the GitLab API. Designed for use in GitLab CI pipelines.

```bash
agileflow gitlab
```

**Required Environment Variable:**
- `AGILEFLOW_TOKEN` - GitLab access token with `api` scope

**Auto-provided by GitLab CI:**
- `CI_SERVER_HOST` - GitLab server hostname
- `CI_PROJECT_PATH` - Project path (e.g., "group/project")
- `CI_COMMIT_SHA` - Current commit SHA

**Example GitLab CI job:**
```yaml
agileflow:
  stage: version
  image: node:20-alpine
  script:
    - npx @logickernel/agileflow gitlab
  only:
    - main
```

### github

Creates a version tag via the GitHub API. Designed for use in GitHub Actions workflows.

```bash
agileflow github
```

**Required Environment Variable:**
- `AGILEFLOW_TOKEN` - GitHub Personal Access Token with `contents: write` permission

**Auto-provided by GitHub Actions:**
- `GITHUB_REPOSITORY` - Repository name (e.g., "owner/repo")
- `GITHUB_SHA` - Current commit SHA

**Example GitHub Actions step:**
```yaml
- name: Create version tag
  env:
    AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
  run: npx @logickernel/agileflow github
```

## Options

### --quiet

Only output the next version string. Useful for capturing the version in scripts.

```bash
agileflow --quiet
# Output: v1.2.4
```

If no version bump is needed, outputs nothing.

```bash
VERSION=$(npx @logickernel/agileflow --quiet)
if [ -n "$VERSION" ]; then
  echo "New version: $VERSION"
else
  echo "No version bump needed"
fi
```

### --help, -h

Display help information.

```bash
agileflow --help
```

### --version, -v

Display the AgileFlow CLI version.

```bash
agileflow --version
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (missing token, git error, API error, etc.) |

## Error Handling

AgileFlow provides detailed error messages for common issues:

### Authentication Errors

**GitLab:**
```
AGILEFLOW_TOKEN environment variable is required but not set.

To fix this:
1. Create a project access token: https://gitlab.com/your/project/-/settings/access_tokens
   - Name: AgileFlow Bot
   - Role: maintainer
   - Scopes: api
2. Add it as a CI/CD variable: https://gitlab.com/your/project/-/settings/ci_cd
   - Variable key: AGILEFLOW_TOKEN
   - Protect variable: Yes (recommended)
```

**GitHub:**
```
AGILEFLOW_TOKEN environment variable is required but not set.

To fix this:
1. Create a Personal Access Token with "contents: write" permission
2. Add it as a repository secret named AGILEFLOW_TOKEN
3. In your workflow, add: env: AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
```

### Git Repository Errors

```
Current directory is not a git repository (missing .git directory).
```

### Detached HEAD State

```
Repository is in a detached HEAD state. Please check out a branch and try again.
```

## Examples

### Preview Version Locally

```bash
cd my-project
npx @logickernel/agileflow
```

### Get Version for Use in Scripts

```bash
VERSION=$(npx @logickernel/agileflow --quiet)
docker build -t myapp:$VERSION .
```

### GitLab CI Pipeline

```yaml
stages:
  - version
  - build
  - deploy

agileflow:
  stage: version
  image: node:20-alpine
  script:
    - VERSION=$(npx @logickernel/agileflow gitlab --quiet)
    - echo "VERSION=$VERSION" >> version.env
  artifacts:
    reports:
      dotenv: version.env
  only:
    - main

build:
  stage: build
  script:
    - docker build -t myapp:$VERSION .
  needs:
    - agileflow
```

### GitHub Actions Workflow

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Create version tag
        env:
          AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
        run: npx @logickernel/agileflow github
```

## Related Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [Conventional Commits](./conventional-commits.md) - Commit message format
- [Version-Centric CI/CD](./version-centric-cicd.md) - Methodology overview
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
