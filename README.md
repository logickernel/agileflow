![AgileFlow icon](./media/agileflow_icon.svg)

# AgileFlow

In today’s fast-paced software development landscape, maintaining clarity, consistency, and efficiency in the release process is essential. AgileFlow is a streamlined yet powerful versioning system, branching strategy, and CI/CD tool designed for software teams of all sizes and projects of any scale.

AgileFlow enforces **Semantic Versioning** and integrates a robust branching strategy for development and deployment. It seamlessly works with **GitLab CI** and **GitHub Actions** CI/CD pipelines to ensure a structured, efficient, and predictable development lifecycle. Whether for small projects or large-scale deployments, AgileFlow is an indispensable tool that simplifies versioning and release management.


- [AgileFlow](#agileflow)
  - [How to Use It](#how-to-use-it)
  - [Install](#install)
    - [Auto Install](#auto-install)
    - [Manual Install](#manual-install)
      - [GitLab](#gitlab)
        - [GitLab Keys Setup](#gitlab-keys-setup)
      - [GitHub](#github)
        - [GitHub Keys Setup](#github-keys-setup)
  - [Release Branches](#release-branches)
  - [Development Branches](#development-branches)
- [Work in Progress](#work-in-progress)
  - [Versioning](#versioning)
    - [Automated Patch Management](#automated-patch-management)
    - [Main Branch](#main-branch)
  - [Workflow](#workflow)
  - [Version Tagging and Automation](#version-tagging-and-automation)
  - [Managing Breaking Changes](#managing-breaking-changes)
  - [GitLab CI Integration](#gitlab-ci-integration)
  - [GitHub Actions Integration](#github-actions-integration)


## How to Use It

You require repository maintainer or owner equivalent permissions.

- [Install the AgileFlow tool](#install) in your project. It is recommended to configure the necessary Deploy Keys in the CD/CI engine to automate the tagging and release processes.
- [Create a release branch](#release-branches) using the product's current **MAJOR** and **MINOR** version numbers, e.g. `release/0.1`, `release/1.0`, `release/1.1`, etc.
- [Create development branches](#development-branches) for contributors, following the naming conventions like `feat/*`, `fix/*`, `dev/*`, or `hotfix/*` to keep the code organized and ensure smooth merging.
- [Version](#versioning) each contribution when there’s a merge into a release branch, with the patch number incremented based on the latest identifiable version in the branch.
- **Create New Release Branches** for every **MAJOR** or **MINOR** version increment. After `v1.0.0`, ensure that any breaking change increments the **MAJOR** version.

![AgileFlow workflow example diagram](./media/diagram.jpg)

## Install

AgileFlow can be installed automatically in any software project using a utility script or manually copying the necessary files in the project's directory.

### Auto Install

```bash
/bin/bash -c "$(curl -fsSL https://code.logickernel.com/kernel/agileflow/-/raw/release/0.2/install.sh)"
```

Select the CD/CI engine to view the keys and instructions to set them up in [GitLab](#gitlab-keys-setup) or [GitHub](#github-keys-setup). If completed successfully, CD/CI scripts will be created or updated automatically so the engine uses AgileFlow to version the product.

### Manual Install

#### GitLab

<details>
<summary>Click to expand</summary>


##### GitLab Keys Setup

The following instructions will allow the CD/CI scripts to automatically version and push the corresponding tag to the GitLab repository.


1. Go to your project's Settings > Repository > Deploy Keys
2. Add the public key as a deploy key making sure to grant it write access
3. Go to your project's Settings > CI/CD > Variables
4. Add a new variable called AGILEFLOW_KEY with type "file" and paste the generated private key

</details>

#### GitHub

<details>
<summary>Click to expand</summary>

##### GitHub Keys Setup

The following instructions will allow the CD/CI scripts to automatically version and push the corresponding tag to the GitHub repository.

1. Go to your repository's settings
2. Add the public key as a deploy key
3. Go to your repository's settings > Secrets
4. Add a new secret called AGILEFLOW_KEY_BASE64 and paste the private key

</details>

## Release Branches

Release Branches are a main concept in the AgileFlow framework. They are meant to group the product versions. Their name is composed by `release/` followed by the **MAJOR** and **MINOR** numbers of the versions they contain. Use the current product version number in the form `release/<MAJOR>.<MINOR>`, or for still unversioned projects:

- Use `release/0.1` for new projects.
- Use `release/1.0` or a greater **MAJOR** number if the project is already being used in production.

Once the tool is [installed](#install), you can use the following command to create the first release branch or to increase the **MAJOR** or **MINOR** numbers.

```bash
# Create the first release for your project or perform a minor release
./agileflow release

# Create the first release for your project or perform a major release
./agileflow release --major
```

> Hint: You can use the flag `--print` to only show the next release calculated.


## Development Branches

Development branches are used for feature additions and bug fixes. They branch off the release branch they intend to merge into and follow these naming conventions:
  
1. **Generic Development Branches (`dev/*`)**: Generic development branches for large changes. Specially useful before `1.0.0`.

```bash
# Create a Generic Development Branch
git checkout -b dev/generic-development-branch-name
```

2. **Feature Branches (`feat/*`)**: For developing new features. Merges back into the corresponding release branch when features are ready. Example: `feat/new-login`.

```bash
# Create a Feature Branch
git checkout -b feat/feature-branch-name
```

3. **Bug Fix Branches (`fix/*`)**: For fixing bugs. These are also merged into the relevant release branch. Example: `fix/login-error`.

```bash
# Create a Bug Fix Branch
git checkout -b fix/bug-fix-branch-name
```

4. **Hotfix Branches (`hotfix/*`)**: For urgent fixes in production. They allow applying critical patches without interfering with other in-progress development. Once resolved, these branches are merged back into their release branch, typically after the release has already been finalized.

   Merging strategies like **cherry-picking** or **rebasing** must be used to apply these fixes cleanly into current branches.

```bash
# Create a Hotfix Branch
git checkout -b hotfix/hotfix-branch-name
```


After the contribution is ready, the development branch is merged into it's origin Release Branch, preferrably using a [Merge Request](https://docs.gitlab.com/ee/user/project/merge_requests/), a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests), or similar.

## Versioning

Create a new version every time there's a merge into a release branch. AgileFlow enforces strict [Semantic Versioning](https://semver.org), which breaks down version numbers as follows:

- **Major Versions (X.0.0)**: Introduces breaking changes or significant shifts in functionality.
- **Minor Versions (0.Y.0)**: Represents new features, improvements, or non-breaking changes.
- **Patch Versions (0.0.Z)**: Denotes bug fixes or minor tweaks.

### Automated Patch Management

Patches are incremented automatically upon validated merges to the release branches. This keeps versioning consistent and transparent, making it easier to track small changes or bug fixes.

---

# Work in Progress

### Main Branch

The **main** branch represents the latest stable version of the software:
- All validated changes from the release branches are merged here.
- The main branch always contains the most recent production-ready version.
- Version tags (`vX.Y.Z`) are automatically generated when changes from the release branch are merged into `main`.


Once installed, AgileFlow can be used to automatically manage the versioning, branching, and deployment processes.

## Workflow

1. **Starting a New Release**:
   - Create a release branch: for example, `release/0.1`.
   - Develop features (`feat/*`) and fixes (`fix/*`) in separate branches, merging them back into the release branch.
  
2. **Developing & Testing**:
   - Use CI pipelines to validate each feature or bug fix merge into `release/X.Y`.
  
3. **Validating & Tagging**:
   - Once all changes in the release branch are stable, the `main` branch is updated, and the version tag (`vX.Y.0`) is generated.

4. **Handling Hotfixes**:
   - If urgent issues arise post-release, create a `hotfix/*` branch. These branches are merged back using **cherry-picking** or **rebasing** and can be merged into other release branches if necessary.

## Version Tagging and Automation

AgileFlow uses CI/CD scripts to automate version tagging:
- It ensures the patch version (`Z`) is incremented automatically with each validated change.
- Merges into `release/X.Y` result in version tags (`vX.Y.Z`) being created automatically, ensuring that every change is traceable and versioned appropriately.

## Managing Breaking Changes

When significant, backward-incompatible changes are introduced:
- A new major release branch (`release/2.0`) is created.
- Older release branches continue to be maintained for minor updates or patches, ensuring stability until the deprecation of older versions is necessary.

## GitLab CI Integration

To integrate AgileFlow into GitLab, follow these steps:

1. Add the `AgileFlow` script to your repository (see installation above).
2. Add a GitLab CI/CD job to execute the `AgileFlow` script in your `.gitlab-ci.yml` file:
      
    ```yaml
    stages:
        - tagging

    AgileFlow:
        stage: tagging
        script:
        - ./agileflow tag --key ${AGILEFLOW_KEY}
        only:
        - /^release\/[0-9]+\.[0-9]+$/
    ```

3. Ensure you store the deploy key as a **file** in the GitLab CI/CD variables.

## GitHub Actions Integration

To integrate AgileFlow with GitHub Actions:

1. Add the `AgileFlow` script to your repository (see installation above).
2. Create a GitHub Actions workflow to execute the `AgileFlow` script in your `.github/workflows/tag.yml`:

    ```yaml
    name: AgileFlow Tag Version

    on:
      push:
        branches:
          - 'release/*'

    jobs:
      tag_version:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          - name: Run AgileFlow
            run: ./agileflow tag --key ${{ secrets.AGILEFLOW_KEY }}
    ```

3. Ensure you store the deploy key in your GitHub repository secrets as `DEPLOY_KEY`.
