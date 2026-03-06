# GitHub Actions

Two workflows: one that runs AgileFlow on push to main and creates a version tag, and one that triggers on that tag to build and deploy.

---

## Step 1: Create an access token

1. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set:
   - **Name**: `AgileFlow`
   - **Repository access**: your repository
   - **Permissions**: `Contents: Read and write`
4. Copy the token

## Step 2: Add the token as a secret

1. In your repository: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `AGILEFLOW_TOKEN`, value: your token

## Step 3: Create the versioning workflow

`.github/workflows/version.yml`:

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

`fetch-depth: 0` is required — without it, AgileFlow can only see a shallow clone and cannot find the last version tag.

## Step 4: Create the release workflow

`.github/workflows/release.yml`:

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
        run: |
          docker build -t myapp:$VERSION .
          docker push myapp:$VERSION

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy
        run: kubectl set image deployment/myapp myapp=myapp:$VERSION
```

---

## How it works end to end

1. You push a `feat:` commit to main
2. The `version` workflow runs AgileFlow, which creates tag `v1.5.0` via the GitHub API
3. The tag push triggers the `release` workflow
4. Your build runs with `VERSION=v1.5.0`

If no bump is needed (all commits are `chore`, `docs`, etc.), AgileFlow exits without creating a tag, and the release workflow never runs.

---

## Troubleshooting

**"AGILEFLOW_TOKEN not set"** — The secret is missing or not passed via `env:`. Verify the secret exists and the `env:` block is present in the step.

**"Resource not accessible by integration" / 403** — The token lacks `Contents: Read and write` permission. Regenerate with the correct scope.

**"Bad credentials" / 401** — The token has expired or was revoked. Regenerate and update the secret.

**Tag created but release workflow didn't run** — Check that the release workflow trigger is `push: tags: ['v*']`, not `push: branches: [main]`.

**"Current version: none"** — `fetch-depth: 0` is missing from the checkout step. AgileFlow cannot see the tag history in a shallow clone.
