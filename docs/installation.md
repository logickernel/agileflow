# Installation & Setup Guide

This guide covers installing and setting up AgileFlow for different platforms and use cases.

## Prerequisites

Before installing AgileFlow, ensure you have:

- **Git Repository**: A Git repository with GitLab CI/CD enabled
- **GitLab Access**: Access to modify `.gitlab-ci.yml` files
- **CI/CD Permissions**: Ability to enable job token permissions for tag pushing
- **Basic Knowledge**: Understanding of Git, CI/CD, and Docker concepts

## GitLab CI Installation

### Step 1: Enable Job Token Permissions

AgileFlow needs to push version tags to your repository. Enable this in your GitLab project:

1. Go to **Settings > CI/CD > Job token permissions**
2. Enable **Allow Git push requests to the repository**
3. Save the changes

> [!NOTE]
> If you don't see this option, you may need to enable the feature flag `allow_push_repository_for_job_token` in your self-managed GitLab instance.

### Step 2: Include the AgileFlow Template

Add this line to the top of your `.gitlab-ci.yml` file:

```yaml
include:
  - remote: code.logickernel.com/kernel/agileflow/-/raw/main/templates/AgileFlow.gitlab-ci.yml
```

### Step 3: Add Your First Job

Below the include statement, add a simple build job to test the setup:

```yaml
build:
  stage: build
  script:
    - echo "Building version ${VERSION}"
    - docker build -t myapp:${VERSION} .
    - docker push myapp:${VERSION}
  needs:
    - agileflow
```

### Step 4: Test the Installation

1. Commit and push your changes:
   ```bash
   git add .gitlab-ci.yml
   git commit -m "feat: add AgileFlow CI/CD pipeline"
   git push
   ```

2. Check your GitLab CI pipeline - it should automatically start
3. The `agileflow` job should complete successfully and generate a version
4. Subsequent jobs should have access to the `${VERSION}` variable

## Docker Installation

### Using AgileFlow as a Docker Image

If you want to use AgileFlow directly as a Docker image:

```bash
# Pull the latest image
docker pull registry.logickernel.com/kernel/agileflow:latest

# Run AgileFlow commands
docker run --rm -v $(pwd):/workspace -w /workspace \
  registry.logickernel.com/kernel/agileflow:latest \
  agileflow --help
```

### Docker Compose Setup

For local development or testing:

```yaml
# docker-compose.yml
version: '3.8'
services:
  agileflow:
    image: registry.logickernel.com/kernel/agileflow:latest
    volumes:
      - .:/workspace
      - ~/.gitconfig:/root/.gitconfig:ro
    working_dir: /workspace
    environment:
      - GITLAB_USER_NAME=Your Name
      - GITLAB_USER_EMAIL=your.email@example.com
    command: agileflow --help
```

## Local Development Setup

### Prerequisites for Local Development

- **Node.js**: Version 16 or higher
- **Git**: Latest version with proper user configuration
- **Docker**: For running AgileFlow in containers

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/logickernel/agileflow.git
cd agileflow

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run AgileFlow locally
npm start
```

### Environment Variables

Set these environment variables for local development:

```bash
export GITLAB_USER_NAME="Your Name"
export GITLAB_USER_EMAIL="your.email@example.com"
export CI_JOB_TOKEN="your-job-token"
export CI_SERVER_HOST="gitlab.example.com"
export CI_PROJECT_PATH="group/project"
```

## Kubernetes Installation

### Using Helm Charts

If you're deploying AgileFlow in a Kubernetes environment:

```bash
# Add the Helm repository
helm repo add agileflow https://charts.logickernel.com/agileflow
helm repo update

# Install AgileFlow
helm install agileflow agileflow/agileflow \
  --namespace ci-cd \
  --create-namespace \
  --set gitlab.host=gitlab.example.com \
  --set gitlab.token=your-token
```

### Manual Kubernetes Deployment

```yaml
# agileflow-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agileflow
  namespace: ci-cd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: agileflow
  template:
    metadata:
      labels:
        app: agileflow
    spec:
      containers:
      - name: agileflow
        image: registry.logickernel.com/kernel/agileflow:latest
        env:
        - name: GITLAB_USER_NAME
          value: "AgileFlow Bot"
        - name: GITLAB_USER_EMAIL
          value: "agileflow@example.com"
        - name: CI_JOB_TOKEN
          valueFrom:
            secretKeyRef:
              name: agileflow-secrets
              key: job-token
        - name: CI_SERVER_HOST
          value: "gitlab.example.com"
        - name: CI_PROJECT_PATH
          value: "group/project"
