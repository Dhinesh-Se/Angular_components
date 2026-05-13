import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, shareReplay, startWith, switchAll } from 'rxjs';
import { DynamicFormField, DynamicFormSchema, DynamicFormSubmit } from './dynamic-form.models';

interface DynamicFormVm {
  readonly schema: DynamicFormSchema;
  readonly form: FormGroup<Record<string, FormControl<unknown>>>;
  readonly visibleFields: readonly DynamicFormField[];
}

@Component({
  selector: 'ent-dynamic-form-renderer',
  standalone: true,
  imports: [AsyncPipe, CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="ent-form" *ngIf="vm$ | async as vm" [formGroup]="vm.form" (ngSubmit)="submit(vm)">
      <h2 *ngIf="vm.schema.title">{{ vm.schema.title }}</h2>
      <ng-container *ngFor="let field of vm.visibleFields; trackBy: trackByField">
        <label class="ent-form__field" [attr.for]="field.key">
          <span>{{ field.label }}</span>
          <input *ngIf="field.type === 'text' || field.type === 'number' || field.type === 'date'" [id]="field.key" [type]="field.type" [placeholder]="field.placeholder ?? ''" [formControlName]="field.key" />
          <textarea *ngIf="field.type === 'textarea'" [id]="field.key" [placeholder]="field.placeholder ?? ''" [formControlName]="field.key"></textarea>
          <select *ngIf="field.type === 'select'" [id]="field.key" [formControlName]="field.key">
            <option *ngFor="let option of field.options ?? []" [ngValue]="option.value">{{ option.label }}</option>
          </select>
          <input *ngIf="field.type === 'checkbox'" [id]="field.key" type="checkbox" [formControlName]="field.key" />
          <small *ngIf="field.hint">{{ field.hint }}</small>
          <small class="ent-form__error" *ngIf="vm.form.controls[field.key].invalid && vm.form.controls[field.key].touched">Please review {{ field.label }}.</small>
        </label>
      </ng-container>
      <button type="submit" [disabled]="vm.form.invalid">{{ vm.schema.submitLabel ?? 'Submit' }}</button>
    </form>
  `,
  styles: [`.ent-form{display:grid;gap:1rem;max-width:48rem}.ent-form__field{display:grid;gap:.35rem}input,textarea,select{border:1px solid #cbd5e1;border-radius:.5rem;padding:.65rem}.ent-form__error{color:#dc2626}button{justify-self:start;border:0;border-radius:.5rem;background:#2563eb;color:white;padding:.7rem 1rem}`]
})
/** Schema-driven form renderer for enterprise forms where fields are configured by product metadata or backend contracts. */
export class DynamicFormRendererComponent {
  private readonly schemaSubject = new BehaviorSubject<DynamicFormSchema>({ id: 'empty', fields: [] });
  private readonly initialValueSubject = new BehaviorSubject<Record<string, unknown>>({});

  @Input() set schema(schema: DynamicFormSchema | null) { this.schemaSubject.next(schema ?? { id: 'empty', fields: [] }); }
  @Input() set value(value: Record<string, unknown> | null) { this.initialValueSubject.next(value ?? {}); }
  @Output() readonly valueChange = new EventEmitter<Record<string, unknown>>();
  @Output() readonly formSubmit = new EventEmitter<DynamicFormSubmit>();

  readonly form$ = combineLatest([this.schemaSubject, this.initialValueSubject]).pipe(
    map(([schema, value]) => this.buildForm(schema, value)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest([this.schemaSubject, this.form$]).pipe(
    map(([schema, form]) => form.valueChanges.pipe(startWith(form.getRawValue()), map(value => ({ schema, form, visibleFields: this.visibleFields(schema, value as Record<string, unknown>) })))),
    switchAll(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  submit(vm: DynamicFormVm): void {
    vm.form.markAllAsTouched();
    if (vm.form.invalid) { return; }
    const value = vm.form.getRawValue();
    this.valueChange.emit(value as Record<string, unknown>);
    this.formSubmit.emit({ schemaId: vm.schema.id, value: value as Record<string, unknown> });
  }

  trackByField(_: number, field: DynamicFormField): string { return field.key; }

  private buildForm(schema: DynamicFormSchema, value: Record<string, unknown>): FormGroup<Record<string, FormControl<unknown>>> {
    const controls = schema.fields.reduce<Record<string, FormControl<unknown>>>((accumulator, field) => {
      accumulator[field.key] = new FormControl({ value: value[field.key] ?? field.defaultValue ?? null, disabled: false }, { validators: field.validators ? [...field.validators] : [] });
      return accumulator;
    }, {});

    const form = new FormGroup(controls);
    form.valueChanges.pipe(startWith(form.getRawValue())).subscribe(formValue => {
      schema.fields.forEach(field => {
        const control = form.controls[field.key];
        if (!control || !field.disabledWhen) { return; }
        if (field.disabledWhen(formValue as Record<string, unknown>) && control.enabled) { control.disable({ emitEvent: false }); }
        if (!field.disabledWhen(formValue as Record<string, unknown>) && control.disabled) { control.enable({ emitEvent: false }); }
      });
    });
    return form;
  }

  private visibleFields(schema: DynamicFormSchema, value: Record<string, unknown>): readonly DynamicFormField[] {
    return schema.fields.filter(field => !field.visibleWhen || field.visibleWhen(value));
  }
}
