# GitHub Actions

Two workflows: one that runs AgileFlow on push to main and creates a version tag, and one that triggers on that tag to build and deploy.

---

## Step 1: Create the versioning workflow

`.github/workflows/version.yml`:

```yaml
name: Version
on:
  push:
    branches: [main]

permissions:
  contents: write

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
        run: npx @logickernel/agileflow github
```

That's it. AgileFlow automatically picks up the `GITHUB_TOKEN` that GitHub Actions provides. The `permissions: contents: write` block grants it permission to create tags.

`fetch-depth: 0` is required — without it, AgileFlow can only see a shallow clone and cannot find the last version tag.

### Using a Personal Access Token instead

If your organization restricts `GITHUB_TOKEN` permissions or you need cross-repository tagging, use a PAT:

1. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set:
   - **Name**: `AgileFlow`
   - **Repository access**: your repository
   - **Permissions**: `Contents: Read and write`
4. Copy the token
5. In your repository: **Settings → Secrets and variables → Actions**
6. Click **New repository secret**
7. Name: `AGILEFLOW_TOKEN`, value: your token

AgileFlow checks `AGILEFLOW_TOKEN` first, then falls back to `GITHUB_TOKEN`. When `AGILEFLOW_TOKEN` is set, no `permissions` block is needed.

## Step 3: Create the release workflow

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

**"No authentication token found"** — Neither `AGILEFLOW_TOKEN` nor `GITHUB_TOKEN` is available. If running in GitHub Actions, ensure the workflow has `permissions: contents: write`. If using a PAT, verify the `AGILEFLOW_TOKEN` secret exists.

**"Resource not accessible by integration" / 403** — The token lacks `contents: write` permission. Add `permissions: contents: write` to your workflow, or regenerate your PAT with the correct scope.

**"Bad credentials" / 401** — The token has expired or was revoked. Regenerate and update the secret.

**Tag created but release workflow didn't run** — Check that the release workflow trigger is `push: tags: ['v*']`, not `push: branches: [main]`.

**"Current version: none"** — `fetch-depth: 0` is missing from the checkout step. AgileFlow cannot see the tag history in a shallow clone.
