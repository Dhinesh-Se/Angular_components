import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { DynamicFormRendererComponent } from './dynamic-form-renderer.component';

describe('DynamicFormRendererComponent', () => {
  let component: DynamicFormRendererComponent;
  let fixture: ComponentFixture<DynamicFormRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormRendererComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
