import { Observable, isObservable, of } from 'rxjs';

/** Accepts either a static value or an Observable value for enterprise shells that hydrate data asynchronously. */
export type ObservableInput<T> = T | Observable<T>;

/** Normalises dynamic component inputs so downstream code can be written with a single reactive contract. */
export function toObservable<T>(value: ObservableInput<T> | null | undefined, fallback: T): Observable<T> {
  if (isObservable(value)) {
    return value;
  }

  return of(value ?? fallback);
}

/** Immutable update helper used by small component stores to keep change detection predictable. */
export function patchState<T extends object>(state: T, patch: Partial<T>): T {
  return { ...state, ...patch };
}
