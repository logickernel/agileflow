# Features (`feat`)

Introduces new user- or API-facing capabilities without removing existing behavior.

## Examples

```text
feat(api) add user authentication endpoint
feat(cli): implement --dry-run flag for deployments
feat(ui): add dark mode toggle
feat(auth): support OAuth2 login flow
```

## Use for

- New endpoints or API methods
- CLI commands and options
- Configuration options
- UI components and features
- Additive database migrations
- New functionality

## Avoid for

- Internal-only refactors
- Performance tweaks that don't add capability
- Bug fixes

