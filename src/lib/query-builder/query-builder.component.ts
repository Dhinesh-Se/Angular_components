import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, map, shareReplay } from 'rxjs';
import { compileQuery, describeQuery, QueryTargetDialect } from './query-compiler';
import { QueryField, QueryGroup, QueryNode, QueryOperator, QueryRule, isQueryGroup } from './query-builder.models';

const DEFAULT_OPERATORS: readonly QueryOperator[] = ['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte'];
const id = (): string => Math.random().toString(36).slice(2, 10);

@Component({
  selector: 'ent-query-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="vm$ | async as vm">
      <section class="ent-query">
        <ng-container *ngTemplateOutlet="groupTemplate; context: { group: vm.root, depth: 0 }"></ng-container>

        <section *ngIf="showSummary" class="ent-query__summary">{{ vm.summary }}</section>
        <pre *ngIf="showPreview">{{ vm.root | json }}</pre>
        <pre *ngIf="showCompiledPreview && vm.compiled">{{ vm.compiled }}</pre>
      </section>
    </div>

    <ng-template #groupTemplate let-group="group" let-depth="depth">
      <fieldset class="ent-query__group" [style.margin-left.rem]="depth">
        <legend>
          <select [ngModel]="group.conjunction" (ngModelChange)="updateGroup(group.id, { conjunction: $event })">
            <option value="and">AND</option><option value="or">OR</option>
          </select>
          <button type="button" (click)="addRule(group.id)">Add rule</button>
          <button type="button" (click)="addGroup(group.id)">Add group</button>
        </legend>

        <div *ngFor="let node of group.rules; trackBy: trackByNode" class="ent-query__node">
          <ng-container *ngIf="isGroup(node); else ruleTemplate">
            <ng-container *ngTemplateOutlet="groupTemplate; context: { group: node, depth: depth + 1 }"></ng-container>
          </ng-container>
          <ng-template #ruleTemplate>
            <div class="ent-query__rule">
              <select [ngModel]="$any(node).field" (ngModelChange)="updateRule($any(node).id, { field: $event, operator: firstOperator($event), value: null })">
                <option *ngFor="let field of fields" [value]="field.key">{{ field.label }}</option>
              </select>
              <select [ngModel]="$any(node).operator" (ngModelChange)="updateRule($any(node).id, { operator: $event })">
                <option *ngFor="let operator of operatorsFor($any(node).field)" [value]="operator">{{ operator }}</option>
              </select>

              <ng-container [ngSwitch]="fieldType($any(node).field)">
                <select *ngSwitchCase="'enum'" [ngModel]="$any(node).value" (ngModelChange)="updateRuleValue($any(node).id, $any(node).field, $event)">
                  <option *ngFor="let option of optionsFor($any(node).field)" [ngValue]="option.value">{{ option.label }}</option>
                </select>
                <select *ngSwitchCase="'boolean'" [ngModel]="$any(node).value" (ngModelChange)="updateRuleValue($any(node).id, $any(node).field, $event)">
                  <option [ngValue]="true">True</option>
                  <option [ngValue]="false">False</option>
                </select>
                <input *ngSwitchDefault [ngModel]="$any(node).value" (ngModelChange)="updateRuleValue($any(node).id, $any(node).field, $event)" [attr.type]="inputType($any(node).field)" />
              </ng-container>

              <button type="button" (click)="removeNode($any(node).id)">Remove</button>
            </div>
          </ng-template>
        </div>
      </fieldset>
    </ng-template>
  `,
  styles: [`.ent-query{display:grid;gap:1rem}.ent-query__group{border:1px solid #cbd5e1;border-radius:.75rem;padding:1rem;background:#f8fafc}.ent-query__group legend{display:flex;gap:.5rem;align-items:center}.ent-query__rule{display:grid;grid-template-columns:1fr 1fr 2fr auto;gap:.5rem;margin:.5rem 0}.ent-query__summary{padding:.75rem;border-radius:.75rem;background:#ecfeff;color:#0f172a;border:1px solid #bae6fd}select,input{border:1px solid #cbd5e1;border-radius:.5rem;padding:.55rem}button{border:0;border-radius:.5rem;background:#334155;color:white;padding:.55rem .75rem}pre{background:#0f172a;color:#dbeafe;padding:1rem;border-radius:.75rem;overflow:auto}`]
})
export class QueryBuilderComponent {
  private readonly rootSubject = new BehaviorSubject<QueryGroup>({ id: 'root', conjunction: 'and', rules: [] });

  @Input() fields: readonly QueryField[] = [];
  @Input() showPreview = false;
  @Input() showSummary = true;
  @Input() showCompiledPreview = false;
  @Input() previewDialect: QueryTargetDialect = 'sql';
  @Input() set query(value: QueryGroup | null) { this.rootSubject.next(value ?? { id: 'root', conjunction: 'and', rules: [] }); }
  @Output() readonly queryChange = new EventEmitter<QueryGroup>();

  readonly vm$ = this.rootSubject.pipe(map(root => ({
    root,
    summary: describeQuery(root, this.fields),
    compiled: root.rules.length > 0 ? compileQuery(root, { dialect: this.previewDialect }) : ''
  })), shareReplay({ bufferSize: 1, refCount: true }));

  isGroup(node: QueryNode): boolean { return isQueryGroup(node); }
  trackByNode(_: number, node: QueryNode): string { return node.id; }
  operatorsFor(fieldKey: string): readonly QueryOperator[] { return this.fieldFor(fieldKey)?.operators ?? DEFAULT_OPERATORS; }
  firstOperator(fieldKey: string): QueryOperator { return this.operatorsFor(fieldKey)[0] ?? 'eq'; }
  fieldType(fieldKey: string): QueryField['type'] { return this.fieldFor(fieldKey)?.type ?? 'string'; }
  inputType(fieldKey: string): string { return this.fieldType(fieldKey) === 'number' ? 'number' : this.fieldType(fieldKey) === 'date' ? 'date' : 'text'; }
  optionsFor(fieldKey: string): readonly { label: string; value: unknown }[] { return this.fieldFor(fieldKey)?.options ?? []; }

  addRule(groupId: string): void {
    const field = this.fields[0];
    if (!field) { return; }
    const defaultValue = field.type === 'boolean' ? false : field.options?.[0]?.value ?? null;
    const rule: QueryRule = { id: id(), field: field.key, operator: this.firstOperator(field.key), value: defaultValue };
    this.mutate(group => this.insertNode(group, groupId, rule));
  }

  addGroup(groupId: string): void {
    this.mutate(group => this.insertNode(group, groupId, { id: id(), conjunction: 'and', rules: [] }));
  }

  updateRule(ruleId: string, patch: Partial<QueryRule>): void {
    this.mutate(group => this.mapNodes(group, node => !isQueryGroup(node) && node.id === ruleId ? { ...node, ...patch } : node));
  }

  updateRuleValue(ruleId: string, fieldKey: string, value: unknown): void {
    const type = this.fieldType(fieldKey);
    const normalized = type === 'number' ? Number(value) : type === 'boolean' ? value === true || value === 'true' : value;
    this.updateRule(ruleId, { value: normalized });
  }

  updateGroup(groupId: string, patch: Partial<Pick<QueryGroup, 'conjunction'>>): void {
    this.mutate(group => this.mapNodes(group, node => isQueryGroup(node) && node.id === groupId ? { ...node, ...patch } : node));
  }

  removeNode(nodeId: string): void {
    if (nodeId === 'root') { return; }
    this.mutate(group => this.removeNodeById(group, nodeId));
  }

  private fieldFor(fieldKey: string): QueryField | undefined {
    return this.fields.find(field => field.key === fieldKey);
  }

  private mutate(project: (group: QueryGroup) => QueryGroup): void {
    const next = project(this.rootSubject.value);
    this.rootSubject.next(next);
    this.queryChange.emit(next);
  }

  private insertNode(group: QueryGroup, groupId: string, node: QueryNode): QueryGroup {
    if (group.id === groupId) { return { ...group, rules: [...group.rules, node] }; }
    return { ...group, rules: group.rules.map(child => isQueryGroup(child) ? this.insertNode(child, groupId, node) : child) };
  }

  private mapNodes(group: QueryGroup, mapper: (node: QueryNode) => QueryNode): QueryGroup {
    const mapped = mapper(group);
    if (!isQueryGroup(mapped)) { return group; }
    return { ...mapped, rules: mapped.rules.map(node => isQueryGroup(node) ? this.mapNodes(node, mapper) : mapper(node)) };
  }

  private removeNodeById(group: QueryGroup, nodeId: string): QueryGroup {
    return { ...group, rules: group.rules.filter(node => node.id !== nodeId).map(node => isQueryGroup(node) ? this.removeNodeById(node, nodeId) : node) };
  }
}
