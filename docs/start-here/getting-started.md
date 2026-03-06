# Getting Started

## Run it now

No installation needed. Run AgileFlow in any git repository:

```bash
npx @logickernel/agileflow
```

This is a read-only preview — it never creates tags or modifies anything.

### Understanding the output

```
Commits since current version (3):
  a1b2c3d feat: add dark mode
  d4e5f6a fix: resolve login timeout
  7g8h9i0 docs: update README

Current version: v1.4.2
New version:     v1.5.0

Changelog:

### Features
- add dark mode

### Bug fixes
- resolve login timeout
```

- **Current version** — the highest semver tag found in the commit history
- **New version** — calculated from the commit types since that tag
- **Changelog** — grouped by commit type; `docs`, `chore`, and `style` commits are omitted from the changelog but still analyzed for versioning

If all commits since the last tag are `docs`, `chore`, `style`, or other non-bumping types, AgileFlow prints `no bump needed` and skips tag creation.

### Starting from scratch

No version tags yet? AgileFlow starts from `v0.0.0`:

```bash
git commit -m "feat: initial project setup"
npx @logickernel/agileflow
# New version: v0.1.0
```

### Creating v1.0.0

`v1.0.0` signals your first stable release. Create it manually when you're ready:

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

After `v1.0.0`, breaking changes bump the major version (e.g., `v2.0.0`). Before it, they bump minor (e.g., `v0.2.0`).

---

## Set up CI/CD

Pick your platform:

- [GitHub Actions](../guides/github-actions.md)
- [GitLab CI](../guides/gitlab-ci.md)
- [Other CI/CD](../guides/other-ci.md)

---

## How version bumps are calculated

AgileFlow picks the highest-priority bump across all commits since the last tag:

| Commit | Example | Before v1.0.0 | v1.0.0 and after |
|--------|---------|---------------|------------------|
| Breaking change | `feat!: redesign API` | minor bump | major bump |
| New feature | `feat: add login` | minor bump | minor bump |
| Bug fix | `fix: resolve crash` | patch bump | patch bump |
| Everything else | `docs: update README` | no bump | no bump |

See [Conventional Commits](../reference/conventional-commits.md) for the full format reference.
