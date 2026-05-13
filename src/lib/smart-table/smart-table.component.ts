import { AsyncPipe, CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, map, shareReplay, switchAll } from 'rxjs';
import { ObservableInput, patchState, toObservable } from '../shared/rxjs-utils';
import { SmartTableColumn, SmartTableConfig, SmartTableState, SortDirection } from './smart-table.models';

interface SmartTableVm<T> {
  readonly columns: readonly SmartTableColumn<T>[];
  readonly rows: readonly T[];
  readonly total: number;
  readonly state: SmartTableState;
  readonly pageSizeOptions: readonly number[];
}

const DEFAULT_STATE: SmartTableState = { pageIndex: 0, pageSize: 10, sortDirection: '', filter: '', selectedIds: [] };

@Component({
  selector: 'ent-smart-table',
  standalone: true,
  imports: [AsyncPipe, CommonModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ent-table" *ngIf="vm$ | async as vm">
      <label class="ent-table__filter">Search <input type="search" [value]="vm.state.filter" (input)="setFilter($any($event.target).value)" /></label>
      <table>
        <thead><tr>
          <th scope="col">Select</th>
          <th *ngFor="let column of vm.columns; trackBy: trackByColumn" scope="col">
            <button type="button" [disabled]="!column.sortable" (click)="toggleSort(column)">{{ column.label }} {{ sortGlyph(vm.state, column) }}</button>
          </th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let row of vm.rows; trackBy: trackByRow">
            <td><input type="checkbox" [checked]="isSelected(vm.state, row)" (change)="toggleSelection(row)" /></td>
            <td *ngFor="let column of vm.columns; trackBy: trackByColumn">
              <ng-container *ngIf="column.cellTemplate; else defaultCell" [ngTemplateOutlet]="column.cellTemplate" [ngTemplateOutletContext]="{ $implicit: row, value: getValue(row, column) }"></ng-container>
              <ng-template #defaultCell>{{ getValue(row, column) }}</ng-template>
            </td>
          </tr>
        </tbody>
      </table>
      <footer class="ent-table__pager">
        <button type="button" (click)="previousPage()" [disabled]="vm.state.pageIndex === 0">Previous</button>
        <span>Page {{ vm.state.pageIndex + 1 }} of {{ pageCount(vm.total, vm.state.pageSize) }}</span>
        <button type="button" (click)="nextPage(vm.total)" [disabled]="vm.state.pageIndex + 1 >= pageCount(vm.total, vm.state.pageSize)">Next</button>
        <select [value]="vm.state.pageSize" (change)="setPageSize(+$any($event.target).value)">
          <option *ngFor="let size of vm.pageSizeOptions" [value]="size">{{ size }}</option>
        </select>
      </footer>
    </section>
  `,
  styles: [`.ent-table{display:grid;gap:1rem}.ent-table__filter{justify-self:end}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e5e7eb;padding:.75rem;text-align:left}th button{background:transparent;border:0;font:inherit;cursor:pointer}.ent-table__pager{display:flex;align-items:center;gap:.75rem;justify-content:flex-end}`]
})
/** Reactive table shell: accepts raw rows and emits UI state so apps can persist, sync, or server-drive table behavior. */
export class SmartTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  private readonly dataInput = new BehaviorSubject<ObservableInput<readonly T[]> | null>([]);
  private readonly configSubject = new BehaviorSubject<SmartTableConfig<T>>({ columns: [] });
  private readonly stateSubject = new BehaviorSubject<SmartTableState>(DEFAULT_STATE);

  @Input() set data(value: ObservableInput<readonly T[]> | null) { this.dataInput.next(value); }
  @Input() set config(value: SmartTableConfig<T> | null) {
    const config = value ?? { columns: [] };
    this.configSubject.next(config);
    this.stateSubject.next({ ...DEFAULT_STATE, ...config.initialState });
  }
  @Output() readonly stateChange = new EventEmitter<SmartTableState>();
  @Output() readonly selectionChange = new EventEmitter<readonly string[]>();

  readonly vm$ = combineLatest([
    this.dataInput.pipe(map(input => toObservable(input, [])), switchAll()),
    this.configSubject,
    this.stateSubject,
  ]).pipe(
    map(([rows, config, state]) => this.createVm(rows, config, state)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getValue(row: T, column: SmartTableColumn<T>): unknown { return column.valueGetter ? column.valueGetter(row) : row[column.key]; }
  trackByColumn(_: number, column: SmartTableColumn<T>): string { return column.key; }
  trackByRow = (_: number, row: T): string => this.configSubject.value.idSelector?.(row) ?? JSON.stringify(row);
  pageCount(total: number, pageSize: number): number { return Math.max(1, Math.ceil(total / pageSize)); }
  sortGlyph(state: SmartTableState, column: SmartTableColumn<T>): string { return state.sortKey === column.key ? (state.sortDirection === 'asc' ? '↑' : state.sortDirection === 'desc' ? '↓' : '') : ''; }
  isSelected(state: SmartTableState, row: T): boolean { return state.selectedIds.includes(this.rowId(row)); }

  setFilter(filter: string): void { this.patch({ filter, pageIndex: 0 }); }
  setPageSize(pageSize: number): void { this.patch({ pageSize, pageIndex: 0 }); }
  previousPage(): void { this.patch({ pageIndex: Math.max(0, this.stateSubject.value.pageIndex - 1) }); }
  nextPage(total: number): void { this.patch({ pageIndex: Math.min(this.pageCount(total, this.stateSubject.value.pageSize) - 1, this.stateSubject.value.pageIndex + 1) }); }

  toggleSort(column: SmartTableColumn<T>): void {
    if (!column.sortable) { return; }
    const current = this.stateSubject.value;
    const nextDirection: SortDirection = current.sortKey !== column.key ? 'asc' : current.sortDirection === 'asc' ? 'desc' : current.sortDirection === 'desc' ? '' : 'asc';
    this.patch({ sortKey: nextDirection ? column.key : undefined, sortDirection: nextDirection });
  }

  toggleSelection(row: T): void {
    const id = this.rowId(row);
    const selectedIds = this.stateSubject.value.selectedIds.includes(id)
      ? this.stateSubject.value.selectedIds.filter(selected => selected !== id)
      : [...this.stateSubject.value.selectedIds, id];
    this.patch({ selectedIds });
    this.selectionChange.emit(selectedIds);
  }

  private createVm(rows: readonly T[], config: SmartTableConfig<T>, state: SmartTableState): SmartTableVm<T> {
    const filtered = this.filterRows(rows, config.columns, state.filter);
    const sorted = this.sortRows(filtered, config.columns, state);
    const start = state.pageIndex * state.pageSize;
    return { columns: config.columns, rows: sorted.slice(start, start + state.pageSize), total: sorted.length, state, pageSizeOptions: config.pageSizeOptions ?? [10, 25, 50] };
  }

  private filterRows(rows: readonly T[], columns: readonly SmartTableColumn<T>[], filter: string): readonly T[] {
    if (!filter.trim()) { return rows; }
    const term = filter.toLowerCase();
    return rows.filter(row => columns.some(column => column.filterable !== false && String(this.getValue(row, column) ?? '').toLowerCase().includes(term)));
  }

  private sortRows(rows: readonly T[], columns: readonly SmartTableColumn<T>[], state: SmartTableState): readonly T[] {
    const column = columns.find(candidate => candidate.key === state.sortKey);
    if (!column || !state.sortDirection) { return rows; }
    return [...rows].sort((left, right) => String(this.getValue(left, column)).localeCompare(String(this.getValue(right, column))) * (state.sortDirection === 'asc' ? 1 : -1));
  }

  private rowId(row: T): string { return this.configSubject.value.idSelector?.(row) ?? JSON.stringify(row); }
  private patch(patch: Partial<SmartTableState>): void {
    const next = patchState(this.stateSubject.value, patch);
    this.stateSubject.next(next);
    this.stateChange.emit(next);
  }
}
