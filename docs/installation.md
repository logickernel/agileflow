# Installation Guide

AgileFlow requires no installation for local use — just run it with npx. For CI/CD integration, you'll configure a workflow that creates version tags, which then trigger your build and deploy pipelines.

## Prerequisites

- **Node.js 14+** (or a Node.js CI image)
- **Git repository** with commit history
- **Access token** with permission to create tags

## Local Usage

Preview your next version without any setup:

```bash
npx @logickernel/agileflow
```

Or install globally:

```bash
npm install -g @logickernel/agileflow
agileflow
```

---

## Architecture Overview

AgileFlow uses a **decoupled two-step approach**:

```
┌─────────────────┐         ┌─────────────────┐
│  Merge to main  │         │   Tag: v1.2.3   │
│                 │ ──────▶ │                 │
│  (AgileFlow     │         │  (Your build/   │
│   creates tag)  │         │   deploy runs)  │
└─────────────────┘         └─────────────────┘
```

1. **Versioning workflow**: Runs AgileFlow on merge to main → creates version tag
2. **Release workflow**: Triggered by tag creation → builds and deploys

This separation keeps versioning independent from your build/deploy process.

---

## GitHub Actions

### Step 1: Create an Access Token

1. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Configure:
   - **Name**: `AgileFlow`
   - **Repository access**: Select your repositories
   - **Permissions**: `Contents: Read and write`
4. Copy the token

### Step 2: Add the Token as a Secret

1. Go to your repository's **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `AGILEFLOW_TOKEN`
   - **Value**: Your token

### Step 3: Create the Versioning Workflow

Create `.github/workflows/version.yml`:

```yaml
name: Version
on:
  push:
    branches: [main]

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for commit history

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Create version tag
        env:
          AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
        run: npx @logickernel/agileflow github
```

### Step 4: Create the Release Workflow

Create `.github/workflows/release.yml` to handle builds triggered by tags:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get version from tag
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

      - name: Build
        run: |
          echo "Building version $VERSION"
          docker build -t myapp:$VERSION .
          docker push myapp:$VERSION

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: kubectl set image deployment/myapp myapp=myapp:$VERSION

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: kubectl set image deployment/myapp myapp=myapp:$VERSION
```

### Step 5: Test the Setup

1. Push a commit with conventional format:
   ```bash
   git commit -m "feat: add new feature"
   git push
   ```
2. The version workflow creates a tag (e.g., `v1.2.3`)
3. The tag triggers the release workflow
4. Build and deploy jobs run automatically

---

## GitLab CI

### Step 1: Create an Access Token

**Option A: Project Access Token (Recommended)**
1. Go to project **Settings → Access tokens**
2. Create:
   - **Name**: `AgileFlow`
   - **Role**: `Maintainer`
   - **Scopes**: `api`
3. Copy the token

**Option B: Personal Access Token**
1. Go to user **Settings → Access tokens**
2. Create:
   - **Name**: `AgileFlow`
   - **Scopes**: `api`
3. Copy the token

### Step 2: Add the Token as a CI/CD Variable

1. Go to project **Settings → CI/CD → Variables**
2. Add:
   - **Key**: `AGILEFLOW_TOKEN`
   - **Value**: Your token
   - **Flags**: Protected, Masked

### Step 3: Configure Your Pipeline

Update `.gitlab-ci.yml`:

```yaml
stages:
  - version
  - build
  - deploy

# Versioning job - runs on merge to main
agileflow:
  stage: version
  image: node:20-alpine
  script:
    - npx @logickernel/agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# Build job - runs on tag creation
build:
  stage: build
  script:
    - echo "Building version $CI_COMMIT_TAG"
    - docker build -t myapp:$CI_COMMIT_TAG .
    - docker push myapp:$CI_COMMIT_TAG
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

# Deploy jobs - run on tag creation
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  environment:
    name: staging
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

deploy-production:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  environment:
    name: production
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
  when: manual
```

### Step 4: Test the Setup

1. Push a commit with conventional format:
   ```bash
   git commit -m "feat: add new feature"
   git push
   ```
2. The `agileflow` job creates a tag
3. A new pipeline starts for the tag
4. Build and deploy jobs run

---

## Other CI/CD Platforms

For platforms without native API integration, use the `push` command:

```yaml
version:
  script:
    - git config user.name "CI Bot"
    - git config user.email "ci@example.com"
    - npx @logickernel/agileflow push
```

Then configure your platform to trigger pipelines on tag creation.

---

## How It Works

AgileFlow uses platform APIs to create version tags:

1. **Analyzes commits** since the last version tag
2. **Calculates version** based on conventional commits
3. **Creates tag** via API (GitHub/GitLab) or git push
4. **Tag triggers** your build/deploy workflows

### Benefits

- **No repository write permissions** for CI jobs (uses API tokens)
- **Decoupled architecture** — versioning separate from builds
- **Works with protected branches**
- **Any process can hook into tag creation**

---

## Troubleshooting

### Token Permission Errors

**GitHub**: Ensure token has `contents: write` permission.

**GitLab**: Ensure token has `api` scope and `Maintainer` role.

### Tag Not Created

- Check you're pushing to the main branch
- Verify conventional commit format
- Check pipeline logs for errors

### Build Not Triggered

- Ensure release workflow is configured for tag events
- Check tag pattern matches (`v*` for GitHub, `/^v/` for GitLab)

---

## Next Steps

- [Getting Started](./getting-started.md) — Quick start guide
- [CLI Reference](./cli-reference.md) — Commands and options
- [Troubleshooting](./troubleshooting.md) — Common issues
