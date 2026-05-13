# Contributing

Thank you for helping improve `@dhinesh-se/angular-components`. This project is intended to be open source, reusable, and safe for enterprise Angular applications.

## Development setup

```bash
npm install
npm run build
npm run pack:dry-run
```

If the repository has a committed `package-lock.json`, prefer `npm ci` in CI and release pipelines.

## Contribution workflow

1. Fork the repository.
2. Create a feature branch from the default branch.
3. Keep changes focused and add or update documentation when public APIs change.
4. Run the available verification commands before opening a pull request.
5. Open a pull request with a clear summary, testing notes, and screenshots for visible UI changes.

## Coding guidelines

- Keep components standalone and reusable across feature modules, shells, and micro-frontends.
- Keep business-specific rules in application adapters rather than inside shared UI primitives.
- Prefer immutable inputs, typed public models, and observable view-models.
- Preserve `ChangeDetectionStrategy.OnPush` for reusable components unless there is a documented reason to change it.
- Avoid committing generated outputs such as `dist/`, coverage reports, logs, and package tarballs.

## Commit and release notes

Use clear commit messages that explain what changed. For user-facing changes, update `CHANGELOG.md` under the `Unreleased` section.
