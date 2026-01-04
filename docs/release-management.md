# Release Management

AgileFlow automates version generation with a decoupled architecture that creates version tags, which then trigger your release pipelines.

## Architecture

```
Merge to main ──▶ AgileFlow ──▶ Tag v1.2.3 ──▶ Your build/deploy
```

1. **AgileFlow creates the version tag** — Triggered on merge to main
2. **Your pipelines handle the release** — Triggered by tag creation

This separation keeps versioning independent from build and deployment.

---

## How Version Generation Works

### Semantic Versioning

AgileFlow follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fixes, refactors
  │     └──────── New features
  └────────────── Breaking changes
```

### Automatic Version Calculation

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| Breaking | `feat!: remove API` | Major |
| Feature | `feat: add login` | Minor |
| Fix | `fix: resolve crash` | Patch |
| Performance | `perf: optimize` | Patch |
| No bump | `docs: update README` | None |

---

## Release Process

### 1. Development

Work on feature branches:

```bash
git checkout -b feat/user-auth
git commit -m "feat: implement login flow"
git push origin feat/user-auth
```

### 2. Merge

Create and merge a pull/merge request to main.

### 3. Version Creation (Automatic)

AgileFlow runs and creates a tag:
- Analyzes commits since last version
- Calculates next version
- Creates annotated tag with release notes

### 4. Release (Your Pipelines)

Tag creation triggers your release workflow:
- Build artifacts tagged with version
- Deploy to environments
- Run tests

---

## Release Workflows

### GitHub Actions

**Release workflow** (`.github/workflows/release.yml`):
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

      - name: Get version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

      - name: Build
        run: docker build -t myapp:$VERSION .

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:$VERSION

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:$VERSION
```

### GitLab CI

```yaml
build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_TAG .
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  environment: staging
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  environment: production
  when: manual
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

---

## Release Notes

AgileFlow generates structured release notes from conventional commits:

```
v1.2.4

### Features
- auth: add OAuth2 login flow

### Bug fixes
- api: handle null user ID

### Performance
- cache: implement Redis pooling
```

### View Release Notes

```bash
git tag -l -n99 v1.2.4
```

---

## Initial Development (0.x.x)

New projects start at v0.0.0:

- Features/fixes → Patch bump (0.0.0 → 0.0.1)
- Breaking changes → Minor bump (0.0.0 → 0.1.0)

---

## First Stable Release

Version 1.0.0 represents first stable release. Create manually:

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

This will trigger your release workflow.

---

## Viewing Releases

```bash
# List versions
git tag --sort=-version:refname

# View specific version
git show v1.2.3

# Compare versions
git log v1.2.2..v1.2.3 --oneline
```

---

## Rollbacks

### Simple Rollback

Redeploy a previous version:

```bash
kubectl set image deployment/myapp myapp=myapp:v1.2.2
```

### Automated Rollback Job

**GitHub Actions:**
```yaml
rollback:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - run: |
        PREVIOUS=$(git describe --tags --abbrev=0 HEAD^)
        kubectl set image deployment/myapp myapp=myapp:$PREVIOUS
```

**GitLab CI:**
```yaml
rollback:
  script:
    - PREVIOUS=$(git describe --tags --abbrev=0 HEAD^)
    - kubectl set image deployment/myapp myapp=myapp:$PREVIOUS
  when: manual
```

---

## Release Strategies

### Continuous Delivery

Auto-deploy to staging, manual to production:

```yaml
deploy-staging:
  # Runs automatically on tag

deploy-production:
  when: manual
```

### Version-Based Gates

Only deploy certain version types:

```yaml
deploy-production:
  rules:
    # Only minor/major versions
    - if: '$CI_COMMIT_TAG =~ /^v\d+\.\d+\.0$/'
```

---

## Release Communication

### Notifications

```yaml
notify:
  script:
    - |
      curl -X POST "$SLACK_WEBHOOK" \
        -d "{\"text\": \"Released $CI_COMMIT_TAG\"}"
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

### GitHub Releases

```yaml
- uses: softprops/action-gh-release@v1
  with:
    tag_name: ${{ github.ref_name }}
    generate_release_notes: true
```

---

## Best Practices

1. **Use conventional commits** — For accurate versioning
2. **Keep releases small** — Easier to debug and rollback
3. **Test in staging first** — Before production
4. **Document breaking changes** — Clear for users
5. **Plan rollbacks** — Have procedures ready

---

## Related Documentation

- [Getting Started](./getting-started.md) — Quick start
- [Conventional Commits](./conventional-commits.md) — Commit format
- [Version-Centric CI/CD](./version-centric-cicd.md) — Methodology
- [Best Practices](./best-practices.md) — Recommendations
