# Configuration Guide

AgileFlow uses environment variables for configuration. Most variables are automatically provided by your CI/CD platform.

## Environment Variables

### Required for CI/CD

#### AGILEFLOW_TOKEN

The access token used to create version tags via the platform API.

| Platform | Token Type | Required Permissions |
|----------|------------|---------------------|
| GitHub | Personal Access Token | `contents: write` |
| GitLab | Project or Personal Access Token | `api` scope, `Maintainer` role |

**GitHub Actions:**
```yaml
env:
  AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
```

**GitLab CI:**
```yaml
# Set via Settings → CI/CD → Variables
# Key: AGILEFLOW_TOKEN
# Flags: Protected, Masked
```

### Auto-Provided Variables

These are automatically set by your CI/CD platform:

#### GitHub Actions

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_REPOSITORY` | Repository name | `owner/repo` |
| `GITHUB_SHA` | Current commit SHA | `abc123...` |

#### GitLab CI

| Variable | Description | Example |
|----------|-------------|---------|
| `CI_SERVER_HOST` | GitLab server hostname | `gitlab.com` |
| `CI_PROJECT_PATH` | Project path | `group/project` |
| `CI_COMMIT_SHA` | Current commit SHA | `abc123...` |

---

## Platform Configuration

### GitHub Actions

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for full commit history

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Create version tag
        env:
          AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
        run: agileflow github
```

### GitLab CI

```yaml
agileflow:
  image: node:20
  script:
    - npm install -g @logickernel/agileflow
    - agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
  tags:
    - agileflow
```

---

## Setting Up Tokens

### GitHub Personal Access Token

1. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Configure:
   - **Name**: `AgileFlow`
   - **Repository access**: Select your repositories
   - **Permissions**: `Contents: Read and write`
4. Copy the token

Add as a repository secret:
1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `AGILEFLOW_TOKEN`, Value: your token

### GitLab Project Access Token

1. Go to project **Settings → Access tokens**
2. Create new token:
   - **Name**: `AgileFlow`
   - **Role**: `Maintainer`
   - **Scopes**: `api`
3. Copy the token

Add as a CI/CD variable:
1. Go to project **Settings → CI/CD → Variables**
2. Add variable:
   - **Key**: `AGILEFLOW_TOKEN`
   - **Value**: your token
   - **Flags**: Protected, Masked

---

## Security Best Practices

### Token Security

- **Use project tokens** over personal tokens when possible
- **Enable protection** for sensitive variables
- **Limit scope** to only required permissions
- **Rotate tokens** regularly
- **Use masked variables** to hide values in logs

### Access Control

- **Minimal permissions** — Use tokens with only required access
- **Protected branches** — Limit who can push to main
- **Audit access** — Regularly review token usage

### Example: Protected Variable

**GitHub:**
- Repository secrets are automatically protected
- Only workflows triggered from the default branch can access them

**GitLab:**
```yaml
# Variable settings:
# - Protected: Yes (only available on protected branches)
# - Masked: Yes (hidden in job logs)
```

---

## Troubleshooting Configuration

### Token Permission Errors

**GitHub:**
```
Error: Resource not accessible by integration
```
- Ensure token has `contents: write` permission
- Check repository access is granted

**GitLab:**
```
Error: 403 Forbidden
```
- Ensure token has `api` scope
- Verify `Maintainer` role or higher
- Check token hasn't expired

### Missing Environment Variables

```
Error: AGILEFLOW_TOKEN environment variable is required but not set.
```
- Verify the variable is configured in your CI/CD settings
- Check variable protection settings match your branch

### Debug Configuration

Add a debug step to verify configuration:

**GitHub Actions:**
```yaml
- name: Debug
  run: |
    echo "Repository: $GITHUB_REPOSITORY"
    echo "SHA: $GITHUB_SHA"
    echo "Token set: ${{ secrets.AGILEFLOW_TOKEN != '' }}"
```

**GitLab CI:**
```yaml
debug:
  script:
    - echo "Server: $CI_SERVER_HOST"
    - echo "Project: $CI_PROJECT_PATH"
    - echo "Token set: ${AGILEFLOW_TOKEN:+yes}"
```

---

## Related Documentation

- [Installation Guide](./installation.md) — Complete setup instructions
- [CLI Reference](./cli-reference.md) — Command-line options
- [Troubleshooting](./troubleshooting.md) — Common issues and solutions
