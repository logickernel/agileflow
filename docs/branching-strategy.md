# Branching Strategy

AgileFlow uses a simplified branching strategy that eliminates complexity while maintaining flexibility.

## Overview

Unlike traditional Git workflows with multiple long-lived branches, AgileFlow uses:

- **Main branch** — Single source of truth for all releases
- **Feature branches** — Short-lived branches for development
- **Version tags** — Immutable markers for each release

```
main ─────●─────●─────●─────●───▶
          │     │     │     │
          v     v     v     v
        v1.0.0 v1.0.1 v1.1.0 v1.2.0
          ▲     ▲
          │     │
feat/auth─┘     │
      fix/crash─┘
```

---

## Core Principles

### 1. Main Branch as Release Source

All releases come from main:

- **Single version sequence** — v1.0.0, v1.0.1, v1.1.0 all share the same lineage
- **Consistent history** — Every release builds on the same foundation
- **Simple rollbacks** — Just deploy a previous version
- **No branch drift** — All environments run identical code

### 2. Short-Lived Development Branches

Create focused branches, merge quickly:

- **Purpose** — One feature, one fix, or one improvement
- **Lifespan** — Days to weeks, not months
- **Target** — Always merge to main
- **Naming** — Descriptive prefix (feat/, fix/, etc.)

### 3. Version-Based Deployments

Deploy versions, not branches:

```
Version v1.2.3
    │
    ├──▶ Staging
    ├──▶ Production
    └──▶ Any environment
```

---

## Branch Types

### Feature Branches

For new functionality:

```bash
git checkout -b feat/user-authentication
git checkout -b feat/api-rate-limiting
git checkout -b feat/dark-mode
```

**When to use:**
- Adding new features
- Implementing user stories
- Creating new endpoints

**Workflow:**
1. Create from main
2. Develop with conventional commits
3. Open pull/merge request
4. Merge to main → triggers version bump

### Fix Branches

For bug fixes:

```bash
git checkout -b fix/login-validation
git checkout -b fix/api-timeout
git checkout -b fix/memory-leak
```

**When to use:**
- Fixing bugs
- Resolving errors
- Addressing issues

### Hotfix Branches

For urgent production fixes:

```bash
git checkout -b hotfix/security-patch
git checkout -b hotfix/critical-bug
```

**When to use:**
- Critical production issues
- Security vulnerabilities
- Service outages

**Workflow:**
1. Create from main
2. Implement minimal fix
3. Fast-track review
4. Merge and deploy immediately

### Refactor Branches

For code improvements:

```bash
git checkout -b refactor/auth-service
git checkout -b refactor/database-layer
```

**When to use:**
- Improving code structure
- Reducing technical debt
- Optimizing performance

---

## Branch Lifecycle

### Create

```bash
# Always start from updated main
git checkout main
git pull origin main
git checkout -b feat/new-feature
```

### Develop

```bash
# Make changes with conventional commits
git commit -m "feat: implement user login"
git commit -m "test: add login tests"
git commit -m "docs: update auth documentation"
```

### Sync

```bash
# Keep up to date with main
git checkout main
git pull origin main
git checkout feat/new-feature
git rebase main
```

### Complete

```bash
# Push and create pull/merge request
git push origin feat/new-feature
```

### Cleanup

```bash
# After merge
git checkout main
git pull origin main
git branch -d feat/new-feature
git push origin --delete feat/new-feature
```

---

## Version Management

### Automatic Bumping

AgileFlow determines version bumps from commits:

```bash
# Patch bump (v1.0.0 → v1.0.1)
fix: resolve login bug

# Minor bump (v1.0.0 → v1.1.0)
feat: add user dashboard

# Major bump (v1.0.0 → v2.0.0)
feat!: remove deprecated API

# No bump
perf: optimize queries
refactor: simplify logic
docs: update README
chore: update dependencies
```

### Version Tags

Every merge to main creates a tag:

```bash
# List versions
git tag --sort=-version:refname

# View version details
git show v1.2.3

# Checkout version
git checkout v1.2.3
```

---

## Environment Management

### Configuration Over Branches

Use configuration for environment differences, not branches:

**GitHub Actions:**
```yaml
deploy-staging:
  environment: staging
  env:
    DATABASE_URL: ${{ secrets.STAGING_DB_URL }}

deploy-production:
  environment: production
  env:
    DATABASE_URL: ${{ secrets.PROD_DB_URL }}
```

**GitLab CI:**
```yaml
deploy-staging:
  environment:
    name: staging
  variables:
    DATABASE_URL: "$STAGING_DB_URL"

deploy-production:
  environment:
    name: production
  variables:
    DATABASE_URL: "$PROD_DB_URL"
```

---

## Best Practices

### Keep Branches Small

```bash
# ✅ Good — Single purpose
git checkout -b feat/user-login
git checkout -b fix/password-validation

# ❌ Bad — Multiple purposes
git checkout -b feature-and-bugfixes
```

### Use Conventional Commits

```bash
# ✅ Good — Clear type and scope
feat(auth): add OAuth2 support
fix(api): handle null user ID

# ❌ Bad — No type
add oauth login
fix bug
```

### Rebase Regularly

```bash
# Weekly sync with main
git checkout main
git pull
git checkout your-branch
git rebase main
```

### Clean Up After Merge

```bash
git branch -d feature-branch
git push origin --delete feature-branch
```

---

## Migration from Other Workflows

### From GitFlow

1. Stop creating release/develop branches
2. Use main for all releases
3. Convert hotfix branches to hotfix/ prefix
4. Let AgileFlow handle versioning

### From GitHub Flow

1. Continue using feature branches
2. Add AgileFlow for versioning
3. Deploy versions instead of branches

### From Trunk-Based Development

1. Continue working on main
2. Use branches for larger changes
3. Add AgileFlow for versioning

---

## Troubleshooting

### Merge Conflicts

- Rebase regularly
- Keep branches small
- Resolve during rebase, not merge

### Branch Divergence

- Always start from updated main
- Rebase instead of merge
- Delete branches after merge

---

## Related Documentation

- [Getting Started](./getting-started.md) — Quick start
- [Conventional Commits](./conventional-commits.md) — Commit format
- [Version-Centric CI/CD](./version-centric-cicd.md) — Pipeline methodology
- [Release Management](./release-management.md) — Managing releases
