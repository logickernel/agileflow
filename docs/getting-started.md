# Getting Started with AgileFlow

Welcome to AgileFlow! This guide will help you get up and running with AgileFlow's version-centric CI/CD approach in just a few minutes.

## What You'll Learn

By the end of this guide, you'll have:
- AgileFlow running in your project
- Automatic semantic versioning based on conventional commits
- Understanding of how the version-centric approach works

## Prerequisites

Before you begin, ensure you have:
- Node.js 14+ installed (for local usage)
- A Git repository with commit history
- Basic understanding of Git and conventional commits

## Quick Start

### Local Usage

Run AgileFlow directly with npx to see your current and next version:

```bash
npx @logickernel/agileflow
```

Example output:
```
Current version: v1.2.3
Next version: v1.2.4
Commits since current version: 3

Changelog:
### fix
- resolve authentication issue
- correct null handling in user lookup

### docs
- update README with usage examples
```

### Quiet Mode

Use `--quiet` to only output the next version (useful for scripts):

```bash
VERSION=$(npx @logickernel/agileflow --quiet)
echo "Next version will be: $VERSION"
```

## CI/CD Integration

### GitLab CI

1. **Configure the AGILEFLOW_TOKEN**

   Go to **Settings > CI/CD > Variables** and add:

   | Variable | Value | Protect | Mask |
   |----------|-------|---------|------|
   | `AGILEFLOW_TOKEN` | Your GitLab API token | Yes | Yes |

   Create the token at **Settings > Access Tokens** with:
   - **Name**: AgileFlow Bot
   - **Role**: Maintainer
   - **Scopes**: api

2. **Add AgileFlow to your pipeline**

   ```yaml
   stages:
     - version
     - build

   agileflow:
     stage: version
     image: node:20-alpine
     script:
       - npx @logickernel/agileflow gitlab
     only:
       - main
   
   build:
     stage: build
     script:
       - echo "Building..."
     needs:
       - agileflow
   ```

### GitHub Actions

1. **Configure the AGILEFLOW_TOKEN**

   Go to **Settings > Secrets and variables > Actions** and add a secret:
   - **Name**: `AGILEFLOW_TOKEN`
   - **Value**: A Personal Access Token with `contents: write` permission

2. **Add AgileFlow to your workflow**

   ```yaml
   name: Release
   on:
     push:
       branches: [main]

   jobs:
     version:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0  # Required for version history
         
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         
         - name: Create version tag
           env:
             AGILEFLOW_TOKEN: ${{ secrets.AGILEFLOW_TOKEN }}
           run: npx @logickernel/agileflow github
   ```

### Native Git Push

If you prefer using native git commands (requires git credentials):

```bash
npx @logickernel/agileflow push
```

This creates an annotated tag and pushes it to the origin remote.

## How AgileFlow Works

### Version Calculation
- Analyzes commit messages since the last version tag
- Uses conventional commits to determine version bump type
- Generates semantic versions automatically (v1.0.0, v1.0.1, etc.)

### Version Bump Rules

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| Breaking change | `feat!: redesign API` | Major (1.0.0 → 2.0.0) |
| Feature | `feat: add login` | Minor (1.0.0 → 1.1.0) |
| Fix | `fix: resolve crash` | Patch (1.0.0 → 1.0.1) |
| Performance | `perf: optimize query` | Patch |
| Refactor | `refactor: simplify logic` | Patch |
| Docs only | `docs: update README` | No bump |
| Chore | `chore: update deps` | No bump |

### No Bump Needed

If all commits since the last version are docs/chore/style types, AgileFlow will report "no bump needed" and skip tag creation in push commands.

## Common Questions

### Q: How does AgileFlow determine the next version?
A: AgileFlow analyzes your commit messages using conventional commits. Features bump the minor version, fixes bump the patch version, and breaking changes bump the major version.

### Q: What if there's no version tag yet?
A: AgileFlow starts from v0.0.0 and calculates the first version based on your commits.

### Q: Can I use this locally before pushing?
A: Yes! Run `npx @logickernel/agileflow` to preview the next version without creating any tags.

### Q: What happens if no version bump is needed?
A: The push commands (`push`, `gitlab`, `github`) will skip tag creation and exit successfully.

## Troubleshooting

### "Not a git repository" Error
- Ensure you're running AgileFlow from within a git repository
- Check that the `.git` directory exists

### "AGILEFLOW_TOKEN not set" Error
- Ensure the environment variable is configured in your CI/CD settings
- Verify the token has the required permissions

### No Version Bump Detected
- Ensure you're using conventional commit format
- Check that there are commits since the last version tag
- Verify commits include bump-triggering types (feat, fix, perf, etc.)

## Next Steps

- Read the [CLI Reference](./cli-reference.md) for all available commands
- Learn about [Conventional Commits](./conventional-commits.md)
- Explore [Version-Centric CI/CD](./version-centric-cicd.md) methodology
