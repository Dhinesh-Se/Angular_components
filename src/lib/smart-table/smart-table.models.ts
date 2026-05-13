import { TemplateRef } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';

export interface SmartTableColumn<T = Record<string, unknown>> {
  readonly key: keyof T & string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly cellTemplate?: TemplateRef<{ $implicit: T; value: unknown }>;
  readonly valueGetter?: (row: T) => unknown;
}

export interface SmartTableState {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly sortKey?: string;
  readonly sortDirection: SortDirection;
  readonly filter: string;
  readonly selectedIds: readonly string[];
}

export interface SmartTableConfig<T = Record<string, unknown>> {
  readonly columns: readonly SmartTableColumn<T>[];
  readonly idSelector?: (row: T) => string;
  readonly pageSizeOptions?: readonly number[];
  readonly initialState?: Partial<SmartTableState>;
}
