# Conventional Commits Guide

Conventional Commits is a specification that provides a standardized format for commit messages. AgileFlow uses this format to automatically generate semantic versions and comprehensive release notes.

## Why Conventional Commits?

Conventional Commits provide several benefits:

- **Automatic Versioning**: AgileFlow can determine version bumps automatically
- **Clear Release Notes**: Generate meaningful release notes from commit history
- **Better Collaboration**: Team members understand the intent of each change
- **Automated Tools**: Enable CI/CD tools to make intelligent decisions
- **Professional Standards**: Follow industry best practices for commit messages

## Commit Message Format

The basic format for conventional commits is:

```text
type(scope)?[!]: description

[optional body]

[optional footer(s)]
```

### Required Elements

1. **type**: The type of change (lowercase)
2. **description**: A concise summary in imperative mood

### Optional Elements

3. **scope**: The area of the codebase affected
4. **!**: Indicates a breaking change
5. **body**: Detailed explanation of the change
6. **footer**: Additional metadata (e.g., breaking changes, issue references)

## Commit Types

AgileFlow recognizes the following commit types, ordered by their impact on versioning:

### Features (`feat`)
Introduces new user- or API-facing capabilities without removing existing behavior.

**Use for**:
- New endpoints or API methods
- CLI commands and options
- Configuration options
- UI components and features
- Additive database migrations
- New functionality

**Avoid for**:
- Internal-only refactors
- Performance tweaks that don't add capability
- Bug fixes

**Examples**:
```text
feat(api): add user authentication endpoint
feat(cli): implement --dry-run flag for deployments
feat(ui): add dark mode toggle
feat(auth): support OAuth2 login flow
```

### 🐛 Bug Fixes (`fix`)
Corrects faulty behavior, regressions, crashes, data corruption, or incorrect outputs.

**Use for**:
- Logic errors and bugs
- Off-by-one fixes
- Null handling improvements
- Race condition fixes
- Flaky behavior resolution
- Data validation fixes

**Avoid for**:
- Refactors that don't change behavior
- Performance improvements
- New features

**Examples**:
```text
fix(auth): handle empty refresh token gracefully
fix(api): correct null pointer exception in user lookup
fix(ui): resolve button click event not firing
fix(db): fix transaction rollback on connection failure
```

### Performance (`perf`)
Makes the system faster or leaner without changing public behavior or semantics.

**Use for**:
- Algorithmic improvements
- Caching implementations
- Reduced memory allocations
- Optimized database queries
- I/O batching
- Performance optimizations

**Avoid for**:
- Feature additions
- Bug fixes
- Refactoring

**Examples**:
```text
perf(cache): implement Redis caching for user sessions
perf(db): optimize user query with proper indexing
perf(api): batch database writes to reduce latency
perf(ui): lazy load images for better page performance
```

### Refactors (`refactor`)
Internal code changes that do not alter external behavior; improves structure, readability, or maintainability.

**Use for**:
- Code reorganization
- Function extraction
- Module restructuring
- Technical debt reduction
- Code cleanup
- Renaming variables/functions

**Avoid for**:
- Behavior changes
- New features
- Bug fixes

**Examples**:
```text
refactor(auth): extract authentication logic into service
refactor(api): split monolithic controller into modules
refactor(ui): reorganize component hierarchy
refactor(db): normalize database schema
```

### Documentation (`docs`)

Documentation-only changes.

**Use for**:
- README updates
- API documentation
- Code examples
- Architecture decision records (ADRs)
- Inline code comments
- User guides

**Avoid for**:
- Code changes that affect behavior
- Configuration changes

**Examples**:
```text
docs: update installation instructions
docs(api): add endpoint documentation
docs: add troubleshooting guide
docs: update contributing guidelines
```

### Build System (`build`)

Changes that affect the build tooling or dependencies.

**Use for**:
- Dependency updates
- Lockfile changes
- Dockerfile modifications
- Build script updates
- Compiler configurations
- Bundler settings

**Avoid for**:
- Runtime code changes
- CI-only configuration

**Examples**:
```text
build(deps): update React to version 18
build(docker): optimize Docker image layers
build(webpack): configure code splitting
build(npm): update package-lock.json
```

### CI/CD (`ci`)

Changes to continuous integration configuration and automation. They usually do not affect source behavior, if they do, they must be marked as ! or add a BREAKING FIX footer.

**Use for**:
- Pipeline definitions
- Job configurations
- Cache settings
- CI scripts
- Deployment automation
- Test configurations

**Avoid for**:
- Build tooling that affects local builds
- Application code changes

**Examples**:
```text
ci(gitlab): add deployment job for staging
ci(docker): configure multi-stage builds
ci(tests): add integration test suite
ci(deploy): automate production deployments
```

### Chores (`chore`)

Routine tasks that do not affect source behavior or tests.

**Use for**:
- Repository housekeeping
- License file updates
- Issue template changes
- File renames without behavior change
- Git configuration
- Development environment setup

**Avoid for**:
- Dependency changes
- Build system modifications
- Code formatting

**Examples**:
```text
chore: update .gitignore patterns
chore: add issue templates
chore: reorganize project structure
chore: update development setup instructions
```

### Tests (`test`)

Adds or updates tests without changing runtime behavior.

