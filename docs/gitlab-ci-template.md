# GitLab CI Template Reference

The AgileFlow GitLab CI template provides a streamlined, version-centric CI/CD pipeline that eliminates the complexity of traditional environment-based deployments.

## Overview

This template implements a 5-stage pipeline that focuses on version management rather than branch-based environment management. Every deployment, test, and operation is performed on well-identified versions, ensuring consistency and reliability across all environments.

## Template Structure

```yaml
include:
  - local: templates/AgileFlow.gitlab-ci.yml
```

## Pipeline Stages

### 1. Version Stage
The foundation of the AgileFlow approach. This stage automatically generates semantic versions and comprehensive release notes.

**Job**: `agileflow`
- **Image**: `registry.logickernel.com/kernel/agileflow:0.6.68`
- **Script**: `agileflow gitlab-ci`
- **Artifacts**: `VERSION` variable (dotenv report)

**What it does**:
- Analyzes commit history on the main branch
- Calculates the next semantic version based on conventional commits
- Generates comprehensive release notes
- Creates and pushes version tags to the repository
- Makes the `VERSION` variable available to all subsequent stages

**Output**: The `VERSION` variable contains the generated semantic version (e.g., `v1.2.3`)

### 2. Build Stage
Creates application artifacts and Docker images using the version from the previous stage.

**Purpose**: Build versioned artifacts that will be deployed across all environments
**Input**: `VERSION` variable from the version stage
**Output**: Versioned artifacts (e.g., `app:v1.2.3`, `frontend:v1.2.3`)

**Example implementation**:
```yaml
build:
  stage: build
  script:
    - docker build -t myapp:${VERSION} .
    - docker push myapp:${VERSION}
  needs:
    - agileflow
```

### 3. Deploy Stage
Deploys the versioned artifacts to various environments.

**Purpose**: Deploy the same version to staging, production, and other environments
**Approach**: All environments receive identical versions, eliminating environment drift
**Benefits**: Predictable deployments, simplified rollbacks, consistent behavior

**Example implementation**:
```yaml
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: staging
  needs:
    - build

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: production
  when: manual
  needs:
    - build
```

### 4. Test Stage
Validates the deployed version across all environments.

**Purpose**: Run tests against the actual deployed version
**Scope**: Integration tests, end-to-end tests, performance tests
**Target**: Tests validate exactly what will run in production

**Example implementation**:
```yaml
integration-tests:
  stage: test
  script:
    - ./run-tests.sh --version ${VERSION}
  needs:
    - deploy-staging

performance-tests:
  stage: test
  script:
    - ./run-performance-tests.sh --version ${VERSION}
  needs:
    - deploy-staging
```

### 5. Clean Stage
Cleanup temporary resources and artifacts.

**Purpose**: Remove old Docker images, temporary files, and unnecessary artifacts
**Maintenance**: Keep only necessary version artifacts
**Optimization**: Reduce storage costs and improve pipeline performance

**Example implementation**:
```yaml
cleanup:
  stage: clean
  script:
    - docker image prune -f
    - rm -rf /tmp/build-artifacts
  when: always
```

## Key Benefits

### Version Consistency
- **Single Source of Truth**: All environments run identical versions
- **No Environment Drift**: Staging and production are always in sync
- **Predictable Deployments**: Every deployment uses a well-identified version

### Simplified Operations
- **Clear Version Tracking**: Easy to identify what's running where
- **Simple Rollbacks**: Rollback to any previous version with confidence
- **Reduced Complexity**: No need to manage multiple deployment branches

### Enhanced Reliability
- **Auditable Deployments**: Every deployment is tied to a specific version
- **Consistent Testing**: Tests validate the exact version that will be deployed
- **Improved Security**: Version-based deployments provide clear audit trails

## Implementation Examples

### Basic Implementation
```yaml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

build:
  stage: build
  script:
    - docker build -t myapp:${VERSION} .
    - docker push myapp:${VERSION}
  needs:
    - agileflow

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  needs:
    - build
```

### Advanced Implementation with Multiple Services
```yaml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

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

deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/backend backend=backend:${VERSION}
    - kubectl set image deployment/frontend frontend=frontend:${VERSION}
  environment:
    name: staging
  needs:
    - build-backend
    - build-frontend

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/backend backend=backend:${VERSION}
    - kubectl set image deployment/frontend frontend=frontend:${VERSION}
  environment:
    name: production
  when: manual
  needs:
    - build-backend
    - build-frontend
```

## Best Practices

### 1. Always Use the VERSION Variable
```yaml
# ✅ Good - Uses VERSION from AgileFlow
- docker build -t myapp:${VERSION} .

# ❌ Bad - Hardcoded or branch-based tagging
- docker build -t myapp:latest .
- docker build -t myapp:${CI_COMMIT_REF_SLUG} .
```

### 2. Proper Stage Dependencies
```yaml
# ✅ Good - Clear dependency chain
deploy:
  stage: deploy
  needs:
    - build

# ❌ Bad - No dependencies specified
deploy:
  stage: deploy
```

### 3. Environment-Specific Deployments
```yaml
# ✅ Good - Same version, different environments
deploy-staging:
  environment:
    name: staging

deploy-production:
  environment:
    name: production
  when: manual
```

### 4. Consistent Testing
```yaml
# ✅ Good - Test against deployed version
test:
  stage: test
  script:
    - ./run-tests.sh --version ${VERSION}
  needs:
    - deploy-staging
```

## Troubleshooting

### Common Issues

**VERSION variable not available**
- Ensure the `agileflow` job completed successfully
- Check that the dotenv artifact is properly configured
- Verify the job dependencies are set correctly

**Build failures in later stages**
- Check that the `VERSION` variable is being used correctly
- Ensure all jobs have proper `needs` dependencies
- Verify the artifact paths and variable names

**Deployment inconsistencies**
- Confirm that all deploy jobs use the same `${VERSION}` variable
- Check that the same image tags are used across environments
- Verify that the deployment scripts are identical

### Debug Commands

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

## Migration from Traditional CI/CD

If you're currently using a traditional branch-based approach:

1. **Include the template**: Add the include statement to your `.gitlab-ci.yml`
2. **Update build jobs**: Modify build scripts to use `${VERSION}` instead of branch names
3. **Consolidate deployments**: Deploy the same version to all environments
4. **Update testing**: Ensure tests run against the deployed version
5. **Remove branch logic**: Eliminate environment-specific branch handling

## Support

For issues or questions about the GitLab CI template:

- Check the [main documentation](../README.md)
- Review the [version-centric CI/CD approach](./version-centric-cicd.md)
- Open an issue in the project repository
- Join community discussions
