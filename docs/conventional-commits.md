# Conventional Commits

This document describes the conventional commit format used in AgileFlow and how it affects version bumping.

## Version Bump Logic

AgileFlow automatically determines version bumps based on conventional commit messages using the following logic:

### For versions 1.0.0 and above:
- **Major version bump (X.0.0)**: Breaking changes (`!` suffix or `BREAKING CHANGE:` in footer)
- **Minor version bump (0.X.0)**: New features (`feat:`)
- **Patch version bump (0.0.X)**: Bug fixes, performance improvements, build system changes, CI changes, refactors, reverts, tests, or dependency updates
- **No version bump**: Documentation, style changes, or chores (unless they affect build artifacts)

### For pre-1.0.0 versions (0.x.x):
- **Minor version bump (0.X.0)**: Breaking changes (`!` suffix or `BREAKING CHANGE:` in footer)
- **Patch version bump (0.0.X)**: New features, bug fixes, performance improvements, build system changes, CI changes, refactors, reverts, tests, or dependency updates
- **No version bump**: Documentation, style changes, or chores (unless they affect build artifacts)

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

### Dependency Updates

Dependency updates are handled consistently based on their impact:

- **`build(deps):`** - Always triggers patch version bump (affects build artifacts)
- **`chore(deps):`** - Triggers patch version bump if it affects runtime dependencies, no bump for dev/test-only dependencies

#### Examples:
```
build(deps): upgrade React to 18.2.0          # Patch bump (affects runtime)
chore(deps): bump lodash to 4.17.21          # Patch bump (runtime dependency)
chore(deps): bump jest to 29.0.0 [skip release]  # No bump (dev dependency)
```

## Breaking Changes

Breaking changes can be indicated in two ways:

1. **Exclamation mark suffix**: `feat!: breaking change` or `feat(scope)!: breaking change`
2. **BREAKING CHANGE in footer**: Any commit with `BREAKING CHANGE:` in the commit footer/trailer section

**Important**: Breaking change indicators in the commit body are not supported and may cause false positives. Always use the footer section.

### Breaking Change Examples:
```
feat!: remove deprecated API endpoints

feat(auth)!: change authentication flow

fix!: modify database schema

feat: new feature
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
- **footer**: Optional footers like `BREAKING CHANGE:` or `[skip release]`

## Non-Conventional Commits

Commits that don't follow the conventional format are handled as follows:

- **Version bumping**: Non-conventional commits trigger **patch version bumps by default** unless they contain `[skip release]`
- **Release notes**: They appear under "Other changes" section
- **Examples**: `git merge`, `git revert`, or plain text commits

### Skip Release Convention

Use `[skip release]` suffix to explicitly prevent version bumping:

```
docs: update internal notes [skip release]
chore: update local config [skip release]
test: add debug logging [skip release]
```

## Release Note Generation

AgileFlow automatically generates organized release notes by grouping commits by type. The system follows this specific order:

1. **Features** - New functionality
2. **Bug fixes** - Bug resolutions
3. **Performance improvements** - Performance enhancements
4. **Refactors** - Code refactoring
5. **Documentation** - Documentation updates
6. **Build system** - Build tooling changes
7. **CI** - Continuous integration changes
8. **Chores** - Maintenance tasks
9. **Tests** - Test additions/changes (placed after chores as they're not user-facing)
10. **Code style** - Formatting and style changes
11. **Reverts** - Reverted changes
12. **Other changes** - Non-conventional commits

### Breaking Change Indicators

When breaking changes are detected, they are automatically prefixed with `BREAKING: ` in the release notes:

```
v2.0.0

Features:
- BREAKING: auth: change authentication flow
- BREAKING: remove deprecated API endpoints

Bug fixes:
- BREAKING: modify database schema
```

## Examples

### Major Version Bump (1.0.0+)
```
feat!: remove deprecated API endpoints

feat(auth)!: change authentication flow

fix!: modify database schema
BREAKING CHANGE: Database schema has changed
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
ci: add GitHub Actions workflow
ci(gitlab): update pipeline configuration
refactor: extract common utilities
refactor(auth): simplify token validation
revert: "feat: add user authentication"
test: add unit tests for auth module
test(integration): add API endpoint tests
chore(deps): bump lodash to 4.17.21
```

### No Version Bump
```
docs: update API documentation
docs(readme): add installation instructions
style: format code with prettier
style(eslint): enforce consistent formatting
chore: update local configuration
chore(deps): bump jest to 29.0.0 [skip release]
```

## Version Bump Priority

When multiple commit types are present in the commit history since the last version, the highest priority bump is applied:

1. **Breaking changes** → Major version bump (or minor for 0.x.x)
2. **Features** → Minor version bump (or patch for 0.x.x)
3. **Fixes, Performance, Build, CI, Refactor, Revert, Test, Dependencies** → Patch version bump
4. **Documentation, Style, Chores** → No version bump (unless they affect build artifacts)

**Non-conventional commits** trigger patch version bumps by default unless they contain `[skip release]`.

This ensures semantic versioning follows the [SemVer specification](https://semver.org/).

## Implementation Details

AgileFlow's versioning system:

- **Analyzes commit messages** since the last version tag
- **Groups changes by type** for organized release notes using the defined section order
- **Generates comprehensive tag messages** with categorized changes
- **Supports scoped commits** for better organization
- **Handles breaking changes** automatically with `BREAKING: ` prefix
- **Creates annotated tags** with detailed commit summaries
- **Falls back to flat list** for repositories without conventional commits
- **Supports metadata** in version tags (e.g., `v1.0.0-alpha.1`)
- **Treats non-conventional commits** as patch-level changes by default
- **Respects `[skip release]`** convention for explicit version control

## Best Practices

1. **Use conventional commit types** consistently
2. **Add scopes** when changes affect specific areas
3. **Use breaking change indicators** (`!` or `BREAKING CHANGE:` in footer) for incompatible changes
4. **Write clear descriptions** that explain what changed
5. **Keep commits focused** on single changes
6. **Use present tense** in commit messages ("add feature" not "added feature")
7. **Follow the established section order** for consistent release notes
8. **Use `[skip release]`** for dev/test dependencies that shouldn't trigger releases
9. **Place breaking changes in footer** to avoid false positives
10. **Group dependency updates** consistently: `build(deps)` for runtime, `chore(deps)` for maintenance

## Related Documentation

- [Getting Started](./getting-started.md) - Quick start guide
- [Release Management](./release-management.md) - How versions are managed
- [GitLab CI Template](./gitlab-ci-template.md) - CI/CD integration
- [Branching Strategy](./branching-strategy.md) - Development workflow