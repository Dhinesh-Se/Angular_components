import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export type PermissionMode = 'all' | 'any' | 'none';

export interface PermissionContext {
  readonly permissions: readonly string[];
  readonly attributes?: Record<string, unknown>;
}

export interface PermissionDecision {
  readonly allowed: boolean;
  readonly missing: readonly string[];
}

export interface PermissionEvaluator {
  canAccess(required: readonly string[], context: PermissionContext, mode: PermissionMode): PermissionDecision;
}

export interface PermissionProvider {
  readonly context$: Observable<PermissionContext>;
}

export const PERMISSION_EVALUATOR = new InjectionToken<PermissionEvaluator>('PERMISSION_EVALUATOR');
