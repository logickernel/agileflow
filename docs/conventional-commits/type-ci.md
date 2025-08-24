# CI/CD (`ci`)

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