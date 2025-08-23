# AgileFlow GitLab CI Template

This template provides an opinionated structure for GitLab CI/CD pipelines while allowing users to customize the implementation details.

## Features

- **Predefined Stages**: version, validate, build, test, security, deploy, cleanup
- **Abstract Job Templates**: Extendable base jobs for each stage
- **Flexible Configuration**: Override variables, images, and behavior as needed
- **Best Practices**: Built-in rules, timeouts, and failure handling

## Usage

### Basic Setup

Include this template in your `.gitlab-ci.yml`:

```yaml
include:
  - template: 'AgileFlow.gitlab-ci.yml'
```

### Customizing Jobs

The template provides abstract job templates (prefixed with `.`) that you can extend:

```yaml
# Extend the build template
build:
  extends: .build-template
  image: node:18-alpine
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  cache:
    key: 
      files:
        - package-lock.json
    paths:
      - node_modules/
```

### Available Job Templates

#### `.agileflow-version`
- **Stage**: version
- **Purpose**: Generates version information using AgileFlow
- **Customizable**: Image, rules, script

#### `.validate-template`
- **Stage**: validate
- **Purpose**: Code validation, linting, format checking
- **Default**: Allows failure
- **Customizable**: Image, script, rules

#### `.build-template`
- **Stage**: build
- **Purpose**: Building your application
- **Default**: Fails pipeline on failure
- **Customizable**: Image, script, artifacts, cache

#### `.test-template`
- **Stage**: test
- **Purpose**: Running tests
- **Default**: Fails pipeline on failure
- **Customizable**: Image, script, artifacts, coverage

#### `.security-template`
- **Stage**: security
- **Purpose**: Security scanning, dependency checks
- **Default**: Allows failure
- **Customizable**: Image, script, rules

#### `.deploy-template`
- **Stage**: deploy
- **Purpose**: Deployment to environments
- **Default**: Manual trigger, production environment
- **Customizable**: Image, script, environment, rules

#### `.cleanup-template`
- **Stage**: cleanup
- **Purpose**: Cleanup operations
- **Default**: Allows failure
- **Customizable**: Image, script, rules

### Overriding Variables

The template provides default variables that you can override:

```yaml
variables:
  BUILD_IMAGE: "node:18-alpine"
  TEST_IMAGE: "node:18-alpine"
  DEPLOY_IMAGE: "alpine:latest"
  BUILD_TIMEOUT: "15m"
  TEST_TIMEOUT: "20m"
```

### Complete Example

```yaml
include:
  - template: 'AgileFlow.gitlab-ci.yml'

variables:
  BUILD_IMAGE: "node:18-alpine"
  TEST_IMAGE: "node:18-alpine"

# Customize the build job
build:
  extends: .build-template
  image: $BUILD_IMAGE
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  cache:
    key: 
      files:
        - package-lock.json
    paths:
      - node_modules/

# Customize the test job
test:
  extends: .test-template
  image: $TEST_IMAGE
  script:
    - npm ci
    - npm run test:coverage
  artifacts:
    paths:
      - coverage/
    reports:
      junit: test-results.xml
    expire_in: 1 week

# Customize the deploy job
deploy:
  extends: .deploy-template
  image: alpine:latest
  script:
    - echo "Deploying to production..."
    - ./deploy.sh
  environment:
    name: production
    url: https://myapp.example.com
  only:
    - main
```

## Stage Flow

1. **version**: Generate version information (always runs)
2. **validate**: Code validation and linting
3. **build**: Build the application
4. **test**: Run tests and generate coverage
5. **security**: Security scanning and dependency checks
6. **deploy**: Deploy to target environment (manual trigger)
7. **cleanup**: Cleanup operations

## Best Practices

- **Extend templates**: Don't copy-paste, use `extends` to inherit structure
- **Override selectively**: Only override what you need to change
- **Use variables**: Leverage the provided variables for consistency
- **Add artifacts**: Define what should be preserved between jobs
- **Configure cache**: Optimize build times with appropriate caching
- **Set timeouts**: Use the timeout variables for long-running operations

## Troubleshooting

### Job not running
- Check if the job extends the correct template
- Verify stage names match the template
- Ensure rules are properly configured

### Template not found
- Verify the template path is correct
- Check GitLab version compatibility
- Ensure the template file is accessible

### Variables not working
- Variables are case-sensitive
- Check for typos in variable names
- Ensure variables are defined before use
