# Conventional Commits

This document describes the conventional commit format used in AgileFlow and how it affects version bumping.

## Version Bump Logic

AgileFlow automatically determines version bumps based on conventional commit messages using the following logic:

### For versions 1.0.0 and above:
- **Major version bump (X.0.0)**: Breaking changes (`!` suffix or `BREAKING CHANGE:` in body)
- **Minor version bump (0.X.0)**: New features (`feat:`)
- **Patch version bump (0.0.X)**: Bug fixes, performance improvements, build system changes, CI changes, refactors, reverts, or tests
- **No version bump**: Documentation, style changes, or chores

### For pre-1.0.0 versions (0.x.x):
- **Minor version bump (0.X.0)**: Breaking changes (`!` suffix or `BREAKING CHANGE:` in body)
- **Patch version bump (0.0.X)**: New features, bug fixes, performance improvements, build system changes, CI changes, refactors, or reverts
- **No version bump**: Documentation, style changes, tests, or chores

## Commit Types and Version Impact

| Commit Type | Description | (>1.0.0) | (0.x.x) |
|-------------|-------------|----------|---------|
| [feat](./conventional-commits/type-feat.md) | New features | **Minor** | **Patch** |
| [fix](./conventional-commits/type-fix.md) | Bug fixes | **Patch** | **Patch** |
| [perf](./conventional-commits/type-perf.md) | Performance improvements | **Patch** | **Patch** |
| [build](./conventional-commits/type-build.md) | Build system changes | **Patch** | **Patch** |
| [ci](./conventional-commits/type-ci.md) | CI/CD changes | **Patch** | **Patch** |
| [refactor](./conventional-commits/type-refactor.md) | Code refactoring | **Patch** | **Patch** |
| [revert](./conventional-commits/type-revert.md) | Revert previous commits | **Patch** | **Patch** |
| [test](./conventional-commits/type-test.md) | Test additions/changes | **Patch** | **Patch** |
| [docs](./conventional-commits/type-docs.md) | Documentation changes | **None** | **None** |
| [style](./conventional-commits/type-style.md) | Code style changes | **None** | **None** |
| [chore](./conventional-commits/type-chore.md) | Maintenance tasks | **None** | **None** |

## Breaking Changes

Breaking changes can be indicated in two ways:

1. **Exclamation mark suffix**: `feat!: breaking change` or `feat(scope)!: breaking change`
2. **BREAKING CHANGE in body**: Any commit with `BREAKING CHANGE:` in the commit body

### Breaking Change Examples:
```
feat!: remove deprecated API endpoints
feat(auth)!: change authentication flow
fix!: modify database schema
BREAKING CHANGE: The /api/v1/users endpoint has been removed
```

## Commit Message Format

The standard format for conventional commits is:

```text
type[!]?(scope)?: description

[optional body]

[optional footer(s)]
```

### Format Components:
- **type**: The type of change (feat, fix, perf, etc.)
- **!**: Optional breaking change indicator
- **scope**: Optional scope in parentheses (e.g., auth, api, ui)
- **description**: Short description of the change
- **body**: Optional detailed explanation
- **footer**: Optional footers like `BREAKING CHANGE:`

## Examples

### Major Version Bump (1.0.0+)
```
feat!: remove deprecated API endpoints
BREAKING CHANGE: The /api/v1/users endpoint has been removed

feat(auth)!: change authentication flow
BREAKING CHANGE: JWT tokens are now required for all API calls
```

### Minor Version Bump
```
feat: add new user management dashboard
feat(auth): implement two-factor authentication
feat(api): add user search endpoint
```

### Patch Version Bump
```
fix: resolve user login issue
fix(auth): correct null handling in user lookup
perf: optimize database queries
perf(cache): improve Redis connection pooling
build: update webpack to v5
build(deps): upgrade React to 18.2.0
```

### No Version Bump
```
docs: update API documentation
docs(readme): add installation instructions
style: format code with prettier
style(eslint): enforce consistent formatting
test: add unit tests for auth module
test(integration): add API endpoint tests
ci: add GitHub Actions workflow
ci(gitlab): update pipeline configuration
chore: update dependencies
chore(deps): bump lodash to 4.17.21
refactor: extract common utilities
refactor(auth): simplify token validation
revert: "feat: add user authentication"
```

## Version Bump Priority

When multiple commit types are present in the commit history since the last version, the highest priority bump is applied:

1. **Breaking changes** → Major version bump (or minor for 0.x.x)
2. **Features** → Minor version bump (or patch for 0.x.x)
3. **Fixes, Performance, Build, CI, Refactor, Revert, Test** → Patch version bump
4. **All others** → No version bump

This ensures semantic versioning follows the [SemVer specification](https://semver.org/).

## Implementation Details

AgileFlow's versioning system:

- **Analyzes commit messages** since the last version tag
- **Groups changes by type** for organized release notes
- **Generates comprehensive tag messages** with categorized changes
- **Supports scoped commits** for better organization
- **Handles breaking changes** automatically
- **Creates annotated tags** with detailed commit summaries

## Best Practices

1. **Use conventional commit types** consistently
2. **Add scopes** when changes affect specific areas
3. **Use breaking change indicators** (`!` or `BREAKING CHANGE:`) for incompatible changes
4. **Write clear descriptions** that explain what changed
5. **Keep commits focused** on single changes
6. **Use present tense** in commit messages ("add feature" not "added feature")

## Related Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [Release Management](./release-management.md) - How versions are managed
- [GitLab CI Template](./gitlab-ci-template.md) - CI/CD integration
- [Branching Strategy](./branching-strategy.md) - Development workflow