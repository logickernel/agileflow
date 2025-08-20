![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today’s fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system, branching strategy, and CI/CD tool designed for software teams of all sizes and projects of any scale.

AgileFlow enforces Semantic Versioning and integrates a robust branching strategy for development and deployment. It seamlessly works with GitLab CI and GitHub Actions CI/CD pipelines to ensure a structured, efficient, and predictable development lifecycle. Whether for small projects or large-scale deployments, AgileFlow is an indispensable tool that simplifies versioning and release management.

![AgileFlow workflow example diagram](./media/diagram.jpg)


AgileFlow works integrated with the CI/CD engine to **automatically create a new version** every time there’s a merge into a release branch, incrementing the patch number based on the latest identifiable version in the branch.

Once AgileFlow is installed in either [GitLab](#gitlab-ci) or GitHub:

1. [Create a release branch](#release-branches) using the product's current **MAJOR** and **MINOR** version numbers, e.g. `release/0.1`, `release/1.0`, `release/1.1`, etc.
2. [Create development branches](#development-branches) for contributors, following the naming conventions `dev/*`, `feat/*`, `fix/*`, or `hotfix/*` to keep the code organized and ensure smooth merging.
3. [Merge the development branch with the release branch](#create-new-release-branches) for every **MAJOR** or **MINOR** version increment. After `v1.0.0`, ensure that any breaking change increments the **MAJOR** version.




## Release Branches

Release Branches are a main concept in the AgileFlow framework. They are meant to group the product versions and their name is used to determine them.

Their name is composed by `release/` followed by the **MAJOR** and **MINOR** numbers of the versions they contain. Use the current product version number in the form `release/<MAJOR>.<MINOR>`, or for still unversioned projects:

- Use `release/0.1` for new projects.
- Use `release/1.0` or a greater **MAJOR** number if the project is already being used in production.


## Development Branches

Development branches are used for feature additions and bug fixes. They branch off the release branch they intend to merge into. They use the following names depending on their purpose: `dev/*`, `feat/*`, `fix/*`, and `hotfix/*`.


### Development Branches Creation

1. **Generic Development Branches (dev/*)**: Generic development branches for large changes. Specially useful before `1.0.0`.

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

After the contribution is ready, the development branch is merged into its origin Release Branch, preferrably using a [Merge Request](https://docs.gitlab.com/ee/user/project/merge_requests/), a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests), or similar.

## Versioning

Once a development branch is merged into a release branch, AgileFlow calculates the next version number by increasing the patch number from the previous tag in the branch upon validated merges to the release branches. This keeps versioning consistent and transparent, making it easier to track small changes or bug fixes. AgileFlow enforces strict [Semantic Versioning](https://semver.org), which breaks down version numbers as follows:

- **Major Versions (X.0.0)**: Introduces breaking changes or significant shifts in functionality.
- **Minor Versions (0.Y.0)**: Represents new features, improvements, or non-breaking changes.
- **Patch Versions (0.0.Z)**: Denotes bug fixes or minor tweaks.



# Installation

## GitLab CI

Add the following job to your `.gitlab-ci.yml` configuration:

```yml
agileflow:
  image: registry.logickernel.com/kernel/agileflow:0.6.9
  script:
    - agileflow gitlab-ci
  only:
    - /^release\/[0-9]+\.[0-9]+$/
```

