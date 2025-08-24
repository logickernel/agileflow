# Bug Fixes (`fix`)

Corrects faulty behavior, regressions, crashes, data corruption, or incorrect outputs.

## Examples

```text
fix(auth): handle empty refresh token gracefully
fix(api): correct null pointer exception in user lookup
fix(ui): resolve button click event not firing
fix(db): fix transaction rollback on connection failure
```

## Use for

- Logic errors and bugs
- Off-by-one fixes
- Null handling improvements
- Race condition fixes
- Flaky behavior resolution
- Data validation fixes

## Avoid for

- Refactors that don't change behavior
- Performance improvements
- New features