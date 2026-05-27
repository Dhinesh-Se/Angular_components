# Changelog

All notable changes to `@dhinesh-se/angular-components` will be documented in this file.

This project follows semantic versioning where practical: patch releases for fixes, minor releases for backwards-compatible features, and major releases for breaking changes.

## [Unreleased]

## [0.4.0] - 2026-05-27

- Dynamic Form: add section grouping, schema description, and live completion progress.
- Smart Table: add selection summary, clear-selection action, and row click output event.
- Workflow Timeline: add optional completed progress banner (`showProgress`).
- Permission directive/evaluator: add `matched` permissions in decisions and expose allowed-node hints for UX/accessibility.

## [0.3.0] - 2026-05-27

- Enhance `ent-query-builder` UX with type-aware editors for enum and boolean fields.
- Add `showSummary`, `showCompiledPreview`, and `previewDialect` inputs for instant query feedback.
- Auto-generate human-readable summary and compiled dialect preview from the live query AST.

## [0.2.0] - 2026-05-27

- Add Query Compiler utilities (`compileQuery`, `describeQuery`) to convert Query Builder AST into SQL, MongoDB, and OData expressions.
- Export query compiler from public API for library consumers.
- Improve README with backend integration example for the query builder.


## [0.1.0] - 2026-05-13

- Initial Angular library scaffold.
- Add Permission Directive, Workflow Timeline, Smart Table, Dynamic Form Renderer, and Query Builder.
- Add npm publishing documentation.
