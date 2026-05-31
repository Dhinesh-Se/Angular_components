import { Directive, DestroyRef, EmbeddedViewRef, Inject, inject, Input, Optional, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, combineLatest, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DefaultPermissionEvaluator, PermissionStore } from './permission-store.service';
import { PERMISSION_EVALUATOR, PermissionDecision, PermissionEvaluator, PermissionMode } from './permission.models';

interface PermissionViewContext {
  $implicit: PermissionDecision;
  decision: PermissionDecision;
}

/**
 * Structural directive for entitlement-aware rendering.
 * Example: <button *entHasPermission="['invoice.approve']; mode: 'all'; else denied">Approve</button>
 */
@Directive({ selector: '[entHasPermission]', standalone: true })
export class PermissionDirective {
  private readonly requiredSubject = new Subject<readonly string[]>();
  private readonly modeSubject = new Subject<PermissionMode>();
  private fallbackTemplate?: TemplateRef<PermissionViewContext>;
  private allowedView?: EmbeddedViewRef<PermissionViewContext>;
  private deniedView?: EmbeddedViewRef<PermissionViewContext>;
  private readonly destroyRef = inject(DestroyRef);

  @Input() set entHasPermission(required: string | readonly string[]) {
    this.requiredSubject.next(Array.isArray(required) ? required : [required]);
  }

  @Input('entHasPermissionMode') set mode(mode: PermissionMode) {
    this.modeSubject.next(mode ?? 'all');
  }

  @Input('entHasPermissionElse') set fallback(template: TemplateRef<PermissionViewContext> | undefined) {
    this.fallbackTemplate = template;
  }

  constructor(
    private readonly templateRef: TemplateRef<PermissionViewContext>,
    private readonly viewContainer: ViewContainerRef,
    private readonly permissionStore: PermissionStore,
    private readonly defaultEvaluator: DefaultPermissionEvaluator,
    @Optional() @Inject(PERMISSION_EVALUATOR) private readonly customEvaluator: PermissionEvaluator | null,
  ) {
    const evaluator = this.customEvaluator ?? this.defaultEvaluator;

    combineLatest([
      this.requiredSubject.pipe(startWith([] as readonly string[])),
      this.modeSubject.pipe(startWith('all' as PermissionMode)),
    ]).pipe(
      switchMap(([required, mode]) => this.permissionStore.selectDecision(required, mode, evaluator)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((decision: PermissionDecision) => this.render(decision));
  }

  private render(decision: PermissionDecision): void {
    this.viewContainer.clear();
    const context = { $implicit: decision, decision };

    if (decision.allowed) {
      this.allowedView = this.viewContainer.createEmbeddedView(this.templateRef, context);
      this.allowedView.rootNodes.forEach((node: unknown) => {
        if (node instanceof HTMLElement) {
          node.setAttribute('data-ent-permission', 'allowed');
          node.setAttribute('title', decision.matched.length > 0 ? `Matched: ${decision.matched.join(', ')}` : 'Allowed');
        }
      });
      return;
    }

    if (this.fallbackTemplate) {
      this.deniedView = this.viewContainer.createEmbeddedView(this.fallbackTemplate, context);
    }
  }
}