**Use for**:
- New unit tests
- Integration test additions
- Test fixture updates
- Test refactoring
- Test coverage improvements
- End-to-end test additions

**Avoid for**:
- Bug fixes
- Feature additions
- Behavior changes

**Examples**:
```text
test(api): add unit tests for user service
test(ui): add integration tests for login flow
test(db): add database migration tests
test(auth): add OAuth2 flow tests
```

### Code Style (`style`)
Non-functional changes that do not affect the meaning of code.

**Use for**:
- Code formatting
- Whitespace changes
- Linter fixes
- Import reordering
- Code style compliance
- Prettier/ESLint fixes

**Avoid for**:
- Refactoring
- Behavior changes
- Bug fixes

**Examples**:
```text
style: apply Prettier formatting
style: fix ESLint warnings
style: reorder imports alphabetically
style: fix trailing whitespace
```

### Reverts (`revert`)
Reverts a previous commit.

**Use for**:
- Explicit rollbacks
- Undoing problematic changes
- Reverting breaking changes

**Examples**:
```text
revert: feat(api): add user authentication endpoint
revert: fix(auth): handle empty refresh token gracefully
```

## Breaking Changes

Breaking changes are changes that break backward compatibility. They trigger a **MAJOR** version bump.

### Indicating Breaking Changes

#### Method 1: Exclamation Mark
Add `!` after the type and scope:

```text
feat!: remove deprecated API endpoint
feat(api)!: change user ID format from string to UUID
```

#### Method 2: Breaking Change Footer
Add a `BREAKING CHANGE:` footer:

```text
feat(api): change user ID format

BREAKING CHANGE: User IDs are now UUIDs instead of strings.
This affects all API endpoints that return or accept user IDs.
```

### When to Use Breaking Changes

- **API Changes**: Removing endpoints, changing parameter types
- **Database Changes**: Schema modifications that break existing queries
- **Configuration Changes**: Removing or changing configuration options
- **Behavior Changes**: Altering how features work in unexpected ways

## Scopes

Scopes help categorize changes within a specific area of your codebase.

### Common Scopes

- **api**: API-related changes
- **auth**: Authentication and authorization
- **ui**: User interface components
- **db**: Database and data layer
- **cli**: Command-line interface
- **docs**: Documentation
- **ci**: Continuous integration
- **build**: Build system
- **test**: Testing framework
- **deploy**: Deployment and infrastructure

### Scope Examples

```text
feat(api): add user management endpoints
fix(ui): resolve button alignment issues
docs(auth): update OAuth2 configuration guide
refactor(db): normalize user table schema
```

## Commit Message Examples

### Simple Feature
```text
feat: add user authentication system
```

### Scoped Feature
```text
feat(auth): implement JWT token refresh
```

### Breaking Change
```text
feat(api)!: change user ID format to UUID
```

### Feature with Body
```text
feat(ui): add dark mode support

Implements a theme toggle that allows users to switch
between light and dark color schemes. The preference
is stored in localStorage and persists across sessions.

Closes #123
```

### Breaking Change with Footer
```text
feat(api): restructure user endpoints

BREAKING CHANGE: The /api/users endpoint now returns
paginated results instead of all users. Use /api/users?page=1
for the first page of results.

Closes #456
```

### Bug Fix
```text
fix(auth): handle expired refresh tokens gracefully
```

### Performance Improvement
```text
perf(cache): implement Redis caching for user sessions
```

### Documentation Update
```text
docs: add API authentication guide
```

## Best Practices

### 1. Use Imperative Mood
```text
# ✅ Good
feat: add user authentication
fix: resolve login bug

# ❌ Bad
feat: added user authentication
fix: resolved login bug
```

### 2. Keep Description Concise
```text
# ✅ Good
feat: add user authentication system

# ❌ Bad
feat: add comprehensive user authentication system with JWT tokens, refresh tokens, password hashing, and role-based access control
```

### 3. Use Scopes Consistently
Choose a set of scopes and use them consistently across your project.

### 4. Reference Issues
```text
feat: add user authentication

Closes #123
Fixes #456
```

### 5. Group Related Changes
If you have multiple related changes, consider combining them into a single commit or using consistent scopes.

## Version Bumping

AgileFlow automatically determines version bumps based on your commit types:

- **Patch** (v1.0.0 → v1.0.1): Bug fixes, documentation, chores
- **Minor** (v1.0.0 → v1.1.0): New features, performance improvements
- **Major** (v1.0.0 → v2.0.0): Breaking changes

### Version Bump Rules

1. **Major Version**: Any commit with `!` or `BREAKING CHANGE:`
2. **Minor Version**: Any `feat` or `perf` commit
3. **Patch Version**: Any `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, or `chore` commit

## Troubleshooting

### Common Issues

#### Commit message too long
- Keep the description under 72 characters
- Use the body for detailed explanations

#### Invalid type
- Use only the recognized types listed above
- Check spelling and case sensitivity

#### Missing description
- Always provide a clear, concise description
- Use imperative mood

#### Scope format
- Use lowercase, short nouns
- Avoid special characters or spaces

### Getting Help

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitizen](https://github.com/commitizen/cz-cli) - Interactive commit message creation
- [Commitlint](https://github.com/conventional-changelog/commitlint) - Lint commit messages