import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-player-menu',
  templateUrl: './player-menu.component.html',
  styleUrls: ['./player-menu.component.css']
})
export class PlayerMenuComponent implements OnInit {

  more: boolean = false;

  constructor(public router: Router) { }

  ngOnInit() : void{

    window.addEventListener('mousemove', (event) => {
      if(event.x < 120){
        this.more = true;
      }
    })

    const musicMenu = document.getElementById('menu')
    musicMenu.addEventListener('mouseleave', ()=> {
      this.more = false;
    })

    
  }
}
