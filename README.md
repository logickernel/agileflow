![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today's fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system, branching strategy, and CI/CD tool designed for software teams of all sizes and projects of any scale.

AgileFlow enforces Semantic Versioning and integrates a robust branching strategy for development and deployment. It seamlessly works with GitLab CI pipelines to ensure a structured, efficient, and predictable development lifecycle. **All versions are calculated from the main branch's commit history**, ensuring consistent versioning and release notes. Whether for small projects or large-scale deployments, AgileFlow is an indispensable tool that simplifies versioning and release management.

![AgileFlow workflow example diagram](./media/diagram.jpg)

AgileFlow works integrated with the CI/CD engine to **automatically create a new version** every time there's a merge into the main branch, incrementing the patch number based on the latest identifiable version in the repository.

# Installation

## GitLab CI

AgileFlow integrates with GitLab CI to automate version tagging. Add the following line at the top of `.gitlab-ci.yml`:

```yml
include:
  - remote: code.logickernel.com/kernel/agileflow/-/raw/main/templates/AgileFlow.gitlab-ci.yml
```

> [!NOTE]
> To allow the pipeline to push tags enable `Allow Git push requests to the repository` for the CI job token under `Settings > CI/CD > Job token permissions`.
>
> You may need to enable the feature flag `allow_push_repository_for_job_token` in your self-managed instance to see it.

**📚 Learn More**: [Complete Installation Guide](./docs/installation.md) - Step-by-step setup for different platforms

# Core Principles

## Main Branch Strategy

The main branch is the core of the AgileFlow framework. It serves as the single source of truth for all releases and versioning.

**Key Benefits:**
- **Single Version Sequence**: All versions (v1.0.0, v1.0.1, v1.1.0, etc.) are created from the same branch
- **Simplified Workflow**: No need to manage multiple release branches
- **Consistent History**: All releases share the same commit history and lineage
- **Easy Rollbacks**: Simple to revert to any previous version since all versions are on the same branch

**Version Management:**
- Patch versions (v1.0.0 → v1.0.1) are automatically incremented on each merge to main
- Minor versions (v1.0.0 → v1.1.0) are created by merging significant features
- Major versions (v1.0.0 → v2.0.0) are created for breaking changes

**📚 Learn More**: [Branching Strategy Guide](./docs/branching-strategy.md) - Complete guide to AgileFlow's branching approach

## Development Branches

Development branches are used for feature additions and bug fixes. They branch off the main branch and merge back into it when ready. Consider using expressive names depending on their purpose, e.g.: `dev/*`, `feat/*`, `fix/*`, and `hotfix/*`.

After the contribution is ready, the development branch is merged into main, preferably using a [Merge Request](https://docs.gitlab.com/ee/user/project/merge_requests/) or similar.

**📚 Learn More**: [Getting Started Guide](./docs/getting-started.md) - Quick start for new AgileFlow users

# Version-Centric CI/CD Approach

AgileFlow introduces a revolutionary approach to CI/CD that prioritizes **version management over environment-based deployments**. This paradigm shift eliminates the complexity of managing multiple deployment branches and environments, replacing them with a streamlined, version-focused workflow.

## What Makes AgileFlow Different?

- **Version-Centric**: Every deployment, test, and operation is performed on well-identified versions
- **Simplified Pipeline**: Just 5 focused stages (version, build, deploy, test, clean)
- **Eliminates Environment Drift**: All environments run identical versions
- **Predictable Deployments**: Every deployment uses a well-identified, immutable version
- **Simple Rollbacks**: Rollback to any previous version with confidence

## Pipeline Stages

Your pipeline consists of 5 focused stages that work together seamlessly:

1. **Version** - AgileFlow generates semantic versions automatically
2. **Build** - Create versioned artifacts using the generated version
3. **Deploy** - Deploy the same version everywhere (staging, production, etc.)
4. **Test** - Validate the deployed version across all environments
5. **Clean** - Cleanup temporary resources and artifacts

**📚 Learn More**: [Version-Centric CI/CD Deep Dive](./docs/version-centric-cicd.md) - Comprehensive guide to AgileFlow's revolutionary CI/CD paradigm

# Conventional Commits

Conventional Commits encode the intent of a change in the commit subject so that humans (and tools) can generate clear release notes and version bumps.

## Commit Format

```text
type[!]?(scope)?: description

[optional body]

[optional footer(s)]
```

## Key Commit Types

- **feat** - New features (minor version bump)
- **fix** - Bug fixes (patch version bump)
- **perf** - Performance improvements (minor version bump)
- **refactor** - Code refactoring (patch version bump)
- **docs** - Documentation updates (patch version bump)
- **!** - Breaking changes (major version bump)

## Example Commits

```text
feat(auth): add OIDC login flow
fix(api): correct null handling in user lookup
perf(cache)!: switch to Redis cluster
docs: update README with usage examples
```

**📚 Learn More**: [Conventional Commits Guide](./docs/conventional-commits.md) - Complete guide to commit message formatting and types

# Release Management

## Automatic Version Generation

AgileFlow automatically analyzes your commit history and determines the next semantic version based on conventional commits. Each merge to main triggers a new version:

- **Patch versions** (v1.0.0 → v1.0.1) for bug fixes and minor changes
- **Minor versions** (v1.0.0 → v1.1.0) for new features
- **Major versions** (v1.0.0 → v2.0.0) for breaking changes

## Release Notes

AgileFlow generates comprehensive release notes by grouping changes according to their intent:

```text
v1.2.4

Features:
- auth: add OIDC login flow

Bug fixes:
- api: correct null handling in user lookup

Performance improvements:
- BREAKING: cache: switch to Redis cluster

Documentation:
- update README with usage examples
```

**📚 Learn More**: [Release Management Guide](./docs/release-management.md) - How to manage releases and versions effectively

# GitLab CI Integration

## Template Usage

Include the AgileFlow template in your `.gitlab-ci.yml`:

```yaml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

# Your custom jobs using the VERSION variable
build:
  stage: build
  script:
    - docker build -t myapp:${VERSION} .
    - docker push myapp:${VERSION}
  needs:
    - agileflow
```

## Key Benefits

- **Automated Versioning**: The `agileflow` job generates versions automatically
- **VERSION Variable**: Available to all subsequent stages
- **Consistent Deployments**: Deploy the same version everywhere
- **Simplified Rollbacks**: Rollback to any previous version with confidence

**📚 Learn More**: [GitLab CI Template Reference](./docs/gitlab-ci-template.md) - Complete reference for the AgileFlow GitLab CI template

# Getting Started

## Quick Setup (5 minutes)

1. **Include the template** in your `.gitlab-ci.yml`
2. **Add your first job** using the `${VERSION}` variable
3. **Commit and push** - AgileFlow automatically generates versions

## Next Steps

- Add deployment jobs for staging and production
- Implement testing against deployed versions
- Customize for multiple services
- Set up environment-specific configurations

**📚 Learn More**: [Getting Started Guide](./docs/getting-started.md) - Step-by-step setup and examples

# Advanced Topics

## Migration from Traditional CI/CD

If you're currently using a traditional branch-based approach:

1. **Start with AgileFlow** - Include the template and let it generate versions
2. **Gradually simplify** - Remove environment-specific branches over time
3. **Update deployments** - Modify scripts to use `${VERSION}` variable
4. **Standardize testing** - Run tests against the deployed version
5. **Document changes** - Update runbooks to reference versions

## Best Practices

- Always use the `${VERSION}` variable from AgileFlow
- Deploy the same version to all environments
- Test against deployed versions, not source code
- Use conventional commits for automatic versioning
- Keep deployment scripts identical across environments

**📚 Learn More**: [Advanced Topics](./docs/README.md#advanced-topics) - Migration guides, best practices, and troubleshooting

# Documentation

For comprehensive guides and detailed explanations, see our [documentation folder](./docs/README.md).

## Quick Navigation

- **New to AgileFlow?** Start with [Getting Started](./docs/getting-started.md)
- **Want to understand the approach?** Read [Version-Centric CI/CD](./docs/version-centric-cicd.md)
- **Ready to implement?** Follow [GitLab CI Template Reference](./docs/gitlab-ci-template.md)
- **Need help?** Check [Troubleshooting](./docs/troubleshooting.md)

---

**Ready to transform your CI/CD?** Start with AgileFlow today and experience the benefits of a version-centric, streamlined deployment process! 🚀
