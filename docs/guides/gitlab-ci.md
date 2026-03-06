# GitLab CI

One pipeline job creates the version tag on push to main. A separate pipeline (triggered by the tag) builds and deploys.

---

## Step 1: Create an access token

**Recommended: Project Access Token**

1. Go to project **Settings → Access tokens**
2. Create:
   - **Name**: `AgileFlow`
   - **Role**: `Maintainer`
   - **Scopes**: `api`
3. Copy the token

**Alternative: Personal Access Token**

1. Go to user **Settings → Access tokens**
2. Create with `api` scope
3. Copy the token

## Step 2: Add the token as a CI/CD variable

1. Go to project **Settings → CI/CD → Variables**
2. Add:
   - **Key**: `AGILEFLOW_TOKEN`
   - **Value**: your token
   - **Flags**: Protected, Masked

## Step 3: Configure your pipeline

`.gitlab-ci.yml`:

```yaml
stages:
  - version
  - build
  - deploy

# Runs on push to main — creates the version tag
agileflow:
  stage: version
  image: node:20
  script:
    - npm install -g @logickernel/agileflow
    - agileflow version
    - agileflow gitlab
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# Runs when a version tag is created — builds the release
build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_TAG .
    - docker push myapp:$CI_COMMIT_TAG
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

# Runs when a version tag is created — deploys to staging automatically
deploy-staging:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=myapp:$CI_COMMIT_TAG
  environment:
    name: staging
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v/'

# Runs when a version tag is created — deploys to production manually
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

The `agileflow version` line before `agileflow gitlab` is optional but useful for confirming which version of the tool is running when troubleshooting.

---

## How it works end to end

1. You push a `feat:` commit to main
2. The `agileflow` job runs and creates tag `v1.5.0` via the GitLab API
3. GitLab starts a new pipeline for the tag
4. `build` and `deploy-*` jobs run with `CI_COMMIT_TAG=v1.5.0`

If no bump is needed (all commits are `chore`, `docs`, etc.), AgileFlow exits without creating a tag, and no release pipeline runs.

---

## Shallow clone behavior

GitLab CI uses shallow clones by default (`GIT_DEPTH: 20`). AgileFlow handles this by reading tag metadata directly from the remote via `git ls-remote` instead of relying on a full fetch. This works without any extra configuration in most cases.

If you see `Current version: none` despite having version tags, set a larger depth or disable shallow cloning:

```yaml
variables:
  GIT_DEPTH: 0  # fetch full history
```

---

## Troubleshooting

**"AGILEFLOW_TOKEN not set"** — The CI/CD variable is missing. Verify it exists under **Settings → CI/CD → Variables**.

**"403 Forbidden"** — The token lacks `api` scope or `Maintainer` role. Regenerate with the correct permissions.

**"401 Unauthorized"** — The token has expired. Regenerate and update the variable.

**Tag created but no build pipeline** — Check that build/deploy rules use `$CI_COMMIT_TAG =~ /^v/`, not `$CI_COMMIT_BRANCH`.

**`Current version: none` on first run** — Expected if you have no version tags yet. AgileFlow will start from `v0.0.0`. Create a manual tag first if you need a specific starting point:
```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

**Both main and tag pipelines run at the same time** — This is normal. The main pipeline creates the tag; the tag triggers the release pipeline. They are independent.
