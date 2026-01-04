# Version-Centric CI/CD

AgileFlow enables a **version-centric approach** to CI/CD where versioning is decoupled from build and deployment. This architecture simplifies pipelines and provides flexibility.

## The Decoupled Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Merge to main  │         │  Tag: v1.2.3    │         │  Build/Deploy   │
│                 │ ──────▶ │                 │ ──────▶ │                 │
│  AgileFlow      │         │  (event)        │         │  Your pipelines │
│  creates tag    │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### How It Works

1. **On merge to main**: AgileFlow analyzes commits and creates a version tag
2. **Tag creation event**: Triggers your build and deploy pipelines
3. **Build/Deploy**: Uses the tag as the version identifier

### Benefits

- **Separation of concerns** — Versioning is independent from build/deploy
- **Flexibility** — Any process can hook into tag creation
- **Simplicity** — Each pipeline has one responsibility
- **Reusability** — Same build pipeline for all versions
- **Auditability** — Clear version trail for every deployment

---

## Traditional vs. Version-Centric

### Traditional (Coupled)

```yaml
# Everything in one pipeline
on: push to main
  → calculate version
  → build
  → deploy staging
  → deploy production
```

**Problems:**
- Complex, monolithic pipelines
- Version logic mixed with build logic
- Hard to rerun individual steps

### Version-Centric (Decoupled)

```yaml
# Pipeline 1: Versioning
on: push to main
  → AgileFlow creates tag

# Pipeline 2: Release
on: tag created
  → build with tag version
  → deploy staging
  → deploy production
```

**Benefits:**
- Simple, focused pipelines
- Versioning completely separate
- Easy to rerun builds for any version

---

## Implementation

### GitHub Actions

**Versioning workflow** (`.github/workflows/version.yml`):
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
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Create version tag
        env:
          AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
        run: npx @logickernel/agileflow github
```

**Release workflow** (`.github/workflows/release.yml`):
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

      - name: Get version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

      - name: Build
        run: docker build -t myapp:$VERSION .

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:$VERSION

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:$VERSION
```

### GitLab CI

```yaml
stages:
  - version
  - build
  - deploy

# Versioning - runs on merge to main
agileflow:
  stage: version
  image: node:20-alpine
  script:
    - npx @logickernel/agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# Build - runs on tag creation
build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_TAG .
    - docker push myapp:$CI_COMMIT_TAG
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

# Deploy - runs on tag creation
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
  when: manual
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

---

## Version-Centric Deployments

### All Environments Use the Same Version

```
Tag v1.2.3
    │
    ├──▶ Build: myapp:v1.2.3
    │
    ├──▶ Staging: myapp:v1.2.3
    │
    └──▶ Production: myapp:v1.2.3
```

No environment drift — every environment runs identical code.

### Simple Rollbacks

```bash
# Rollback = deploy previous tag
kubectl set image deployment/myapp myapp=myapp:v1.2.2
```

### Clear Audit Trail

```bash
# What version is running?
kubectl get deployment myapp -o jsonpath='{.spec.template.spec.containers[0].image}'
# myapp:v1.2.3

# What's in that version?
git show v1.2.3
```

---

## Advanced Patterns

### Conditional Deployments

Deploy only specific version types:

```yaml
# Only deploy minor/major versions to production
deploy-production:
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v\d+\.\d+\.0$/'
```

### Multiple Services

Same version for all services in a monorepo:

```yaml
build-backend:
  script:
    - docker build -t backend:$CI_COMMIT_TAG ./backend

build-frontend:
  script:
    - docker build -t frontend:$CI_COMMIT_TAG ./frontend
```

### Notifications

Announce new versions:

```yaml
notify:
  script:
    - |
      curl -X POST "$SLACK_WEBHOOK" \
        -d "{\"text\": \"Released $CI_COMMIT_TAG\"}"
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'
```

---

## Key Advantages

1. **Eliminates environment drift** — All environments run identical versions
2. **Simplifies operations** — Work with versions, not branch states
3. **Enables easy rollbacks** — Just redeploy a previous tag
4. **Provides clear audit trail** — Every deployment tied to a version
5. **Decouples concerns** — Versioning separate from build/deploy

---

## Migration Path

If using a traditional coupled approach:

1. **Add AgileFlow** — Create versioning workflow
2. **Add tag-triggered workflow** — For build/deploy
3. **Test both workflows** — Verify tags trigger releases
4. **Remove old logic** — Clean up version calculation from build pipeline

---

## Related Documentation

- [Getting Started](./getting-started.md) — Quick start
- [Installation Guide](./installation.md) — Setup instructions
- [Branching Strategy](./branching-strategy.md) — Git workflow
- [Best Practices](./best-practices.md) — Recommended patterns
