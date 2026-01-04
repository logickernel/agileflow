# Best Practices

This guide covers recommended practices for using AgileFlow effectively.

## Decoupled Pipeline Architecture

### Separate Versioning from Build/Deploy

AgileFlow works best with a decoupled architecture:

```
Versioning Workflow     Release Workflow
──────────────────     ─────────────────
on: push to main       on: tag created
  → AgileFlow            → build
  → create tag           → deploy
```

**Benefits:**
- Clear separation of concerns
- Each pipeline has one responsibility
- Easy to rerun builds independently

### Version Workflow (Minimal)

Keep the versioning workflow simple:

```yaml
# ✅ Good — Focused on versioning only
name: Version
on:
  push:
    branches: [main]
jobs:
  version:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: npx @logickernel/agileflow github
```

### Release Workflow (Complete)

Put build and deploy logic in the tag-triggered workflow:

```yaml
# ✅ Good — Triggered by tag, handles build/deploy
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    # Build logic here
  deploy:
    # Deploy logic here
```

---

## Commit Message Best Practices

### Use Conventional Commits Consistently

```bash
# ✅ Good — Clear type and description
feat(auth): add OAuth2 login support
fix(api): handle null user ID gracefully

# ❌ Bad — Unclear
add oauth
fix bug
```

### Add Scopes for Organization

```bash
# ✅ Good — Scoped commits
feat(auth): implement JWT validation
fix(api): resolve timeout issue
docs(readme): add troubleshooting section
```

### Mark Breaking Changes Properly

```bash
# ✅ Good — Breaking change marked
feat!: remove deprecated API endpoints

# ✅ Good — Using footer
feat: change API format

BREAKING CHANGE: Response uses camelCase keys

# ❌ Bad — Not marked
feat: remove deprecated endpoints
```

---

## Pipeline Best Practices

### Use Tag as Version

In your release workflow, extract the version from the tag:

**GitHub Actions:**
```yaml
- name: Get version
  run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

- name: Build
  run: docker build -t myapp:$VERSION .
```

**GitLab CI:**
```yaml
build:
  script:
    - docker build -t myapp:$CI_COMMIT_TAG .
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

### Deploy Same Version Everywhere

```yaml
# ✅ Good — Same version for all environments
deploy-staging:
  script:
    - kubectl set image deployment/myapp myapp=myapp:$VERSION

deploy-production:
  script:
    - kubectl set image deployment/myapp myapp=myapp:$VERSION
```

### Add Health Checks

```yaml
deploy:
  script:
    - kubectl set image deployment/myapp myapp=myapp:$VERSION
    - kubectl rollout status deployment/myapp --timeout=300s
    - ./health-check.sh
```

---

## Version Management Best Practices

### Keep Releases Small

- Small releases reduce risk
- Frequent releases provide faster feedback
- Focused changes simplify rollbacks

### Test Before Merging

- Unit tests pass on feature branches
- Integration tests run before merge
- Documentation updated with changes

### Plan for Rollbacks

**GitHub Actions:**
```yaml
rollback:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - name: Rollback
      run: |
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

## Security Best Practices

### Protect Tokens

**GitHub:**
- Use repository secrets (automatically protected)
- Rotate tokens regularly

**GitLab:**
- Mark variables as Protected and Masked
- Use project tokens over personal tokens

### Minimal Permissions

| Platform | Required Permission |
|----------|---------------------|
| GitHub | `contents: write` |
| GitLab | `api` scope, `Maintainer` role |

---

## Performance Best Practices

### Shallow Clone for Release Workflow

The release workflow doesn't need full history:

```yaml
# Versioning — needs full history
version:
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Full history

# Release — doesn't need history
build:
  steps:
    - uses: actions/checkout@v4
      # Default shallow clone
```

### Cache Dependencies

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
```

### Parallel Jobs

```yaml
# Build jobs run in parallel
build-backend:
  runs-on: ubuntu-latest
build-frontend:
  runs-on: ubuntu-latest
```

---

## Documentation Best Practices

### Write Meaningful Commit Messages

```bash
# ✅ Good — Becomes clear release note
feat(auth): add OAuth2 login with Google and GitHub providers

# ❌ Bad — Poor release note
feat: add login
```

### Include Docs in Changes

```bash
git commit -m "feat(auth): add OAuth2 login

- Implement OAuth2 flow
- Add configuration documentation
- Update API reference"
```

---

## Team Best Practices

### Establish Conventions

- Document commit message standards
- Use commit linting (commitlint, husky)
- Review commit messages in PRs

### Communicate Releases

```yaml
notify:
  script:
    - |
      curl -X POST "$SLACK_WEBHOOK" \
        -d "{\"text\": \"Released $VERSION\"}"
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

---

## Related Documentation

- [Getting Started](./getting-started.md) — Quick start
- [Conventional Commits](./conventional-commits.md) — Commit format
- [Installation Guide](./installation.md) — Setup
- [Troubleshooting](./troubleshooting.md) — Common issues
