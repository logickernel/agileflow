# AgileFlow

AgileFlow reads your commit history, calculates the next semantic version, and creates a git tag — automatically, on every push to main.

No config files. No servers. Just commits and tags.

```bash
npx @logickernel/agileflow
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

---

## How it works

1. On push to main, AgileFlow analyzes commits since the last version tag
2. It calculates the next version using [Conventional Commits](./reference/conventional-commits.md)
3. It creates an annotated git tag with the changelog as the tag message
4. Your build and deploy pipelines trigger on the tag

This is the **decoupled architecture**: versioning is a separate concern from building and deploying.

```
Push to main → AgileFlow → Tag v1.5.0 → Your build/deploy pipelines
```

---

## Documentation

### Start Here
- [Getting Started](./start-here/getting-started.md) — Run AgileFlow locally, understand the output, set up your first CI integration

### Guides
- [GitHub Actions](./guides/github-actions.md) — Full setup for GitHub repositories
- [GitLab CI](./guides/gitlab-ci.md) — Full setup for GitLab repositories
- [Other CI/CD](./guides/other-ci.md) — Git-push based integration for any platform

### Reference
- [CLI Reference](./reference/cli.md) — All commands and options
- [Conventional Commits](./reference/conventional-commits.md) — Commit format and version impact
