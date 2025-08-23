![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today’s fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system, branching strategy, and CI/CD tool designed for software teams of all sizes and projects of any scale.

AgileFlow enforces Semantic Versioning and integrates a robust branching strategy for development and deployment. It seamlessly works with GitLab CI pipelines to ensure a structured, efficient, and predictable development lifecycle. **All versions are calculated from the main branch's commit history**, ensuring consistent versioning and release notes. Whether for small projects or large-scale deployments, AgileFlow is an indispensable tool that simplifies versioning and release management.

![AgileFlow workflow example diagram](./media/diagram.jpg)


AgileFlow works integrated with the CI/CD engine to **automatically create a new version** every time there's a merge into the main branch, incrementing the patch number based on the latest identifiable version in the repository.

# Installation

## GitLab CI

AgileFlow integrates with GitLab CI to automate version tagging. Follow these steps to set up the pipeline in your project.

### Using the Template

Add the following line at the top of `.gitlab-ci.yml`:

```yml
include:
  - remote: https://code.logickernel.com/kernel/agileflow/-/raw/release/0.6/templates/AgileFlow.gitlab-ci.yml
```

### Manual Installation

You can also install it manually by adding the following job to the `.gitlab-ci.yml` file instead:

```yml
agileflow:
  image: registry.logickernel.com/kernel/agileflow:0.6.23
  script:
    - VERSION=$(agileflow gitlab-ci)
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
```

> [!NOTE]
> To allow the pipeline to push tags enable `Allow Git push requests to the repository` for the CI job token under `Settings > CI/CD > Job token permissions`.
>
> You may need to enable the feature flag `allow_push_repository_for_job_token` in your self-managed instance to see it.


# Principles

Once AgileFlow is installed in [GitLab](#gitlab-ci):

1. **Main Branch**: Use the main branch (or master) as your primary release branch
2. [Create development branches](#development-branches) for contributors, following the naming conventions `dev/*`, `feat/*`, `fix/*`, or `hotfix/*` to keep the code organized and ensure smooth merging
3. Merge development branches into main when ready, and AgileFlow automatically creates the next version tag based on the main branch's history

## Main Branch Strategy

The main branch is the core of the AgileFlow framework. It serves as the single source of truth for all releases and versioning.

**Key Benefits:**
- **Single Version Sequence**: All versions (v1.0.0, v1.0.1, v1.1.0, etc.) are created from the same branch
- **Simplified Workflow**: No need to manage multiple release branches
- **Consistent History**: All releases share the same commit history and lineage
- **Easy Rollbacks**: Simple to revert to any previous version since all versions are on the same branch

**Version Management:**
- Patch versions (v1.0.0 → v1.0.1) are automatically incremented on each merge to main
- Minor versions (v1.0.0 → v1.1.0) are created by merging significant features
- Major versions (v1.0.0 → v2.0.0) are created for breaking changes

## Development Branches

Development branches are used for feature additions and bug fixes. They branch off the main branch and merge back into it when ready. Consider using expressive names depending on their purpose, e.g.: `dev/*`, `feat/*`, `fix/*`, and `hotfix/*`.

After the contribution is ready, the development branch is merged into main, preferably using a [Merge Request](https://docs.gitlab.com/ee/user/project/merge_requests/) or similar.


### Conventional Commits

Conventional Commits encode the intent of a change in the commit subject so that humans (and tools) can generate clear release notes and version bumps.

Commit subject format:

```text
type[!]?(scope)?: description
```

- **type**: one of the recognized types below (lowercase).
- **scope (optional)**: short, lowercase noun describing the affected area, e.g. `api`, `auth`, `build`.
- **description**: concise, imperative mood summary (e.g., "add support for...", "fix crash when...").
- Use the commit body for rationale/details, and use footers for metadata (e.g., `BREAKING CHANGE:`).

Recognized commit types (release notes order):

- **feat — Features**: Introduces new user- or API-facing capabilities without removing existing behavior.
  - **Use for**: new endpoints, CLI commands, configuration options, UI components, additive DB migrations.
  - **Avoid for**: internal-only refactors or performance tweaks that do not add capability.
  - **Example**: `feat(api): expose /v2/reports endpoint`

- **fix — Bug fixes**: Corrects faulty behavior, regressions, crashes, data corruption, or incorrect outputs.
  - **Use for**: logic errors, off-by-one fixes, null handling, race conditions, flaky behavior.
  - **Avoid for**: refactors that do not change externally observable behavior.
  - **Example**: `fix(auth): handle empty refresh token gracefully`

- **perf — Performance improvements**: Makes the system faster or leaner without changing public behavior or semantics.
  - **Use for**: algorithmic improvements, caching, reduced allocations, optimized queries, I/O batching.
  - **Avoid for**: feature additions or bug fixes; use those dedicated types instead.
  - **Example**: `perf(cache): batch writes to cut latency by 30%`

- **refactor — Refactors**: Internal code changes that do not alter external behavior; improves structure, readability, or maintainability.
  - **Use for**: renaming, extracting functions, reorganizing modules, paying down technical debt.
  - **Avoid for**: behavior changes (use `feat`, `fix`, or `perf`).
  - **Example**: `refactor(repo): split monolithic service into modules`

- **docs — Documentation**: Documentation-only changes.
  - **Use for**: README updates, API docs, examples, ADRs, inline docstrings.
  - **Avoid for**: code changes that affect behavior; pair with another type if both occur.
  - **Example**: `docs: add configuration examples for SSO`

- **build — Build system**: Changes that affect the build tooling or dependencies.
  - **Use for**: dependency bumps, lockfiles, Dockerfiles, Makefiles, build scripts, compilers, bundlers.
  - **Avoid for**: runtime code or CI-only config (use `ci` for that).
  - **Example**: `build(docker): slim image and enable build cache`

- **ci — CI**: Changes to continuous integration configuration and automation.
  - **Use for**: pipeline definitions, jobs, cache settings, CI scripts, badges.
  - **Avoid for**: build tooling that also affects local builds (use `build`).
  - **Example**: `ci(gitlab): add release job for tags`

- **chore — Chores**: Routine tasks that do not affect src behavior or tests.
  - **Use for**: repository housekeeping, license files, issue templates, renaming files without behavior change.
  - **Avoid for**: dependency/build changes (`build`), formatting-only changes (`style`).
  - **Example**: `chore: archive old roadmap documents`

- **test — Tests**: Adds or updates tests without changing runtime behavior.
  - **Use for**: new unit/integration/e2e tests, fixtures, test refactors.
  - **Avoid for**: fixing behavior (use `fix`) or adding features (`feat`).
  - **Example**: `test(api): cover error path for 404 responses`

- **style — Code style**: Non-functional changes that do not affect meaning of code.
  - **Use for**: formatting, whitespace, linters, code style fixes, reorder imports.
  - **Avoid for**: refactors or behavior changes.
  - **Example**: `style: apply Prettier 3 formatting`

- **revert — Reverts**: Reverts a previous commit.
  - **Use for**: explicit rollbacks; the body should reference the reverted commit.
  - **Example**: `revert: feat(api): expose /v2/reports endpoint`

- **Other changes**: Commits that don't match the conventional format or are unclassified. These are listed verbatim when at least one conventional commit is present.

Breaking changes are flagged using the `!` shorthand in the subject (for example, `feat!:`) or with a `BREAKING CHANGE:` footer. After `1.0.0`, breaking changes should drive a **MAJOR** version bump per SemVer.

Examples of conventional commit subjects:

```text
feat(auth): add OIDC login flow
fix(api): correct null handling in user lookup
perf(cache)!: switch to Redis cluster
docs: update README with usage examples
```

### Tag Messages

AgileFlow elevates release notes by grouping the annotated tag message according to the intent of each change, following the [Conventional Commits](https://www.conventionalcommits.org/) methodology.


Example of the generated tag message body when conventional commits are detected:

```text
v1.2.4

Features:
- auth: add OIDC login flow

Bug fixes:
- api: correct null handling in user lookup

Performance improvements:
- BREAKING: cache: switch to Redis cluster

Documentation:
- update README with usage examples
```

When commits are not in the conventional format, AgileFlow will produce a simple list:

```text
v1.2.4
- Merge branch 'feat/ui-polish'
- Tweak logging verbosity
- Fix typo in pipeline
```
