import { AsyncPipe, CommonModule, DatePipe, KeyValuePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, map, shareReplay, switchAll } from 'rxjs';
import { ObservableInput, toObservable } from '../shared/rxjs-utils';
import { WorkflowStep, WorkflowTimelineConfig } from './workflow-timeline.models';

interface TimelineVm {
  readonly steps: readonly WorkflowStep[];
  readonly config: Required<WorkflowTimelineConfig>;
  readonly completedCount: number;
}

const DEFAULT_CONFIG: Required<WorkflowTimelineConfig> = {
  orientation: 'vertical',
  showMetadata: false,
  density: 'comfortable',
};

@Component({
  selector: 'ent-workflow-timeline',
  standalone: true,
  imports: [AsyncPipe, CommonModule, DatePipe, KeyValuePipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ent-timeline" [class.ent-timeline--horizontal]="(vm$ | async)?.config?.orientation === 'horizontal'">
      <ol class="ent-timeline__list" *ngIf="vm$ | async as vm">
        <li class="ent-timeline__item" *ngFor="let step of vm.steps; trackBy: trackByStep" [ngClass]="'is-' + step.status">
          <button class="ent-timeline__marker" type="button" (click)="stepSelected.emit(step)" [attr.aria-label]="step.label + ' status ' + step.status">
            {{ step.status === 'completed' ? '✓' : step.status === 'failed' ? '!' : '•' }}
          </button>
          <article class="ent-timeline__content">
            <header>
              <h3>{{ step.label }}</h3>
              <span class="ent-timeline__status">{{ step.status }}</span>
            </header>
            <p *ngIf="step.description">{{ step.description }}</p>
            <small *ngIf="step.timestamp">{{ step.timestamp | date:'medium' }}</small>
            <small *ngIf="step.actor">Owner: {{ step.actor }}</small>
            <dl *ngIf="vm.config.showMetadata && step.metadata">
              <ng-container *ngFor="let item of step.metadata | keyvalue">
                <dt>{{ item.key }}</dt><dd>{{ item.value }}</dd>
              </ng-container>
            </dl>
          </article>
        </li>
      </ol>
    </section>
  `,
  styles: [`
    .ent-timeline__list{list-style:none;margin:0;padding:0;display:grid;gap:1rem}.ent-timeline--horizontal .ent-timeline__list{grid-auto-flow:column;grid-auto-columns:minmax(12rem,1fr);overflow:auto}.ent-timeline__item{display:grid;grid-template-columns:auto 1fr;gap:.75rem}.ent-timeline__marker{border:0;border-radius:999px;width:2rem;height:2rem;cursor:pointer}.is-completed .ent-timeline__marker{background:#047857;color:white}.is-active .ent-timeline__marker{background:#2563eb;color:white}.is-failed .ent-timeline__marker{background:#dc2626;color:white}.is-pending .ent-timeline__marker,.is-skipped .ent-timeline__marker{background:#e5e7eb}.ent-timeline__content{border:1px solid #e5e7eb;border-radius:.75rem;padding:1rem;background:white}.ent-timeline__content header{display:flex;justify-content:space-between;gap:1rem}.ent-timeline__content h3{margin:0}.ent-timeline__status{text-transform:capitalize;font-size:.8rem;color:#475569}dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem .75rem}`]
})
/** Renders immutable workflow steps and keeps presentation stateless so process orchestration remains in application services. */
export class WorkflowTimelineComponent {
  private readonly stepsInput = new BehaviorSubject<ObservableInput<readonly WorkflowStep[]> | null>([]);
  private readonly configInput = new BehaviorSubject<WorkflowTimelineConfig>({});

  @Input() set steps(value: ObservableInput<readonly WorkflowStep[]> | null) { this.stepsInput.next(value); }
  @Input() set config(value: WorkflowTimelineConfig | null) { this.configInput.next(value ?? {}); }
  @Output() readonly stepSelected = new EventEmitter<WorkflowStep>();

  readonly vm$ = combineLatest([
    this.stepsInput.pipe(map(input => toObservable(input, []))),
    this.configInput,
  ]).pipe(
    map(([steps$, config]) => steps$.pipe(map(steps => ({ steps, config })))),
    // The outer stream swaps cleanly when callers replace an array with an Observable source.
    switchAll(),
    map(({ steps, config }) => ({
      steps,
      config: { ...DEFAULT_CONFIG, ...config },
      completedCount: steps.filter(step => step.status === 'completed').length,
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  trackByStep(_: number, step: WorkflowStep): string { return step.id; }
}
