# Troubleshooting Guide

This guide helps you resolve common issues when using AgileFlow.

## Quick Diagnosis

### Check Your Setup

```bash
# Verify git repository
git status

# Check existing version tags
git tag --sort=-version:refname | head -5

# Preview next version
npx @logickernel/agileflow
```

### Common Symptoms

| Symptom | Likely Cause | Section |
|---------|--------------|---------|
| No tag created | Token permissions | [Authentication](#authentication-errors) |
| Wrong version | Commit format | [Version Generation](#version-generation-issues) |
| Tag created but no build | Release workflow config | [Release Workflow](#release-workflow-issues) |

---

## Authentication Errors

### GitHub: "Resource not accessible by integration"

**Cause:** Token lacks required permissions.

**Solution:**
1. Create a Fine-grained Personal Access Token
2. Grant `Contents: Read and write` permission
3. Ensure repository is in token scope
4. Update `AGILEFLOW_TOKEN` secret

### GitHub: "Bad credentials"

**Cause:** Token invalid or expired.

**Solution:**
1. Check token hasn't expired
2. Regenerate token
3. Update secret

### GitLab: "403 Forbidden"

**Cause:** Token lacks permissions.

**Solution:**
1. Verify `api` scope
2. Ensure `Maintainer` role
3. Check token not expired
4. For protected branches, ensure variable is protected

### GitLab: "401 Unauthorized"

**Cause:** Invalid or missing token.

**Solution:**
1. Verify `AGILEFLOW_TOKEN` variable exists
2. Check variable protection settings
3. Regenerate if needed

---

## Version Generation Issues

### No Tag Created

**Possible causes:**

1. **No conventional commits**
   ```bash
   # Check recent commits
   git log --oneline -10
   
   # Should see: feat:, fix:, perf:, etc.
   ```

2. **All commits are docs/chore/style**
   ```bash
   # These don't trigger bumps:
   docs: update README
   chore: update deps
   style: format code
   ```

3. **Not on main branch**
   ```bash
   git branch --show-current
   ```

**Solution:** Include bump-triggering commits (`feat`, `fix`, `perf`, etc.).

### Wrong Version Calculated

**Possible causes:**

1. **Breaking change not marked**
   ```bash
   # Wrong
   feat: remove old API
   
   # Correct
   feat!: remove old API
   ```

2. **Wrong commit type**
   ```bash
   # Wrong
   fix: add new login feature
   
   # Correct
   feat: add new login feature
   ```

### Commits Not Recognized

**Common mistakes:**

```bash
# Wrong — missing colon
feat add new feature

# Wrong — wrong separator
feat - add new feature

# Wrong — capitalized
Feat: add new feature

# Correct
feat: add new feature
```

---

## Release Workflow Issues

### Tag Created but Build Didn't Run

**Cause:** Release workflow not triggered by tags.

**GitHub Actions — Check workflow trigger:**
```yaml
# ✅ Correct
on:
  push:
    tags:
      - 'v*'

# ❌ Wrong — only triggers on branch push
on:
  push:
    branches: [main]
```

**GitLab CI — Check rules:**
```yaml
# ✅ Correct
build:
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

# ❌ Wrong — only runs on main branch
build:
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

### Version Not Available in Release Workflow

**GitHub Actions:**
```yaml
# Extract version from tag
- name: Get version
  run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

- name: Use version
  run: docker build -t myapp:$VERSION .
```

**GitLab CI:**
```yaml
# Use CI_COMMIT_TAG directly
build:
  script:
    - docker build -t myapp:$CI_COMMIT_TAG .
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

---

## Git Repository Errors

### "Not a git repository"

**Cause:** Running outside git repository.

**Solution:**
```bash
ls -la .git  # Verify .git exists
```

### "Detached HEAD state"

**GitHub Actions:**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    ref: main  # Checkout branch
```

**GitLab CI:**
```yaml
agileflow:
  script:
    - git checkout $CI_COMMIT_REF_NAME
    - npx @logickernel/agileflow gitlab
```

### Shallow Clone Issues

**Cause:** Commit history not available.

**GitHub Actions:**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Fetch all history
```

**GitLab CI:**
```yaml
variables:
  GIT_DEPTH: 0
```

---

## Pipeline Issues

### Versioning Job Fails

**Debug steps:**

1. **Check logs** for error messages
2. **Verify token** is set:
   ```yaml
   - run: echo "Token set: ${{ secrets.AGILEFLOW_TOKEN != '' }}"
   ```
3. **Check git state**:
   ```yaml
   - run: |
       git log --oneline -5
       git tag --sort=-version:refname | head -3
   ```

### Both Workflows Running on Same Push

**Cause:** Main push triggers versioning, tag push triggers release — correct behavior!

This is expected:
1. Push to main → Versioning workflow → Creates tag
2. Tag push → Release workflow → Builds

---

## Debug Commands

### Verify AgileFlow

```bash
# Check version
npx @logickernel/agileflow --version

# Preview (no tag creation)
npx @logickernel/agileflow

# Quiet mode
npx @logickernel/agileflow --quiet
```

### Check Git State

```bash
# Recent tags
git tag --sort=-version:refname | head -5

# Recent commits
git log --oneline -10

# Current branch
git branch --show-current
```

### Test Tokens

**GitLab:**
```bash
curl --header "PRIVATE-TOKEN: $AGILEFLOW_TOKEN" \
  "https://gitlab.com/api/v4/projects"
```

**GitHub:**
```bash
curl -H "Authorization: token $AGILEFLOW_TOKEN" \
  "https://api.github.com/user"
```

---

## Common Patterns

### Complete Debug Workflow

**GitHub Actions:**
```yaml
- name: Debug
  run: |
    echo "Node: $(node --version)"
    echo "Git: $(git --version)"
    echo "Branch: $(git branch --show-current)"
    echo "Tags: $(git tag --sort=-version:refname | head -3)"
    echo "Commits:"
    git log --oneline -5
    npx @logickernel/agileflow || echo "Exit: $?"
```

**GitLab CI:**
```yaml
debug:
  script:
    - node --version
    - git --version
    - git branch --show-current
    - git tag --sort=-version:refname | head -3
    - git log --oneline -5
    - npx @logickernel/agileflow || echo "Exit: $?"
```

---

## Getting Help

If still stuck:

1. **Check error messages** — Usually descriptive
2. **Verify configuration** — Tokens, workflow triggers
3. **Test locally** — `npx @logickernel/agileflow`
4. **Open an issue** — Include logs and config

---

## Related Documentation

- [Installation Guide](./installation.md) — Setup
- [Configuration](./configuration.md) — Variables
- [CLI Reference](./cli-reference.md) — Commands
- [Conventional Commits](./conventional-commits.md) — Commit format
