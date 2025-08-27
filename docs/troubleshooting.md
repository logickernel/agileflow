# Troubleshooting Guide

This guide helps you resolve common issues when using AgileFlow. If you encounter a problem not covered here, check the community discussions or open an issue in the project repository.

## Quick Diagnosis

### Check Pipeline Status

First, verify your pipeline status:

```bash
# Check if AgileFlow job completed successfully
gitlab-ci status

# View pipeline logs
gitlab-ci logs agileflow

# Check if VERSION variable is available
echo $VERSION
```

### Common Symptoms

- **Pipeline fails on version stage**
- **VERSION variable not available**
- **Build jobs fail with version errors**
- **Deployment inconsistencies**
- **Release notes not generated**

## Installation Issues

### Job Token Permissions Not Available

**Problem**: You don't see the "Allow Git push requests to the repository" option in GitLab CI/CD settings.

**Solution**:
1. Check if you're using a self-managed GitLab instance
2. Enable the feature flag `allow_push_repository_for_job_token`
3. Ensure you have admin access to the GitLab instance

```bash
# For self-managed GitLab, enable the feature flag
sudo gitlab-rake gitlab:features:enable allow_push_repository_for_job_token
```

**Alternative**: Use a personal access token with write permissions to the repository.

### Template Include Fails

**Problem**: The AgileFlow template include statement fails with a network error.

**Solutions**:
1. **Check network connectivity** to `code.logickernel.com`
2. **Use local template** if remote access is restricted:

```yaml
# .gitlab-ci.yml
include:
  - local: templates/AgileFlow.gitlab-ci.yml
```

3. **Copy template locally** and include from your repository:

```bash
# Download template to your repository
curl -o templates/AgileFlow.gitlab-ci.yml \
  https://code.logickernel.com/kernel/agileflow/-/raw/main/templates/AgileFlow.gitlab-ci.yml
```

### Docker Image Pull Fails

**Problem**: Cannot pull the AgileFlow Docker image.

**Solutions**:
1. **Check Docker daemon** is running
2. **Verify image name** and tag
3. **Check registry access** and authentication
4. **Use alternative image** if available

```bash
# Test Docker connectivity
docker pull hello-world

# Check AgileFlow image availability
docker pull registry.logickernel.com/kernel/agileflow:latest
```

## Version Generation Issues

### VERSION Variable Not Available

**Problem**: The `${VERSION}` variable is not available in subsequent pipeline stages.

**Causes and Solutions**:

1. **AgileFlow job failed**
   ```bash
   # Check agileflow job status
   gitlab-ci logs agileflow
   
   # Ensure job completed successfully
   gitlab-ci status agileflow
   ```

2. **Missing job dependency**
   ```yaml
   # ✅ Good - Proper dependency
   build:
     stage: build
     needs:
       - agileflow
   
   # ❌ Bad - No dependency specified
   build:
     stage: build
   ```

### Version Not Generated

**Problem**: AgileFlow doesn't create a new version tag.

**Causes and Solutions**:

1. **No conventional commits detected**
   ```bash
   # Check commit messages
   git log --oneline -10
   
   # Use conventional commit format
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   ```

2. **No merge to main branch**
   ```bash
   # Verify you're on main branch
   git branch
   
   # Check if changes were merged
   git log --oneline --graph
   ```

### Incorrect Version Bumping

**Problem**: AgileFlow generates the wrong version number.

**Causes and Solutions**:

1. **Commit type not recognized**
   ```bash
   # Use recognized commit types
   feat: new feature          # Minor version bump
   fix: bug fix              # Patch version bump
   perf: performance improvement # Patch version bump
refactor: code refactoring    # Patch version bump
build: build system change    # Patch version bump
ci: CI/CD change             # Patch version bump
test: test additions/changes  # Patch version bump
revert: revert commit         # Patch version bump
   feat!: breaking change    # Major version bump
   ```

