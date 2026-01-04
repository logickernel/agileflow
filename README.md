![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today's fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system designed for software teams of all sizes and projects of any scale.

AgileFlow enforces Semantic Versioning and integrates seamlessly with your CI/CD pipeline to ensure a structured, efficient, and predictable development lifecycle. **All versions are calculated from the main branch's commit history** using [Conventional Commits](https://www.conventionalcommits.org/), ensuring consistent versioning and release notes. Whether for small projects or large-scale deployments, AgileFlow simplifies versioning and release management.

![AgileFlow workflow example diagram](./media/diagram.jpg)

AgileFlow works with your CI/CD engine to **automatically create a new version tag** every time there's a merge into the main branch. Your existing build and deploy pipelines then trigger on tag creation, creating a clean separation between versioning and release processes. This decoupled architecture means AgileFlow focuses solely on versioning, while your build and deploy workflows remain independent.

---

## Quick Start

### Preview Your Next Version

```bash
npx @logickernel/agileflow
```

```
Current version: v1.2.3
Next version: v1.2.4

Changelog:
### fix
- resolve authentication issue
- correct null handling in user lookup
```

### Create a Version Tag

**GitHub Actions:**
```bash
npx @logickernel/agileflow github
```

**GitLab CI:**
```bash
npx @logickernel/agileflow gitlab
```

**Native Git:**
```bash
npx @logickernel/agileflow push
```

**Learn More**: [Getting Started Guide](./docs/getting-started.md) • [CLI Reference](./docs/cli-reference.md)

---

## CI/CD Integration

AgileFlow uses a **two-step decoupled approach**:

### Step 1: Version Creation (AgileFlow)

Create a workflow that runs AgileFlow when code is merged to main:

**GitHub Actions** (`.github/workflows/version.yml`):
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

**GitLab CI** (`.gitlab-ci.yml`):
```yaml
agileflow:
  stage: version
  image: node:20-alpine
  script:
    - npx @logickernel/agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### Step 2: Build & Deploy (Your Pipelines)

Create separate workflows triggered by tag creation:

**GitHub Actions** (`.github/workflows/release.yml`):
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

      - name: Get version from tag
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

      - name: Build
        run: |
          echo "Building $VERSION"
          docker build -t myapp:$VERSION .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: kubectl set image deployment/myapp myapp=myapp:$VERSION
```

**GitLab CI** (`.gitlab-ci.yml`):
```yaml
build:
  stage: build
  script:
    - echo "Building $CI_COMMIT_TAG"
    - docker build -t myapp:$CI_COMMIT_TAG .
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
  when: manual
```

### Benefits of Decoupled Architecture

- **Separation of concerns** — Versioning is independent from build/deploy
- **Flexibility** — Hook any process to tag creation
- **Reusability** — Same build pipeline works for any version
- **Simplicity** — Each pipeline has a single responsibility

**Learn More**: [Installation Guide](./docs/installation.md) • [Configuration](./docs/configuration.md)

---

## Version Calculation

AgileFlow analyzes commits since the last version tag:

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| Breaking change | `feat!: redesign API` | **Major** (1.0.0 → 2.0.0) |
| Feature | `feat: add login` | **Minor** (1.0.0 → 1.1.0) |
| Fix | `fix: resolve crash` | **Patch** (1.0.0 → 1.0.1) |
| Performance | `perf: optimize query` | **Patch** |
| Docs only | `docs: update README` | No bump |

### Conventional Commits

```text
type(scope): description

feat(auth): add OAuth2 login flow
fix(api): correct null handling in user lookup
perf(cache)!: switch to Redis cluster
docs: update README with usage examples
```

**Learn More**: [Conventional Commits Guide](./docs/conventional-commits.md)

---

## Core Principles

### Main Branch Strategy

The main branch is the single source of truth for all releases:

- **Single Version Sequence** — All versions created from the same branch
- **Simplified Workflow** — No release branches needed
- **Consistent History** — All releases share the same commit history
- **Easy Rollbacks** — Deploy any previous version tag

### Version-Centric Deployments

Every environment runs the same immutable version:

```
Tag v1.2.3 ──▶ Build ──▶ Staging
                    ──▶ Production
                    ──▶ Any environment
```

**Learn More**: [Branching Strategy](./docs/branching-strategy.md) • [Version-Centric CI/CD](./docs/version-centric-cicd.md)

---

## Release Management

### Automatic Versioning

Each merge to main triggers automatic version generation:

- **Patch** (v1.0.0 → v1.0.1) — Bug fixes, refactors, performance improvements
- **Minor** (v1.0.0 → v1.1.0) — New features
- **Major** (v1.0.0 → v2.0.0) — Breaking changes

### Initial Development (0.x.x)

New projects start at **v0.0.0**. During initial development:
- Features and fixes bump the patch version
- Breaking changes bump the minor version

### First Stable Release

Version 1.0.0 represents your first stable release. Create it manually when ready:

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

**Learn More**: [Release Management Guide](./docs/release-management.md)

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/getting-started.md) | Quick start for new users |
| [Installation](./docs/installation.md) | Setup for GitHub Actions and GitLab CI |
| [CLI Reference](./docs/cli-reference.md) | Command-line options and usage |
| [Configuration](./docs/configuration.md) | Environment variables and options |
| [Conventional Commits](./docs/conventional-commits.md) | Commit message formatting |
| [Branching Strategy](./docs/branching-strategy.md) | Development workflow |
| [Version-Centric CI/CD](./docs/version-centric-cicd.md) | Pipeline methodology |
| [Release Management](./docs/release-management.md) | Managing releases effectively |
| [Migration Guide](./docs/migration-guide.md) | Transitioning from other approaches |
| [Best Practices](./docs/best-practices.md) | Recommended patterns |
| [Troubleshooting](./docs/troubleshooting.md) | Common issues and solutions |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Ready to simplify your release process?** Get started with AgileFlow today! 🚀

```bash
npx @logickernel/agileflow
```
