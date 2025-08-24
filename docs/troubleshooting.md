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

3. **Dotenv artifact not configured**
   ```yaml
   # Ensure agileflow job has proper artifacts
   agileflow:
     stage: version
     artifacts:
       reports:
         dotenv: VERSION
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

3. **AgileFlow configuration issues**
   ```javascript
   // Check agileflow.config.js
   module.exports = {
     versionRules: {
       major: ['feat!', 'BREAKING CHANGE'],
       minor: ['feat', 'perf'],
       patch: ['fix', 'docs', 'style', 'refactor', 'test', 'build', 'ci', 'chore']
     }
   };
   ```

### Incorrect Version Bumping

**Problem**: AgileFlow generates the wrong version number.

**Causes and Solutions**:

1. **Commit type not recognized**
   ```bash
   # Use recognized commit types
   feat: new feature          # Minor version bump
   fix: bug fix              # Patch version bump
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

### Deploy Stage Issues

**Problem**: Deployment jobs fail or deploy inconsistently.

**Solutions**:

1. **Environment-specific configurations**
   ```yaml
   deploy-staging:
     stage: deploy
     variables:
       DATABASE_URL: "staging-db.example.com"
       LOG_LEVEL: "debug"
     script:
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
   
   deploy-production:
     stage: deploy
     variables:
       DATABASE_URL: "prod-db.example.com"
       LOG_LEVEL: "info"
     script:
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
   ```

2. **Consistent deployment scripts**
   ```yaml
   # Use the same script for all environments
   .deploy-template: &deploy-template
     script:
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
       - kubectl rollout status deployment/myapp
   
   deploy-staging:
     <<: *deploy-template
     environment:
       name: staging
   
   deploy-production:
     <<: *deploy-template
     environment:
       name: production
   ```

3. **Version verification**
   ```yaml
   deploy-production:
     script:
       - echo "Deploying version: ${VERSION}"
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
       - kubectl get deployment/myapp -o jsonpath='{.spec.template.spec.containers[0].image}'
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

## Environment Issues

### Environment Drift

**Problem**: Staging and production environments behave differently.

**Solutions**:

1. **Deploy identical versions**
   ```yaml
   # Same version, different configurations
   deploy-staging:
     variables:
       ENVIRONMENT: "staging"
       LOG_LEVEL: "debug"
     script:
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
   
   deploy-production:
     variables:
       ENVIRONMENT: "production"
       LOG_LEVEL: "info"
     script:
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
   ```

2. **Use configuration files**
   ```yaml
   # config/staging.yaml
   database:
     host: staging-db.example.com
     ssl: false
   
   # config/production.yaml
   database:
     host: prod-db.example.com
     ssl: true
   ```

3. **Environment-specific variables**
   ```yaml
   deploy:
     script:
       - envsubst < config/${ENVIRONMENT}.yaml > config.yaml
       - kubectl set image deployment/myapp myapp=myapp:${VERSION}
   ```

### Rollback Issues

**Problem**: Rollbacks don't work as expected.

**Solutions**:

1. **Version-based rollbacks**
   ```bash
   # Rollback to specific version
   kubectl set image deployment/myapp myapp=myapp:v1.2.2
   
   # Verify rollback
   kubectl get deployment/myapp -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

2. **Automated rollback in CI/CD**
   ```yaml
   rollback-production:
     stage: deploy
     script:
       - PREVIOUS_VERSION=$(git describe --abbrev=0 --tags v${VERSION%.*}.$((10#${VERSION##*.} - 1)))
       - kubectl set image deployment/myapp myapp=myapp:${PREVIOUS_VERSION}
     environment:
       name: production
     when: manual
   ```

3. **Rollback verification**
   ```yaml
   verify-rollback:
     stage: test
     script:
       - ./scripts/health-check.sh
       - ./scripts/verify-version.sh ${PREVIOUS_VERSION}
   ```

## Performance Issues

### Slow Version Generation

**Problem**: AgileFlow takes too long to generate versions.

**Solutions**:

1. **Optimize repository size**
   ```bash
   # Clean up old branches
   git remote prune origin
   git gc --aggressive
   
   # Limit fetch depth if needed
   git fetch --depth=100
   ```

2. **Use caching**
   ```yaml
   agileflow:
     cache:
       key: agileflow-cache
       paths:
         - .agileflow-cache/
   ```

3. **Parallel processing**
   ```yaml
   # Run version generation in parallel with other jobs
   version:
     stage: version
     parallel:
       matrix:
         - JOB: agileflow
         - JOB: security-scan
   ```

### Memory Issues

**Problem**: AgileFlow jobs consume too much memory.

**Solutions**:

1. **Adjust resource limits**
   ```yaml
   agileflow:
     variables:
       NODE_OPTIONS: "--max-old-space-size=2048"
   ```

2. **Use smaller Docker image**
   ```yaml
   agileflow:
     image: registry.logickernel.com/kernel/agileflow:alpine
   ```

3. **Optimize Git operations**
   ```yaml
   agileflow:
     variables:
       GIT_DEPTH: "100"
       GIT_FETCH_EXTRA_ARGS: "--no-tags"
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

## Getting Help

### Self-Service Resources

1. **Documentation**: Check other guides in this documentation
2. **Examples**: Review the getting started guide
3. **Configuration**: Check AgileFlow configuration options
4. **Logs**: Examine pipeline and job logs

### Community Support

1. **Community Forum**: Join discussions in the community forum
2. **GitHub Issues**: Open an issue in the project repository
3. **Stack Overflow**: Search for existing questions and answers
4. **Slack/Discord**: Join community chat channels

### Professional Support

1. **Enterprise Support**: Contact the AgileFlow team for enterprise support
2. **Consulting**: Get help with implementation and optimization
3. **Training**: Attend AgileFlow training sessions
4. **Custom Development**: Request custom features or integrations

## Prevention Best Practices

### Regular Maintenance

1. **Keep branches clean** - Delete merged branches regularly
2. **Update dependencies** - Keep AgileFlow and tools up to date
3. **Monitor performance** - Track pipeline execution times
4. **Review configurations** - Periodically review and optimize settings

### Team Training

1. **Conventional commits** - Train team on proper commit format
2. **Pipeline management** - Educate on CI/CD best practices
3. **Troubleshooting** - Share common issues and solutions
4. **Documentation** - Keep team documentation updated

### Monitoring and Alerting

1. **Pipeline health** - Monitor pipeline success rates
2. **Version generation** - Track version creation success
3. **Deployment status** - Monitor deployment success rates
4. **Performance metrics** - Track execution times and resource usage

## Conclusion

Most AgileFlow issues can be resolved by following the troubleshooting steps in this guide. The key is to:

1. **Start with the basics** - Check pipeline status and job dependencies
2. **Verify configuration** - Ensure proper setup and configuration
3. **Use debugging tools** - Enable debug logging and verify environment
4. **Follow best practices** - Use conventional commits and proper job dependencies
5. **Seek help when needed** - Use community resources and professional support

By following these troubleshooting steps and best practices, you'll be able to resolve most issues quickly and maintain a healthy AgileFlow implementation.
