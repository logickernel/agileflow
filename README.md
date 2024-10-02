![Agileflow icon](./media/agileflow_icon.svg)

# Agileflow

In the fast-paced world of software development, maintaining clarity, consistency, and efficiency in the release process is crucial. 

Agileflow is a robust yet simple versioning system, branching strategy, and CD/CI tool designed to be used by all types of software and technology projects. 

The versioning rules enforce [Semantic Versioning](https://semver.org), the branching strategy is robust and contemplates development and deployment procedures, and the tool integrates seamlessly with [GitLab CI](https://docs.gitlab.com/ee/ci/) and [GitHub Actions](https://github.com/features/actions) CI/CD pipelines and source control systems, ensuring a structured and efficient development lifecycle.

## Principles

In summary, Agileflow recommends using: 

- A strict [versioning system](#versioning]).
- Releases for iterations of the project during development and feature releases after v1.0.0.
- A [Release Branch](#release-branches) per release naming it after each MAJOR.MINOR version of the code, e.g.: `release/0.1`, `release/0.2`, `release/1.0`, `release/1.20`, etc.
- Developers contribute with code in branches `fix/*`, `feat/*`, `dev/*` or `hotfix/*`

![Agileflow workflow example](./media/example_diagram.png)

### Versioning

Agileflow adheres strictly to [semantic versioning](https://semver.org), with `X` representing major versions, `Y` for minor versions, and `Z` for patches.
- **Automated Patch Management**: Patches are automatically incremented, ensuring consistent and accurate versioning without manual intervention.

### Branching Strategy

#### Release Branches

Represents the major and minor versions. Protected and used for stabilizing features before release. They are usually created and protected by code maintainers.

#### Development Branches

2. **Feature Branches (`feat/*`)**: For developing new functionality. Merge back into the appropriate `release/X.Y`.
3. **Bug Fix Branches (`fix/*`)**: Created for resolving bugs, merged back into the respective `release/X.Y`.
4. **Hotfix Branches (`hotfix/*`)**: For urgent production fixes, providing a mechanism to apply critical patches without risking additional contributions. Merged into their respective `release/X.Y` after the release has been wrapped up and .

#### Main Branch

5. **Main Branch**: Represents the latest, stable version, integrating validated changes from release branches.

### Tool

To implement Agileflow in your project, you need to set up the necessary script to manage versioning and branching automatically. We provide a simple installation script that you can use to get started:

### Auto Install

Run the following command to install Agileflow in your project directory:

```bash
curl -s https://URL/install.sh | bash --init
```

Once installed, the `Agileflow` script will be placed in the project directory and will be used by the CD/CI engine to manage your branching and versioning strategy automatically.


### Manual Install

Download the `agileflow` script and place it in the root directory of your project.

```sh
curl https://code.logickernel.com/kernel/agileflow/-/raw/release/0.1/agileflow?ref_type=heads
chmod a+x agileflow
```

#### GitLab


#### GitHub



### Workflow

1. **Starting a New Release**: 
   - Create a release branch: `release/0.1`.
   - Develop features (`feat/*`) and fixes (`fix/*`) in separate branches.
2. **Developing & Testing**: 
   - Use CI pipelines to validate merges into `release/X.Y`.
3. **Validating & Tagging**: 
   - Once all changes are stable, the `main` branch is updated, and the version tag (`vX.Y.0`) is created.
4. **Handling Hotfixes**: 
   - Use `hotfix/*` branches for urgent issues, merged back using **cherry-picking** or **rebasing**.

### Version Tagging and Automation

The `Agileflow` script automates version tagging:
- It increments patch versions automatically with each validated change.
- Ensures the release branch is always tagged with the latest version.

### Managing Breaking Changes

For backward-incompatible changes, a new major branch (`release/2.0`) is created. Older branches are maintained for minor updates or patches until deprecation.

