import * as THREE from 'three';
import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';
import Delaunator from 'delaunator';
// tslint: disable
@Injectable({ providedIn: 'root' })
export class TestsEngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;


  /*
  private analyser;
  private dataArray: Uint8Array;

  */


  private frameId: number = null;

/**
  FOR BOTH GALAXIES
 */
  private mouseX = 100; private mouseY = 100;
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  count = 0;
  /**
   * FOR GALAXY ORBIT 1
   */




  particles_H;
  /**
   * FOR GALAXY ORBIT 1
   */




  particles_L;

  /**
   *  MINE
   */
  RADIUS = 800;
  LINES = 300;
  DOTS = 4;
  SPREAD = 25;
  speed = 7;

  ballOuter: THREE.Mesh;
  ballInner: THREE.Mesh;

  triangles = [];
  triangles2 = [];
  triangleDepth1 = -1700;
  triangleDepth2 = 1700;
  time = 0;

  shader1 = `
  attribute float scale;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    gl_PointSize = scale * ( 300.0 / - mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;
  }
  `;

  shader2 = `
    uniform vec3 color;

    void main() {

      if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;

      gl_FragColor = vec4( color, 1.0 );
    }
  `;

  highNote = 0;
  lowNote = 0;

  beatData = new Array(60).fill(0);
  beatTime = 0;

  playing = false;

  beatColors: Array<number[]> = [
    [0.83,1,0.5],
    []
  ];






  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document


  }

  init(canvas: HTMLCanvasElement): void {

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 15000 );
    this.camera.position.z = 1000;
    this.camera.position.y = 200;

    this.scene = new THREE.Scene();


    /**
     * Particles for high frequencies
     */

    // let line = new THREE.Line(geometry, material)
    // this.scene.add(line)
    this.particles_H = this.makeOrbit(this.RADIUS, this.LINES, this.DOTS, this.SPREAD, 1, 'rgb(255,255,255)');
    this.scene.add( this.particles_H );

    const radiusLower = (this.RADIUS - this.DOTS * this.SPREAD - 80);
    this.particles_L = this.makeOrbit(radiusLower, this.LINES, this.DOTS, this.SPREAD, 1, 'rgb(255,255,255)');
    this.scene.add( this.particles_L );




    /**
     * BALL
     */

    this.ballOuter = this.makeBall(this.RADIUS * 6, 1, 0, 0, 0, true);
    this.ballInner = this.makeBall(this.RADIUS / 3, 2, 0, 0, 0, true);


    /**
     * TRIANGLE
     */

    this.triangles = this.makeFracture(100, 6000, 6000, this.triangleDepth1, 90);
   // this.triangles2 = this.makeFracture(100,6000,6000,this.triangleDepth2 + 2500,-90)
    /**
     * Renderer
     */


    this.renderer = new THREE.WebGLRenderer(
      { antialias: true,
        canvas,
        } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );


    /*
    var width = 100;
    var height = 100;
    var intensity = 1;
    var rectLight = new THREE.RectAreaLight( 0xffffff, intensity,  width, height );
    rectLight.position.set( 5, 5, 0 );
    rectLight.lookAt( 0, 0, 0 );
    this.scene.add( rectLight )
    */

    // let rectLightHelper = new THREE.RectAreaLightHelper( rectLight );
    // rectLight.add( rectLightHelper );
