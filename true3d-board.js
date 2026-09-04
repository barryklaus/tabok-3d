import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SQRT3 = Math.sqrt(3);
const HEX_RADIUS = .72;
const PORTAL_R = 2.08;
const COLORS = { P: 0xa979c4, T: 0x55a8a0, G: 0xb1aa9c, B: 0x211d19, W: 0xe0c68e };
const PORTAL_LOOKS = {
  idle: [16, 1, new THREE.Color(0x53129a), new THREE.Color(0xd44dff)],
  rejected: [25, 1.28, new THREE.Color(0x8f174f), new THREE.Color(0xff4fb7)],
  reckoning: [34, 1.58, new THREE.Color(0x76112b), new THREE.Color(0xff326e)],
  crossing: [30, 1.42, new THREE.Color(0x176aaa), new THREE.Color(0x70f6ff)]
};
const PLAYER_ART = {
  misty: 'assets/traveler-0-0.png', cliff: 'assets/traveler-1-0.png',
  paige: 'assets/traveler-2-0.png', justin: 'assets/traveler-3-0.png',
  sue: 'assets/traveler-4-0.png', wanday: 'assets/traveler-5-0.png'
};

function parse(id) {
  const [q, r] = id.split(',').map(Number);
  return { q, r };
}

function idOf(q, r) { return q + ',' + r; }

function worldFor(id) {
  if (id === 'PORTAL') return new THREE.Vector3(0, .16, 0);
  const { q, r } = parse(id);
  const rr = r - 11;
  return new THREE.Vector3(SQRT3 * (q + rr / 2) * HEX_RADIUS, .16, 1.5 * rr * HEX_RADIUS);
}

function annularSegmentGeometry(innerRadius, outerRadius, span, depth) {
  const shape = new THREE.Shape(), steps = 5;
  for (let i = 0; i <= steps; i++) {
    const angle = -span / 2 + span * i / steps;
    const x = Math.sin(angle) * outerRadius, y = Math.cos(angle) * outerRadius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const angle = -span / 2 + span * i / steps;
    shape.lineTo(Math.sin(angle) * innerRadius, Math.cos(angle) * innerRadius);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSegments: 1, bevelSize: .035,
    bevelThickness: .035, curveSegments: 2
  });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function makePortalRuneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d'), cx = 512, cy = 512;
  ctx.clearRect(0, 0, 1024, 1024);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 18;
  const patterns = [
    [[0,-1],[0,1],[-.62,.15],[.62,.15]],
    [[-.62,-.72],[.55,.72],[-.55,.72],[.62,-.72]],
    [[-.66,-.62],[.48,-.15],[-.48,.18],[.66,.65]],
    [[0,-.9],[.62,0],[0,.9],[-.62,0],[0,-.9]],
    [[-.62,-.68],[-.15,0],[-.62,.68],[.62,.68],[.15,0],[.62,-.68]],
    [[-.7,0],[.7,0],[0,-.82],[0,.82]],
    [[-.62,-.72],[0,-.22],[.62,-.72],[0,.78],[-.62,-.72]],
    [[-.68,-.7],[.68,-.7],[-.42,.1],[.48,.1],[-.68,.72],[.68,.72]]
  ];
  for (let i = 0; i < 20; i++) {
    const angle = i / 20 * Math.PI * 2, radius = 390;
    ctx.save();
    ctx.translate(cx + Math.sin(angle) * radius, cy - Math.cos(angle) * radius);
    ctx.rotate(angle);
    ctx.beginPath();
    const points = patterns[i % patterns.length], scale = 34;
    points.forEach(([x,y], n) => n ? ctx.lineTo(x * scale, y * scale) : ctx.moveTo(x * scale, y * scale));
    ctx.stroke();
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeStoneHeightTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(size, size);
  // Deterministic layered stone grain: no downloads and identical on every client.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const broad = Math.sin(x * .075) * 15 + Math.cos(y * .061) * 14 + Math.sin((x + y) * .031) * 10;
      const fine = Math.sin(x * .39 + Math.cos(y * .13) * 2.4) * 7 + Math.cos(y * .34) * 5;
      const grain = ((x * 73 + y * 151 + x * y * 13) % 29) - 14;
      const value = Math.max(38, Math.min(218, 128 + broad + fine + grain * .55));
      const offset = (y * size + x) * 4;
      image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  // Recessed cracks cut through the generated relief.
  ctx.strokeStyle = 'rgb(24,24,24)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    let seed = (i * 97 + 41) % size;
    ctx.lineWidth = 1 + i % 3;
    ctx.beginPath();
    ctx.moveTo(seed, -4);
    for (let y = 0; y <= size + 8; y += 22) {
      seed = (seed * 53 + 19) % size;
      ctx.lineTo(seed, y);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.4, 1.4);
  texture.anisotropy = 4;
  return texture;
}

