# Best Practices Guide

This guide provides recommended practices and patterns for using AgileFlow effectively in your development workflow.

## Commit Message Best Practices

### 1. Use Conventional Commits Consistently

```bash
# ✅ Good - Clear and consistent
feat(auth): add OAuth2 login support
fix(api): handle null user ID gracefully
docs: update installation guide

# ❌ Bad - Inconsistent and unclear
add oauth
fix bug
update docs
```

### 2. Add Scopes for Better Organization

```bash
# ✅ Good - Scoped commits
feat(auth): implement JWT token validation
fix(api): resolve user lookup timeout
docs(readme): add troubleshooting section

# ❌ Bad - No scope
feat: implement JWT token validation
fix: resolve user lookup timeout
docs: add troubleshooting section
```

### 3. Write Clear, Descriptive Messages

```bash
# ✅ Good - Clear description
feat(auth): add two-factor authentication with SMS
fix(api): handle database connection failures gracefully
docs: add comprehensive API reference

# ❌ Bad - Vague description
feat: add 2FA
fix: fix bug
docs: update docs
```

### 4. Use Breaking Change Indicators Properly

```bash
# ✅ Good - Breaking changes clearly marked
feat!: remove deprecated API endpoints
feat(auth)!: change user ID format to UUID
BREAKING CHANGE: modify database schema

# ❌ Bad - Breaking changes not marked
feat: remove deprecated API endpoints
feat(auth): change user ID format to UUID
```

## Pipeline Configuration Best Practices

### 1. Always Use the VERSION Variable

```yaml
# ✅ Good - Uses VERSION from AgileFlow
build:
  stage: build
  script:
    - docker build -t myapp:${VERSION} .
    - docker push myapp:${VERSION}

# ❌ Bad - Hardcoded or branch-based tagging
build:
  stage: build
  script:
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

## Version Management Best Practices

### 1. Keep Releases Small and Focused

- **Small releases** reduce risk and make debugging easier
- **Frequent releases** provide faster feedback
- **Focused changes** make rollbacks more predictable

### 2. Test Thoroughly Before Merging

- **Unit tests** should pass on feature branches
- **Integration tests** should run before merge
- **Documentation** should be updated with changes

### 3. Use Feature Flags for Large Changes

```yaml
# ✅ Good - Feature flag for gradual rollout
deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
    - kubectl patch deployment/myapp -p '{"spec":{"template":{"metadata":{"annotations":{"feature-flag/new-auth":"enabled"}}}}}'
```

### 4. Monitor Deployments

```yaml
# ✅ Good - Health checks after deployment
deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
    - kubectl rollout status deployment/myapp --timeout=300s
    - ./health-check.sh
```

## Security Best Practices

### 1. Secure Environment Variables

```yaml
# ✅ Good - Protected and masked variables
variables:
  AGILEFLOW_TOKEN: $AGILEFLOW_TOKEN  # Protected and masked
  GITLAB_USER_NAME: "AgileFlow Bot"  # Not sensitive

# ❌ Bad - Exposed sensitive information
variables:
  AGILEFLOW_TOKEN: "glpat-xxxxxxxxxxxxxxxxxxxx"
```

### 2. Minimal Token Permissions

- **Use project tokens** instead of personal tokens when possible
- **Limit token scope** to only required permissions
- **Regular token rotation** for security

### 3. Environment Isolation

```yaml
# ✅ Good - Environment-specific configurations
deploy-staging:
  environment:
    name: staging
  variables:
    DATABASE_URL: $STAGING_DATABASE_URL

deploy-production:
  environment:
    name: production
  variables:
    DATABASE_URL: $PRODUCTION_DATABASE_URL
```

## Performance Best Practices

### 1. Optimize Build Times

```yaml
# ✅ Good - Cached dependencies
build:
  stage: build
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .cache/
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
```

### 2. Parallel Job Execution

```yaml
# ✅ Good - Parallel builds for multiple services
build-backend:
  stage: build
  script:
    - docker build -t backend:${VERSION} ./backend

build-frontend:
  stage: build
  script:
    - docker build -t frontend:${VERSION} ./frontend

# Both jobs can run in parallel
```

### 3. Efficient Artifact Management

```yaml
# ✅ Good - Selective artifacts
build:
  stage: build
  artifacts:
    paths:
      - dist/
      - build/
    expire_in: 1 week
    when: on_success
```

## Monitoring and Observability

### 1. Pipeline Visibility

```yaml
# ✅ Good - Clear job names and descriptions
build-production:
  stage: build
  description: "Build production artifacts with version ${VERSION}"
  script:
    - echo "Building version ${VERSION}"
```

### 2. Deployment Tracking

```yaml
# ✅ Good - Track deployment status
deploy:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
    - echo "Deployed ${VERSION} at $(date)" >> deployment.log
```

### 3. Error Reporting

```yaml
# ✅ Good - Comprehensive error handling
deploy:
  stage: deploy
  script:
    - |
      if ! kubectl set image deployment/myapp myapp=myapp:${VERSION}; then
        echo "Deployment failed for version ${VERSION}"
        exit 1
      fi
```

## Migration Best Practices

### 1. Gradual Adoption

- **Start with AgileFlow** on new projects
- **Gradually migrate** existing pipelines
- **Test thoroughly** before full migration

### 2. Team Training

- **Train team members** on conventional commits
- **Document workflow changes** clearly
- **Provide examples** and templates

### 3. Rollback Planning

```yaml
# ✅ Good - Rollback capability
rollback:
  stage: deploy
  script:
    - |
      PREVIOUS_VERSION=$(git describe --abbrev=0 --tags v${VERSION%.*}.$((10#${VERSION##*.} - 1)))
      kubectl set image deployment/myapp myapp=myapp:${PREVIOUS_VERSION}
  when: manual
  allow_failure: true
```

## Documentation Best Practices

### 1. Keep Documentation Updated

- **Update README** with new features
- **Document breaking changes** clearly
- **Provide examples** for common use cases

### 2. Version-Specific Documentation

```yaml
# ✅ Good - Generate version-specific docs
docs:
  stage: deploy
  script:
    - |
      echo "# Version ${VERSION}" > docs/versions/${VERSION}.md
      echo "Released: $(date)" >> docs/versions/${VERSION}.md
      echo "Changes: $(git tag -l -n99 ${VERSION})" >> docs/versions/${VERSION}.md
```

## Related Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [Conventional Commits](./conventional-commits.md) - Commit message format
- [GitLab CI Template](./gitlab-ci-template.md) - Template configuration
- [Configuration](./configuration.md) - Environment variables
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
