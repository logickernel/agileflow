# Installation & Setup Guide

This guide covers installing and setting up AgileFlow for different platforms and use cases.

## Prerequisites

Before installing AgileFlow, ensure you have:

- **Git Repository**: A Git repository with GitLab CI/CD enabled
- **GitLab Access**: Access to modify `.gitlab-ci.yml` files and CI/CD variables
- **Basic Knowledge**: Understanding of Git, CI/CD, and Docker concepts

## GitLab CI Installation

### Step 1: Include the AgileFlow Template

Add this line to the top of your `.gitlab-ci.yml` file:

```yaml
include:
  - remote: https://code.logickernel.com/kernel/agileflow/-/raw/main/templates/AgileFlow.gitlab-ci.yml
```

### Step 2: Configure the AGILEFLOW_TOKEN

AgileFlow needs a GitLab access token to create version tags via the API. Set this in your GitLab project's CI/CD variables:

1. Go to your GitLab project
2. Navigate to **Settings > CI/CD**
3. Expand **Variables**
4. Add the `AGILEFLOW_TOKEN` variable:

| Variable | Value | Type | Protect | Mask |
|----------|-------|------|---------|------|
| `AGILEFLOW_TOKEN` | Your GitLab API token | Variable | Yes | No |

#### Creating the AGILEFLOW_TOKEN

You need a GitLab access token with API permissions. You can create either:

**Option 1: Project Access Token (Recommended)**
1. Go to your project's **Settings > Access Tokens**
2. Create a new token with:
   - **Name**: `AgileFlow Bot`
   - **Description**: `Token for AgileFlow automatic versioning`
   - **Role**: `maintainer` or higher
   - **Scopes**: `api`
3. Copy the generated token

**Option 2: Personal Access Token**
1. Go to your user **Settings > Access Tokens**
2. Create a new token with:
   - **Name**: `AgileFlow Bot`
   - **Description**: `Token for AgileFlow automatic versioning`
   - **Scopes**: `api`
3. Copy the generated token

### Step 3: Add Your First Job

Below the include statement, add a simple build job to test the setup:

```yaml
build:
  stage: build
  script:
    - echo "Building version ${VERSION}"
    - docker build -t myapp:${VERSION} .
    - docker push myapp:${VERSION}
  needs:
    - agileflow
```

### Step 4: Test the Installation

1. Commit and push your changes:
   ```bash
   git add .gitlab-ci.yml
   git commit -m "feat: add AgileFlow CI/CD pipeline"
   git push
   ```

2. Check your GitLab CI pipeline - it should automatically start
3. The `agileflow` job should complete successfully and generate a version
4. Subsequent jobs should have access to the `${VERSION}` variable

## How It Works

AgileFlow uses a different approach than traditional CI/CD tools:

### No Git Push Required
- **AgileFlow does NOT push tags to your repository** using git commands
- **Instead, it uses the GitLab API** to create tags remotely
- **This eliminates the need** for job token permissions to push to the repository

### Version Generation Process
1. **Analyzes commit history** on the main branch
2. **Calculates next semantic version** based on conventional commits
3. **Creates version tag** via GitLab API (not git push)
4. **Makes VERSION variable available** to all subsequent pipeline stages

### Benefits of This Approach
- **No repository write permissions** needed for CI/CD jobs
- **More secure** - uses API tokens instead of git credentials
- **Works with protected branches** without special permissions
- **Consistent behavior** across all GitLab instances

## Troubleshooting Installation

### Common Issues

#### AGILEFLOW_TOKEN Permission Errors

**Problem**: Token permission denied errors.

**Solutions**:
- Ensure the token has `api` scope
- Verify the token has `maintainer` role or higher
- Check that the token hasn't expired
- Confirm the token is for the correct project/user

#### Template Include Fails

**Problem**: The AgileFlow template include statement fails.

**Solutions**:
- Check network connectivity to `code.logickernel.com`
- Verify the remote URL is accessible from your GitLab instance
- Check firewall rules and network policies
- Use a local copy of the template if remote access is restricted

#### VERSION Variable Not Available

**Problem**: The `${VERSION}` variable is not available in subsequent pipeline stages.

**Solutions**:
- Ensure the `agileflow` job completed successfully
- Check that your jobs have `needs: - agileflow` dependency
- Verify the dotenv artifact is properly configured
- Check the `agileflow` job logs for errors

### Debug Configuration

Add a debug job to verify the setup:

```yaml
debug-version:
  stage: build
  script:
    - echo "VERSION: ${VERSION}"
    - echo "CI_COMMIT_REF_NAME: ${CI_COMMIT_REF_NAME}"
    - echo "CI_COMMIT_SHA: ${CI_COMMIT_SHA}"
  needs:
    - agileflow
```

## Next Steps

After successful installation:

1. **Read the [Getting Started Guide](./getting-started.md)** for your first pipeline
2. **Explore [Conventional Commits](./conventional-commits.md)** for proper commit formatting
3. **Review [GitLab CI Template Reference](./gitlab-ci-template.md)** for advanced configuration
4. **Check [Troubleshooting](./troubleshooting.md)** if you encounter issues