const PORTAL_VERTEX = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`;

const PORTAL_FRAGMENT = `
  uniform float uTime;
  uniform float uPower;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
  }
  void main(){
    vec2 p=(vUv-.5)*2.;
    float r=length(p), a=atan(p.y,p.x), t=uTime;
    if(r>1.) discard;
    float n=noise(p*5.5+vec2(t*.12,-t*.15));
    float spiralA=.5+.5*sin(a*7.-r*18.+t*2.25+n*3.2);
    float spiralB=.5+.5*sin(a*4.+r*24.-t*1.55+n*4.1);
    float veins=pow(max(spiralA*spiralB,0.),2.35);
    float rim=pow(smoothstep(.42,1.,r),2.0);
    float pulse=.84+.16*sin(t*2.1-r*10.);
    float energy=(.12+veins*.9+n*.18)*rim*pulse*uPower;
    float abyss=1.-smoothstep(.02,.58,r);
    vec3 color=mix(vec3(.002,.001,.008),uColorA,energy*.72);
    color+=uColorB*energy*energy*1.25;
    color=mix(color,vec3(.001,0.,.005),abyss*.82);
    float stars=step(.992,hash(floor((p+2.)*92.+floor(t*.35))))*(1.-r)*.8;
    color+=uColorB*stars;
    gl_FragColor=vec4(color,1.);
  }
`;

const PORTAL_MIST_FRAGMENT = `
  uniform float uTime;
  uniform float uPower;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(91.7,251.3)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
  void main(){
    vec2 p=(vUv-.5)*2.; float r=length(p),a=atan(p.y,p.x),t=uTime;
    if(r>.995||r<.61)discard;
    float turbulence=noise(vec2(a*3.2-r*4.+t*.32,r*9.-t*.44));
    float tongues=.5+.5*sin(a*13.+r*22.-t*3.1+turbulence*5.);
    float edge=smoothstep(.61,.76,r)*(1.-smoothstep(.88,.995,r));
    float alpha=edge*(.12+tongues*.48+turbulence*.26)*uPower;
    vec3 color=mix(uColorA,uColorB,tongues);
    gl_FragColor=vec4(color,alpha*.72);
  }