/**
 *  Adding Listeners
 */

    document.addEventListener( 'mousemove', (event) => {


      this.mouseX = event.clientX - window.innerWidth / 2 ;
      this.mouseY = event.clientY - window.innerHeight / 2 - 300;


    }, false );
    document.addEventListener( 'touchstart', this.onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', this.onDocumentTouchMove, false );

    //

    window.addEventListener( 'resize', this.onWindowResize, false );

  }




  /**
   * MODELS AND FUNCTIONS
   * (cleaner code)
   */

  makeBall(radius: number, detail: number, x: number, y: number, z: number, wireframe: boolean){
    let icosahedronGeometry = new THREE.IcosahedronGeometry(radius, detail);
    const lambertMaterial = new THREE.MeshBasicMaterial({

      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe: true

    });

    /*
    console.log(icosahedronGeometry)

    icosahedronGeometry.faces.forEach(face => {
      face.color =  new THREE.Color('rgb(20,60,80)');
    
    })
    

    icosahedronGeometry.colorsNeedUpdate = true;
*/
    const ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(x, y, z);

    this.scene.add(ball);

    // const faces = icosahedronGeometry.faces.

    return ball;

  }

  makeOrbit(radius: number, lines: number, dots: number, spread: number, angle: number, color: string, ){

    const numParticles = lines * dots;
    const positions = new Float32Array( numParticles * 3 );
    const scales = new Float32Array( numParticles );

    let i = 0, j = 0;
    for (let ix = 0; ix < this.LINES; ix ++){
      for (let iy = 0; iy < this.DOTS; iy ++){
        // tslint:disable-next-line: max-line-length
        positions[ i ] = Math.cos(ix / lines * Math.PI * 2 - 45) * radius  + Math.cos(ix / lines * Math.PI * 2 - 45) * spread * iy * 1.5; // x+ this.RADIUS * iy * 0.1
        positions[ i + 1 ] = angle * Math.cos(ix / lines * Math.PI * 2) * 100; // + Math.cos(ix/this.LINES * Math.PI * 2) * iy * 20; // y
        // tslint:disable-next-line: max-line-length
        positions[ i + 2 ] = Math.sin(ix / lines * Math.PI * 2 - 45) * radius  + Math.sin(ix / lines * Math.PI * 2 - 45) * spread * iy * 1.5; // z+ this.RADIUS * iy * 0.1

        scales[ j ] = spread;

        i += 3;
        j ++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.setAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );

    const material = new THREE.ShaderMaterial( {

      uniforms: {
        color: { value: new THREE.Color( color ) },

      },

      vertexShader: this.shader1,
      fragmentShader: this.shader2

    } );

    const newParticles = new THREE.Points(geometry, material);

    return newParticles;

  }

  makeFractureSpace(numOfPoints: number, width: number, height: number, depth: number, angle: number){
    const triangles = [];
    // ONE: GET ALL COORDS OF FRAGMENTS
    const points = [];
    for (let i = 0; i < numOfPoints; i++){
      const x = Math.floor( Math.random() * width );
      const y = Math.floor( Math.random() * height );

      points.push([x, y]);
    }
    const delaunay = Delaunator.from(points);
    const trianglesDel = delaunay.triangles;
    const coords = [];

    for (let i = 0; i < trianglesDel.length; i += 3) {
      coords.push([
          points[trianglesDel[i]],
          points[trianglesDel[i + 1]],
          points[trianglesDel[i + 2]]
      ]);
    }
    console.log(coords);

    // TWO: ADD TRIANGLES TO THE SCENE


    coords.forEach(coord => {
      const geometry = new THREE.Geometry();
      coord.forEach(point => {
          geometry.vertices.push(new THREE.Vector3( point[0], point[1], 0));
      });


      const material = new THREE.MeshBasicMaterial({
        color: 'black',
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
    });


      const face = new THREE.Face3( 0, 1, 2);
      // let color = new THREE.Color( 'white' );
      // face.color = color;
      geometry.faces.push(face);

      geometry.computeFaceNormals();
      geometry.computeVertexNormals();


      const triangle = new THREE.Mesh(geometry, material);
      triangle.position.z = (angle / 90) * (-width / 2);
      triangle.position.x = -width / 2;
      triangle.position.y = -1400;
      triangle.rotation.x = angle;
      this.scene.add(triangle);

      // making wireframe
      const geo = new THREE.EdgesGeometry( triangle.geometry ); // or WireframeGeometry
      const mat = new THREE.LineBasicMaterial( { color: 'rgb(212,212,212)', linewidth: 1 } );
      const wireframe = new THREE.LineSegments( geo, mat );
      triangle.add(wireframe);

      triangles.push(triangle);
  });


    for (let i = 0; i < triangles.length; i++){
    triangles[i].position.y = - (angle / 90) * Math.pow(((i - 50) / 4), 3) + depth;
    triangles[i].rotateX = Math.random() * 45 + (-Math.random) * 85;
  }




    return triangles;

    // THREE: ADD LIGHT



  }
  makeFracture(numOfPoints: number, width: number, height: number, depth: number, angle: number){
    const triangles = [];
    // ONE: GET ALL COORDS OF FRAGMENTS
    const points = [];
    for (let i = 0; i < numOfPoints; i++){
      const x = Math.floor( Math.random() * width );
      const y = Math.floor( Math.random() * height );

      points.push([x, y]);
    }
    const delaunay = Delaunator.from(points);
    const trianglesDel = delaunay.triangles;
    const coords = [];

    for (let i = 0; i < trianglesDel.length; i += 3) {
      coords.push([
          points[trianglesDel[i]],
          points[trianglesDel[i + 1]],
          points[trianglesDel[i + 2]]
      ]);
    }
    console.log(coords);

    // TWO: ADD TRIANGLES TO THE SCENE


    coords.forEach(coord => {
      const geometry = new THREE.Geometry();
      coord.forEach(point => {
          geometry.vertices.push(new THREE.Vector3( point[0], point[1], 0));
      });


      const material = new THREE.MeshBasicMaterial({
        color: 'black',
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
    });


      const face = new THREE.Face3( 0, 1, 2);
      // let color = new THREE.Color( 'white' );
      // face.color = color;
      geometry.faces.push(face);

      geometry.computeFaceNormals();
      geometry.computeVertexNormals();


      const triangle = new THREE.Mesh(geometry, material);
      triangle.position.z = (angle / 90) * (-width / 2);
      triangle.position.x = -width / 2;
      triangle.position.y = -1400;
      triangle.rotation.x = angle;
      this.scene.add(triangle);

      // making wireframe
      const geo = new THREE.EdgesGeometry( triangle.geometry ); // or WireframeGeometry
      const mat = new THREE.LineBasicMaterial( { color: 'rgb(212,212,212)', linewidth: 1 } );
      const wireframe = new THREE.LineSegments( geo, mat );
      triangle.add(wireframe);

      triangles.push(triangle);
  });


    for (let i = 0; i < triangles.length; i++){
    triangles[i].position.y = - (angle / 90) * Math.pow(((i - 50) / 4), 3) + depth;
    triangles[i].rotateX = Math.random() * 45 + (-Math.random) * 85;
  }




    return triangles;

    // THREE: ADD LIGHT



  }





/**
 * UTILITIS
 */

  onWindowResize() {
      this.windowHalfX = window.innerWidth / 2;
      this.windowHalfY = window.innerHeight / 2;

      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( window.innerWidth, window.innerHeight );

  }



  onDocumentMouseMove( event ) {

    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    this.mouseX = event.clientX - x;
    this.mouseY = event.clientY - y;


    console.log(this.mouseX);
  }



  onDocumentTouchStart( event ) {
    if ( event.touches.length === 1 ) {

      event.preventDefault();

      this.mouseX = event.touches[ 0 ].pageX - this.windowHalfX;
      this.mouseY = event.touches[ 0 ].pageY - this.windowHalfY;

      console.log(this.mouseX);
    }
  }

  onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {

      event.preventDefault();

      this.mouseX = event.touches[ 0 ].pageX - this.windowHalfX;
      this.mouseY = event.touches[ 0 ].pageY - this.windowHalfY;
      console.log(this.mouseX);
    }
  }
  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();



    this.renderer.setSize( width, height );
  }





