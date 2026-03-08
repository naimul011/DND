/**
 * IsometricWorld — Full-screen Three.js isometric RPG world background.
 *
 * Adapted from dgreenheck/isometric-rpg. Renders a procedural low-poly
 * grid world with trees, rocks, bushes, and colored player tokens.
 *
 * Uses primitive Three.js geometries (no external GLB models needed).
 * The canvas fills the entire viewport and sits behind overlay UI.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ─── Configuration ───────────────────────────────────────────────────────────

const WORLD_SIZE = 16;
const TREE_COUNT = 18;
const ROCK_COUNT = 25;
const BUSH_COUNT = 15;
const FOG_COLOR = 0x12081f;
const GROUND_COLOR = 0x1a2a15;
const GRID_COLOR = 0x2a4a25;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorldPlayer {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
}

export interface ChatBubble {
  /** ID of the player whose token should show the bubble */
  playerId: string;
  /** Message text to display */
  text: string;
  /** Speaker name label */
  speakerName: string;
  /** Role: 'dm' shows as DM-styled, otherwise player-styled */
  role: 'dm' | 'user' | 'system';
}

export interface TokenScreenPosition {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

interface IsometricWorldProps {
  /** Party members to render as tokens */
  players?: WorldPlayer[];
  /** Current campaign theme — affects world generation (forest, dungeon, etc.) */
  theme?: string;
  /** Callback when a grid square is clicked */
  onSquareClick?: (x: number, z: number) => void;
  /** Chat bubble to display above a player token */
  chatBubble?: ChatBubble | null;
  /** Whether to show a Dungeon Master token */
  showDMToken?: boolean;
  /** Called every frame with screen positions of all tokens (for HTML overlays) */
  onTokenPositions?: (positions: TokenScreenPosition[]) => void;
}

// ─── Geometry Helpers ────────────────────────────────────────────────────────

function createTree(x: number, z: number): THREE.Group {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.5, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, flatShading: true });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 0.25, 0);
  group.add(trunk);

  // Foliage layers
  const foliageColors = [0x2d5a1e, 0x3a7a28, 0x1e4a12];
  const scales = [
    { radius: 0.35, height: 0.5, y: 0.6 },
    { radius: 0.28, height: 0.45, y: 0.9 },
    { radius: 0.18, height: 0.35, y: 1.15 },
  ];

  scales.forEach((s, i) => {
    const coneGeo = new THREE.ConeGeometry(s.radius, s.height, 7);
    const coneMat = new THREE.MeshStandardMaterial({
      color: foliageColors[i % foliageColors.length],
      flatShading: true,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, s.y, 0);
    cone.rotation.y = Math.random() * Math.PI;
    group.add(cone);
  });

  // Randomize
  const scale = 0.8 + Math.random() * 0.6;
  group.scale.set(scale, scale, scale);
  group.rotation.y = Math.random() * Math.PI * 2;
  group.position.set(x + 0.5, 0, z + 0.5);

  return group;
}

function createRock(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const count = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const geo = new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.15, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0, 0, 0.35 + Math.random() * 0.2),
      flatShading: true,
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(
      (Math.random() - 0.5) * 0.4,
      0.08 + Math.random() * 0.05,
      (Math.random() - 0.5) * 0.4,
    );
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.scale.set(
      0.8 + Math.random() * 0.6,
      0.6 + Math.random() * 0.5,
      0.8 + Math.random() * 0.6,
    );
    group.add(rock);
  }

  group.position.set(x + 0.5, 0, z + 0.5);
  return group;
}

function createBush(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const count = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 6, 5);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.25 + Math.random() * 0.1),
      flatShading: true,
    });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(
      (Math.random() - 0.5) * 0.3,
      0.1 + Math.random() * 0.05,
      (Math.random() - 0.5) * 0.3,
    );
    group.add(sphere);
  }

  group.position.set(x + 0.5, 0, z + 0.5);
  return group;
}

