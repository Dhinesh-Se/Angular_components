export type QueryOperator = 'eq' | 'neq' | 'contains' | 'startsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
export type QueryConjunction = 'and' | 'or';

export interface QueryField {
  readonly key: string;
  readonly label: string;
  readonly type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  readonly operators?: readonly QueryOperator[];
  readonly options?: readonly { label: string; value: unknown }[];
}

export interface QueryRule {
  readonly id: string;
  readonly field: string;
  readonly operator: QueryOperator;
  readonly value: unknown;
}

export interface QueryGroup {
  readonly id: string;
  readonly conjunction: QueryConjunction;
  readonly rules: readonly QueryNode[];
}

export type QueryNode = QueryRule | QueryGroup;

export function isQueryGroup(node: QueryNode): node is QueryGroup {
  return 'rules' in node;
}
