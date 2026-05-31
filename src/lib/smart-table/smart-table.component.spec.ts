import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { SmartTableComponent } from './smart-table.component';

describe('SmartTableComponent', () => {
  let component: SmartTableComponent<any>;
  let fixture: ComponentFixture<SmartTableComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
