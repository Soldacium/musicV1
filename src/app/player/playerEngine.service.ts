import * as THREE from 'three';
import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';
import Delaunator from 'delaunator';
import { analyze } from 'web-audio-beat-detector';
import { ThemeService, ThemeColors } from '../services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PlayerEngineService implements OnDestroy {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  private frameId: number | null = null;

  private mouseX = 100;
  private mouseY = 100;
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  count = 0;

  particlesH;
  particlesL;

  RADIUS = 800;
  LINES = 300;
  DOTS = 4;
  SPREAD = 25;
  speed = 7;

  ballOuter: THREE.Mesh;
  ballInner: THREE.Mesh;

  triangles: THREE.Mesh<THREE.Geometry, THREE.MeshBasicMaterial>[] = [];
  triangles2: THREE.Mesh<THREE.Geometry, THREE.MeshBasicMaterial>[] = [];
  triangleDepth1 = -1700;
  triangleDepth2 = 1700;
  time = 0;

  private animatingTriangles = new Map<
    THREE.Mesh,
    {
      color: number[];
      baseColor: number[];
      startTime: number;
      duration: number;
      maxIntensity: number;
    }
  >();

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

  beatColors: Array<number[]> = [[0.83, 1, 0.5], []];

  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private bufferLength: number;
  private audioCtx: AudioContext;

  private destroy$ = new Subject<void>();
  private currentThemeColors: ThemeColors;

  public constructor(private ngZone: NgZone, private themeService: ThemeService) {
    this.setupThemeSubscription();
  }

  private setupThemeSubscription(): void {
    this.currentThemeColors = this.themeService.getCurrentColors();

    this.themeService.currentColors$
      .pipe(takeUntil(this.destroy$))
      .subscribe((colors: ThemeColors) => {
        this.currentThemeColors = colors;
        this.updateVisualizationColors();
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }

    this.playing = false;
    this.animatingTriangles.clear();

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
  }

  private updateVisualizationColors(): void {
    if (!this.currentThemeColors) {
      return;
    }

    this.updateParticleColors();
    this.updateWireframeColors();
    this.updateTriangleColors();
    this.updateBallColors();
    this.beatColors = this.currentThemeColors.triangleColors;
    if (this.scene) {
      this.scene.background = new THREE.Color(this.currentThemeColors.background);
    }
  }

  private updateParticleColors(): void {
    if (this.particlesH && this.particlesL && this.currentThemeColors) {
      const highMaterial = this.particlesH.material as THREE.ShaderMaterial;
      if (highMaterial && highMaterial.uniforms && highMaterial.uniforms.color) {
        highMaterial.uniforms.color.value = new THREE.Color(
          this.currentThemeColors.particleColors[0] || '#ffffff'
        );
        highMaterial.needsUpdate = true;
      }

      const lowMaterial = this.particlesL.material as THREE.ShaderMaterial;
      if (lowMaterial && lowMaterial.uniforms && lowMaterial.uniforms.color) {
        lowMaterial.uniforms.color.value = new THREE.Color(
          this.currentThemeColors.particleColors[1] || '#cccccc'
        );
        lowMaterial.needsUpdate = true;
      }
    }
  }

  private updateWireframeColors(): void {
    if (this.triangles && this.currentThemeColors) {
      this.triangles.forEach((triangle) => {
        const wireframe = triangle.children.find(
          (child) => child instanceof THREE.LineSegments
        ) as THREE.LineSegments;
        if (wireframe && wireframe.material) {
          const wireframeMaterial = wireframe.material as THREE.LineBasicMaterial;
          if (wireframeMaterial.color) {
            wireframeMaterial.color = new THREE.Color(this.currentThemeColors.wireframe);
            wireframeMaterial.needsUpdate = true;
          }
        }
      });
    }
  }

  private updateTriangleColors(): void {
    if (this.triangles && this.currentThemeColors) {
      const triangleColor = this.currentThemeColors.triangleColors?.[0] || [0, 0, 0];
      this.triangles.forEach((triangle) => {
        const triangleMaterial = triangle.material as THREE.MeshBasicMaterial;
        if (triangleMaterial && triangleMaterial.color) {
          triangleMaterial.color.setHSL(triangleColor[0], triangleColor[1], triangleColor[2]);
          triangleMaterial.needsUpdate = true;
        }
      });

      // Update base colors for currently animating triangles
      this.animatingTriangles.forEach((animation, triangle) => {
        animation.baseColor = triangleColor;
      });
    }
  }

  private updateBallColors(): void {
    if (this.ballOuter && this.currentThemeColors) {
      const ballMaterial = this.ballOuter.material as THREE.MeshBasicMaterial;
      if (ballMaterial && ballMaterial.color) {
        ballMaterial.color = new THREE.Color(this.currentThemeColors.accent);
        ballMaterial.needsUpdate = true;
      }
    }

    if (this.ballInner && this.currentThemeColors) {
      const ballMaterial = this.ballInner.material as THREE.MeshBasicMaterial;
      if (ballMaterial && ballMaterial.color) {
        ballMaterial.color = new THREE.Color(this.currentThemeColors.secondary);
        ballMaterial.needsUpdate = true;
      }
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {}

  init(canvas: HTMLCanvasElement): void {
    this.setupCamera();
    this.setupScene();
    this.setupObjects();
    this.setupRenderer(canvas);
    this.addEventListeners();
    setTimeout(() => {
      this.updateVisualizationColors();
    }, 100);
  }

  setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 15000);
    this.camera.position.z = 1000;
    this.camera.position.y = 200;
  }

  setupScene(): void {
    this.scene = new THREE.Scene();

    this.particlesH = this.makeOrbit(this.RADIUS, this.LINES, this.DOTS, this.SPREAD, 1, 0);
    this.scene.add(this.particlesH);

    const radiusLower = this.RADIUS - this.DOTS * this.SPREAD - 80;
    this.particlesL = this.makeOrbit(radiusLower, this.LINES, this.DOTS, this.SPREAD, 1, 1);
    this.scene.add(this.particlesL);
  }

  setupRenderer(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupObjects(): void {
    this.ballOuter = this.makeBall(this.RADIUS * 6, 1, 0, 0, 0, true);
    this.ballInner = this.makeBall(this.RADIUS / 3, 2, 0, 0, 0, true);

    this.triangles = this.makeFracture(100, 6000, 6000, this.triangleDepth1, 90);
  }

  addEventListeners() {
    document.addEventListener(
      'mousemove',
      (event) => {
        this.mouseX = event.clientX - window.innerWidth / 2;
        this.mouseY = event.clientY - window.innerHeight / 2 - 300;
      },
      false
    );
    document.addEventListener('touchstart', this.onDocumentTouchStart, false);
    document.addEventListener('touchmove', this.onDocumentTouchMove, false);
    window.addEventListener('resize', this.onWindowResize, false);
  }

  makeBall(radius: number, detail: number, x: number, y: number, z: number, wireframe: boolean) {
    const icosahedronGeometry = new THREE.IcosahedronGeometry(radius, detail);
    const lambertMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(x, y, z);

    this.scene.add(ball);
    return ball;
  }

  makeOrbit(
    radius: number,
    lines: number,
    dots: number,
    spread: number,
    angle: number,
    colorIndex: number = 0
  ) {
    const numParticles = lines * dots;
    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    let i = 0;
    let j = 0;
    for (let ix = 0; ix < this.LINES; ix++) {
      for (let iy = 0; iy < this.DOTS; iy++) {
        positions[i] =
          Math.cos((ix / lines) * Math.PI * 2 - 45) * radius +
          Math.cos((ix / lines) * Math.PI * 2 - 45) * spread * iy * 1.5;
        positions[i + 1] = angle * Math.cos((ix / lines) * Math.PI * 2) * 100;

        positions[i + 2] =
          Math.sin((ix / lines) * Math.PI * 2 - 45) * radius +
          Math.sin((ix / lines) * Math.PI * 2 - 45) * spread * iy * 1.5;

        scales[j] = spread;

        i += 3;
        j++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const color = this.currentThemeColors?.particleColors?.[colorIndex] || '#ffffff';

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
      },
      vertexShader: this.shader1,
      fragmentShader: this.shader2,
    });

    const newParticles = new THREE.Points(geometry, material);
    return newParticles;
  }

  makeFracture(numOfPoints: number, width: number, height: number, depth: number, angle: number) {
    const triangles: THREE.Mesh<THREE.Geometry, THREE.MeshBasicMaterial>[] = [];
    const points: number[][] = [];
    for (let i = 0; i < numOfPoints; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      points.push([x, y]);
    }

    const delaunay = Delaunator.from(points);
    const trianglesDel = delaunay.triangles;
    const coords: number[][][] = [];

    for (let i = 0; i < trianglesDel.length; i += 3) {
      coords.push([
        points[trianglesDel[i]],
        points[trianglesDel[i + 1]],
        points[trianglesDel[i + 2]],
      ]);
    }

    coords.forEach((coord) => {
      const geometry = new THREE.Geometry();
      coord.forEach((point) => {
        geometry.vertices.push(new THREE.Vector3(point[0], point[1], 0));
      });

      // Use theme triangle colors - default to first color or black if not available
      const triangleColor = this.currentThemeColors?.triangleColors?.[0] || [0, 0, 0];
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(triangleColor[0], triangleColor[1], triangleColor[2]),
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
        side: THREE.DoubleSide,
      });

      const face = new THREE.Face3(0, 1, 2);
      geometry.faces.push(face);

      geometry.computeFaceNormals();
      geometry.computeVertexNormals();

      const triangle = new THREE.Mesh(geometry, material);
      triangle.position.z = (angle / 90) * (-width / 2);
      triangle.position.x = -width / 2;
      triangle.position.y = -1400;
      triangle.rotation.x = angle;
      this.scene.add(triangle);

      // Create wireframe with theme color
      const geo = new THREE.EdgesGeometry(triangle.geometry);
      const wireframeColor = this.currentThemeColors?.wireframe || 'rgb(212,212,212)';
      const mat = new THREE.LineBasicMaterial({ color: wireframeColor, linewidth: 1 });
      const wireframe = new THREE.LineSegments(geo, mat);
      triangle.add(wireframe);

      triangles.push(triangle);
    });

    for (let i = 0; i < triangles.length; i++) {
      triangles[i].position.y = -(angle / 90) * Math.pow((i - 50) / 4, 3) + depth;
    }

    return triangles;
  }

  onWindowResize() {
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onDocumentMouseMove(event) {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    this.mouseX = event.clientX - x;
    this.mouseY = event.clientY - y;
  }

  onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
      event.preventDefault();

      this.mouseX = event.touches[0].pageX - this.windowHalfX;
      this.mouseY = event.touches[0].pageY - this.windowHalfY;
    }
  }

  onDocumentTouchMove(event) {
    if (event.touches.length === 1) {
      event.preventDefault();

      this.mouseX = event.touches[0].pageX - this.windowHalfX;
      this.mouseY = event.touches[0].pageY - this.windowHalfY;
    }
  }
  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getMusicData(dataArray: Uint8Array) {
    this.highNote = (dataArray[1] - 144) * 6;
    this.lowNote = (dataArray[140] - 144) * 6;
  }

  wave(particles, lines: number, dots: number, currentNote: number) {
    const positions = particles.geometry.attributes.position.array;
    const scales = particles.geometry.attributes.scale.array;

    for (let i = 0; i < dots; i++) {
      positions[i * 3 + 1] += (currentNote - positions[i * 3 + 1]) * 0.7;
    }
    for (let ix = lines; ix > 0; ix--) {
      for (let iy = 0; iy < dots; iy++) {
        const posNow = ix * dots * 3 + iy * 3 + 1;
        positions[posNow] += (positions[posNow - dots * 3] - positions[posNow]) * 0.7;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.scale.needsUpdate = true;
  }

  animateTriangles() {
    for (let i = 0; i < this.triangles.length; i++) {
      this.triangles[i].position.y =
        -Math.pow((i - 50) / 4, 3) + this.triangleDepth1 + Math.sin((i + this.time) * 0.3) * 50;
    }
    this.time += 0.05;
  }

  animateColor(triangle: THREE.Mesh, color: Array<number>, maxIntensity: number) {
    const duration = Math.max(1000, this.beatTime * 1.5);
    const baseTriangleColor = this.currentThemeColors?.triangleColors?.[0] || [0, 0, 0];
    this.animatingTriangles.set(triangle, {
      color,
      baseColor: baseTriangleColor,
      startTime: performance.now(),
      duration,
      maxIntensity,
    });
  }

  private updateTriangleAnimations(): void {
    const currentTime = performance.now();
    const toRemove: THREE.Mesh[] = [];

    this.animatingTriangles.forEach((animation, triangle) => {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      if (progress >= 1) {
        // Reset to theme's base triangle color
        (triangle.material as THREE.MeshBasicMaterial).color.setHSL(
          animation.baseColor[0],
          animation.baseColor[1],
          animation.baseColor[2]
        );
        toRemove.push(triangle);
      } else {
        // Create a light-up then fade-out effect: quick light-up, gradual fade
        const lightUpDuration = 0.2; // 20% of animation for light-up
        let blendFactor: number;

        if (progress <= lightUpDuration) {
          // Quick light-up phase
          blendFactor = progress / lightUpDuration;
        } else {
          // Gradual fade-out phase
          const fadeProgress = (progress - lightUpDuration) / (1 - lightUpDuration);
          blendFactor = 1 - fadeProgress;
        }

        // Blend between base color and beat color
        const baseHue = animation.baseColor[0] ?? 0;
        const baseSat = animation.baseColor[1] ?? 0;
        const baseLight = animation.baseColor[2] ?? 0;

        const beatHue = animation.color[0] ?? 0;
        const beatSat = animation.color[1] ?? 1;
        const beatLight = animation.color[2] ?? 0.5;

        const finalHue = baseHue + (beatHue - baseHue) * blendFactor;
        const finalSat = baseSat + (beatSat - baseSat) * blendFactor;
        const finalLight = baseLight + (beatLight - baseLight) * blendFactor;

        (triangle.material as THREE.MeshBasicMaterial).color.setHSL(finalHue, finalSat, finalLight);
      }
    });

    toRemove.forEach((triangle) => this.animatingTriangles.delete(triangle));
  }

  detectBeats() {
    setTimeout(() => {
      if (this.playing === true) {
        // Get available triangles (not currently animating)
        const availableTriangles = this.triangles.filter(
          (triangle) => !this.animatingTriangles.has(triangle)
        );

        const animationCount = Math.min(6, availableTriangles.length);

        for (let i = 0; i < animationCount; i++) {
          const randomIndex = Math.floor(Math.random() * availableTriangles.length);
          const triangle = availableTriangles.splice(randomIndex, 1)[0]; // Remove from available list
          const color = this.beatColors[Math.floor(Math.random() * this.beatColors.length)];

          this.animateColor(triangle, color, 360);
        }
        this.detectBeats();
      }
    }, this.beatTime || 500);
  }

  play() {
    this.playing = true;
    this.detectBeats();
  }

  pause() {
    this.playing = false;
  }

  render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.01;
    this.camera.position.y += (-(this.mouseY * 2) + 20 - this.camera.position.y) * 0.01;
    this.camera.position.z += (-(this.mouseY * 2.3) + 300 - this.camera.position.z) * 0.01;
    this.camera.lookAt(this.scene.position);

    this.wave(this.particlesH, this.LINES, this.DOTS, this.highNote);
    this.wave(this.particlesL, this.LINES, this.DOTS, this.lowNote);

    this.ballOuter.rotation.y += 0.0005;
    this.ballInner.rotation.y -= 0.002;

    this.animateTriangles();

    this.updateTriangleAnimations();

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

  setupAudioContext(audioElement: HTMLAudioElement): void {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaElementSource(audioElement);
      this.analyser = this.audioCtx.createAnalyser();

      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
    } catch (error) {}
  }

  private startVisualizationLoop(): void {
    const updateVisualization = () => {
      if (this.playing) {
        this.analyser.getByteFrequencyData(this.dataArray);
        this.getMusicData(this.dataArray);
        requestAnimationFrame(updateVisualization);
      }
    };
    updateVisualization();
  }

  startPlaying(): void {
    this.playing = true;
    this.detectBeats();
    this.startVisualizationLoop();
  }

  stopPlaying(): void {
    this.playing = false;
  }
}