`;

function disposeObject(root) {
  root.traverse(node => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => material.dispose());
    }
  });
}

export class TabokTrue3DBoard {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.isTrue3D = true;
    this.cells = new Map();
    this.pickables = [];
    this.actors = new Map();
    this.itemRoot = new THREE.Group();
    this.actorRoot = new THREE.Group();
    this.highlightRoot = new THREE.Group();
    this.startedAt = performance.now();
    this.pointerStart = null;
    this.hovered = null;
    this.stateSignature = '';
    this.portalState = 'idle';
    this.ready = this.init();
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.48;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050305);
    this.scene.fog = new THREE.FogExp2(0x070508, .014);
    this.camera = new THREE.PerspectiveCamera(42, 1, .1, 90);
    this.camera.position.set(0, 18.5, 23.5);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, .15, 0);
    this.controls.enableRotate = true;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .075;
    this.controls.enablePan = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 38;
    this.controls.minPolarAngle = .28;
    this.controls.maxPolarAngle = 1.39;
    this.controls.rotateSpeed = .62;
    this.controls.zoomSpeed = .8;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    this.controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    this.canvas.tabIndex = 0;
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('contextmenu', event => event.preventDefault());

    this.textureLoader = new THREE.TextureLoader();
    await this.loadTextures();
    this.stoneHeightTexture = makeStoneHeightTexture();
    this.makeLights();
    this.makeGround();
    this.makeBoard();
    this.makeRuinRing();
    this.makePortal();
    this.scene.add(this.itemRoot, this.actorRoot, this.highlightRoot);
    this.bindInput();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement);
    this.resize();
    this.renderer.setAnimationLoop(() => this.render());
    document.documentElement.classList.add('true3d-active');
    document.documentElement.dataset.gpuBackend = 'three-webgl';
    window.dispatchEvent(new CustomEvent('tabok-true3d-ready'));
    return this;
  }

  loadTexture(url) {
    return new Promise((resolve, reject) => this.textureLoader.load(url, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      resolve(texture);
    }, undefined, reject));
  }

  async loadTextures() {
    const sources = {
      P: 'assets/exp-purple-stone-v1.png', T: 'assets/exp-teal-stone-v1.png',
      G: 'assets/exp-grey-stone-v1.png', wall: 'assets/ruin-wall-texture.png'
    };
    this.textures = {};
    await Promise.all(Object.entries(sources).map(async ([key, url]) => { this.textures[key] = await this.loadTexture(url); }));
    for (const texture of Object.values(this.textures)) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(keyTextureRepeat(texture), keyTextureRepeat(texture));
    }
  }

  makeLights() {
    this.scene.add(new THREE.HemisphereLight(0xb8a9d5, 0x2d1710, 2.15));
    const moon = new THREE.DirectionalLight(0xc3afff, 3.5);
    moon.position.set(-8, 17, 9);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = moon.shadow.camera.bottom = -19;
    moon.shadow.camera.right = moon.shadow.camera.top = 19;
    this.scene.add(moon);
    [[-12, 2, -9], [12, 2, -9], [-13, 2, 8], [13, 2, 8]].forEach(([x, y, z]) => {
      const light = new THREE.PointLight(0xffa34d, 25, 9, 2);
      light.position.set(x, y, z);
      this.scene.add(light);
    });
  }

  makeGround() {
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(17.1, 96),
      new THREE.MeshStandardMaterial({ map: this.textures.wall, bumpMap: this.stoneHeightTexture, bumpScale: .11, color: 0x2a211c, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.08;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(16.75, .34, 8, 96),
      new THREE.MeshStandardMaterial({ color: 0x21140c, roughness: .72, metalness: .25 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = .08;
    rim.receiveShadow = true;
    this.scene.add(rim);
  }

  makeBoard() {
    const topMaterials = {};
    const sideMaterials = {};
    for (const type of ['P', 'T', 'G', 'B', 'W']) {
      topMaterials[type] = new THREE.MeshStandardMaterial({
        map: this.textures[type] || this.textures.wall, color: COLORS[type],
        bumpMap: this.stoneHeightTexture, bumpScale: type === 'W' ? .055 : .042,
        emissive: type === 'B' ? 0x000000 : COLORS[type], emissiveIntensity: type === 'W' ? .08 : .045,
        roughness: type === 'W' ? .68 : .9, metalness: type === 'W' ? .18 : .04
      });
      sideMaterials[type] = new THREE.MeshStandardMaterial({ color: type === 'B' ? 0x090807 : 0x201711, roughness: .96 });
    }
    const geometries = {
      playable: new THREE.CylinderGeometry(HEX_RADIUS * .94, HEX_RADIUS * .98, .18, 6, 1, false),
      blocked: new THREE.CylinderGeometry(HEX_RADIUS * .94, HEX_RADIUS * .98, .28, 6, 1, false),
      entry: new THREE.CylinderGeometry(HEX_RADIUS, HEX_RADIUS * 1.02, .24, 6, 1, false)
    };
    for (const cell of this.config.cells) {
      const id = idOf(cell.q, cell.r);
      const portalDistance = Math.max(Math.abs(cell.q), Math.abs(cell.r - 11), Math.abs(cell.q + cell.r - 11));
      if (cell.type === 'B' && portalDistance <= 1) continue;
      const playable = 'PTG'.includes(cell.type);
      const geometry = cell.type === 'W' ? geometries.entry : playable ? geometries.playable : geometries.blocked;
      const mesh = new THREE.Mesh(geometry, [sideMaterials[cell.type], topMaterials[cell.type], sideMaterials[cell.type]]);
      mesh.position.copy(worldFor(id));
      mesh.position.y = cell.type === 'B' ? .06 : .02;
      // CylinderGeometry starts point-top, matching TABOK's original board and
      // the axial coordinate spacing used by worldFor().
      mesh.rotation.y = 0;
      mesh.receiveShadow = true;
      mesh.castShadow = cell.type !== 'B';
      mesh.userData = { id, playable };
      this.scene.add(mesh);
      this.cells.set(id, mesh);
      if (playable || cell.type === 'W') this.pickables.push(mesh);
    }
  }

  makeRuinRing() {
    const material = new THREE.MeshStandardMaterial({ map: this.textures.wall, bumpMap: this.stoneHeightTexture, bumpScale: .13, color: 0x30251e, roughness: 1 });
    const columnGeo = new THREE.BoxGeometry(1.15, 3.8, .9);
    for (let i = 0; i < 28; i++) {
      const angle = i / 28 * Math.PI * 2;
      const column = new THREE.Mesh(columnGeo, material);
      column.position.set(Math.sin(angle) * 17.2, 1.75, Math.cos(angle) * 17.2);
      column.rotation.y = angle;
      column.castShadow = column.receiveShadow = true;
      this.scene.add(column);
      if (i % 4 === 0) {
        const flame = new THREE.PointLight(0xff7a32, 17, 5, 2);
        flame.position.set(Math.sin(angle) * 15.8, 1.25, Math.cos(angle) * 15.8);
        this.scene.add(flame);
      }
    }
  }

  makePortal() {
    this.portal = new THREE.Group();
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.62, .34, 64),
      new THREE.MeshStandardMaterial({ color: 0x100b0e, bumpMap: this.stoneHeightTexture, bumpScale: .06, roughness: .82, metalness: .28 })
    );
    well.position.y = .08;
    well.receiveShadow = true;
    this.portal.add(well);

    this.portalStoneMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.wall, bumpMap: this.stoneHeightTexture, bumpScale: .055,
      color: 0x30282f, emissive: 0x3b0a55,
      emissiveIntensity: .12, roughness: .9, metalness: .12
    });
    const segmentCount = 20, span = Math.PI * 2 / segmentCount * .91;
    const stones = new THREE.InstancedMesh(
      annularSegmentGeometry(1.78, 2.5, span, .3),
      this.portalStoneMaterial,
      segmentCount
    );
    const transform = new THREE.Matrix4();
    for (let i = 0; i < segmentCount; i++) {
      transform.makeRotationY(i / segmentCount * Math.PI * 2);
      transform.setPosition(0, .48 + (i % 3 === 0 ? .025 : 0), 0);
      stones.setMatrixAt(i, transform);
    }
    stones.castShadow = stones.receiveShadow = true;
    stones.userData.pickPortal = true;
    this.portal.add(stones);

    this.portalCapMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.wall,
      displacementMap: this.stoneHeightTexture,
      displacementScale: .105,
      displacementBias: -.045,
      bumpMap: this.stoneHeightTexture,
      bumpScale: .075,
      color: 0x3d333c,
      emissive: 0x35084d,
      emissiveIntensity: .09,
      roughness: .91,
      metalness: .1,
      side: THREE.DoubleSide
    });
    const capGeometry = new THREE.RingGeometry(1.82, 2.46, 8, 4, -span / 2, span);
    capGeometry.rotateX(-Math.PI / 2);
    this.portalCaps = new THREE.InstancedMesh(capGeometry, this.portalCapMaterial, segmentCount);
    for (let i = 0; i < segmentCount; i++) {
      transform.makeRotationY(i / segmentCount * Math.PI * 2);
      transform.setPosition(0, .525 + (i % 3 === 0 ? .025 : 0), 0);
      this.portalCaps.setMatrixAt(i, transform);
    }
    this.portalCaps.receiveShadow = true;
    this.portalCaps.userData.pickPortal = true;
    this.portal.add(this.portalCaps);

    const lipMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.wall, bumpMap: this.stoneHeightTexture, bumpScale: .045,
      color: 0x3b3039, emissive: 0x3b0a55,
      emissiveIntensity: .14, roughness: .82, metalness: .2
    });
    this.portalLips = [
      new THREE.Mesh(new THREE.TorusGeometry(1.79, .095, 8, 96), lipMaterial),
      new THREE.Mesh(new THREE.TorusGeometry(2.49, .075, 8, 96), lipMaterial)
    ];
    this.portalLips.forEach(lip => {
      lip.rotation.x = Math.PI / 2;
      lip.position.y = .48;
      lip.castShadow = lip.receiveShadow = true;
      lip.userData.pickPortal = true;
      this.portal.add(lip);
    });

    this.portalEnergyMaterial = new THREE.MeshBasicMaterial({
      color: 0xd561ff, transparent: true, opacity: .78,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    this.portalEnergyRims = [
      new THREE.Mesh(new THREE.TorusGeometry(1.765, .026, 6, 96), this.portalEnergyMaterial),
      new THREE.Mesh(new THREE.TorusGeometry(2.465, .018, 6, 96), this.portalEnergyMaterial)
    ];
    this.portalEnergyRims.forEach(rim => {
      rim.rotation.x = Math.PI / 2;
      rim.position.y = .55;
      this.portal.add(rim);
    });

    this.portalVortexMaterial = new THREE.ShaderMaterial({
      vertexShader: PORTAL_VERTEX, fragmentShader: PORTAL_FRAGMENT,
      uniforms: {
        uTime: { value: 0 }, uPower: { value: 1 },
        uColorA: { value: new THREE.Color(0x53129a) },
        uColorB: { value: new THREE.Color(0xd44dff) }
      },
      side: THREE.DoubleSide
    });
    this.portalVortex = new THREE.Mesh(new THREE.CircleGeometry(1.79, 96), this.portalVortexMaterial);
    this.portalVortex.rotation.x = -Math.PI / 2;
    this.portalVortex.position.y = .35;
    this.portalVortex.userData.pickPortal = true;
    this.portal.add(this.portalVortex);

    this.portalMistMaterial = new THREE.ShaderMaterial({
      vertexShader: PORTAL_VERTEX, fragmentShader: PORTAL_MIST_FRAGMENT,
      uniforms: {
        uTime: { value: 0 }, uPower: { value: 1 },
        uColorA: { value: new THREE.Color(0x6c20d5) },
        uColorB: { value: new THREE.Color(0xff63ee) }
      },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.portalMist = new THREE.Mesh(new THREE.CircleGeometry(2.03, 96), this.portalMistMaterial);
    this.portalMist.rotation.x = -Math.PI / 2;
    this.portalMist.position.y = .53;
    this.portal.add(this.portalMist);

    this.portalRuneMaterial = new THREE.MeshBasicMaterial({
      map: makePortalRuneTexture(), color: 0xc961ff, transparent: true,
      opacity: .9, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.portalRunes = new THREE.Mesh(new THREE.CircleGeometry(2.48, 96), this.portalRuneMaterial);
    this.portalRunes.rotation.x = -Math.PI / 2;
    this.portalRunes.position.y = .535;
    this.portal.add(this.portalRunes);

    this.portalKeystones = [];
    const keystoneGeometry = new THREE.BoxGeometry(.72, .3, .82, 4, 2, 4);
    const keystoneMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.wall, displacementMap: this.stoneHeightTexture,
      displacementScale: .035, displacementBias: -.012,
      bumpMap: this.stoneHeightTexture, bumpScale: .065,
      color: 0x665166, emissive: 0x501173,
      emissiveIntensity: .42, roughness: .78, metalness: .18
    });
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2, stone = new THREE.Mesh(keystoneGeometry, keystoneMaterial);
      stone.position.set(Math.sin(angle) * 2.47, .52, Math.cos(angle) * 2.47);
      stone.rotation.y = angle;
      stone.castShadow = stone.receiveShadow = true;
      stone.userData.pickPortal = true;
      this.portal.add(stone);
      this.portalKeystones.push(stone);
    }

    this.portalDebris = [];
    const debrisGeometry = new THREE.DodecahedronGeometry(.1, 0);
    const debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x19121c, emissive: 0x501173, emissiveIntensity: .28, roughness: .94 });
    for (let i = 0; i < 12; i++) {
      const shard = new THREE.Mesh(debrisGeometry, debrisMaterial);
      shard.scale.setScalar(.55 + (i % 4) * .24);
      shard.userData.portalDebris = {
        angle: i / 12 * Math.PI * 2, radius: 1.18 + (i % 5) * .13,
        speed: (i % 2 ? -.13 : .17) * (1 + (i % 3) * .12),
        height: .72 + (i % 4) * .16, phase: i * 1.71
      };
      this.portal.add(shard);
      this.portalDebris.push(shard);
    }

    this.portalLight = new THREE.PointLight(0xb345ff, 16, 7, 2);
    this.portalLight.position.y = 1.35;
    this.portal.add(this.portalLight);
    this.portal.userData.pickPortal = true;
    this.scene.add(this.portal);
    this.pickables.push(well, stones, this.portalCaps, this.portalVortex, ...this.portalLips, ...this.portalKeystones);
    [well, stones, this.portalCaps, this.portalVortex, ...this.portalLips, ...this.portalKeystones].forEach(mesh => { mesh.userData.pickPortal = true; });
  }

  bindInput() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.canvas.addEventListener('pointerdown', event => { this.pointerStart = { x: event.clientX, y: event.clientY }; });
    this.canvas.addEventListener('pointermove', event => {
      if (this.pointerStart && Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 5) return;
      const hit = this.pick(event);
      const object = hit?.object;
      const id = object?.userData?.id || (object?.userData?.pickPortal ? 'PORTAL' : null);
      if (id !== this.hovered) {
        this.hovered = id;
        this.canvas.style.cursor = id ? 'pointer' : 'grab';
        this.highlightRoot.children.forEach(child => child.scale.setScalar(child.userData.id === id ? 1.12 : 1));
      }
    });
    this.canvas.addEventListener('pointerup', event => {
      const start = this.pointerStart;
      this.pointerStart = null;
      if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
      const hit = this.pick(event);
      if (!hit) return;
      if (hit.object.userData.pickPortal) this.config.onPortal?.();
      else if (hit.object.userData.id) this.config.onHex?.(hit.object.userData.id);
    });
    this.canvas.addEventListener('pointerleave', () => { this.pointerStart = null; this.canvas.style.cursor = 'grab'; });
  }

  pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    this.pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.pickables, false)[0] || null;
  }

  makeSprite(url, width, height, centerY = .04) {
    const texture = this.textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: .035, depthWrite: false }));
    sprite.center.set(.5, centerY);
    sprite.scale.set(width, height, 1);
    sprite.position.y = .13;
    sprite.castShadow = true;
    return sprite;
  }

  makeActor(actor) {
    const group = new THREE.Group();
    const major = actor.major;
    const color = new THREE.Color(actor.color || (major ? '#d842db' : '#ef4f9c'));
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(major ? .68 : .5, major ? .72 : .54, .16, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: actor.active ? .72 : .25, roughness: .4, metalness: .5 })
    );
    base.position.y = .12;
    // CylinderGeometry is point-top by default, matching the original board.
    base.rotation.y = 0;
    base.castShadow = base.receiveShadow = true;
    group.add(base);
    let sprite, groundY=.15;
    if (actor.kind === 'player') sprite = this.makeSprite(PLAYER_ART[actor.charId] || PLAYER_ART.misty, 1.18, 1.65);
    else if (major) sprite = this.makeSprite('assets/major-monster-fullbody-v1.png', 1.8, 2.65);
    else {
      // The source is a four-frame horizontal strip. Crop exactly one frame and
      // anchor its transparent lower margin to the top of the hexagonal plinth.
      sprite = this.makeSprite('assets/monster-sprite.png', 1.34, 1.5, .2);
      sprite.material.map.repeat.set(1 / 4, 1);
      sprite.material.map.offset.set(0,0);
      sprite.center.x=.47;
      groundY=.2;
    }
    sprite.position.y = groundY;
    group.add(sprite);
    group.position.copy(worldFor(actor.pos));
    group.userData.actorId = actor.id;
    this.actorRoot.add(group);
    this.actors.set(actor.id, group);
  }

  clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeObject(child);
    }
  }

  syncState(state) {
    if (!state) return;
    const signature = JSON.stringify(state);
    if (signature === this.stateSignature) return;
    this.stateSignature = signature;
    this.clearGroup(this.actorRoot);
    this.clearGroup(this.itemRoot);
    this.clearGroup(this.highlightRoot);
    this.actors.clear();
    state.players.forEach(player => this.makeActor({ ...player, kind: 'player' }));
    state.monsters.forEach(monster => this.makeActor({ ...monster, kind: 'monster' }));
    state.equipment.forEach(([pos, items]) => items.forEach((item, index) => {
      const sprite = this.makeSprite(item === 'S' ? 'assets/shield-isolated.png' : 'assets/armor-isolated.png', .62, .76, .08);
      sprite.position.copy(worldFor(pos));
      sprite.position.x += (index - (items.length - 1) / 2) * .32;
      sprite.position.y = .2;
      this.itemRoot.add(sprite);
    }));
    state.runes.forEach(([pos, count]) => {
      if (count < 1) return;
      const die = new THREE.Mesh(
        new THREE.DodecahedronGeometry(.28, 0),
        new THREE.MeshStandardMaterial({ color: 0x7652c8, emissive: 0x6d3ddb, emissiveIntensity: 1.3, roughness: .32, metalness: .48 })
      );
      die.position.copy(worldFor(pos));
      die.position.y = .55;
      die.userData.rune = true;
      this.itemRoot.add(die);
    });
    state.legal.forEach((id, index) => {
      const color = new THREE.Color(index === 0 ? 0xffffff : state.turnColor || '#ffd36b');
      const geometry = new THREE.RingGeometry(.52, .69, 6);
      geometry.rotateX(-Math.PI / 2);
      const ring = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .88, side: THREE.DoubleSide, depthWrite: false })
      );
      // Rotate around the board's vertical axis; rotating the original plane's
      // Z axis produced the visibly mismatched hex angle at oblique views.
      ring.rotation.y = Math.PI / 6;
      ring.position.copy(worldFor(id));
      ring.position.y = .25;
      ring.userData.id = id;
      this.highlightRoot.add(ring);
    });
    if (state.portalLegal) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.28, 2.42, 64),
        new THREE.MeshBasicMaterial({ color: 0xffe3a0, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = .23;
      ring.userData.id = 'PORTAL';
      this.highlightRoot.add(ring);
    }
  }

  setPortalState(state) { this.portalState = state || 'idle'; }

  setQuality(quality = 'auto') {
    this.quality = quality;
    const ratioCap = quality === 'ultra' ? 1 : quality === 'lite' ? 1.25 : quality === 'full' ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, ratioCap));
    this.renderer.shadowMap.enabled = quality !== 'ultra';
    if (this.portalCapMaterial) {
      this.portalCapMaterial.displacementScale = quality === 'ultra' ? .035 : quality === 'lite' ? .065 : .105;
      this.portalCapMaterial.bumpScale = quality === 'ultra' ? .035 : .075;
    }
    this.resize();
  }

  resetCamera() {
    this.camera.position.set(0, 18.5, 23.5);
    this.controls.target.set(0, .15, 0);
    this.controls.update();
  }

  orbitCamera(direction = 1) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 10);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  animateActor(id, from, to, duration = 320) {
    const actor = this.actors.get(id);
    if (!actor) return Promise.resolve();
    const start = worldFor(from), end = worldFor(to), started = performance.now();
    return new Promise(resolve => {
      const step = now => {
        const t = Math.min(1, (now - started) / duration);
        const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        actor.position.lerpVectors(start, end, eased);
        actor.position.y += Math.sin(Math.PI * eased) * .58;
        if (t < 1) requestAnimationFrame(step); else { actor.position.copy(end); resolve(); }
      };
      requestAnimationFrame(step);
    });
  }

  actorScreenPoint(id,height=.72) {
    const actor=this.actors.get(id);
    if(!actor||!this.camera||!this.canvas)return null;
    const point=actor.position.clone();
    point.y+=height;
    point.project(this.camera);
    const rect=this.canvas.getBoundingClientRect();
    return {x:rect.left+(point.x+1)*rect.width/2,y:rect.top+(1-point.y)*rect.height/2};
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    const time = (performance.now() - this.startedAt) / 1000;
    this.controls.update();
    const look = PORTAL_LOOKS[this.portalState] || PORTAL_LOOKS.idle;
    const intensity = look[0] * (.94 + Math.sin(time * 2.15) * .06);
    this.portalLight.intensity += (intensity - this.portalLight.intensity) * .06;
    this.portalVortexMaterial.uniforms.uTime.value = time;
    this.portalMistMaterial.uniforms.uTime.value = time;
    this.portalVortexMaterial.uniforms.uPower.value += (look[1] - this.portalVortexMaterial.uniforms.uPower.value) * .045;
    this.portalMistMaterial.uniforms.uPower.value = this.portalVortexMaterial.uniforms.uPower.value;
    const colorA = look[2], colorB = look[3];
    this.portalVortexMaterial.uniforms.uColorA.value.lerp(colorA, .04);
    this.portalVortexMaterial.uniforms.uColorB.value.lerp(colorB, .04);
    this.portalMistMaterial.uniforms.uColorA.value.copy(this.portalVortexMaterial.uniforms.uColorA.value);
    this.portalMistMaterial.uniforms.uColorB.value.copy(this.portalVortexMaterial.uniforms.uColorB.value);
    this.portalRuneMaterial.color.lerp(colorB, .045);
    this.portalRuneMaterial.opacity = .76 + Math.sin(time * 2.35) * .16;
    this.portalEnergyMaterial.color.lerp(colorB, .045);
    this.portalEnergyMaterial.opacity = .64 + Math.sin(time * 2.9) * .2;
    this.portalStoneMaterial.emissive.lerp(colorA, .035);
    this.portalStoneMaterial.emissiveIntensity = .06 + look[1] * .07 + Math.sin(time * 1.7) * .025;
    this.portalCapMaterial.emissive.lerp(colorA, .035);
    this.portalCapMaterial.emissiveIntensity = .045 + look[1] * .055 + Math.sin(time * 1.7) * .02;
    this.portalRunes.rotation.z = time * .025;
    this.portalMist.rotation.z = -time * .055;
    this.portalDebris.forEach((shard, index) => {
      const data = shard.userData.portalDebris, angle = data.angle + time * data.speed;
      shard.position.set(Math.sin(angle) * data.radius, data.height + Math.sin(time * 1.35 + data.phase) * .13, Math.cos(angle) * data.radius);
      shard.rotation.set(time * (.18 + index * .007), time * (.25 - index * .005), time * .12);
    });
    this.itemRoot.children.forEach((item, index) => {
      if (item.userData.rune) { item.rotation.y = time * .72 + index; item.position.y = .5 + Math.sin(time * 1.8 + index) * .09; }
    });
    this.renderer.render(this.scene, this.camera);
  }
}

function keyTextureRepeat() { return 1; }
