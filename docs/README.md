# AgileFlow Documentation

Welcome to the AgileFlow documentation! AgileFlow is a lightweight, platform-agnostic tool for automatic semantic versioning and changelog generation.

```bash
npx @logickernel/agileflow
```

## Quick Navigation

| I want to... | Read this |
|--------------|-----------|
| Get started quickly | [Getting Started](./getting-started.md) |
| Set up CI/CD integration | [Installation Guide](./installation.md) |
| Understand the CLI | [CLI Reference](./cli-reference.md) |
| Learn the methodology | [Version-Centric CI/CD](./version-centric-cicd.md) |
| Fix an issue | [Troubleshooting](./troubleshooting.md) |

## Documentation Index

### Getting Started
- **[Getting Started](./getting-started.md)** — Quick start guide for new users
- **[Installation Guide](./installation.md)** — Setup for GitHub Actions and GitLab CI
- **[CLI Reference](./cli-reference.md)** — Commands, options, and examples

### Core Concepts
- **[Version-Centric CI/CD](./version-centric-cicd.md)** — The methodology behind AgileFlow
- **[Branching Strategy](./branching-strategy.md)** — How to structure your Git workflow
- **[Conventional Commits](./conventional-commits.md)** — Commit message format and version impact
- **[Release Management](./release-management.md)** — Managing releases and versions

### Reference
- **[Configuration](./configuration.md)** — Environment variables and options
- **[Best Practices](./best-practices.md)** — Recommended patterns and tips
- **[Migration Guide](./migration-guide.md)** — Transitioning from other CI/CD approaches
- **[Troubleshooting](./troubleshooting.md)** — Common issues and solutions

## Platform Support

AgileFlow works with any Git repository and provides native integrations for:

- **GitHub Actions** — Uses GitHub API for tag creation
- **GitLab CI** — Uses GitLab API for tag creation
- **Any CI/CD** — Native git push for other platforms

## Contributing to Documentation

We welcome improvements to our documentation! Please:

1. Follow the existing style and tone
2. Use clear, concise language
3. Include practical examples
4. Test any code examples or commands
5. Submit changes via pull/merge requests

## External Resources

- [Main README](../README.md) — Project overview and quick start
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning Specification](https://semver.org/)
