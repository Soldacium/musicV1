import * as THREE from 'three';
import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WelcomeEngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;

  private cube: THREE.Mesh;
  private group: THREE.Group;

  private frameId: number = null;

  coordinates;
  triangles = [];



  mode = 2;

  time = 0;
  //bgOpacity = 1;
  exitAcceleration = 1;
  enterAcceleration = 5;

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createTriangles(coordinates: Array<[]>){
    const material = new THREE.MeshBasicMaterial({
        color: 'white',
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1,
        side: THREE.BackSide
    });

    coordinates.forEach(coord => {
        let geometry = new THREE.Geometry();      
        coord.forEach(point => {
            geometry.vertices.push(new THREE.Vector3( point[0], point[1], 0));
        })

        
        
        

        let face = new THREE.Face3( 0, 1, 2);
        //let color = new THREE.Color( 'white' ); 
        //face.color = color;
        geometry.faces.push(face)

        geometry.computeFaceNormals();
        geometry.computeVertexNormals()

        let triangle = new THREE.Mesh(geometry,material)
        triangle.position.z = 600;
        this.scene.add(triangle)

        // making wireframe
        let geo = new THREE.EdgesGeometry( triangle.geometry ); // or WireframeGeometry
        let mat = new THREE.LineBasicMaterial( { color: 'rgb(212,212,212)', linewidth: 1 } );
        let wireframe = new THREE.LineSegments( geo, mat );
        triangle.add(wireframe);

        this.triangles.push(triangle)
        
;
    })

    console.log(this.triangles)
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();
    //const color = new THREE.Color(`rgba(0,0,0,${this.bgOpacity})`)
    //this.scene.background = color;

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.z = 400;
    this.camera.position.y = window.innerHeight/2 + 100;
    this.camera.position.x = window.innerWidth/2;
    this.scene.add(this.camera);

    // soft white light
  }

  animateTriangles(){
      /*
      this.triangles.forEach(mesh => {
        mesh.position.z = 
      })
      */

      for(let i = 0;i < this.triangles.length; i++){
          this.triangles[i].position.z = ( Math.sin( ( i + this.time ) * 0.3 ) * 4 )

      }
      this.time += 0.05;
  }

  animateExit(){
    for(let i = 0;i < this.triangles.length; i++){
      this.triangles[i].position.z += ( ((Math.sin(i) + 1.5)) * 0.1 * this.exitAcceleration )

    }

    this.exitAcceleration += 0.1;
    //this.bgOpacity -= 0.003;
    //const color = new THREE.Color(`rgba(0,0,0,${this.bgOpacity})`)
    //this.scene.background = color;
  }

  animateEnter(){
    for(let i = 0;i < this.triangles.length; i++){
      if(this.triangles[i].position.z > ( Math.sin( ( i + this.time ) * 0.3 ) * 4 )){
        this.triangles[i].position.z -= ( ((Math.sin(i) + 3.5)) * 0.2 * this.enterAcceleration )
      }else{
        this.triangles[i].position.z = ( Math.sin( ( i + this.time ) * 0.3 ) * 4 )
      }
      

    }

    this.enterAcceleration -= 0.0097;
  }

  


  public animate(): void {
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

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });
    //this.camera.lookAt(0,0,0)
    //this.animateTriangles()
    //this.modes[0]()

    // calling from array faster? think later.
    if(this.mode === 1){
      this.animateTriangles()
    }else if(this.mode === 2){
      this.animateExit()
    }else{
      this.animateEnter()
    }
    
    //this.animateExit()
    this.camera.position.y = -window.pageYOffset * 0.2 + window.innerHeight/2 + 100;
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( width, height );
  }
}