function createDMToken(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const dmColor = new THREE.Color(0x7c3aed);

  // Base platform (glowing magical circle)
  const discGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16);
  const discMat = new THREE.MeshStandardMaterial({
    color: dmColor,
    emissive: dmColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.8,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.02;
  group.add(disc);

  // Robe body (wider, flowing)
  const robeGeo = new THREE.CylinderGeometry(0.08, 0.25, 0.6, 8);
  const robeMat = new THREE.MeshStandardMaterial({ color: 0x2d1b69, flatShading: true });
  const robe = new THREE.Mesh(robeGeo, robeMat);
  robe.position.y = 0.3;
  group.add(robe);

  // Hood/head
  const hoodGeo = new THREE.SphereGeometry(0.14, 8, 6);
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x1a0e3e, flatShading: true });
  const hood = new THREE.Mesh(hoodGeo, hoodMat);
  hood.position.y = 0.65;
  group.add(hood);

  // Eyes (glowing dots)
  const eyeGeo = new THREE.SphereGeometry(0.025, 6, 4);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0xc084fc,
    emissiveIntensity: 2,
  });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.04, 0.66, 0.12);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.04, 0.66, 0.12);
  group.add(rightEye);

  // Wizard hat
  const hatGeo = new THREE.ConeGeometry(0.16, 0.35, 6);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x2d1b69, flatShading: true });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 0.9;
  group.add(hat);

  // Hat brim
  const brimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 8);
  const brimMat = new THREE.MeshStandardMaterial({ color: 0x3b2080, flatShading: true });
  const brim = new THREE.Mesh(brimGeo, brimMat);
  brim.position.y = 0.75;
  group.add(brim);

  // Staff
  const staffGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.9, 6);
  const staffMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, flatShading: true });
  const staff = new THREE.Mesh(staffGeo, staffMat);
  staff.position.set(0.2, 0.45, 0);
  staff.rotation.z = -0.15;
  group.add(staff);

  // Staff orb
  const orbGeo = new THREE.SphereGeometry(0.06, 8, 6);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0xc084fc,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.set(0.23, 0.92, 0);
  group.add(orb);

  // Floating name label
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(45, 27, 105, 0.8)';
  ctx.roundRect(0, 8, 256, 48, 8);
  ctx.fill();
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c084fc';
  ctx.fillText('🐉 Dungeon Master', 128, 42);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 1.2, 0);
  sprite.scale.set(1.2, 0.3, 1);
  group.add(sprite);

  group.position.set(x + 0.5, 0, z + 0.5);
  group.userData = { playerId: '__dm__', isDM: true };

  return group;
}

function createPlayerToken(player: WorldPlayer): THREE.Group {
  const group = new THREE.Group();
  const color = new THREE.Color(player.color);

  // Base platform (glowing disc)
  const discGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16);
  const discMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.7,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.02;
  group.add(disc);

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.25;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.12, 8, 6);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xf0d0b0,
    flatShading: true,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.55;
  group.add(head);

  // Helmet/hat (class indicator)
  const helmetGeo = new THREE.ConeGeometry(0.1, 0.15, 6);
  const helmetMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.y = 0.72;
  group.add(helmet);

  // Floating name label (sprite)
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.roundRect(0, 8, 256, 48, 8);
  ctx.fill();
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = player.color;
  ctx.fillText(player.name, 128, 42);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 1.0, 0);
  sprite.scale.set(1.0, 0.25, 1);
  group.add(sprite);

  group.position.set(player.x + 0.5, 0, player.z + 0.5);
  group.userData = { playerId: player.id };

  return group;
}

// ─── Grid Texture (generated via canvas) ─────────────────────────────────────

