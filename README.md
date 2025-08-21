![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today’s fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system, branching strategy, and CI/CD tool designed for software teams of all sizes and projects of any scale.

AgileFlow enforces Semantic Versioning and integrates a robust branching strategy for development and deployment. It seamlessly works with GitLab CI pipelines to ensure a structured, efficient, and predictable development lifecycle. Whether for small projects or large-scale deployments, AgileFlow is an indispensable tool that simplifies versioning and release management.

![AgileFlow workflow example diagram](./media/diagram.jpg)


AgileFlow works integrated with the CI/CD engine to **automatically create a new version** every time there’s a merge into a release branch, incrementing the patch number based on the latest identifiable version in the branch.

Once AgileFlow is installed in [GitLab](#gitlab-ci):

1. [Create a release branch](#release-branches) using the product's current **MAJOR** and **MINOR** version numbers, e.g. `release/0.1`, `release/1.0`, `release/1.1`, etc.
2. [Create development branches](#development-branches) for contributors, following the naming conventions `dev/*`, `feat/*`, `fix/*`, or `hotfix/*` to keep the code organized and ensure smooth merging.
3. For a **MAJOR** or **MINOR** increment, [create a new release branch](#create-new-release-branches) (e.g., `release/1.1`) and merge development branches into it. Merges into a release branch automatically create the next patch tag. After `v1.0.0`, any breaking change increments the **MAJOR** version.




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



### Conventional Commits and Tag Messages

AgileFlow elevates release notes by grouping the annotated tag message according to the intent of each change, following the [Conventional Commits](https://www.conventionalcommits.org/) methodology.

- **Principle**: Release notes should communicate intent (what improved, what was fixed, what changed) rather than a raw list of commits. Grouping by change type creates a quick, scannable summary aligned with Semantic Versioning.
- **Method**: When commit subjects follow the Conventional Commits format `type[!]?(scope)?: description`, AgileFlow groups them into sections like Features, Bug fixes, and Performance improvements. Breaking changes are highlighted.
- **Resilience**: If no conventional commit messages are detected, AgileFlow falls back to a simple, flat list of commit subjects (the previous behavior). Non-conforming commits are listed under "Other changes" when at least one conventional commit is present.

Recognized types and their order in the tag message:

- **feat**: Features
- **fix**: Bug fixes
- **perf**: Performance improvements
- **refactor**: Refactors
- **docs**: Documentation
- **build**: Build system
- **ci**: CI
- **chore**: Chores
- **test**: Tests
- **style**: Code style
- **revert**: Reverts
- **Other changes**: Any commits that don't match the conventional format

Breaking changes are flagged when using the conventional `!` shorthand (for example, `feat!:`). After `1.0.0`, breaking changes should drive a **MAJOR** version bump per SemVer.

Examples of conventional commit subjects:

```text
feat(auth): add OIDC login flow
fix(api): correct null handling in user lookup
perf(cache)!: switch to Redis cluster
docs: update README with usage examples
```

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

