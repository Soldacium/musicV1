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


  private frameId: number = null;

  private mouseX = 100; private mouseY = 100;
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  count = 0;

  particles_H;
  particles_L;

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
    [0.83, 1, 0.5],
    []
  ];






  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
  }

  init(canvas: HTMLCanvasElement): void {

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 15000 );
    this.camera.position.z = 1000;
    this.camera.position.y = 200;

    this.scene = new THREE.Scene();
    this.particles_H = this.makeOrbit(this.RADIUS, this.LINES, this.DOTS, this.SPREAD, 1, 'rgb(255,255,255)');
    this.scene.add( this.particles_H );

    const radiusLower = (this.RADIUS - this.DOTS * this.SPREAD - 80);
    this.particles_L = this.makeOrbit(radiusLower, this.LINES, this.DOTS, this.SPREAD, 1, 'rgb(255,255,255)');
    this.scene.add( this.particles_L );

    this.ballOuter = this.makeBall(this.RADIUS * 6, 1, 0, 0, 0, true);
    this.ballInner = this.makeBall(this.RADIUS / 3, 2, 0, 0, 0, true);

    this.triangles = this.makeFracture(100, 6000, 6000, this.triangleDepth1, 90);

    this.renderer = new THREE.WebGLRenderer(
      { antialias: true,
        canvas,
        } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );

    this.addEventListeners();
  }

  addEventListeners(){
    document.addEventListener( 'mousemove', (event) => {
      this.mouseX = event.clientX - window.innerWidth / 2 ;
      this.mouseY = event.clientY - window.innerHeight / 2 - 300;
    }, false );
    document.addEventListener( 'touchstart', this.onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', this.onDocumentTouchMove, false );
    window.addEventListener( 'resize', this.onWindowResize, false );
  }

  makeBall(radius: number, detail: number, x: number, y: number, z: number, wireframe: boolean){
    const icosahedronGeometry = new THREE.IcosahedronGeometry(radius, detail);
    const lambertMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(x, y, z);

    this.scene.add(ball);
    return ball;
  }

  makeOrbit(radius: number, lines: number, dots: number, spread: number, angle: number, color: string, ){

    const numParticles = lines * dots;
    const positions = new Float32Array( numParticles * 3 );
    const scales = new Float32Array( numParticles );

    let i = 0;
    let j = 0;
    for (let ix = 0; ix < this.LINES; ix ++){
      for (let iy = 0; iy < this.DOTS; iy ++){

        positions[ i ] =
        Math.cos(ix / lines * Math.PI * 2 - 45) * radius +
        Math.cos(ix / lines * Math.PI * 2 - 45) * spread * iy * 1.5;
        positions[ i + 1 ] = angle * Math.cos(ix / lines * Math.PI * 2) * 100; 

        positions[ i + 2 ] =
        Math.sin(ix / lines * Math.PI * 2 - 45) * radius +
        Math.sin(ix / lines * Math.PI * 2 - 45) * spread * iy * 1.5; 

        scales[ j ] = spread;

        i += 3;
        j ++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.setAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color( color ) },

      },
      vertexShader: this.shader1,
      fragmentShader: this.shader2

    });
    const newParticles = new THREE.Points(geometry, material);
    return newParticles;
  }

  makeFractureSpace(numOfPoints: number, width: number, height: number, depth: number, angle: number){
    const triangles = [];
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
      geometry.faces.push(face);

      geometry.computeFaceNormals();
      geometry.computeVertexNormals();


      const triangle = new THREE.Mesh(geometry, material);
      triangle.position.z = (angle / 90) * (-width / 2);
      triangle.position.x = -width / 2;
      triangle.position.y = -1400;
      triangle.rotation.x = angle;
      this.scene.add(triangle);

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
  }


  makeFracture(numOfPoints: number, width: number, height: number, depth: number, angle: number){
    const triangles = [];
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
    coords.forEach(coord => {
      const geometry = new THREE.Geometry();
      coord.forEach(point => {
          geometry.vertices.push(new THREE.Vector3( point[0], point[1], 0));
      });


      const material = new THREE.MeshBasicMaterial({
        color: 'black',
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide
      });


      const face = new THREE.Face3( 0, 1, 2);
      geometry.faces.push(face);

      geometry.computeFaceNormals();
      geometry.computeVertexNormals();


      const triangle = new THREE.Mesh(geometry, material);
      triangle.position.z = (angle / 90) * (-width / 2);
      triangle.position.x = -width / 2;
      triangle.position.y = -1400;
      triangle.rotation.x = angle;
      this.scene.add(triangle);

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
  }


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
  }



  onDocumentTouchStart( event ) {
    if ( event.touches.length === 1 ) {

      event.preventDefault();

      this.mouseX = event.touches[ 0 ].pageX - this.windowHalfX;
      this.mouseY = event.touches[ 0 ].pageY - this.windowHalfY;
    }
  }

  onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {

      event.preventDefault();

      this.mouseX = event.touches[ 0 ].pageX - this.windowHalfX;
      this.mouseY = event.touches[ 0 ].pageY - this.windowHalfY;
    }
  }
  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( width, height );
  }


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
      if (i > 0) {
        triangle.material.color.setHSL( color[0], 0, color[2] * i / 361 );
        this.animateColor(triangle, color, i );
      }
    }, this.beatTime / (360 * 8));
    i -= 1;
  }

  detectBeats(){

    setTimeout(() => {
      if (this.playing == true){
        for (let i = 0; i < 4; i++){
          const triangle =  this.triangles[Math.floor(Math.random() * this.triangles.length)];
          const color = this.beatColors[Math.floor(Math.random() * this.beatColors.length)];
          this.animateColor(triangle, color, 360);
        }
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
