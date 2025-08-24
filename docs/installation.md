# Installation & Setup Guide

This guide covers installing and setting up AgileFlow for different platforms and use cases.

## Prerequisites

Before installing AgileFlow, ensure you have:

- **Git Repository**: A Git repository with GitLab CI/CD enabled
- **GitLab Access**: Access to modify `.gitlab-ci.yml` files
- **CI/CD Permissions**: Ability to enable job token permissions for tag pushing
- **Basic Knowledge**: Understanding of Git, CI/CD, and Docker concepts

## GitLab CI Installation

### Step 1: Enable Job Token Permissions

AgileFlow needs to push version tags to your repository. Enable this in your GitLab project:

1. Go to **Settings > CI/CD > Job token permissions**
2. Enable **Allow Git push requests to the repository**
3. Save the changes

> [!NOTE]
> If you don't see this option, you may need to enable the feature flag `allow_push_repository_for_job_token` in your self-managed GitLab instance.

### Step 2: Include the AgileFlow Template

Add this line to the top of your `.gitlab-ci.yml` file:

```yaml
include:
  - remote: code.logickernel.com/kernel/agileflow/-/raw/main/templates/AgileFlow.gitlab-ci.yml
```

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

## Troubleshooting Installation

### Common Issues

**Job Token Permissions Not Available**
- Check if you're using a self-managed GitLab instance
- Enable the `allow_push_repository_for_job_token` feature flag
- Ensure you have admin access to the GitLab instance

**Template Include Fails**
- Verify the remote URL is accessible from your GitLab instance
- Check network connectivity and firewall rules
- Use a local copy of the template if remote access is restricted

**VERSION Variable Not Available**
- Ensure the `agileflow` job completed successfully
- Check that your jobs have `needs: - agileflow` dependency
- Verify the dotenv artifact is properly configured

**Docker Image Pull Fails**
- Check Docker registry access
- Verify image name and tag
- Ensure Docker daemon is running

### Getting Help

- **Documentation**: Check other guides in this documentation
- **Issues**: Open an issue in the project repository

## Next Steps

After successful installation:

1. **Read the [Getting Started Guide](./getting-started.md)** for your first pipeline
2. **Explore [Conventional Commits](./conventional-commits.md)** for proper commit formatting
3. **Review [GitLab CI Template Reference](./gitlab-ci-template.md)** for advanced configuration
4. **Check [Troubleshooting](./troubleshooting.md)** if you encounter issues