```

## CI/CD Platform Integration

### GitHub Actions

While AgileFlow is primarily designed for GitLab CI, you can integrate it with GitHub Actions:

```yaml
# .github/workflows/agileflow.yml
name: AgileFlow Versioning
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Run AgileFlow
      uses: docker://registry.logickernel.com/kernel/agileflow:latest
      with:
        args: github-actions
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITLAB_USER_NAME: "AgileFlow Bot"
        GITLAB_USER_EMAIL: "agileflow@github.actions"
```

### Jenkins Integration

For Jenkins pipelines:

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        VERSION = ''
    }
    
    stages {
        stage('Version') {
            steps {
                script {
                    // Run AgileFlow to generate version
                    sh 'docker run --rm -v $(pwd):/workspace -w /workspace registry.logickernel.com/kernel/agileflow:latest agileflow jenkins'
                    
                    // Read version from generated file
                    VERSION = sh(script: 'cat VERSION', returnStdout: true).trim()
                }
            }
        }
        
        stage('Build') {
            steps {
                echo "Building version ${VERSION}"
                sh "docker build -t myapp:${VERSION} ."
            }
        }
    }
}
```

## Configuration Options

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITLAB_USER_NAME` | Name for Git commits | Yes | - |
| `GITLAB_USER_EMAIL` | Email for Git commits | Yes | - |
| `CI_JOB_TOKEN` | GitLab CI job token | Yes | - |
| `CI_SERVER_HOST` | GitLab server hostname | Yes | - |
| `CI_PROJECT_PATH` | GitLab project path | Yes | - |
| `AGILEFLOW_CONFIG` | Path to config file | No | `./agileflow.config.js` |

### Configuration File

Create an `agileflow.config.js` file for advanced configuration:

```javascript
module.exports = {
  // Version bump rules
  versionRules: {
    major: ['feat!', 'BREAKING CHANGE'],
    minor: ['feat', 'perf'],
    patch: ['fix', 'docs', 'style', 'refactor', 'test', 'build', 'ci', 'chore']
  },
  
  // Commit message patterns
  commitPatterns: {
    conventional: true,
    scopeRequired: false,
    bodyRequired: false
  },
  
  // Tag format
  tagFormat: 'v{version}',
  
  // Release notes
  releaseNotes: {
    enabled: true,
    format: 'conventional',
    includeBody: true
  }
};
```

## Troubleshooting Installation

### Common Issues

**Job Token Permissions Not Available**
- Check if you're using a self-managed GitLab instance
- Enable the `allow_push_repository_for_job_token` feature flag
- Ensure you have admin access to the GitLab instance

**Template Include Fails**
- Verify the remote URL is accessible from your GitLab instance
- Check network connectivity and firewall rules
- Use a local copy of the template if remote access is restricted

**VERSION Variable Not Available**
- Ensure the `agileflow` job completed successfully
- Check that your jobs have `needs: - agileflow` dependency
- Verify the dotenv artifact is properly configured

**Docker Image Pull Fails**
- Check Docker registry access
- Verify image name and tag
- Ensure Docker daemon is running

### Getting Help

- **Documentation**: Check other guides in this documentation
- **Issues**: Open an issue in the project repository
- **Community**: Join discussions in the community forum
- **Support**: Contact the AgileFlow team for enterprise support

## Next Steps

After successful installation:

1. **Read the [Getting Started Guide](./getting-started.md)** for your first pipeline
2. **Explore [Conventional Commits](./conventional-commits.md)** for proper commit formatting
3. **Review [GitLab CI Template Reference](./gitlab-ci-template.md)** for advanced configuration
4. **Check [Troubleshooting](./troubleshooting.md)** if you encounter issues

## Enterprise Installation

For enterprise environments with specific requirements:

- **Air-gapped Networks**: Contact us for offline installation packages
- **Custom Registries**: We can provide images for your private registry
- **High Availability**: Enterprise deployment guides available
- **Security Compliance**: SOC2, ISO27001 compliant deployments

Contact our enterprise team for custom installation support and enterprise features.
