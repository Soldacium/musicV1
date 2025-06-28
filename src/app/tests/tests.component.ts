import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TestsEngineService } from './testsEngine.service';
import { analyze, guess } from 'web-audio-beat-detector';
import { MusicServiceService } from '../services/music-service.service';
@Component({
  selector: 'app-tests',
  templateUrl: './tests.component.html',
  styleUrls: ['./tests.component.scss'],
})
export class TestsComponent implements OnInit {
  public constructor(
    private engServ: TestsEngineService,
    private musicService: MusicServiceService
  ) {}

  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  @ViewChild('audio', { static: true })
  public audio: ElementRef<HTMLAudioElement>;

  canvas2d: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  width = 500;
  height = 200;

  analyser;
  dataArray: Uint8Array;
  bufferLength;
  audioCtx: AudioContext = new AudioContext();
  gainNode: GainNode;
  audioSrc =
    'https://raw.githubusercontent.com/Soldacium/musicmusic/master/circus2/02-blue_dot.mp3';

  loading = true;

  public ngOnInit(): void {
    this.canvas2d = document.querySelector('#renderCanvas');

    this.setSubscribtions();

    this.engServ.init(this.canvas2d);
    this.engServ.animate();

    this.gainNode = this.audioCtx.createGain();
    this.audio.nativeElement.crossOrigin = 'anonymous';
    this.audio.nativeElement.volume = 0.1;
    this.audioContext(this.audio.nativeElement);
  }

  setSubscribtions() {
    this.musicService.changedSong.subscribe((song) => {
      console.log(song);
      this.play(song);
    });

    this.musicService.pausedSong.subscribe(() => {
      this.pauseAudio();
    });

    this.musicService.unpausedSong.subscribe(() => {
      this.unpauseAudio();
    });
  }

  fetch(url, resolve) {
    const combinedUrl = 'https://cors-anywhere.herokuapp.com/' + url;
    const request = new XMLHttpRequest();
    request.open('GET', combinedUrl, true);
    // console.log(this.audioCtx);
    this.loading = true;

    request.setRequestHeader('Access-Control-Allow-Origin', '*');
    request.setRequestHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    request.setRequestHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, PUT, DELETE, OPTIONS'
    );

    request.responseType = 'arraybuffer';
    request.onload = () => {
      const audioData = request.response;
      console.log(this.audioSrc);
      console.log(audioData);
      this.audioCtx.decodeAudioData(
        audioData,
        (buffer) => {
          const source = this.audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.audioCtx.destination);
          source.loop = false;

          this.audio.nativeElement.onended = () => {
            this.nextSong();
          };

          analyze(buffer).then((tempo) => {
            console.log(tempo);
            this.setupBeat(tempo);
            this.engServ.playing = true;
            this.loading = false;
            this.audioCtx.resume();
            this.audio.nativeElement.play();
          });
        },
        this.onDecodeBufferError
      );
    };
    request.send();
  }
  onSuccess(request) {
    const audioData = request.response;
  }
  onDecodeBufferError(e) {
    console.log('Error decoding buffer: ' + e.message);
  }

  setupBeat(tempo) {
    this.engServ.beatTime = (1 / (tempo / 60)) * 1000;
    console.log(this.engServ.beatTime);
    const hue = 340 / 360;
    const saturation = 100 / 100;
    const luminosity = 50 / 100;
    this.engServ.beatColors = [
      [hue, saturation, luminosity],
      [220 / 360, saturation, luminosity],
      [270 / 360, saturation, luminosity],
    ];
    this.engServ.play();
  }

  logTempo(tempo) {
    setTimeout(() => {
      this.logTempo(tempo);
    }, (1 / (tempo / 60)) * 1000);
  }
  play(song) {
    this.audio.nativeElement.src = song.path;
    this.engServ.playing = false;
    this.fetch(song.path, this.onSuccess); // https://cors-anywhere.herokuapp.com/
    /*
    const combinedUrl = 'https://cors-anywhere.herokuapp.com/' + song.path;
    fetch(combinedUrl, {
      credentials: 'include',
      method: 'GET',
      mode: 'cors',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3000/',
        'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods' : 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
      }),
  })
  .then(response => {
    response.headers
    console.log(response)
      return response.text();
  })
  */
  }
  pauseAudio() {
    this.engServ.playing = false;
    this.audio.nativeElement.pause();
  }
  unpauseAudio() {
    this.audio.nativeElement.play();
    const audioBuffer = this.audioCtx.createBuffer(
      2,
      this.audioCtx.sampleRate * 314,
      this.audioCtx.sampleRate
    );

    analyze(audioBuffer).then((tempo) => {
      console.log(tempo);
    });
  }

  nextSong() {
    this.musicService.songEnd();
  }

  audioContext(audioSource) {
    const source = this.audioCtx.createMediaElementSource(audioSource);
    this.analyser = this.audioCtx.createAnalyser();

    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.analyser.fftSize = 512;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    console.log(this.dataArray.buffer);

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.analyser.getByteFrequencyData(this.dataArray);
    this.engServ.getMusicData(this.dataArray);
  }
}
