import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerNothingComponent } from './player-nothing.component';

describe('PlayerNothingComponent', () => {
  let component: PlayerNothingComponent;
  let fixture: ComponentFixture<PlayerNothingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerNothingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerNothingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