/**
 *
 *
 * MUSIC - RELATED
 */
  getMusicData(dataArray: Uint8Array){
    this.highNote = (dataArray[1] - 144) * 6;
    this.lowNote = (dataArray[140] - 144) * 6;
  }

  wave(particles, lines: number, dots: number, currentNote: number){
    const positions = particles.geometry.attributes.position.array;
    const scales = particles.geometry.attributes.scale.array;

    for (let i = 0; i < dots; i++){
      positions[i * 3 + 1] += (currentNote - positions[i * 3 + 1]) * 0.7 ;
    }
    for (let ix = lines; ix > 0; ix--){
      for (let iy = 0; iy < dots; iy++){
        const posNow = ix * dots * 3 + iy * 3 + 1;
        positions[posNow] += ( positions[posNow - dots * 3] - positions[posNow]) * 0.7;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.scale.needsUpdate = true;
  }

  animateTriangles(){
    for (let i = 0; i < this.triangles.length; i++){
      this.triangles[i].position.y = -Math.pow(((i - 50) / 4), 3) + this.triangleDepth1 + ( Math.sin( ( i + this.time ) * 0.3 ) * 50 );
    }
    this.time += 0.05;
  }

  animateColor(triangle: any, color: Array<number>, i: number){
    setTimeout(() => {
      if (i >0) {
        triangle.material.color.setHSL( color[0], 0, color[2]* i/361 );
        this.animateColor(triangle, color, i );    
      }
    }, this.beatTime/(360 * 8));
    i -= 1;
  }

  detectBeats(){
    
    setTimeout(() => {
      if (this.playing == true){
        for(let i = 0; i < 4; i++){
          const triangle =  this.triangles[Math.floor(Math.random() * this.triangles.length)];
          const color = this.beatColors[Math.floor(Math.random() * this.beatColors.length)];
          
          this.animateColor(triangle, color, 360);     
          
          
        }
        //console.log('beat2')
        this.detectBeats();

      }
    }, this.beatTime);
  }

  play(){
    this.playing = true;
    this.detectBeats();
  }

  pause(){
    this.playing = false;
  }




/**
 * RENDER + ANIMATIONS ORDER
 *
 */
  render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    // console.log(posX, posY)
    this.camera.position.x += ( this.mouseX - this.camera.position.x ) * .01;
    this.camera.position.y += ( - (this.mouseY * 2) + 20 - this.camera.position.y ) * .01;
    this.camera.position.z += ( - (this.mouseY * 2.3) + 300 - this.camera.position.z ) * .01;
    this.camera.lookAt( this.scene.position );

    this.wave(this.particles_H, this.LINES, this.DOTS, this.highNote);
    this.wave(this.particles_L, this.LINES, this.DOTS, this.lowNote);

    this.ballOuter.rotation.y += 0.0005;
    this.ballInner.rotation.y -= 0.002;

    this.animateTriangles();


    this.count += 0.1;
    this.renderer.render(this.scene, this.camera);

  }

  animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();

      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();

        });
      }

      window.addEventListener('resize', () => {
        this.resize();

      });
    });
  }









}

  /*
  public playAudio(audioSource){
    // clear
    this.analyser = undefined;
    this.dataArray = undefined;
    //first, create something to analyze music with, audioContext analyser
    var context = new AudioContext();
    var src = context.createMediaElementSource(audioSource);
    this.analyser = context.createAnalyser();
    src.connect(this.analyser);
    this.analyser.connect(context.destination);
    this.analyser.fftSize = 512; // fast fourier transform, the higher it gets, the better frequenct analysis bbecomes at the cost of providing fewer details in time domain
    var bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    console.log(this.dataArray.buffer)
  }
  */
/*
fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = this.fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}

avg(arr){
    var total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

max(arr){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}
    if(this.analyser){
        this.analyser.getByteFrequencyData(this.dataArray);

        var lowerHalfArray = this.dataArray.slice(0, (this.dataArray.length/2) - 1);
        var upperHalfArray = this.dataArray.slice((this.dataArray.length/2) - 1, this.dataArray.length - 1);

        var overallAvg = this.avg(this.dataArray);
        var lowerMax = this.max(lowerHalfArray);
        var lowerAvg = this.avg(lowerHalfArray);
        var upperMax = this.max(upperHalfArray);
        var upperAvg = this.avg(upperHalfArray);

        var lowerMaxFr = lowerMax / lowerHalfArray.length;
        var lowerAvgFr = lowerAvg / lowerHalfArray.length;
        var upperMaxFr = upperMax / upperHalfArray.length;
        var upperAvgFr = upperAvg / upperHalfArray.length;

        console.log(lowerAvgFr, lowerMaxFr, upperAvgFr, upperMaxFr,)
    }
    */
