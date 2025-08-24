# Release Management Guide

AgileFlow revolutionizes release management by automating version generation, creating comprehensive release notes, and ensuring consistent deployments across all environments.

## Overview

Traditional release management often involves:
- Manual version number management
- Complex branching strategies for releases
- Environment-specific deployments
- Manual release note generation
- Inconsistent versioning across teams

AgileFlow eliminates these challenges by:
- **Automatic version generation** based on commit history
- **Single source of truth** for all releases
- **Version-centric deployments** across all environments
- **Automated release notes** from conventional commits
- **Consistent versioning** for all team members

## How Version Generation Works

### Semantic Versioning

AgileFlow follows [Semantic Versioning](https://semver.org/) (SemVer) principles:

```
MAJOR.MINOR.PATCH
   ^     ^     ^
   |     |     └── Patch: Bug fixes, documentation, etc.
   |     └──────── Minor: New features, backward compatible
   └────────────── Major: Breaking changes
```

### Automatic Version Bumping

AgileFlow analyzes your commit messages to determine the appropriate version bump:

```bash
# Patch version (v1.0.0 → v1.0.1)
fix: resolve login validation error
docs: update API documentation
refactor: improve error handling
test: add missing test coverage
build: update dependencies
ci: fix pipeline configuration
chore: update issue templates
style: fix code formatting

# Minor version (v1.0.0 → v1.1.0)
feat: add user authentication system
perf: optimize database queries
feat(api): implement rate limiting
perf(cache): add Redis caching layer

# Major version (v1.0.0 → v2.0.0)
feat!: remove deprecated API endpoints
feat(api)!: change user ID format to UUID
BREAKING CHANGE: modify database schema
```

### Version Calculation Logic

1. **Analyze commits** since the last version tag
2. **Identify commit types** using conventional commit format
3. **Determine bump level** based on highest impact commit
4. **Generate new version** by incrementing appropriate component
5. **Create version tag** and push to repository

## Release Process

### 1. Development Phase

During development, team members work on feature branches:

```bash
# Create feature branch
git checkout -b feat/user-authentication

# Make changes with conventional commits
git commit -m "feat: implement basic authentication"
git commit -m "test: add authentication unit tests"
git commit -m "docs: update authentication API docs"

# Push and create merge request
git push origin feat/user-authentication
```

### 2. Merge Request Review

Before merging to main:

- **Code review** by team members
- **Automated testing** passes
- **Documentation** updated
- **Conventional commits** used consistently

### 3. Merge to Main

When the merge request is approved and merged:

```bash
# AgileFlow automatically:
# 1. Detects the merge to main
# 2. Analyzes commit history
# 3. Calculates next version
# 4. Creates version tag
# 5. Generates release notes
# 6. Makes VERSION available to CI/CD
```

### 4. Automated Release

The CI/CD pipeline automatically:

```yaml
# .gitlab-ci.yml
agileflow:
  stage: version
  # Generates VERSION variable

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
```

## Release Notes Generation

### Conventional Commit Release Notes

When conventional commits are detected, AgileFlow generates structured release notes:

```text
v1.2.4

Features:
- auth: add OIDC login flow
- api: implement rate limiting middleware
- ui: add dark mode toggle

Bug fixes:
- api: correct null handling in user lookup
- auth: handle expired refresh tokens gracefully
- ui: fix button alignment in mobile view

Performance improvements:
- cache: implement Redis clustering
- db: optimize user query performance
- api: add response compression

Documentation:
- update API authentication guide
- add deployment troubleshooting section
- improve contributing guidelines

Tests:
- add integration tests for auth flow
- increase test coverage to 85%
- add performance benchmarks
```

### Traditional Commit Release Notes

For commits not following conventional format:

```text
v1.2.4
- Merge branch 'feat/user-authentication'
- Add user login functionality
- Fix password validation bug
- Update documentation
- Add unit tests
```

### Customizing Release Notes

You can customize release note generation:

```javascript
// agileflow.config.js
module.exports = {
  releaseNotes: {
    enabled: true,
    format: 'conventional', // 'conventional' or 'simple'
    includeBody: true,     // Include commit body
    groupByType: true,      // Group by commit type
    sortOrder: [           // Custom sort order
      'feat',
      'fix', 
      'perf',
      'refactor',
      'docs',
      'test',
      'build',
      'ci',
      'chore',
      'style'
    ]
  }
};
```

## Release Strategies

### Continuous Delivery

For teams practicing continuous delivery:

```yaml
# .gitlab-ci.yml
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: staging
  when: always  # Deploy every version to staging

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: production
  when: manual  # Manual approval for production
```

### Release Trains

For teams using release trains:

```yaml
# .gitlab-ci.yml
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: staging
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: never
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: always

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
  environment:
    name: production
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v\d+\.\d+\.0$/'  # Only major/minor releases
      when: manual
```

### Feature Flags

For teams using feature flags:

```yaml
# .gitlab-ci.yml
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
    - ./scripts/update-feature-flags.sh staging
  environment:
    name: staging

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
    - ./scripts/update-feature-flags.sh production
  environment:
    name: production
  when: manual
```

## Version Management

### Viewing Versions

```bash
# List all versions
git tag --sort=-version:refname

# View specific version
git show v1.2.3

# Compare versions
git diff v1.2.2..v1.2.3

# Checkout specific version
git checkout v1.2.3
```

### Version Metadata

Each version tag contains rich metadata:

```bash
# View tag message (release notes)
git tag -l -n99 v1.2.3

# View tag details
git show v1.2.3

# View commit hash for version
git rev-list -n 1 v1.2.3
```

### Version History

Track version evolution:

```bash
# View version timeline
git log --oneline --decorate --graph --all

# View commits in specific version
git log v1.2.2..v1.2.3 --oneline

# View files changed in version
git diff --name-only v1.2.2..v1.2.3
```

## Rollback Management

### Simple Rollbacks

With AgileFlow's version-centric approach, rollbacks are straightforward:

```bash
# Rollback to previous version
git checkout v1.2.2

# Deploy previous version
kubectl set image deployment/myapp myapp=myapp:v1.2.2
```

### Automated Rollback

Implement automated rollback in your CI/CD:

```yaml
# .gitlab-ci.yml
deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:${VERSION}
    - ./scripts/health-check.sh
  environment:
    name: production
  when: manual

rollback-production:
  stage: deploy
  script:
    - PREVIOUS_VERSION=$(git describe --abbrev=0 --tags v${VERSION%.*}.$((10#${VERSION##*.} - 1)))
    - kubectl set image deployment/myapp myapp=myapp:${PREVIOUS_VERSION}
  environment:
    name: production
  when: manual
  allow_failure: true
```

## Release Communication

### Release Announcements

Automate release announcements:

```yaml
# .gitlab-ci.yml
announce-release:
  stage: deploy
  script:
    - |
      cat << EOF | curl -X POST -H 'Content-Type: application/json' \
        -d @- $SLACK_WEBHOOK_URL
      {
        "text": "🚀 New Release: ${VERSION}",
        "attachments": [{
          "title": "Release Notes",
          "text": "$(git tag -l -n99 ${VERSION})",
          "color": "good"
        }]
      }
      EOF
  needs:
    - agileflow
  when: manual
```

### Release Documentation

Generate release documentation:

```yaml
# .gitlab-ci.yml
generate-release-docs:
  stage: deploy
  script:
    - mkdir -p releases
    - |
      cat > "releases/${VERSION}.md" << EOF
      # Release ${VERSION}
      
      ## Changes
      $(git tag -l -n99 ${VERSION})
      
      ## Deployment
      - Staging: ${CI_ENVIRONMENT_URL}
      - Production: Manual deployment required
      
      ## Rollback
      Previous version: $(git describe --abbrev=0 --tags v${VERSION%.*}.$((10#${VERSION##*.} - 1)))
      EOF
    - git add releases/
    - git commit -m "docs: add release documentation for ${VERSION}"
    - git push origin main
  needs:
    - agileflow
```

## Best Practices

### 1. Consistent Commit Messages

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

### 2. Small, Focused Releases

- **Keep releases small** and focused on specific features
- **Release frequently** to reduce risk
- **Test thoroughly** before merging to main
- **Document breaking changes** clearly

### 3. Environment Consistency

- **Deploy the same version** to all environments
- **Use configuration** for environment differences
- **Test in staging** before production
- **Monitor deployments** for issues

### 4. Version Tagging

- **Never manually create** version tags
- **Let AgileFlow handle** all versioning
- **Use conventional commits** for automatic versioning
- **Review release notes** before deployment

### 5. Rollback Planning

- **Plan rollback procedures** in advance
- **Test rollback processes** regularly
- **Document rollback steps** for each environment
- **Monitor system health** after deployments

## Troubleshooting

### Common Issues

**Version Not Generated**
- Check that conventional commits are used
- Verify AgileFlow is properly configured
- Ensure merge request process is followed
- Check CI/CD pipeline logs

**Release Notes Empty**
- Verify commit message format
- Check conventional commit types
- Ensure commits are properly merged
- Review AgileFlow configuration

**Deployment Issues**
- Verify VERSION variable is available
- Check job dependencies in pipeline
- Ensure environment configuration is correct
- Review deployment scripts

### Getting Help

- **Documentation**: Check other guides in this documentation
- **Examples**: Review the getting started guide
- **Community**: Join discussions in the community forum
- **Issues**: Open an issue in the project repository

## Conclusion

AgileFlow's release management approach transforms complex, manual release processes into automated, consistent workflows. By leveraging conventional commits and version-centric deployments, teams can:

- **Automate version generation** and release note creation
- **Maintain consistency** across all environments
- **Simplify rollbacks** with version-based deployments
- **Improve collaboration** with clear release communication
- **Reduce risk** through frequent, small releases

This approach scales from small teams to large enterprises, providing the structure and automation needed for modern software delivery while maintaining the flexibility teams require for effective development.
