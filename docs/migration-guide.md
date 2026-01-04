# Migration Guide

This guide helps you transition to AgileFlow's decoupled, version-centric approach.

## What You're Changing

### From Traditional Approach

- Version calculation mixed with build/deploy
- Branch-based deployments
- Manual version management
- Environment-specific branches

### To AgileFlow Approach

- **Decoupled versioning** — AgileFlow only creates tags
- **Tag-triggered pipelines** — Build/deploy on tag events
- **Automatic versions** — Based on conventional commits
- **Single main branch** — All versions from one source

---

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│  Merge to main  │         │  Tag: v1.2.3    │
│                 │ ──────▶ │                 │
│  Versioning     │         │  Release        │
│  workflow       │         │  workflow       │
└─────────────────┘         └─────────────────┘
       │                           │
       ▼                           ▼
   AgileFlow                  Build/Deploy
   creates tag                your pipelines
```

---

## Migration Steps

### Phase 1: Preparation

#### Train Your Team

- Introduce conventional commits
- Explain the decoupled approach
- Share commit message examples

#### Create Access Token

**GitHub:**
1. Settings → Developer settings → Personal access tokens
2. Create token with `contents: write`
3. Add as secret `AGILEFLOW_TOKEN`

**GitLab:**
1. Project Settings → Access tokens
2. Create token with `api` scope, `Maintainer` role
3. Add as variable `AGILEFLOW_TOKEN`

### Phase 2: Add Versioning Workflow

**GitHub Actions** — Create `.github/workflows/version.yml`:

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

**GitLab CI** — Add to `.gitlab-ci.yml`:

```yaml
agileflow:
  stage: version
  image: node:20-alpine
  script:
    - npx @logickernel/agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### Phase 3: Add Release Workflow

**GitHub Actions** — Create `.github/workflows/release.yml`:

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

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: kubectl set image deployment/myapp myapp=myapp:$VERSION
```

**GitLab CI** — Add to `.gitlab-ci.yml`:

```yaml
build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_TAG .
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

### Phase 4: Remove Old Logic

Once the new workflows are working:

1. **Remove version calculation** from existing build pipelines
2. **Remove environment branches** (staging, production)
3. **Remove branch-based triggers** for deployments

---

## Common Migration Patterns

### Simple Application

**Before:**
```yaml
# Single workflow doing everything
on: push to main
  → calculate version
  → build
  → deploy
```

**After:**
```yaml
# Workflow 1: version.yml
on: push to main
  → AgileFlow creates tag

# Workflow 2: release.yml
on: tag v*
  → build
  → deploy
```

### Microservices

**After (same version for all services):**
```yaml
# release.yml
build-backend:
  script:
    - docker build -t backend:$VERSION ./backend

build-frontend:
  script:
    - docker build -t frontend:$VERSION ./frontend

deploy:
  needs: [build-backend, build-frontend]
  script:
    - kubectl set image deployment/backend backend=backend:$VERSION
    - kubectl set image deployment/frontend frontend=frontend:$VERSION
```

---

## Migration Challenges

### Existing Version Logic

**Challenge:** Current pipeline calculates versions.

**Solution:** Keep both temporarily, then remove old logic:
```yaml
# Phase 1: Add AgileFlow alongside existing logic
# Phase 2: Switch release workflow to use tags
# Phase 3: Remove old version calculation
```

### Team Learning Conventional Commits

**Challenge:** Team not familiar with format.

**Solutions:**
- Start with just `feat:` and `fix:`
- Use commit linting
- Provide IDE snippets

### Existing Environment Branches

**Challenge:** Using staging/production branches.

**Solution:** After migration works, delete them:
```bash
git branch -d staging
git push origin --delete staging
```

---

## Testing Your Migration

### Verify Version Creation

```bash
# Push a conventional commit
git commit -m "feat: test feature"
git push

# Check for new tag
git tag --sort=-version:refname | head -1
```

### Verify Release Workflow

- Confirm tag triggers your release workflow
- Check build uses the tag as version
- Verify deployment works

### End-to-End Test

1. Push conventional commit to main
2. AgileFlow creates tag (e.g., v1.2.3)
3. Release workflow triggers
4. Build creates artifact tagged v1.2.3
5. Deployment uses correct version

---

## Rollback Plan

If migration fails:

1. **Revert workflow changes**
   ```bash
   git revert <workflow-commit>
   ```

2. **Keep running old pipeline** until issues resolved

3. **Document issues** for next attempt

---

## Post-Migration Checklist

- [ ] Versioning workflow creates tags on merge to main
- [ ] Release workflow triggers on tag creation
- [ ] Builds use tag as version
- [ ] Deployments use correct version
- [ ] Team uses conventional commits
- [ ] Old version logic removed
- [ ] Old environment branches deleted

---

## Related Documentation

- [Getting Started](./getting-started.md) — Quick start
- [Installation Guide](./installation.md) — Setup
- [Best Practices](./best-practices.md) — Recommendations
- [Troubleshooting](./troubleshooting.md) — Common issues