function createGridTexture(size: number): THREE.CanvasTexture {
  const res = 512;
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d')!;

  // Fill base
  ctx.fillStyle = '#1a2a15';
  ctx.fillRect(0, 0, res, res);

  // Draw subtle variation per cell
  const cellSize = res / size;
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const brightness = 0.08 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(50, 120, 50, ${brightness})`;
      ctx.fillRect(x * cellSize + 1, z * cellSize + 1, cellSize - 2, cellSize - 2);
    }
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(100, 180, 80, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i++) {
    const pos = (i / size) * res;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, res);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(res, pos);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Speech Bubble (canvas-rendered sprite) ─────────────────────────────────

function createSpeechBubble(text: string, speakerName: string, role: 'dm' | 'user' | 'system'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const maxWidth = 420;
  canvas.width = maxWidth;
  canvas.height = 200;
  const ctx = canvas.getContext('2d')!;

  // Word-wrap the text
  const fontSize = 18;
  const lineHeight = 22;
  const padding = 14;
  const maxTextWidth = maxWidth - padding * 2;

  ctx.font = `${fontSize}px Inter, sans-serif`;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
    if (lines.length >= 3) {
      currentLine = currentLine.slice(0, 30) + '…';
      break;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Compute bubble dimensions
  const nameHeight = 18;
  const bubbleHeight = padding + nameHeight + lines.length * lineHeight + padding;
  const tailHeight = 10;
  const totalHeight = bubbleHeight + tailHeight;

  // Resize canvas to fit
  canvas.height = totalHeight + 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bubble background
  const isDM = role === 'dm';
  const bgColor = isDM ? 'rgba(88, 28, 180, 0.92)' : 'rgba(15, 12, 30, 0.88)';
  const borderColor = isDM ? 'rgba(168, 120, 255, 0.7)' : 'rgba(139, 92, 246, 0.4)';

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, maxWidth - 4, bubbleHeight - 2, 10);
  ctx.fill();
  ctx.stroke();

  // Speech tail (triangle pointing down)
  const tailX = maxWidth / 2;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(tailX - 8, bubbleHeight - 2);
  ctx.lineTo(tailX, bubbleHeight + tailHeight);
  ctx.lineTo(tailX + 8, bubbleHeight - 2);
  ctx.fill();

  // Speaker name
  ctx.font = `bold 13px Inter, sans-serif`;
  ctx.fillStyle = isDM ? '#e0c0ff' : '#c084fc';
  ctx.textAlign = 'left';
  ctx.fillText(isDM ? '🐉 Dungeon Master' : `⚔ ${speakerName}`, padding, padding + 13);

  // Message text
  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, padding + nameHeight + (i + 1) * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);

  // Scale to world units (wider bubble)
  const aspect = canvas.width / canvas.height;
  const spriteHeight = 0.8 + lines.length * 0.15;
  sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);

  return sprite;
}

// ─── Main Component ──────────────────────────────────────────────────────────

const IsometricWorld = function IsometricWorld(
  { players = [], theme, onSquareClick, chatBubble, showDMToken = false, onTokenPositions }: IsometricWorldProps,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    playerGroup: THREE.Group;
    dmGroup: THREE.Group;
    propsGroup: THREE.Group;
    terrain: THREE.Mesh;
    animationId: number;
    hoverIndicator: THREE.Mesh;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    occupiedCells: Set<string>;
    chatBubbleSprite: THREE.Sprite | null;
    chatBubblePlayerId: string | null;
  } | null>(null);

  // Store latest callback in a ref to avoid re-creating the animation loop
  const onTokenPositionsRef = useRef(onTokenPositions);
  onTokenPositionsRef.current = onTokenPositions;

  // Track mouse for raycasting
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!sceneRef.current) return;
    sceneRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    sceneRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!sceneRef.current || !onSquareClick) return;
    const { raycaster, mouse, camera, terrain } = sceneRef.current;
    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObject(terrain);
    if (intersections.length > 0) {
      const pt = intersections[0].point;
      onSquareClick(Math.floor(pt.x), Math.floor(pt.z));
    }
  }, [onSquareClick]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(FOG_COLOR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.04);

    // Camera (isometric-ish perspective)
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(WORLD_SIZE * 0.8, WORLD_SIZE * 0.6, WORLD_SIZE * 0.8);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(WORLD_SIZE / 2, 0, WORLD_SIZE / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.minDistance = 4;
    controls.maxDistance = 25;
    controls.update();

    // Lighting
    const sun = new THREE.DirectionalLight(0xffe8cc, 2.5);
    sun.position.set(8, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -WORLD_SIZE;
    sun.shadow.camera.right = WORLD_SIZE;
    sun.shadow.camera.top = WORLD_SIZE;
    sun.shadow.camera.bottom = -WORLD_SIZE;
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0x6040a0, 0.6);
    scene.add(ambient);

    // Hemisphere light for sky/ground fill
    const hemi = new THREE.HemisphereLight(0x4060c0, 0x203010, 0.4);
    scene.add(hemi);

    // Point light for warmth
    const campfire = new THREE.PointLight(0xff8844, 1.5, 12);
    campfire.position.set(WORLD_SIZE / 2, 0.5, WORLD_SIZE / 2);
    scene.add(campfire);

    // Terrain
    const gridTex = createGridTexture(WORLD_SIZE);
    const terrainGeo = new THREE.BoxGeometry(WORLD_SIZE, 0.2, WORLD_SIZE);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      color: GROUND_COLOR,
      roughness: 0.95,
      metalness: 0.0,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(WORLD_SIZE / 2, -0.1, WORLD_SIZE / 2);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Edge walls (subtle border)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x15200e, flatShading: true });
    const wallGeos = [
      { geo: new THREE.BoxGeometry(WORLD_SIZE + 0.2, 0.5, 0.1), pos: [WORLD_SIZE / 2, 0.15, 0] },
      { geo: new THREE.BoxGeometry(WORLD_SIZE + 0.2, 0.5, 0.1), pos: [WORLD_SIZE / 2, 0.15, WORLD_SIZE] },
      { geo: new THREE.BoxGeometry(0.1, 0.5, WORLD_SIZE + 0.2), pos: [0, 0.15, WORLD_SIZE / 2] },
      { geo: new THREE.BoxGeometry(0.1, 0.5, WORLD_SIZE + 0.2), pos: [WORLD_SIZE, 0.15, WORLD_SIZE / 2] },
    ];
    wallGeos.forEach(({ geo, pos }) => {
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.set(pos[0], pos[1], pos[2]);
      scene.add(wall);
    });

    // Props group (trees, rocks, bushes)
    const propsGroup = new THREE.Group();
    scene.add(propsGroup);

    const occupiedCells = new Set<string>();

    // Place props
    const placeRandom = (count: number, factory: (x: number, z: number) => THREE.Group) => {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < count * 5) {
        const x = Math.floor(Math.random() * WORLD_SIZE);
        const z = Math.floor(Math.random() * WORLD_SIZE);
        const key = `${x},${z}`;
        if (!occupiedCells.has(key)) {
          occupiedCells.add(key);
          const obj = factory(x, z);
          obj.castShadow = true;
          propsGroup.add(obj);
          placed++;
        }
        attempts++;
      }
    };

    placeRandom(TREE_COUNT, createTree);
    placeRandom(ROCK_COUNT, createRock);
    placeRandom(BUSH_COUNT, createBush);

    // Player group
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // DM token group
    const dmGroup = new THREE.Group();
    scene.add(dmGroup);

    // Hover indicator
    const hoverGeo = new THREE.BoxGeometry(1, 0.05, 1);
    const hoverMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3,
    });
    const hoverIndicator = new THREE.Mesh(hoverGeo, hoverMat);
    hoverIndicator.visible = false;
    scene.add(hoverIndicator);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    // Particles (fireflies / ambient)
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = Math.random() * WORLD_SIZE;
      particlePositions[i * 3 + 1] = 0.3 + Math.random() * 2;
      particlePositions[i * 3 + 2] = Math.random() * WORLD_SIZE;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xaaffaa,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animation loop
    let time = 0;
    const animate = () => {
      const id = requestAnimationFrame(animate);
      sceneRef.current!.animationId = id;
      time += 0.01;

      controls.update();

      // Animate fireflies
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(time * 2 + i) * 0.002;
        positions[i * 3] += Math.sin(time + i * 0.5) * 0.001;
        positions[i * 3 + 2] += Math.cos(time + i * 0.7) * 0.001;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Animate campfire
      campfire.intensity = 1.2 + Math.sin(time * 5) * 0.3;

      // Hover indicator
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(terrain);
      if (hits.length > 0) {
        const gx = Math.floor(hits[0].point.x);
        const gz = Math.floor(hits[0].point.z);
        if (gx >= 0 && gx < WORLD_SIZE && gz >= 0 && gz < WORLD_SIZE) {
          hoverIndicator.position.set(gx + 0.5, 0.03, gz + 0.5);
          hoverIndicator.visible = true;
        } else {
          hoverIndicator.visible = false;
        }
      } else {
        hoverIndicator.visible = false;
      }

      // Bob player tokens
      playerGroup.children.forEach((child, idx) => {
        child.position.y = Math.sin(time * 3 + idx) * 0.03;
      });

      // Bob DM token
      dmGroup.children.forEach((child) => {
        child.position.y = Math.sin(time * 2) * 0.04;
      });

      // Bob chat bubble with the player token it's attached to
      if (sceneRef.current?.chatBubbleSprite && sceneRef.current.chatBubblePlayerId) {
        const targetToken = playerGroup.children.find(
          c => c.userData.playerId === sceneRef.current!.chatBubblePlayerId
        ) || dmGroup.children.find(
          c => c.userData.playerId === sceneRef.current!.chatBubblePlayerId
        );
        if (targetToken) {
          sceneRef.current.chatBubbleSprite.position.x = targetToken.position.x;
          sceneRef.current.chatBubbleSprite.position.y = 1.8 + targetToken.position.y;
          sceneRef.current.chatBubbleSprite.position.z = targetToken.position.z;
        }
      }

      // Project token positions to screen space for HTML overlays
      if (onTokenPositionsRef.current) {
        const results: { id: string; x: number; y: number; visible: boolean }[] = [];
        const tempVec = new THREE.Vector3();
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;
        const projectChild = (child: THREE.Object3D) => {
          const id = child.userData.playerId as string;
          if (!id) return;
          tempVec.set(child.position.x, child.position.y + 1.3, child.position.z);
          tempVec.project(camera);
          results.push({
            id,
            x: (tempVec.x * 0.5 + 0.5) * w,
            y: (-tempVec.y * 0.5 + 0.5) * h,
            visible: tempVec.z > 0 && tempVec.z < 1,
          });
        };
        playerGroup.children.forEach(projectChild);
        dmGroup.children.forEach(projectChild);
        onTokenPositionsRef.current(results);
      }

      renderer.render(scene, camera);
    };

    const animationId = requestAnimationFrame(animate);

    // Store refs
    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      playerGroup,
      dmGroup,
      propsGroup,
      terrain,
      animationId,
      hoverIndicator,
      raycaster,
      mouse,
      occupiedCells,
      chatBubbleSprite: null,
      chatBubblePlayerId: null,
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(sceneRef.current?.animationId || animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update player tokens when players change
  useEffect(() => {
    if (!sceneRef.current) return;
    const { playerGroup, occupiedCells } = sceneRef.current;

    // Clear existing player tokens
    while (playerGroup.children.length > 0) {
      const child = playerGroup.children[0];
      playerGroup.remove(child);
    }

    // Place player tokens
    players.forEach((player, index) => {
      // Find an unoccupied cell near the center for initial placement
      let x = player.x;
      let z = player.z;
      const key = `${x},${z}`;
      if (occupiedCells.has(key)) {
        // Find nearest free spot
        for (let r = 1; r < WORLD_SIZE / 2; r++) {
          let found = false;
          for (let dx = -r; dx <= r && !found; dx++) {
            for (let dz = -r; dz <= r && !found; dz++) {
              const nx = player.x + dx;
              const nz = player.z + dz;
              if (nx >= 0 && nx < WORLD_SIZE && nz >= 0 && nz < WORLD_SIZE) {
                const nkey = `${nx},${nz}`;
                if (!occupiedCells.has(nkey)) {
                  x = nx;
                  z = nz;
                  found = true;
                }
              }
            }
          }
          if (found) break;
        }
      }

      const token = createPlayerToken({ ...player, x, z });
      playerGroup.add(token);
    });
  }, [players]);

  // Manage DM token
  useEffect(() => {
    if (!sceneRef.current) return;
    const { dmGroup, occupiedCells } = sceneRef.current;

    // Clear existing DM tokens
    while (dmGroup.children.length > 0) {
      dmGroup.remove(dmGroup.children[0]);
    }

    if (!showDMToken) return;

    // Place DM token at a fixed position (center-front, offset from player tokens)
    let dmX = Math.floor(WORLD_SIZE / 2);
    let dmZ = 5;
    // Find a free spot if occupied
    const key = `${dmX},${dmZ}`;
    if (occupiedCells.has(key)) {
      for (let r = 1; r < 5; r++) {
        let found = false;
        for (let dx = -r; dx <= r && !found; dx++) {
          for (let dz = -r; dz <= r && !found; dz++) {
            const nx = dmX + dx;
            const nz = dmZ + dz;
            if (nx >= 0 && nx < WORLD_SIZE && nz >= 0 && nz < WORLD_SIZE) {
              const nkey = `${nx},${nz}`;
              if (!occupiedCells.has(nkey)) {
                dmX = nx;
                dmZ = nz;
                found = true;
              }
            }
          }
        }
        if (found) break;
      }
    }

    const dmToken = createDMToken(dmX, dmZ);
    dmGroup.add(dmToken);
  }, [showDMToken, players]);

  // Update chat bubble above player token
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, playerGroup, dmGroup } = sceneRef.current;

    // Remove existing bubble
    if (sceneRef.current.chatBubbleSprite) {
      scene.remove(sceneRef.current.chatBubbleSprite);
      sceneRef.current.chatBubbleSprite.material.map?.dispose();
      (sceneRef.current.chatBubbleSprite.material as THREE.SpriteMaterial).dispose();
      sceneRef.current.chatBubbleSprite = null;
      sceneRef.current.chatBubblePlayerId = null;
    }

    if (!chatBubble || !chatBubble.text) return;

    // Find the player token in the scene (check both player and DM groups)
    const targetToken = playerGroup.children.find(
      child => child.userData.playerId === chatBubble.playerId
    ) || dmGroup.children.find(
      child => child.userData.playerId === chatBubble.playerId
    );
    if (!targetToken) return;

    // Create new speech bubble
    const sprite = createSpeechBubble(chatBubble.text, chatBubble.speakerName, chatBubble.role);
    sprite.position.set(
      targetToken.position.x,
      1.8, // Float above the player token (name label is at 1.0)
      targetToken.position.z,
    );

    scene.add(sprite);
    sceneRef.current.chatBubbleSprite = sprite;
    sceneRef.current.chatBubblePlayerId = chatBubble.playerId;
  }, [chatBubble]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    />
  );
};

export default IsometricWorld;
