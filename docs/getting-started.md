# Getting Started

Get up and running with AgileFlow in minutes. This guide covers local usage and CI/CD integration.

## What You'll Learn

- How to preview your next version locally
- How to set up automatic versioning in CI/CD
- How conventional commits affect version bumps

## Prerequisites

- Node.js 14+ (for local usage)
- A Git repository with commit history
- Basic understanding of conventional commits

---

## Quick Start

### 1. Preview Your Next Version

Run AgileFlow in any Git repository:

```bash
npx @logickernel/agileflow
```

Example output:
```
Current version: v1.2.3
Next version: v1.2.4

Changelog:
### fix
- resolve authentication issue
- correct null handling in user lookup

### docs
- update README with usage examples
```

### 2. Get Just the Version

Use `--quiet` to output only the version (useful for scripts):

```bash
VERSION=$(npx @logickernel/agileflow --quiet)
echo "Next version: $VERSION"
```

---

## CI/CD Integration

AgileFlow uses a **decoupled architecture**:

1. **AgileFlow creates a version tag** (on merge to main)
2. **Your pipelines trigger on the tag** (build, deploy, etc.)

```
Merge to main ──▶ AgileFlow ──▶ Tag v1.2.3 ──▶ Your build/deploy
```

### GitHub Actions

**Step 1**: Add a secret `AGILEFLOW_TOKEN` with a Personal Access Token (`contents: write` permission).

**Step 2**: Create `.github/workflows/version.yml`:

```yaml
name: Version
on:
  push:
    branches: [main]

jobs:
  version:
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

**Step 3**: Create `.github/workflows/release.yml` for builds:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          VERSION=${GITHUB_REF#refs/tags/}
          echo "Building $VERSION"
          docker build -t myapp:$VERSION .
```

### GitLab CI

**Step 1**: Add a CI/CD variable `AGILEFLOW_TOKEN` with a Project Access Token (`api` scope, `Maintainer` role).

**Step 2**: Update `.gitlab-ci.yml`:

```yaml
# Runs on merge to main - creates the tag
agileflow:
  image: node:20
  script:
    - npm install -g @logickernel/agileflow
    - npx @logickernel/agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# Runs on tag creation - builds the release
build:
  stage: build
  script:
    - echo "Building $CI_COMMIT_TAG"
    - docker build -t myapp:$CI_COMMIT_TAG .
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

### Native Git Push

For other platforms:

```bash
npx @logickernel/agileflow push
```

This creates an annotated tag and pushes it. Configure your CI to trigger on tags.

---

## How Version Bumps Work

AgileFlow analyzes commit messages to determine the bump:

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| Breaking change | `feat!: redesign API` | **Major** (1.0.0 → 2.0.0) |
| Feature | `feat: add login` | **Minor** (1.0.0 → 1.1.0) |
| Fix | `fix: resolve crash` | **Patch** (1.0.0 → 1.0.1) |
| Performance | `perf: optimize query` | **Patch** |
| Docs only | `docs: update README` | No bump |

### Pre-1.0.0 Behavior

During initial development (0.x.x):
- Features and fixes → **patch** bump
- Breaking changes → **minor** bump

### No Bump Needed

If all commits are docs/chore/style types, AgileFlow skips tag creation.

---

## Your First Release

### Starting Fresh

No version tags? AgileFlow starts from v0.0.0:

```bash
git commit -m "feat: initial project setup"
# → Creates v0.0.1
```

### Creating v1.0.0

Version 1.0.0 is your first stable release. Create it manually when ready:

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

After v1.0.0, AgileFlow continues with standard semantic versioning.

---

## Common Questions

**How does the decoupled approach work?**

AgileFlow only creates version tags. Your build/deploy pipelines are separate workflows that trigger on tag creation. This keeps versioning independent from your build process.

**What if no version bump is needed?**

AgileFlow skips tag creation. No tag means no build/deploy triggered.

**Can I preview without creating tags?**

Yes! Running `npx @logickernel/agileflow` without a command shows the next version without creating anything.

---

## Troubleshooting

### "AGILEFLOW_TOKEN not set" Error
- Verify the environment variable is configured
- Check token permissions (GitHub: `contents: write`, GitLab: `api` scope)

### Tag Created but Build Didn't Run
- Ensure your release workflow triggers on `tags: ['v*']`
- Check the tag pattern in your CI configuration

### No Version Bump Detected
- Use conventional commit format (`type: description`)
- Include bump-triggering types: `feat`, `fix`, `perf`, etc.

---

## Next Steps

- [CLI Reference](./cli-reference.md) — All commands and options
- [Installation Guide](./installation.md) — Detailed setup
- [Conventional Commits](./conventional-commits.md) — Commit format
- [Version-Centric CI/CD](./version-centric-cicd.md) — The methodology
