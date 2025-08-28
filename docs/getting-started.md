# Getting Started with AgileFlow

Welcome to AgileFlow! This guide will help you get up and running with AgileFlow's version-centric CI/CD approach in just a few minutes.

## What You'll Learn

By the end of this guide, you'll have:
- ✅ AgileFlow installed in your GitLab project
- ✅ A working CI/CD pipeline that automatically generates versions
- ✅ Understanding of how the version-centric approach works
- ✅ Confidence to customize the pipeline for your needs

## Prerequisites

Before you begin, ensure you have:
- A GitLab project with CI/CD enabled
- Access to modify `.gitlab-ci.yml` files and CI/CD variables
- Basic understanding of Git and CI/CD concepts

## Quick Start (5 minutes)

### Step 1: Include the AgileFlow Template

Add this line to the top of your `.gitlab-ci.yml` file:

```yaml
include:
  - remote: https://code.logickernel.com/kernel/agileflow/-/raw/main/templates/AgileFlow.gitlab-ci.yml
```

### Step 2: Configure the AGILEFLOW_TOKEN

AgileFlow needs a GitLab access token to create version tags via the API. Set this in your GitLab project:

1. Go to **Settings > CI/CD > Variables**
2. Add the `AGILEFLOW_TOKEN` variable:

| Variable | Value | Type | Protect | Mask |
|----------|-------|------|---------|------|
| `AGILEFLOW_TOKEN` | Your GitLab API token | Variable | Yes | No |

**Creating the AGILEFLOW_TOKEN:**
- **Project Access Token (Recommended)**: Go to **Settings > Access Tokens** in your project
- **Personal Access Token**: Go to your user **Settings > Access Tokens**
- Set **Name**: `AgileFlow Bot`, **Scopes**: `api`, **Role**: `maintainer` or higher

### Step 3: Add Your First Job

Below the include statement, add a simple build job:

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

### Step 4: Commit and Push

```bash
git add .gitlab-ci.yml
git commit -m "feat: add AgileFlow CI/CD pipeline"
git push
```

That's it! 🎉 Your first AgileFlow pipeline is now running.

## What Happens Next

1. **Pipeline Starts**: GitLab CI automatically detects your changes
2. **Version Generation**: AgileFlow analyzes your commit history and generates the next semantic version
3. **Build Process**: Your build job runs with the generated version
4. **Version Tag**: A new version tag is created via GitLab API (not git push)

## Understanding the Pipeline

Your pipeline now has 6 stages:

```
version → test → build → deploy → e2e → clean
```

- **version**: AgileFlow generates semantic versions automatically using GitLab API
- **test**: Run tests against source code before building (add your test jobs here)
- **build**: Your application builds with the generated version
- **deploy**: Deploy the versioned artifacts (add your deployment jobs here)
- **e2e**: Run end-to-end tests against deployed versions (add your e2e test jobs here)
- **clean**: Cleanup temporary resources (optional)

## How AgileFlow Works

### No Git Push Required
- **AgileFlow uses GitLab API** to create version tags
- **No repository write permissions** needed for CI/CD jobs
- **More secure** than traditional git push approaches
- **Works with protected branches** without special permissions

### Version Generation
- **Analyzes commit messages** since the last version
- **Uses conventional commits** to determine version bump type
- **Creates semantic versions** automatically (v1.0.0, v1.0.1, etc.)
- **Generates release notes** from commit history

## Next Steps

Now that you have the basics working, explore these areas:

### 1. Add Deployment Jobs
```yaml
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: staging
  needs:
    - build
```

### 2. Add Testing
```yaml
# Unit tests run before building
unit-tests:
  stage: test
  script:
    - npm test
    - npm run lint
  needs:
    - agileflow

# Integration tests run after deployment
integration-tests:
  stage: e2e
  script:
    - ./run-tests.sh --version ${VERSION}
  needs:
    - deploy-staging
```

### 3. Customize for Multiple Services
```yaml
build-backend:
  stage: build
  script:
    - docker build -t backend:${VERSION} ./backend
    - docker push backend:${VERSION}
  needs:
    - agileflow

build-frontend:
  stage: build
  script:
    - docker build -t frontend:${VERSION} ./frontend
    - docker push frontend:${VERSION}
  needs:
    - agileflow
```

## Common Questions

### Q: How does AgileFlow determine the next version?
A: AgileFlow analyzes your commit messages using conventional commits. Each merge to main increments the patch version (v1.0.0 → v1.0.1). Use `feat:` for minor versions and `feat!:` for major versions.

### Q: Can I use this with existing CI/CD pipelines?
A: Yes! AgileFlow is designed to work alongside existing pipelines. Just include the template and gradually migrate your jobs to use the `${VERSION}` variable.

### Q: What if I need different versions for different environments?
A: AgileFlow generates one version per pipeline run. Deploy the same version everywhere to eliminate environment drift. Use environment-specific configuration instead of different versions.

### Q: How do I rollback to a previous version?
A: Simply redeploy the previous version tag. Since all environments use the same version, rollbacks are consistent and predictable.

### Q: Why doesn't AgileFlow need git push permissions?
A: AgileFlow uses the GitLab API to create tags remotely instead of pushing them with git commands. This is more secure and doesn't require repository write access.

## Troubleshooting

### Pipeline Fails on Version Stage
- Check that the `AGILEFLOW_TOKEN` is set correctly
- Ensure the token has `api` scope and `maintainer` role
- Verify your GitLab CI/CD settings
- Check the `agileflow` job logs for specific errors

### VERSION Variable Not Available
- Ensure the `agileflow` job completed successfully
- Check that your jobs have `needs: - agileflow` dependency
- Verify the dotenv artifact is properly configured

### Build Jobs Fail
- Check that you're using `${VERSION}` correctly
- Ensure proper job dependencies with `needs:`
- Verify your build scripts work with the version variable

## Getting Help

- 📚 [Complete Documentation](./README.md) - Browse all available guides
- 🔧 [GitLab CI Template Reference](./gitlab-ci-template.md) - Detailed template documentation
- 💡 [Version-Centric CI/CD Approach](./version-centric-cicd.md) - Deep dive into the methodology
- 🐛 [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Congratulations! 🎉

You've successfully set up AgileFlow and are now using a modern, version-centric CI/CD approach. Your deployments will be more predictable, your rollbacks will be simpler, and your team will have better visibility into what's running where.

Ready to dive deeper? Explore the [advanced topics](./README.md#advanced-topics) or customize your pipeline further!
