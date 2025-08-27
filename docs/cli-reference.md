# CLI Reference

AgileFlow provides a simple command-line interface for CI/CD operations. The CLI is designed to be lightweight and focused on specific CI/CD tasks.

## Installation

The AgileFlow CLI is included in the Docker image and is automatically available when using the GitLab CI template. For local development, you can run the CLI directly from the scripts directory.

## Usage

```bash
agileflow <command> [options]
```

## Commands

### gitlab-ci

Configures git, computes semantic version tags from the release branch, and pushes to GitLab.

```bash
agileflow gitlab-ci
```

**What it does:**
- Configures git user with environment variables
- Analyzes commit history to determine next semantic version
- Generates comprehensive release notes from conventional commits
- Creates and pushes version tags to the repository
- Outputs version information for CI/CD pipeline consumption

**Environment Variables Required:**
- `GITLAB_USER_NAME` - GitLab username for commit authorship
- `GITLAB_USER_EMAIL` - GitLab email for commit authorship
- `CI_SERVER_HOST` - GitLab server hostname
- `CI_PROJECT_PATH` - GitLab project path
- `AGILEFLOW_TOKEN` - GitLab access token with API permissions

**Output:**
- Creates a `VERSION` file with the generated version
- Pushes version tag to the repository
- Provides version information via dotenv artifacts

**Example:**
```bash
export GITLAB_USER_NAME="AgileFlow Bot"
export GITLAB_USER_EMAIL="agileflow@example.com"
export CI_SERVER_HOST="gitlab.example.com"
export CI_PROJECT_PATH="group/project"
export AGILEFLOW_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"

agileflow gitlab-ci
```

## Help

Get help information:

```bash
agileflow --help
agileflow -h
agileflow help
```

## Error Handling

The CLI provides detailed error messages for common issues:

- **Missing environment variables** - Clear indication of what's required
- **Git repository issues** - Helpful messages for git-related problems
- **API authentication failures** - Specific guidance for token issues
- **Network problems** - Clear error messages for connectivity issues

## Integration

The CLI is primarily designed for use within GitLab CI pipelines via the AgileFlow template. It automatically handles:

- Git configuration
- Version calculation
- Tag creation and pushing
- Release note generation
- CI/CD pipeline integration

## Troubleshooting

### Common CLI Issues

**Permission Denied Errors**
- Ensure the `AGILEFLOW_TOKEN` has sufficient permissions
- Check that the token has "api" scope and maintainer role
- Verify the token hasn't expired

**Git Configuration Errors**
- Ensure `GITLAB_USER_NAME` and `GITLAB_USER_EMAIL` are set
- Check that the git repository is properly initialized
- Verify write access to the repository

**Version Calculation Issues**
- Check that conventional commit format is being used
- Ensure there are commits since the last version tag
- Verify the repository has proper tag history

For more detailed troubleshooting, see the [Troubleshooting Guide](./troubleshooting.md).

## Related Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [GitLab CI Template](./gitlab-ci-template.md) - CI/CD integration
- [Conventional Commits](./conventional-commits.md) - Commit message format
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
