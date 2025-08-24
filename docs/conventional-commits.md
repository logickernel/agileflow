# Conventional Commits

This document describes the conventional commit format used in AgileFlow and how it affects version bumping.

## Version Bump Logic

AgileFlow automatically determines version bumps based on conventional commit messages:

- **Major version bump (X.0.0)**: Breaking changes (`!` suffix or `BREAKING CHANGE:` in body)
- **Minor version bump (0.X.0)**: New features (`feat:`)
- **Patch version bump (0.0.X)**: Bug fixes, performance improvements, or build system changes
- **No version bump**: Documentation, style changes, tests, CI, chores, refactors, or reverts

**Note**: For pre-1.0.0 versions, breaking changes bump the minor version instead of major.

## Commit Types and Version Impact

| Commit Type | Documentation | (>1.0.0) | (0.x.x) | Description | Examples |
|-------------|---------------|----------------------|---------------------|-------------|----------|
| **BREAKING** | - | **Major** | **Minor** | Breaking changes | `feat!: remove deprecated API`<br>`BREAKING CHANGE: in body` |
| **feat** | [type-feat.md](./type-feat.md) | **Minor** | **Patch** | New features | `feat: add user authentication`<br>`feat(auth): implement OAuth2` |
| **fix** | [type-fix.md](./type-fix.md) | **Patch** | **Patch** | Bug fixes | `fix: resolve login validation error`<br>`fix(api): handle null response` |
| **perf** | [type-perf.md](./type-perf.md) | **Patch** | **Patch** | Performance improvements | `perf: optimize database queries`<br>`perf(ui): reduce render time` |
| **build** | [type-build.md](./type-build.md) | **Patch** | **Patch** | Build system changes | `build: update webpack configuration`<br>`build(deps): upgrade to Node 18` |
| **docs** | [type-docs.md](./type-docs.md) | **None** | **None** | Documentation changes | `docs: update API documentation`<br>`docs: add installation guide` |
| **style** | [type-style.md](./type-style.md) | **None** | **None** | Code style changes | `style: format code with prettier`<br>`style: fix indentation` |
| **refactor** | [type-refactor.md](./type-refactor.md) | **None** | **None** | Code refactoring | `refactor: extract common utilities`<br>`refactor(api): simplify response handling` |
| **test** | [type-test.md](./type-test.md) | **None** | **None** | Test additions/changes | `test: add unit tests for auth`<br>`test: fix failing integration test` |
| **ci** | [type-ci.md](./type-ci.md) | **None** | **None** | CI/CD changes | `ci: add GitHub Actions workflow`<br>`ci: update Docker image` |
| **chore** | [type-chore.md](./type-chore.md) | **None** | **None** | Maintenance tasks | `chore: update dependencies`<br>`chore: clean up old files` |
| **revert** | [type-revert.md](./type-revert.md) | **None** | **None** | Revert previous commits | `revert: "feat: add user authentication"` |

## Breaking Changes

Breaking changes trigger a **major version bump** (or minor for pre-1.0.0) and can be indicated in two ways:

1. **Exclamation mark suffix**: `feat!: breaking change` or `feat(scope)!: breaking change`
2. **BREAKING CHANGE in body**: Any commit with `BREAKING CHANGE:` in the commit body

## Examples

### Major Version Bump
```
feat!: remove deprecated API endpoints
BREAKING CHANGE: The /api/v1/users endpoint has been removed
```

### Minor Version Bump
```
feat: add new user management dashboard
feat(auth): implement two-factor authentication
```

### Patch Version Bump
```
fix: resolve user login issue
perf: optimize database queries
build: update webpack to v5
```

### No Version Bump
```
docs: update API documentation
style: format code with prettier
test: add unit tests for auth module
ci: add GitHub Actions workflow
chore: update dependencies
refactor: extract common utilities
revert: "feat: add user authentication"
```

## Version Bump Priority

When multiple commit types are present, the highest priority bump is applied:

1. **Breaking changes** → Major version bump
2. **Features** → Minor version bump  
3. **Fixes, Performance, Build** → Patch version bump
4. **All others** → No version bump

This ensures semantic versioning follows the [SemVer specification](https://semver.org/).