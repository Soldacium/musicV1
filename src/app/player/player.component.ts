import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PlayerEngineService } from './playerEngine.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  public constructor(private engServ: PlayerEngineService) {}

  public ngOnInit(): void {
    // this.engServ.createScene(this.rendererCanvas);
    // this.engServ.animate();
  }
}
