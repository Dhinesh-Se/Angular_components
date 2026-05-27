# Enterprise Angular Components

[![CI](https://github.com/dhinesh-se/Angular_components/actions/workflows/ci.yml/badge.svg)](https://github.com/dhinesh-se/Angular_components/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@dhinesh-se/angular-components.svg)](https://www.npmjs.com/package/@dhinesh-se/angular-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A reusable Angular library blueprint for enterprise applications. It ships five standalone building blocks that can be imported independently in any feature, shell, or micro-frontend:

1. **Permission Directive** (`entHasPermission`) for policy-aware rendering.
2. **Workflow Timeline** (`ent-workflow-timeline`) for audit trails and process state.
3. **Smart Table** (`ent-smart-table`) for reactive sorting, filtering, paging, and selection.
4. **Dynamic Form Renderer** (`ent-dynamic-form-renderer`) for schema-driven forms.
5. **Query Builder** (`ent-query-builder`) for user-generated filter expressions.

## Architecture principles

- **Standalone Angular APIs**: every directive/component is standalone and tree-shakeable.
- **SOLID**: models, state services, and UI rendering are separated; custom permission evaluation is injected through an `InjectionToken`.
- **Reactive state**: component state is modeled with `BehaviorSubject`, derived with `combineLatest`, and shared with `shareReplay` for efficient OnPush templates.
- **Dynamic rendering**: forms and query rules are generated from schemas rather than hard-coded feature templates.
- **Enterprise extensibility**: all public contracts are exported from `src/public-api.ts`, inputs accept static data or observable sources where useful, and comments document extension points.

## Installation in another Angular workspace

```bash
npm install @dhinesh-se/angular-components
```

If using this repository directly during development:

```bash
npm install
npm run build
```

## Permission Directive

Hydrate permissions at login, from a route resolver, or from a state-management effect:

```ts
constructor(permissionStore: PermissionStore) {
  permissionStore.setPermissions(['invoice.read', 'invoice.approve']);
}
```

Use the directive anywhere a structural directive is valid:

```html
<button *entHasPermission="['invoice.approve']; mode: 'all'; else denied">
  Approve invoice
</button>
<ng-template #denied let-decision="decision">
  Missing: {{ decision.missing.join(', ') }}
</ng-template>
```

Override policy logic by providing `PERMISSION_EVALUATOR` with your own `PermissionEvaluator` implementation.

## Workflow Timeline

```html
<ent-workflow-timeline
  [steps]="workflowSteps$"
  [config]="{ orientation: 'vertical', showMetadata: true }"
  (stepSelected)="openStep($event)" />
```

`steps` can be an array or an `Observable<WorkflowStep[]>`.

## Smart Table

```html
<ent-smart-table
  [data]="customers$"
  [config]="tableConfig"
  (stateChange)="persistTableState($event)"
  (selectionChange)="bulkSelection = $event" />
```

```ts
tableConfig = {
  idSelector: (row: Customer) => row.id,
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'tier', label: 'Tier', filterable: true },
  ],
};
```

## Dynamic Form Renderer

```html
<ent-dynamic-form-renderer
  [schema]="customerSchema"
  [value]="customer"
  (formSubmit)="save($event.value)" />
```

```ts
customerSchema = {
  id: 'customer-onboarding',
  title: 'Customer onboarding',
  submitLabel: 'Create customer',
  fields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'tier', label: 'Tier', type: 'select', options: [{ label: 'Gold', value: 'gold' }] },
  ],
};
```

Fields can declare `visibleWhen` and `disabledWhen` predicates for conditional enterprise forms.

## Query Builder

```html
<ent-query-builder
  [fields]="queryFields"
  [showPreview]="true"
  (queryChange)="filters = $event" />
```

```ts
queryFields = [
  { key: 'status', label: 'Status', type: 'enum', operators: ['eq', 'neq'], options: [{ label: 'Active', value: 'active' }] },
  { key: 'createdAt', label: 'Created at', type: 'date', operators: ['gte', 'lte'] },
];
```

The emitted `QueryGroup` AST can be translated to REST query params, GraphQL filters, or backend-specific search DSLs in an application adapter.

## Project layout

```text
src/lib/permission              Permission store, evaluator, and directive
src/lib/workflow-timeline       Timeline component and workflow contracts
src/lib/smart-table             Table contracts and reactive table component
src/lib/dynamic-form            Form schema contracts and renderer
src/lib/query-builder           Query AST contracts and recursive builder
src/lib/shared                  Small shared RxJS/state helpers
src/public-api.ts               Public exports for consumers
```

## Open-source project

This package is prepared for open-source distribution under the MIT License. Community guidelines, contribution steps, security reporting, and release notes are maintained in:

- [LICENSE](./LICENSE)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SECURITY.md](./SECURITY.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Publishing

Build artifacts are published from `dist/enterprise-components`, not from the repository root. The shortest safe flow is `npm install`, `npm run build`, `npm run pack:dry-run`, `npm run publish:dry-run`, then `npm run publish:public`. See [PUBLISHING.md](./PUBLISHING.md) for the full step-by-step npm login, versioning, dry-run, public/private registry, verification, and CI/CD publishing guide.

## Quality checklist

- Keep feature-specific business rules outside these components.
- Prefer immutable inputs and observable streams for server-driven data.
- Provide adapters at application boundaries for auth, persistence, and backend query translation.
- Add design-system wrappers if your enterprise has a shared token or theming layer.
