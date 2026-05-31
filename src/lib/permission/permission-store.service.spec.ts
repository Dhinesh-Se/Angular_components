import { TestBed } from '@angular/core/testing';
import { PermissionStore } from './permission-store.service';

describe('PermissionStore', () => {
  let store: PermissionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PermissionStore);
  });

  it('should start with empty permissions', () => {
    let ctx: any;
    store.context$.subscribe(c => (ctx = c));
    expect(ctx.permissions).toEqual([]);
  });

  it('should set permissions', () => {
    store.setPermissions(['read']);
    let ctx: any;
    store.context$.subscribe(c => (ctx = c));
    expect(ctx.permissions).toContain('read');
  });
});