2. **Breaking change not properly marked**
   ```bash
   # Use exclamation mark or footer
   feat!: remove deprecated API
   
   # Or use footer
   feat: change API format
   
   BREAKING CHANGE: API format changed from v1 to v2
   ```

3. **Version calculation logic issues**
   ```bash
   # Check commit history
   git log --oneline --since="1 week ago"
   
   # Verify conventional commit format
   git log --grep="^feat\|^fix\|^perf\|^refactor"
   ```

## Pipeline Issues

### Build Stage Failures

**Problem**: Build jobs fail with version-related errors.

**Solutions**:

1. **Check VERSION variable usage**
   ```yaml
   # ✅ Good - Proper variable usage
   build:
     script:
       - docker build -t myapp:${VERSION} .
   
   # ❌ Bad - Hardcoded or incorrect variable
   build:
     script:
       - docker build -t myapp:latest .
       - docker build -t myapp:$VERSION .
   ```

2. **Verify job dependencies**
   ```yaml
   # Ensure build depends on agileflow
   build:
     stage: build
     needs:
       - agileflow
     script:
       - echo "Building version ${VERSION}"
   ```

3. **Check variable expansion**
   ```yaml
   # Test variable availability
   build:
     script:
       - echo "VERSION: ${VERSION}"
       - echo "CI_COMMIT_REF_NAME: ${CI_COMMIT_REF_NAME}"
       - docker build -t myapp:${VERSION} .
   ```

## Release Notes Issues

### Empty Release Notes

**Problem**: Release notes are not generated or are empty.

**Solutions**:

1. **Check commit message format**
   ```bash
   # View recent commits
   git log --oneline -10
   
   # Ensure conventional commit format
   git log --grep="^feat\|^fix\|^perf\|^refactor\|^docs\|^test\|^build\|^ci\|^chore\|^style"
   ```

2. **Verify AgileFlow configuration**
   ```javascript
   // agileflow.config.js
   module.exports = {
     releaseNotes: {
       enabled: true,
       format: 'conventional',
       includeBody: true,
       groupByType: true
     }
   };
   ```

3. **Check tag creation**
   ```bash
   # List all tags
   git tag --sort=-version:refname
   
   # View tag message
   git tag -l -n99 v1.2.3
   ```

### Malformed Release Notes

**Problem**: Release notes are generated but poorly formatted.

**Solutions**:

1. **Improve commit message quality**
   ```bash
   # ✅ Good commit messages
   feat(auth): add OAuth2 login support
   fix(api): handle null user ID gracefully
   docs: update installation guide
   
   # ❌ Poor commit messages
   add oauth
   fix bug
   update docs
   ```

2. **Use consistent scopes**
   ```bash
   # Consistent scope usage
   feat(auth): add OAuth2 login
   feat(auth): implement JWT refresh
   fix(auth): handle expired tokens
   ```

3. **Include meaningful descriptions**
   ```bash
   # Descriptive commit messages
   feat(auth): add OAuth2 login support with Google and GitHub providers
   
   Implements OAuth2 authentication flow supporting multiple
   identity providers. Includes proper error handling and
   user session management.
   ```

## Debugging Techniques

### Enable Debug Logging

```yaml
agileflow:
  variables:
    AGILEFLOW_DEBUG: "true"
    AGILEFLOW_LOG_LEVEL: "debug"
  script:
    - agileflow gitlab-ci --verbose
```

### Check Environment Variables

```yaml
debug-env:
  stage: build
  script:
    - echo "VERSION: ${VERSION}"
    - echo "CI_COMMIT_REF_NAME: ${CI_COMMIT_REF_NAME}"
    - echo "CI_COMMIT_SHA: ${CI_COMMIT_SHA}"
    - env | grep -E "(VERSION|CI_|AGILEFLOW_)"
  needs:
    - agileflow
```

### Verify Git State

```yaml
verify-git:
  stage: build
  script:
    - git status
    - git log --oneline -5
    - git tag --sort=-version:refname | head -5
    - git remote -v
  needs:
    - agileflow
```
