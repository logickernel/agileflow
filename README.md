![Agileflow icon](./media/agileflow_icon.svg)

# **Agileflow**

In the fast-paced world of software development, maintaining clarity, consistency, and efficiency in the release process is crucial. Agileflow is a robust yet simple versioning system, branching strategy, and CI/CD tool designed for all types of software and technology projects.

Agileflow enforces [Semantic Versioning](https://semver.org), employs a robust branching strategy for development and deployment, and integrates seamlessly with [GitLab CI](https://docs.gitlab.com/ee/ci/) and [GitHub Actions](https://github.com/features/actions) CI/CD pipelines. It ensures a structured and efficient development lifecycle, making Agileflow an essential tool for both small projects and large-scale software deployments.

## **Core Principles**

Agileflow provides structure through its core principles:

- **Strict Versioning System**: Agileflow strictly follows [Semantic Versioning](#versioning), simplifying release management.
- **Clear Release Strategy**: Releases are tagged for development iterations and feature releases post `v1.0.0`.
- **Release Branches**: Each major and minor version is represented by a dedicated [release branch](#release-branches) (e.g., `release/0.1`, `release/1.0`, `release/2.0`).
- **Development Branches**: Developers contribute through branches like `feat/*`, `fix/*`, `dev/*`, or `hotfix/*`, ensuring code organization and efficient merging.

Agileflow streamlines the workflow, ensuring that every branch and version tag has a clear purpose and aligns with semantic versioning rules.

![Agileflow workflow example](./media/example_diagram.png)

---

## **Versioning**

Agileflow enforces strict [Semantic Versioning](https://semver.org), which breaks down version numbers as follows:
- **Major Versions (X.0.0)**: Introduces breaking changes or significant shifts in functionality.
- **Minor Versions (0.Y.0)**: Represents new features, improvements, or non-breaking changes.
- **Patch Versions (0.0.Z)**: Denotes bug fixes or minor tweaks. Patch versions are automatically incremented within the release branches to reduce manual intervention.

### **Automated Patch Management**

Patches are incremented automatically upon validated merges to the release branches. This keeps versioning consistent and transparent, making it easier to track small changes or bug fixes.

---

## **Branching Strategy**

Agileflow's branching model ensures that development and bug fixes are handled in a structured, scalable way.

### **Release Branches**

- **`release/X.Y`** branches represent each major and minor version.
- These branches are created by maintainers and are **protected** to ensure stability.
- Code is merged into these branches via merge requests or pull requests to prevent accidental or unvalidated changes.
  
Examples:
- `release/0.1` for the first release iteration.
- `release/1.0` for the first stable feature release.
- `release/1.20` for a significant feature set under the same major version.

### **Development Branches**

Development branches are used for feature additions and bug fixes. They branch off the release branch they intend to merge into and follow these naming conventions:
  
1. **Feature Branches (`feat/*`)**: For developing new features. Merges back into the corresponding release branch when features are ready.
    - Example: `feat/new-login`.

2. **Bug Fix Branches (`fix/*`)**: For fixing bugs. These are also merged into the relevant release branch.
    - Example: `fix/login-error`.

3. **Hotfix Branches (`hotfix/*`)**: For urgent fixes in production. They allow applying critical patches without interfering with other in-progress development. Once resolved, these branches are merged back into their release branch, typically after the release has already been finalized, preventing any further contributions.
    - Merging strategies like **cherry-picking** or **rebasing** can be used to apply these fixes cleanly into other branches if necessary.

4. **Development Branches (`dev/*`)**: Temporary development branches for large changes that are eventually merged into `feat/*` or `release/*` branches.

---

### **Main Branch**

The **main** branch represents the latest stable version of the software:
- All validated changes from the release branches are merged here.
- The main branch always contains the most recent production-ready version.
- Version tags (`vX.Y.Z`) are automatically generated when changes from the release branch are merged into `main`.

---

## **Tool**

The Agileflow tool manages versioning and branching automatically. Once installed, it integrates with your CI/CD pipelines, ensuring that versioning and branch management follow the strategy defined here.

### **Auto Install**

To install Agileflow in your project directory, run:

```bash
curl -s https://URL/install.sh | bash --init
```

This script initializes Agileflow, creates the required deployment keys, and sets up the project for automated versioning and tagging.

### **Manual Install**

Alternatively, you can manually download and set up Agileflow by running:

```bash
curl https://code.logickernel.com/kernel/agileflow/-/raw/release/0.1/agileflow?ref_type=heads
chmod a+x agileflow
```

Once installed, Agileflow can be used to automatically manage the versioning, branching, and deployment processes.

---

## **Workflow**

1. **Starting a New Release**:
   - Create a release branch: for example, `release/0.1`.
   - Develop features (`feat/*`) and fixes (`fix/*`) in separate branches, merging them back into the release branch.
  
2. **Developing & Testing**:
   - Use CI pipelines to validate each feature or bug fix merge into `release/X.Y`.
  
3. **Validating & Tagging**:
   - Once all changes in the release branch are stable, the `main` branch is updated, and the version tag (`vX.Y.0`) is generated.

4. **Handling Hotfixes**:
   - If urgent issues arise post-release, create a `hotfix/*` branch. These branches are merged back using **cherry-picking** or **rebasing** and can be merged into other release branches if necessary.

---

## **Version Tagging and Automation**

Agileflow uses CI/CD scripts to automate version tagging:
- It ensures the patch version (`Z`) is incremented automatically with each validated change.
- Merges into `release/X.Y` result in version tags (`vX.Y.Z`) being created automatically, ensuring that every change is traceable and versioned appropriately.

---

## **Managing Breaking Changes**

When significant, backward-incompatible changes are introduced:
- A new major release branch (`release/2.0`) is created.
- Older release branches continue to be maintained for minor updates or patches, ensuring stability until the deprecation of older versions is necessary.

---

## **GitLab CI Integration**

To integrate Agileflow into GitLab, follow these steps:

1. Add the `agileflow` script to your repository (see installation above).
2. Add a GitLab CI/CD job to execute the `agileflow` script in your `.gitlab-ci.yml` file:
      
    ```yaml
    stages:
      - tag

    tag_version:
      stage: tag
      script:
        - ./agileflow tag --key $AGILEfLOW_KEY
    ```

3. Ensure you store the deploy key as a **file** in the GitLab CI/CD variables.

---

## **GitHub Actions Integration**

To integrate Agileflow with GitHub Actions:

1. Add the `agileflow` script to your repository (see installation above).
2. Create a GitHub Actions workflow to execute the `agileflow` script in your `.github/workflows/tag.yml`:

    ```yaml
    name: Tag Version

    on:
      push:
        branches:
          - 'release/*'

    jobs:
      tag_version:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          - name: Run Agileflow
            run: ./agileflow tag --key ${{ secrets.AGILEfLOW_KEY }}
    ```

3. Ensure you store the deploy key in your GitHub repository secrets as `DEPLOY_KEY`.
