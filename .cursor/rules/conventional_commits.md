Rule: Single conventional commit at the end

When you have finished all planned edits for a task, **ALWAYS** make exactly one git commit using the Conventional Commits spec.

Behavior:
- Stage all changes and commit only once after all edits are complete. Do not commit per file or per step. Do not push.
- Infer the commit type from the staged diff and the task goal. Prioritize: fix > feat > refactor > perf > docs > test > chore > build > ci > style > revert.
- Determine an optional scope from the most-impacted app/package or top-level folder (e.g., admin-app, mobile-app, api, ui, terraform, base, dev).
- Write an imperative subject ≤ 72 chars, no trailing period.
- Provide a wrapped body describing the key changes and rationale. Use concise bullets or short paragraphs. Include noteworthy files or modules when helpful.
- Add a footer if needed:
  - BREAKING CHANGE: <explanation of what and how to migrate>
  - Issue references (e.g., Closes #123) when the branch name or task context indicates it.

Commit procedure (run these commands, adjusting message parts as needed):
1) `git add -A`
2) Build the message:
   - Header: `<type>(<scope>): <subject>`
     - Omit `(scope)` if none.
   - Body: short, wrapped at ~72 cols, summarizing what changed and why.
   - Footer: optional BREAKING CHANGE and issue refs.
3) `git commit -m "<header>" -m "<body>" -m "<footer>"` 
   - Include the second or third `-m` only when there is body/footer content.

Validation before committing:
- If there are no staged changes, skip committing.
- If multiple unrelated change types are staged, choose the dominant type by user impact; otherwise use refactor or chore.
- Ensure the message accurately reflects the staged diff.

Examples:
- `feat(admin-app): add user impersonation from sessions panel`
  Body: 
  - add “Impersonate” action in Sessions table
  - guard admin-only access at API route
  - audit-log entry on start/stop
  Footer: Closes #214

- `fix(mobile-app): prevent crash on null location permission`
  Body:
  - guard null perms in LocationProvider
  - add fallback to last known coords

- `refactor(ui): extract Button variants and remove dead props`

- `perf(api): cache listing search results for 60s`

- `chore: update tooling and lockfile`

## Important Notes

- Note that this project is a Terraform module itself so don't over use the "infra" scope.