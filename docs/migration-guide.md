# Migration Guide

This guide helps you transition from traditional CI/CD approaches to AgileFlow's version-centric methodology. Whether you're using GitLab CI, GitHub Actions, or other CI/CD tools, this guide will walk you through the migration process.

## Understanding the Migration

### What You're Moving From

Traditional CI/CD pipelines typically use:
- **Branch-based environments** (staging branch, production branch)
- **Environment-specific deployments** (different code in different environments)
- **Manual version management** (hand-editing version numbers)
- **Complex branching strategies** (GitFlow, GitHub Flow variations)

### What You're Moving To

AgileFlow provides:
- **Version-centric deployments** (same version everywhere)
- **Automatic version generation** (based on commit history)
- **Simplified branching** (main branch + feature branches)
- **Consistent environments** (no more environment drift)

## Migration Strategy

### Phase 1: Preparation (Week 1)

#### 1. Team Training
- **Train team members** on conventional commits
- **Explain the new workflow** and benefits
- **Provide examples** of good vs. bad commit messages
- **Set up commit message templates** in your IDE

#### 2. Repository Preparation
- **Clean up existing branches** (merge or delete old environment branches)
- **Ensure main branch** is the primary development branch
- **Review existing tags** and versioning strategy
- **Backup current CI/CD configuration**

#### 3. Environment Planning
- **Identify all environments** (dev, staging, production, etc.)
- **Document current deployment processes**
- **Plan configuration management** (environment variables, secrets)
- **Design rollback procedures**

### Phase 2: Implementation (Week 2-3)

#### 1. Add AgileFlow Template
```yaml
# .gitlab-ci.yml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

# Keep existing jobs for now
build:
  stage: build
  script:
    - echo "Building from branch ${CI_COMMIT_REF_NAME}"
```

#### 2. Configure Environment Variables
Set up required AgileFlow variables:
- `GITLAB_USER_NAME`
- `GITLAB_USER_EMAIL`
- `CI_SERVER_HOST`
- `CI_PROJECT_PATH`
- `AGILEFLOW_TOKEN`

#### 3. Test Version Generation
- **Commit a simple change** with conventional commit format
- **Verify the `agileflow` job** completes successfully
- **Check that version tags** are created
- **Confirm `VERSION` variable** is available

### Phase 3: Gradual Migration (Week 4-6)

#### 1. Update Build Jobs
```yaml
# Before: Branch-based tagging
build:
  stage: build
  script:
    - docker build -t myapp:${CI_COMMIT_REF_SLUG} .

# After: Version-based tagging
build:
  stage: build
  script:
    - docker build -t myapp:${VERSION} .
  needs:
    - agileflow
```

#### 2. Update Deployment Jobs
```yaml
# Before: Environment-specific branches
deploy-staging:
  stage: deploy
  only:
    - staging
  script:
    - kubectl set image deployment/myapp myapp=myapp:${CI_COMMIT_REF_SLUG}

# After: Version-based deployment
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: staging
  needs:
    - build
```

#### 3. Update Testing Jobs
```yaml
# Before: Test against source code
test:
  stage: test
  script:
    - npm test

# After: Test against deployed version
test:
  stage: test
  script:
    - ./run-tests.sh --version ${VERSION}
  needs:
    - deploy-staging
```

### Phase 4: Cleanup (Week 7-8)

#### 1. Remove Old Branch Logic
```yaml
# Remove these from your pipeline
only:
  - staging
  - production
except:
  - main
```

#### 2. Clean Up Environment Branches
```bash
# Delete old environment branches
git branch -d staging
git branch -d production

# Push deletion to remote
git push origin --delete staging
git push origin --delete production
```

#### 3. Update Documentation
- **Update deployment runbooks** to reference versions
- **Modify rollback procedures** to use version tags
- **Update team workflows** and processes
- **Document new practices** and conventions

## Common Migration Patterns

### Pattern 1: Simple Web Application

#### Before (Traditional)
```yaml
stages:
  - build
  - test
  - deploy-staging
  - deploy-production

build:
  stage: build
  script:
    - docker build -t myapp:${CI_COMMIT_REF_SLUG} .

deploy-staging:
  stage: deploy-staging
  only:
    - staging
  script:
    - kubectl set image deployment/myapp myapp=myapp:${CI_COMMIT_REF_SLUG}

deploy-production:
  stage: deploy-production
  only:
    - production
  script:
    - kubectl set image deployment/myapp myapp=myapp:${CI_COMMIT_REF_SLUG}
```

