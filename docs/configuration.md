# Configuration Guide

AgileFlow uses environment variables for configuration, making it easy to customize behavior across different environments and deployment scenarios.

## Environment Variables

### Required Variables

These environment variables must be set for AgileFlow to function properly:

#### GitLab CI/CD Variables

- **`GITLAB_USER_NAME`** - Username for git commits and tag creation
  - **Example**: `AgileFlow Bot`
  - **Purpose**: Sets the author name for version tags and commits
  - **Required**: Yes

- **`GITLAB_USER_EMAIL`** - Email address for git commits and tag creation
  - **Example**: `agileflow@example.com`
  - **Purpose**: Sets the author email for version tags and commits
  - **Required**: Yes

- **`CI_SERVER_HOST`** - GitLab server hostname
  - **Example**: `gitlab.example.com`
  - **Purpose**: Used for generating commit pipeline URLs and API calls
  - **Required**: Yes

- **`CI_PROJECT_PATH`** - GitLab project path (group/project)
  - **Example**: `mygroup/myproject`
  - **Purpose**: Used for API calls and URL generation
  - **Required**: Yes

- **`AGILEFLOW_TOKEN`** - GitLab access token with API permissions
  - **Example**: `glpat-xxxxxxxxxxxxxxxxxxxx`
  - **Purpose**: Authenticates API calls for tag creation and repository access
  - **Required**: Yes
  - **Scopes**: `api` access required
  - **Role**: `maintainer` or higher recommended

### Optional Variables

These variables can be set to customize AgileFlow behavior:

#### Version Generation

- **`AGILEFLOW_MAX_COMMIT_LINES`** - Maximum number of commit lines in release notes
  - **Default**: `50`
  - **Example**: `100`
  - **Purpose**: Controls the length of generated release notes

- **`AGILEFLOW_INCLUDE_MERGE_COMMITS`** - Whether to include merge commits in release notes
  - **Default**: `false`
  - **Example**: `true`
  - **Purpose**: Controls whether merge commits appear in release notes

#### Git Configuration

- **`GIT_COMMITTER_NAME`** - Override committer name (if different from author)
  - **Default**: Uses `GITLAB_USER_NAME`
  - **Example**: `CI Bot`
  - **Purpose**: Sets the committer name for git operations

- **`GIT_COMMITTER_EMAIL`** - Override committer email (if different from author)
  - **Default**: Uses `GITLAB_USER_EMAIL`
  - **Example**: `ci@example.com`
  - **Purpose**: Sets the committer email for git operations

## Configuration Examples

### Basic GitLab CI Configuration

```yaml
# .gitlab-ci.yml
variables:
  GITLAB_USER_NAME: "AgileFlow Bot"
  GITLAB_USER_EMAIL: "agileflow@example.com"
  CI_SERVER_HOST: "gitlab.example.com"
  CI_PROJECT_PATH: "mygroup/myproject"

include:
  - local: templates/AgileFlow.gitlab-ci.yml

build:
  stage: build
  script:
    - echo "Building version ${VERSION}"
  needs:
    - agileflow
```

### Advanced Configuration with Custom Options

```yaml
# .gitlab-ci.yml
variables:
  GITLAB_USER_NAME: "AgileFlow Bot"
  GITLAB_USER_EMAIL: "agileflow@example.com"
  CI_SERVER_HOST: "gitlab.example.com"
  CI_PROJECT_PATH: "mygroup/myproject"
  AGILEFLOW_MAX_COMMIT_LINES: "100"
  AGILEFLOW_INCLUDE_MERGE_COMMITS: "false"

include:
  - local: templates/AgileFlow.gitlab-ci.yml

build:
  stage: build
  script:
    - echo "Building version ${VERSION}"
  needs:
    - agileflow
```

### Environment-Specific Configuration

```yaml
# .gitlab-ci.yml
include:
  - local: templates/AgileFlow.gitlab-ci.yml

# Development environment
build-dev:
  stage: build
  variables:
    AGILEFLOW_MAX_COMMIT_LINES: "25"
  script:
    - echo "Building dev version ${VERSION}"
  needs:
    - agileflow

# Production environment
build-prod:
  stage: build
  variables:
    AGILEFLOW_MAX_COMMIT_LINES: "100"
  script:
    - echo "Building production version ${VERSION}"
  needs:
    - agileflow
```

## Setting Variables in GitLab

### Project-Level Variables

1. Go to your GitLab project
2. Navigate to **Settings > CI/CD**
3. Expand **Variables**
4. Add each required variable:
   - **Key**: `GITLAB_USER_NAME`
   - **Value**: `AgileFlow Bot`
   - **Type**: Variable
   - **Environment scope**: All (default)
   - **Protect variable**: Yes (recommended)
   - **Mask variable**: No

### Group-Level Variables

For organization-wide consistency:

1. Go to your GitLab group
2. Navigate to **Settings > CI/CD**
3. Expand **Variables**
4. Add common variables like `GITLAB_USER_NAME` and `GITLAB_USER_EMAIL`

### Instance-Level Variables

For self-managed GitLab instances:

1. Go to **Admin Area > Settings > CI/CD**
2. Expand **Variables**
3. Add instance-wide defaults

## Security Considerations

### Token Security

- **Protect variables**: Enable protection for sensitive variables like `AGILEFLOW_TOKEN`
- **Mask variables**: Don't mask variables that need to be visible in logs
- **Scope variables**: Limit variable scope to specific environments when possible
- **Rotate tokens**: Regularly rotate access tokens

### Access Control

- **Minimal permissions**: Use tokens with minimal required permissions
- **Role-based access**: Ensure tokens have appropriate role assignments
- **Audit access**: Regularly review token access and usage

## Troubleshooting Configuration

### Common Configuration Issues

**Missing Required Variables**
```
Error: Missing required environment variable: GITLAB_USER_NAME
```
**Solution**: Add the missing variable to your GitLab CI/CD variables.

**Invalid Token Permissions**
```
Error: Permission denied. The AGILEFLOW_TOKEN needs "api" scope and maintainer role.
```
**Solution**: Update the token to have proper permissions and role.

**Invalid Project Path**
```
Error: Invalid project path format
```
**Solution**: Ensure `CI_PROJECT_PATH` follows the format `group/project`.

### Debug Configuration

Add a debug job to verify configuration:

```yaml
debug-config:
  stage: build
  script:
    - echo "GITLAB_USER_NAME: ${GITLAB_USER_NAME}"
    - echo "CI_SERVER_HOST: ${CI_SERVER_HOST}"
    - echo "CI_PROJECT_PATH: ${CI_PROJECT_PATH}"
    - echo "AGILEFLOW_TOKEN: ${AGILEFLOW_TOKEN:0:10}..."
  needs:
    - agileflow
```

## Related Documentation

- [Installation Guide](./installation.md) - Setup and configuration
- [GitLab CI Template](./gitlab-ci-template.md) - Template configuration
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
- [CLI Reference](./cli-reference.md) - Command-line configuration
