![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

AgileFlow reads your commit history and automatically creates a semantic version tag on every merge to main. Your build and deploy pipelines then trigger on the tag — keeping versioning completely separate from everything else.

![AgileFlow workflow example diagram](./media/diagram.jpg)

No config files. No servers. Versions are calculated from your [Conventional Commits](https://www.conventionalcommits.org/) and pushed as annotated git tags.

---

## Quick Start

Preview your next version in any git repository:

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

This is read-only — it never creates tags or modifies anything.

---

## CI/CD Integration

AgileFlow uses a **decoupled two-step approach**:

1. **Versioning** — AgileFlow runs on merge to main and creates a version tag
2. **Release** — Your existing build and deploy pipelines trigger on the tag

```
Merge to main → AgileFlow → Tag v1.5.0 → Your build/deploy
```

### GitHub Actions

`.github/workflows/version.yml`:

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

Requires an `AGILEFLOW_TOKEN` secret — a Personal Access Token with `Contents: Read and write` permission.

### GitLab CI

`.gitlab-ci.yml`:

```yaml
agileflow:
  image: node:20
  script:
    - npm install -g @logickernel/agileflow
    - agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

Requires an `AGILEFLOW_TOKEN` CI/CD variable — a Project Access Token with `api` scope and `Maintainer` role.

### Other platforms

```bash
agileflow push           # creates tag and pushes to origin
agileflow push upstream  # pushes to a different remote
```

---

## Conventional Commits

AgileFlow determines the version bump from commit types:

| Commit | Example | Before v1.0.0 | v1.0.0 and after |
|--------|---------|---------------|------------------|
| Breaking change | `feat!: redesign API` | minor bump | major bump |
| `feat` | `feat: add login` | minor bump | minor bump |
| `fix` | `fix: resolve crash` | patch bump | patch bump |
| Everything else | `docs: update README` | no bump | no bump |

The highest-priority bump across all commits since the last tag wins. If no bump-triggering commits exist, AgileFlow exits without creating a tag.

### v1.0.0 — First stable release

New projects start at `v0.0.0`. AgileFlow increments automatically from there. When your API is stable and ready for production, create `v1.0.0` manually:

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

After `v1.0.0`, breaking changes bump the major version.

---

## Documentation

| | |
|-|-|
| [Getting Started](./docs/start-here/getting-started.md) | Run locally, understand the output, first CI setup |
| [GitHub Actions](./docs/guides/github-actions.md) | Token setup, workflow files, troubleshooting |
| [GitLab CI](./docs/guides/gitlab-ci.md) | Token setup, pipeline config, troubleshooting |
| [Other CI/CD](./docs/guides/other-ci.md) | Git-push integration for any platform |
| [CLI Reference](./docs/reference/cli.md) | All commands and options |
| [Conventional Commits](./docs/reference/conventional-commits.md) | Commit format and changelog behavior |
