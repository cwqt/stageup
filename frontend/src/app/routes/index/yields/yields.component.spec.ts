import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YieldsComponent } from './yields.component';

describe('YieldsComponent', () => {
  let component: YieldsComponent;
  let fixture: ComponentFixture<YieldsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YieldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
