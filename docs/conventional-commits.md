# Conventional Commits

AgileFlow uses [Conventional Commits](https://www.conventionalcommits.org/) to automatically determine version bumps and generate release notes.

## Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

### Components

| Part | Required | Description |
|------|----------|-------------|
| `type` | Yes | Type of change (feat, fix, etc.) |
| `scope` | No | Area affected (auth, api, ui) |
| `!` | No | Breaking change indicator |
| `description` | Yes | Short summary |
| `body` | No | Detailed explanation |
| `footer` | No | Breaking changes, issue refs |

---

## Commit Types and Version Impact

| Type | Description | 1.0.0+ | 0.x.x |
|------|-------------|--------|-------|
| `feat` | New features | Minor | Minor |
| `fix` | Bug fixes | Patch | Patch |
| `perf` | Performance improvements | None | None |
| `refactor` | Code refactoring | None | None |
| `build` | Build system changes | None | None |
| `ci` | CI/CD changes | None | None |
| `test` | Test changes | None | None |
| `revert` | Revert commits | None | None |
| `docs` | Documentation | None | None |
| `style` | Code style | None | None |
| `chore` | Maintenance | None | None |

### Breaking Changes

Breaking changes trigger a major version bump (or minor for 0.x.x):

```bash
# Using ! suffix
feat!: remove deprecated API

# Using footer
feat: change response format

BREAKING CHANGE: Response now uses camelCase
```

---

## Examples

### Features

```bash
feat: add user authentication
feat(auth): implement OAuth2 login
feat(api): add rate limiting endpoint
```

### Fixes

```bash
fix: resolve null pointer exception
fix(auth): handle expired tokens correctly
fix(ui): correct button alignment on mobile
```

### Performance

```bash
perf: optimize database queries
perf(cache): implement Redis connection pooling
```

### Refactoring

```bash
refactor: simplify authentication logic
refactor(api): extract validation middleware
```

### Breaking Changes

```bash
feat!: remove v1 API endpoints
feat(auth)!: change token format to JWT

fix: update database schema

BREAKING CHANGE: User table now requires email field
```

### Documentation

```bash
docs: update installation guide
docs(api): add authentication examples
docs(readme): improve getting started section
```

### No Version Bump

```bash
docs: update README
style: format code with prettier
chore: update development dependencies
```

---

## Version Bump Priority

When multiple commits exist, the highest priority wins:

1. **Breaking changes** → Major (or Minor for 0.x.x)
2. **Features** → Minor
3. **Fixes** → Patch
4. **Everything else** → No bump

### Example

If commits since last version include:
```
feat: add new dashboard
fix: resolve login bug
docs: update README
```

Result: **Minor bump** (feat has highest priority)

---

## Release Notes Generation

AgileFlow groups commits by type for release notes:

```
v1.2.4

### Features
- add user dashboard
- implement API rate limiting

### Bug fixes
- resolve login validation error
- fix timeout on large uploads

### Performance improvements
- optimize database queries

### Documentation
- update API reference
```

### Breaking Changes in Notes

Breaking changes are highlighted:

```
v2.0.0

### Features
- BREAKING: remove deprecated API endpoints
- BREAKING: change authentication flow
```

---

## Skip Release

Use `[skip release]` to prevent version bump:

```bash
chore(deps): bump jest to 29.0.0 [skip release]
docs: internal notes [skip release]
```

---

## Non-Conventional Commits

Commits not following the format:
- Trigger **no bump** by default
- Appear under "Other changes" in release notes
- Use `[skip release]` to prevent bump

---

## Best Practices

### 1. Use Clear Types

```bash
# ✅ Correct type
feat: add login feature
fix: resolve crash on startup

# ❌ Wrong type
fix: add login feature  # Should be feat
feat: fix crash         # Should be fix
```

### 2. Add Meaningful Scopes

```bash
# ✅ Helpful scope
feat(auth): add OAuth2 support
fix(api): handle timeout errors

# ✅ Also fine without scope
feat: add OAuth2 support
fix: handle timeout errors
```

### 3. Write Clear Descriptions

```bash
# ✅ Clear and specific
feat(auth): add two-factor authentication via SMS
fix(api): prevent timeout on uploads larger than 100MB

# ❌ Vague
feat: add 2fa
fix: fix timeout
```

### 4. Mark Breaking Changes

```bash
# ✅ Properly marked
feat!: remove deprecated endpoints

# ❌ Breaking change not marked
feat: remove deprecated endpoints
```

### 5. Use Present Tense

```bash
# ✅ Present tense
feat: add user authentication

# ❌ Past tense
feat: added user authentication
```

---

## Commit Type Details

For detailed guidance on each type, see:

- [feat](./conventional-commits/type-feat.md) — Features
- [fix](./conventional-commits/type-fix.md) — Bug fixes
- [perf](./conventional-commits/type-perf.md) — Performance
- [refactor](./conventional-commits/type-refactor.md) — Refactoring
- [build](./conventional-commits/type-build.md) — Build system
- [ci](./conventional-commits/type-ci.md) — CI/CD
- [test](./conventional-commits/type-test.md) — Tests
- [docs](./conventional-commits/type-docs.md) — Documentation
- [style](./conventional-commits/type-style.md) — Code style
- [chore](./conventional-commits/type-chore.md) — Maintenance
- [revert](./conventional-commits/type-revert.md) — Reverts

---

## Related Documentation

- [Getting Started](./getting-started.md) — Quick start
- [Release Management](./release-management.md) — Version management
- [Branching Strategy](./branching-strategy.md) — Git workflow
