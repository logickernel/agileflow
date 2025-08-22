![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today’s fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system, branching strategy, and CI/CD tool designed for software teams of all sizes and projects of any scale.

AgileFlow enforces Semantic Versioning and integrates a robust branching strategy for development and deployment. It seamlessly works with GitLab CI pipelines to ensure a structured, efficient, and predictable development lifecycle. Whether for small projects or large-scale deployments, AgileFlow is an indispensable tool that simplifies versioning and release management.

![AgileFlow workflow example diagram](./media/diagram.jpg)


AgileFlow works integrated with the CI/CD engine to **automatically create a new version** every time there’s a merge into a release branch, incrementing the patch number based on the latest identifiable version in the branch.

# Installation

## GitLab CI

Add the following job to your `.gitlab-ci.yml` configuration:

```yml
agileflow:
  image: registry.logickernel.com/kernel/agileflow:0.6.18
  script:
    - agileflow gitlab-ci
  only:
    - /^release\/[0-9]+\.[0-9]+$/
```

Note: To allow the pipeline to push tags, enable "Allow Git push requests to the repository" for the CI job token under Settings > CI/CD > Job token permissions. On some self-managed instances you may also need to enable the feature flag `allow_push_repository_for_job_token`.



Once AgileFlow is installed in [GitLab](#gitlab-ci):

1. [Create a release branch](#release-branches) using the product's current **MAJOR** and **MINOR** version numbers, e.g. `release/0.1`, `release/1.0`, `release/1.1`, etc.
2. [Create development branches](#development-branches) for contributors, following the naming conventions `dev/*`, `feat/*`, `fix/*`, or `hotfix/*` to keep the code organized and ensure smooth merging.
3. For a **MAJOR** or **MINOR** increment, [create a new release branch](#create-new-release-branches) (e.g., `release/1.1`) and merge development branches into it. Merges into a release branch automatically create the next patch tag. After `v1.0.0`, any breaking change increments the **MAJOR** version.


# Principles

## Release Branches

Release branches are a core concept in the AgileFlow framework. They group product versions, and their name is used to determine them.

Their name is composed of `release/` followed by the **MAJOR** and **MINOR** numbers of the versions they contain. Use the current product version number in the form `release/<MAJOR>.<MINOR>`, or for still unversioned projects:

- Use `release/0.1` for new projects.
- Use `release/1.0` or a greater **MAJOR** number if the project is already being used in production.


## Create New Release Branches

- For a minor increment: branch from the current stable baseline to `release/<MAJOR>.<MINOR+1>` (e.g., from `release/1.0` to `release/1.1`).
- For a major increment: create `release/<MAJOR+1>.0` (e.g., `release/2.0`).
- Point your `dev/*`, `feat/*`, `fix/*`, and `hotfix/*` branches at the new release branch.

## Development Branches

Development branches are used for feature additions and bug fixes. They branch off the release branch they intend to merge into. They use the following names depending on their purpose: `dev/*`, `feat/*`, `fix/*`, and `hotfix/*`.


### Development Branches Creation

1. **Generic Development Branches (dev/*)**: Generic development branches for large changes. Especially useful before `1.0.0`.

```bash
git switch -c dev/generic-development-branch-name
```

2. **Feature Branches (feat/*)**: For developing new features. Merges back into the corresponding release branch when features are ready. Example: `feat/new-login`.

```bash
git switch -c feat/feature-branch-name
```

3. **Bug Fix Branches (fix/*)**: For fixing bugs. These are also merged into the relevant release branch. Example: `fix/login-error`.

```bash
git switch -c fix/bug-fix-branch-name
```

4. **Hotfix Branches (hotfix/*)**: For urgent fixes in production. They allow applying critical patches without interfering with other in-progress development. Once resolved, these branches are merged back into their release branch, typically after the release has already been finalized.

 >  Merging strategies like **cherry-picking** or **rebasing** must be used to apply these fixes cleanly into active release branches.

```bash
git switch -c hotfix/hotfix-branch-name
```

After the contribution is ready, the development branch is merged into its origin release branch, preferably using a [Merge Request](https://docs.gitlab.com/ee/user/project/merge_requests/) or similar.

## Versioning

Once a development branch is merged into a release branch, AgileFlow calculates the next version number by increasing the patch number from the previous tag in the branch upon validated merges to the release branches. This keeps versioning consistent and transparent, making it easier to track small changes or bug fixes. AgileFlow enforces strict [Semantic Versioning](https://semver.org), which breaks down version numbers as follows:

- **Major Versions (X.0.0)**: Introduces breaking changes or significant shifts in functionality.
- **Minor Versions (0.Y.0)**: Represents new features, improvements, or non-breaking changes.
- **Patch Versions (0.0.Z)**: Denotes bug fixes or minor tweaks.



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
