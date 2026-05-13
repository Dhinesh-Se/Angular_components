import { ValidatorFn } from '@angular/forms';

export type DynamicFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';

export interface DynamicFormOption {
  readonly label: string;
  readonly value: string | number | boolean;
}

export interface DynamicFormField {
  readonly key: string;
  readonly label: string;
  readonly type: DynamicFieldType;
  readonly defaultValue?: unknown;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly options?: readonly DynamicFormOption[];
  readonly validators?: readonly ValidatorFn[];
  readonly visibleWhen?: (value: Record<string, unknown>) => boolean;
  readonly disabledWhen?: (value: Record<string, unknown>) => boolean;
}

export interface DynamicFormSchema {
  readonly id: string;
  readonly title?: string;
  readonly fields: readonly DynamicFormField[];
  readonly submitLabel?: string;
}

export interface DynamicFormSubmit<TValue extends Record<string, unknown> = Record<string, unknown>> {
  readonly schemaId: string;
  readonly value: TValue;
}
