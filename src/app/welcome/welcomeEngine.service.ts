import * as THREE from 'three';
import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WelcomeEngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private frameId: number | null = null;

  coordinates;
  triangles: THREE.Mesh<THREE.Geometry, THREE.MeshBasicMaterial>[] = [];
  mode = 2;

  time = 0;
  exitAcceleration = 2;
  enterAcceleration = 8;

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createTriangles(coordinates: Array<number[][]>) {
    const material = new THREE.MeshBasicMaterial({
      color: 'white',
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      side: THREE.BackSide,
    });

    coordinates.forEach((coord) => {
      const geometry = new THREE.Geometry();
      coord.forEach((point) => {
        geometry.vertices.push(new THREE.Vector3(point[0], point[1], 0));
      });

      const face = new THREE.Face3(0, 1, 2);
      geometry.faces.push(face);

      const triangle = new THREE.Mesh(geometry, material);
      triangle.position.z = 600;
      this.scene.add(triangle);

      const geo = new THREE.EdgesGeometry(triangle.geometry);
      const mat = new THREE.LineBasicMaterial({ color: 'rgb(212,212,212)', linewidth: 1 });
      const wireframe = new THREE.LineSegments(geo, mat);
      triangle.add(wireframe);

      this.triangles.push(triangle);
    });
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    this.canvas = canvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 400;
    this.camera.position.y = window.innerHeight / 2 + 100;
    this.camera.position.x = window.innerWidth / 2;
    this.scene.add(this.camera);
  }

  animateTriangles() {
    const time = this.time;
    for (let i = 0; i < this.triangles.length; i++) {
      this.triangles[i].position.z = Math.sin(i + time) * 3;
    }
    this.time += 0.02;
  }

  animateExit() {
    for (let i = 0; i < this.triangles.length; i++) {
      this.triangles[i].position.z += (Math.sin(i) + 1.5) * 0.1 * this.exitAcceleration;
    }
    this.exitAcceleration += 0.35;
  }

  animateEnter() {
    for (let i = 0; i < this.triangles.length; i++) {
      if (this.triangles[i].position.z > Math.sin((i + this.time) * 0.3) * 4) {
        this.triangles[i].position.z -= (Math.sin(i) + 3.5) * 0.2 * this.enterAcceleration;
      } else {
        this.triangles[i].position.z = Math.sin((i + this.time) * 0.3) * 4;
      }
    }
    this.enterAcceleration -= 0.004;
  }

  public animate(): void {
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
    if (this.mode === 1) {
      this.animateTriangles();
    } else if (this.mode === 2) {
      this.animateExit();
    } else {
      this.animateEnter();
    }
    this.camera.position.y = -window.pageYOffset * 0.2 + window.innerHeight / 2 + 100;
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
