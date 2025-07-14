import * as THREE from 'three';
import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';
import Delaunator from 'delaunator';

interface AnimationState {
  mode: number;
  time: number;
  exitAcceleration: number;
  enterAcceleration: number;
  isAnimating: boolean;
}

@Injectable({ providedIn: 'root' })
export class WelcomeEngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private frameId: number | null = null;

  coordinates;
  triangles: THREE.Mesh<THREE.Geometry, THREE.MeshBasicMaterial>[] = [];

  // Default state values
  private readonly defaultState: AnimationState = {
    mode: 2,
    time: 0,
    exitAcceleration: 2,
    enterAcceleration: 5,
    isAnimating: false,
  };

  // Current state (copy of default)
  private state: AnimationState = { ...this.defaultState };

  // Animation state tracking
  private animationPromise: Promise<void> | null = null;
  private animationResolve: (() => void) | null = null;

  // Event listeners for cleanup
  private resizeListener: (() => void) | null = null;
  private domContentLoadedListener: (() => void) | null = null;

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }

    if (this.domContentLoadedListener) {
      window.removeEventListener('DOMContentLoaded', this.domContentLoadedListener);
      this.domContentLoadedListener = null;
    }

    if (this.triangles.length > 0) {
      this.triangles.forEach((triangle) => {
        if (triangle.geometry) {
          triangle.geometry.dispose();
        }
        if (triangle.material) {
          triangle.material.dispose();
        }
        triangle.children.forEach((child) => {
          if (child instanceof THREE.LineSegments) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              child.material.dispose();
            }
          }
        });
      });
      this.triangles = [];
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.resetState();
  }

  private resetState(): void {
    this.state = { ...this.defaultState };
    this.animationPromise = null;
    this.animationResolve = null;
  }

  public initializeEngine(canvas: ElementRef<HTMLCanvasElement>): void {
    this.resetState();
    this.createScene(canvas);
    this.generateTriangles();
    this.animate();
  }

  private generateTriangles(): void {
    const height = window.innerHeight;
    const width = window.innerWidth;
    const pointsNum = 400;
    const points: number[][] = [];
    const coords: number[][][] = [];

    for (let i = 0; i < pointsNum; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      points.push([x, y]);
    }

    const delaunay = Delaunator.from(points);
    const triangles = delaunay.triangles;

    for (let i = 0; i < triangles.length; i += 3) {
      coords.push([points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]]]);
    }

    this.createTriangles(coords);
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
    const time = this.state.time;
    for (let i = 0; i < this.triangles.length; i++) {
      this.triangles[i].position.z = Math.sin((i + time) * 0.3) * 4;
    }
    this.state.time += 0.02;
  }

  animateExit() {
    let allTrianglesExited = true;
    for (let i = 0; i < this.triangles.length; i++) {
      this.triangles[i].position.z += (Math.sin(i) + 1.5) * 0.1 * this.state.exitAcceleration;
      if (this.triangles[i].position.z < 700) {
        allTrianglesExited = false;
      }
    }
    this.state.exitAcceleration += 0.35;

    if (allTrianglesExited && this.animationResolve) {
      this.state.isAnimating = false;
      this.animationResolve();
      this.animationResolve = null;
    }
  }

  animateEnter() {
    let allTrianglesInPosition = true;
    for (let i = 0; i < this.triangles.length; i++) {
      const targetZ = Math.sin((i + this.state.time) * 0.3) * 4;
      if (this.triangles[i].position.z > targetZ) {
        this.triangles[i].position.z -= (Math.sin(i) + 3.5) * 0.2 * this.state.enterAcceleration;
        allTrianglesInPosition = false;
      } else {
        this.triangles[i].position.z = targetZ;
      }
    }
    this.state.enterAcceleration -= 0.004;

    if (allTrianglesInPosition && this.animationResolve) {
      this.state.isAnimating = false;
      this.animationResolve();
      this.animationResolve = null;
    }
  }

  async animateEnterAsync(): Promise<void> {
    if (this.state.isAnimating && this.animationPromise) {
      return this.animationPromise;
    }

    this.state.isAnimating = true;
    this.state.mode = 0;

    this.animationPromise = new Promise<void>((resolve) => {
      this.animationResolve = resolve;
    });

    return this.animationPromise;
  }

  async animateExitAsync(): Promise<void> {
    if (this.state.isAnimating && this.animationPromise) {
      return this.animationPromise;
    }

    this.state.isAnimating = true;
    this.state.mode = 2;
    this.state.exitAcceleration = this.defaultState.exitAcceleration;

    this.animationPromise = new Promise<void>((resolve) => {
      this.animationResolve = resolve;
    });

    return this.animationPromise;
  }

  startTriangleAnimation(): void {
    this.state.mode = 1;
    this.state.isAnimating = false;
    this.animationResolve = null;
  }

  get mode(): number {
    return this.state.mode;
  }

  public animate(): void {
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        this.domContentLoadedListener = () => {
          this.render();
        };
        window.addEventListener('DOMContentLoaded', this.domContentLoadedListener);
      }

      this.resizeListener = () => {
        this.resize();
      };
      window.addEventListener('resize', this.resizeListener);
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });
    if (this.state.mode === 1) {
      this.animateTriangles();
    } else if (this.state.mode === 2) {
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
