import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerPlaylistComponent } from './player-playlist.component';

describe('PlayerPlaylistComponent', () => {
  let component: PlayerPlaylistComponent;
  let fixture: ComponentFixture<PlayerPlaylistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerPlaylistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
