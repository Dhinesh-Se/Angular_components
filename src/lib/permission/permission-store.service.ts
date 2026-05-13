import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged } from 'rxjs';
import { PermissionContext, PermissionDecision, PermissionEvaluator, PermissionMode, PermissionProvider } from './permission.models';

function sameDecision(previous: PermissionDecision, next: PermissionDecision): boolean {
  return previous.allowed === next.allowed && previous.missing.join('|') === next.missing.join('|');
}

@Injectable({ providedIn: 'root' })
export class DefaultPermissionEvaluator implements PermissionEvaluator {
  canAccess(required: readonly string[], context: PermissionContext, mode: PermissionMode): PermissionDecision {
    const granted = new Set(context.permissions);
    const missing = required.filter(permission => !granted.has(permission));
    const allowed = mode === 'all'
      ? missing.length === 0
      : mode === 'any'
        ? required.some(permission => granted.has(permission))
        : missing.length === required.length;

    return { allowed, missing };
  }
}

/**
 * Lightweight permission store that can be hydrated from route resolvers, auth callbacks, or NgRx effects.
 * Keeping it UI-framework agnostic makes the directive reusable across products and micro-frontends.
 */
@Injectable({ providedIn: 'root' })
export class PermissionStore implements PermissionProvider {
  private readonly contextSubject = new BehaviorSubject<PermissionContext>({ permissions: [] });
  readonly context$ = this.contextSubject.asObservable();

  setContext(context: PermissionContext): void {
    this.contextSubject.next({ ...context, permissions: [...context.permissions] });
  }

  setPermissions(permissions: readonly string[]): void {
    this.setContext({ ...this.contextSubject.value, permissions });
  }

  selectDecision(required: readonly string[], mode: PermissionMode, evaluator: PermissionEvaluator): Observable<PermissionDecision> {
    return this.context$.pipe(
      map(context => evaluator.canAccess(required, context, mode)),
      distinctUntilChanged(sameDecision),
    );
  }
}