#### After (AgileFlow)
```yaml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

stages:
  - version
  - build
  - deploy
  - test
  - clean

build:
  stage: build
  script:
    - docker build -t myapp:${VERSION} .
  needs:
    - agileflow

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

### Pattern 2: Microservices Architecture

#### Before (Traditional)
```yaml
build-backend:
  stage: build
  script:
    - docker build -t backend:${CI_COMMIT_REF_SLUG} ./backend

build-frontend:
  stage: build
  script:
    - docker build -t frontend:${CI_COMMIT_REF_SLUG} ./frontend

deploy-staging:
  stage: deploy
  only:
    - staging
  script:
    - kubectl set image deployment/backend backend=backend:${CI_COMMIT_REF_SLUG}
    - kubectl set image deployment/frontend frontend=frontend:${CI_COMMIT_REF_SLUG}
```

#### After (AgileFlow)
```yaml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

build-backend:
  stage: build
  script:
    - docker build -t backend:${VERSION} ./backend
  needs:
    - agileflow

build-frontend:
  stage: build
  script:
    - docker build -t frontend:${VERSION} ./frontend
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
```

## Migration Challenges and Solutions

### Challenge 1: Team Resistance to Conventional Commits

**Problem**: Team members are used to informal commit messages.

**Solutions**:
- **Provide templates** and examples
- **Use commit hooks** to enforce format
- **Start with simple types** (feat, fix, docs)
- **Gradually introduce** more complex patterns

### Challenge 2: Existing Environment-Specific Configurations

**Problem**: Different environments need different settings.

**Solutions**:
- **Use environment variables** for configuration
- **Keep deployment scripts identical** across environments
- **Use Kubernetes ConfigMaps** or similar for environment differences
- **Implement feature flags** for environment-specific features

### Challenge 3: Complex Deployment Dependencies

**Problem**: Some services depend on others being deployed first.

**Solutions**:
- **Use `needs` dependencies** to control job order
- **Implement health checks** between deployments
- **Use Kubernetes readiness probes** for dependency management
- **Consider service mesh** for complex service interactions

### Challenge 4: Rollback Procedures

**Problem**: Current rollback procedures are branch-based.

**Solutions**:
- **Update rollback scripts** to use version tags
- **Implement automated rollback** jobs
- **Document version-based rollback** procedures
- **Test rollback processes** regularly

## Testing Your Migration

### 1. Pipeline Validation
- **Verify all stages** complete successfully
- **Check version generation** works correctly
- **Confirm deployments** use the right versions
- **Test rollback procedures** work as expected

### 2. Environment Validation
- **Deploy to staging** and verify functionality
- **Test production deployment** (if applicable)
- **Verify environment consistency** (same version everywhere)
- **Test monitoring and alerting** still work

### 3. Team Validation
- **Confirm team members** understand new workflow
- **Verify conventional commits** are being used
- **Test deployment processes** with team members
- **Gather feedback** and make adjustments

## Rollback Plan

### If Migration Fails

1. **Revert to previous CI/CD configuration**
2. **Restore environment branches** if deleted
3. **Update documentation** with lessons learned
4. **Plan next migration attempt** with improvements

### Partial Rollback

1. **Keep AgileFlow template** but disable version generation
2. **Revert specific jobs** that are causing issues
3. **Gradually re-enable** features as issues are resolved
4. **Maintain version tags** for future use

## Post-Migration Checklist

- [ ] **All environments** are running the same version
- [ ] **Version tags** are being created automatically
- [ ] **Deployments** use the `${VERSION}` variable
- [ ] **Rollback procedures** work with version tags
- [ ] **Team members** are using conventional commits
- [ ] **Documentation** has been updated
- [ ] **Monitoring** shows consistent behavior
- [ ] **Performance** meets or exceeds previous levels

## Getting Help

If you encounter issues during migration:

1. **Check the [Troubleshooting Guide](./troubleshooting.md)**
2. **Review [Best Practices](./best-practices.md)** for guidance
3. **Consult the [Configuration Guide](./configuration.md)** for setup help
4. **Open an issue** in the project repository
5. **Join community discussions** for support

## Related Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [Best Practices](./best-practices.md) - Recommended practices
- [Configuration](./configuration.md) - Environment variables
- [GitLab CI Template](./gitlab-ci-template.md) - Template reference
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
