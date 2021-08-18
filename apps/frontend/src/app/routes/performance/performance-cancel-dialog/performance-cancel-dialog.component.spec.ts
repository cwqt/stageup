import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceCancelDialogComponent } from './performance-cancel-dialog.component';

describe('PerformanceCancelDialogComponent', () => {
  let component: PerformanceCancelDialogComponent;
  let fixture: ComponentFixture<PerformanceCancelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PerformanceCancelDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PerformanceCancelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
