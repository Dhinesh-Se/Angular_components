export type WorkflowStepStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly status: WorkflowStepStatus;
  readonly timestamp?: Date | string;
  readonly actor?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface WorkflowTimelineConfig {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly showMetadata?: boolean;
  readonly density?: 'comfortable' | 'compact';
}
