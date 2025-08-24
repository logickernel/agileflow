# Build System (`build`)

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