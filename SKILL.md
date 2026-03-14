---
name: conventional-commit
description: Craft conventional commit messages that drive automated semantic versioning and changelog generation. Use when committing code, writing commit messages, staging and committing changes, preparing releases, or when the user says "commit", "/commit", "git commit", "create a commit", "commit these changes", "version bump", "changelog", "write a commit message", or "prepare a release".
---

# Conventional Commit Messages

Write every commit message so that AgileFlow (or any conventional-commits toolchain) can automatically determine the correct semantic version bump and generate a clean changelog.

## Critical Rules

1. **Only `feat` and `fix` trigger version bumps.** All other types are changelog-only or invisible.
2. **Breaking changes always use `!`** after the type/scope, or a `BREAKING CHANGE:` footer.
3. **Before v1.0.0**, breaking changes bump minor (not major).
4. **Use present tense, imperative mood**: "add login" not "added login" or "adds login".
5. **One logical change per commit.** Don't bundle unrelated changes.

## Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

Only the first line is parsed for versioning. Keep it under 72 characters.

## Type Reference

| Type | When to use | Version bump | In changelog? |
|------|-------------|--------------|---------------|
| `feat` | New functionality a user can use | minor | Yes |
| `fix` | Fixes broken functionality | patch | Yes |
| `perf` | Performance improvement (no new feature) | none | Yes |
| `refactor` | Code restructuring, no behavior change | none | Yes |
| `docs` | Documentation only | none | Yes |
| `revert` | Reverts a previous commit | none | Yes |
| `ci` | CI/CD configuration changes | none | Yes |
| `test` | Adding or updating tests only | none | No |
| `style` | Formatting, whitespace, semicolons | none | No |
| `build` | Build system or dependency changes | none | No |
| `chore` | Maintenance, WIP, no user impact | none | No |

## Decision Tree

Ask yourself in order:

1. Does this add new functionality a user can use? -> `feat`
2. Does this fix broken functionality? -> `fix`
3. Is this work-in-progress or maintenance with zero user impact? -> `chore` (stays out of changelog)
4. Is it a performance improvement? -> `perf`
5. Is it restructuring code without changing behavior? -> `refactor`
6. Does it break any existing behavior? -> append `!` (e.g. `feat!:`, `refactor!:`)

## Breaking Changes

Mark breaking changes in one of two ways:

```bash
# With ! — preferred, concise
feat!: remove deprecated v1 endpoints

# With footer — when you need to explain the migration
feat: change response format

BREAKING CHANGE: Response now uses camelCase instead of snake_case.
Migrate by updating all client parsers.
```

### Version impact of breaking changes

| Current version | Breaking change bump |
|-----------------|---------------------|
| v0.x.x (pre-1.0) | minor (e.g. v0.3.0 -> v0.4.0) |
| v1.0.0+ | major (e.g. v1.2.3 -> v2.0.0) |

## Scopes

Use scopes to clarify which part of the codebase is affected. Keep them short and consistent within the project.

```bash
feat(auth): add OAuth2 support
fix(api): handle empty response body
refactor(cli): simplify argument parsing
```

## Examples

### Good commit messages

```bash
feat: add dark mode toggle to settings page
fix: prevent timeout on uploads larger than 100MB
perf: cache user preferences to reduce API calls
refactor!: remove 'quiet' parameter from pushTag functions
docs: update installation instructions for Node 20
chore: scaffold form validation module
fix(parser): handle commits with empty message body
feat(api): add pagination to project list endpoint
```

### Bad commit messages (and how to fix them)

```bash
# Too vague — what was fixed?
fix: fix bug
# Better:
fix: prevent crash when user profile is null

# Wrong type — scaffolding isn't a refactor, it's WIP
refactor: scaffold form validation module
# Better:
chore: scaffold form validation module

# Past tense
feat: added user authentication
# Better:
feat: add user authentication

# Multiple concerns in one commit
feat: add login page and fix database timeout and update docs
# Better: split into three commits

# Missing type entirely (won't trigger any version logic)
update the readme
# Better:
docs: update the readme
```

## When Multiple Commits Exist

When AgileFlow analyzes commits since the last tag, the **highest-priority bump wins**:

- Any breaking change -> major (or minor if pre-v1.0.0)
- Any `feat` -> minor
- Any `fix` -> patch
- Everything else -> no bump

So if you have 3 `fix` commits and 1 `feat`, the result is a minor bump.

## Changelog Grouping

Commits appear in the changelog grouped by type in this order:

1. **BREAKING CHANGES** (dedicated section at top if any)
2. Features (`feat`)
3. Bug fixes (`fix`)
4. Performance improvements (`perf`)
5. Refactors (`refactor`)
6. Documentation (`docs`)
7. Reverts (`revert`)
8. CI (`ci`)

Types `test`, `style`, `build`, and `chore` are excluded from the changelog. Use `chore` for anything you don't want visible in release notes.

## Common Mistakes to Avoid

- Using `refactor` for work-in-progress (use `chore` instead — refactor shows in changelog)
- Forgetting `!` on breaking changes (the version bump won't happen correctly)
- Writing descriptions in past tense ("added" instead of "add")
- Using non-standard types that the tool won't recognize
- Putting the scope outside parentheses: `feat auth:` instead of `feat(auth):`
- Starting the description with a capital letter (conventional style is lowercase)
