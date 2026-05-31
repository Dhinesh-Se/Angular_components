import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { WorkflowTimelineComponent } from './workflow-timeline.component';

describe('WorkflowTimelineComponent', () => {
  let component: WorkflowTimelineComponent;
  let fixture: ComponentFixture<WorkflowTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [WorkflowTimelineComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
