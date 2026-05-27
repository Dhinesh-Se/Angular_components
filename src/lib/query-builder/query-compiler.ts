import { QueryConjunction, QueryField, QueryGroup, QueryNode, QueryOperator, QueryRule, isQueryGroup } from './query-builder.models';

export type QueryTargetDialect = 'sql' | 'mongo' | 'odata';

export interface QueryCompileOptions {
  readonly dialect: QueryTargetDialect;
  readonly fieldMap?: Readonly<Record<string, string>>;
}

const OPERATOR_SQL: Readonly<Record<QueryOperator, string>> = {
  eq: '=',
  neq: '!=',
  contains: 'LIKE',
  startsWith: 'LIKE',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  in: 'IN'
};

export function compileQuery(group: QueryGroup, options: QueryCompileOptions): string {
  const fieldMap = options.fieldMap ?? {};
  if (options.dialect === 'sql') {
    return compileSqlGroup(group, fieldMap);
  }
  if (options.dialect === 'mongo') {
    return compileMongoGroup(group, fieldMap);
  }
  return compileODataGroup(group, fieldMap);
}

export function describeQuery(group: QueryGroup, fields: readonly QueryField[]): string {
  return describeGroup(group, fields);
}

function compileSqlGroup(group: QueryGroup, fieldMap: Readonly<Record<string, string>>): string {
  const conjunction = group.conjunction.toUpperCase();
  const nodes = group.rules.map(node => isQueryGroup(node) ? `(${compileSqlGroup(node, fieldMap)})` : compileSqlRule(node, fieldMap));
  return nodes.join(` ${conjunction} `);
}

function compileSqlRule(rule: QueryRule, fieldMap: Readonly<Record<string, string>>): string {
  const field = fieldMap[rule.field] ?? rule.field;
  if (rule.operator === 'in' && Array.isArray(rule.value)) {
    return `${field} IN (${rule.value.map(value => sqlValue(value)).join(', ')})`;
  }
  if (rule.operator === 'contains') {
    return `${field} LIKE ${sqlValue(`%${String(rule.value ?? '')}%`)}`;
  }
  if (rule.operator === 'startsWith') {
    return `${field} LIKE ${sqlValue(`${String(rule.value ?? '')}%`)}`;
  }
  return `${field} ${OPERATOR_SQL[rule.operator]} ${sqlValue(rule.value)}`;
}

function compileMongoGroup(group: QueryGroup, fieldMap: Readonly<Record<string, string>>): string {
  const operator = group.conjunction === 'and' ? '$and' : '$or';
  return `{ ${operator}: [${group.rules.map(node => isQueryGroup(node) ? compileMongoGroup(node, fieldMap) : compileMongoRule(node, fieldMap)).join(', ')}] }`;
}

function compileMongoRule(rule: QueryRule, fieldMap: Readonly<Record<string, string>>): string {
  const field = fieldMap[rule.field] ?? rule.field;
  const value = jsonValue(rule.value);
  switch (rule.operator) {
    case 'eq': return `{ ${field}: ${value} }`;
    case 'neq': return `{ ${field}: { $ne: ${value} } }`;
    case 'contains': return `{ ${field}: { $regex: ${jsonValue(String(rule.value ?? ''))}, $options: 'i' } }`;
    case 'startsWith': return `{ ${field}: { $regex: ${jsonValue(`^${String(rule.value ?? '')}`)}, $options: 'i' } }`;
    case 'gt': return `{ ${field}: { $gt: ${value} } }`;
    case 'gte': return `{ ${field}: { $gte: ${value} } }`;
    case 'lt': return `{ ${field}: { $lt: ${value} } }`;
    case 'lte': return `{ ${field}: { $lte: ${value} } }`;
    case 'in': return `{ ${field}: { $in: ${jsonValue(Array.isArray(rule.value) ? rule.value : [rule.value])} } }`;
  }
}

function compileODataGroup(group: QueryGroup, fieldMap: Readonly<Record<string, string>>): string {
  const joiner = ` ${group.conjunction} `;
  return group.rules.map(node => isQueryGroup(node) ? `(${compileODataGroup(node, fieldMap)})` : compileODataRule(node, fieldMap)).join(joiner);
}

function compileODataRule(rule: QueryRule, fieldMap: Readonly<Record<string, string>>): string {
  const field = fieldMap[rule.field] ?? rule.field;
  const value = oDataValue(rule.value);
  switch (rule.operator) {
    case 'contains': return `contains(${field}, ${value})`;
    case 'startsWith': return `startswith(${field}, ${value})`;
    case 'in': {
      const values = Array.isArray(rule.value) ? rule.value.map(item => oDataValue(item)).join(', ') : oDataValue(rule.value);
      return `${field} in (${values})`;
    }
    default: return `${field} ${rule.operator} ${value}`;
  }
}

function describeGroup(group: QueryGroup, fields: readonly QueryField[]): string {
  const joiner = group.conjunction === 'and' ? ' AND ' : ' OR ';
  return group.rules.map(node => isQueryGroup(node) ? `(${describeGroup(node, fields)})` : describeRule(node, fields)).join(joiner);
}

function describeRule(rule: QueryRule, fields: readonly QueryField[]): string {
  const label = fields.find(field => field.key === rule.field)?.label ?? rule.field;
  return `${label} ${friendlyOperator(rule.operator)} ${friendlyValue(rule.value)}`;
}

function friendlyOperator(operator: QueryOperator): string {
  return {
    eq: 'is', neq: 'is not', contains: 'contains', startsWith: 'starts with', gt: '>', gte: '>=', lt: '<', lte: '<=', in: 'in'
  }[operator];
}

function friendlyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => String(item)).join(', ')}]`;
  }
  return String(value ?? 'null');
}

function sqlValue(value: unknown): string {
  if (typeof value === 'number') { return String(value); }
  if (typeof value === 'boolean') { return value ? 'TRUE' : 'FALSE'; }
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function jsonValue(value: unknown): string {
  return JSON.stringify(value);
}

function oDataValue(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}
