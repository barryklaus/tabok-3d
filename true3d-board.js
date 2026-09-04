import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SQRT3 = Math.sqrt(3);
const HEX_RADIUS = .72;
const PORTAL_R = 2.08;
const COLORS = { P: 0xa979c4, T: 0x55a8a0, G: 0xb1aa9c, B: 0x211d19, W: 0xe0c68e };
// Keep the grey network at the same perceived value as purple and teal even
// when it catches the moon and temple lights.
const TILE_TINTS = { P: 0xe2d9e7, T: 0xc7d7d0, G: 0x817971, B: 0x4b4239, W: 0xf0dfbd };
const TILE_SIDES = { P: 0x211627, T: 0x142724, G: 0x29251f, B: 0x080706, W: 0x49371f };
const PORTAL_LOOKS = {
  idle: [23, 1, new THREE.Color(0x53129a), new THREE.Color(0xd44dff)],
  rejected: [34, 1.28, new THREE.Color(0x8f174f), new THREE.Color(0xff4fb7)],
  reckoning: [43, 1.58, new THREE.Color(0x76112b), new THREE.Color(0xff326e)],
  crossing: [38, 1.42, new THREE.Color(0x176aaa), new THREE.Color(0x70f6ff)]
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
    const angle = i / 20 * Math.PI * 2, radius = 466;
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

function makeLanternGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(255,238,174,1)');
  gradient.addColorStop(.16, 'rgba(255,174,73,.82)');
  gradient.addColorStop(.48, 'rgba(255,91,26,.22)');
  gradient.addColorStop(1, 'rgba(255,54,12,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
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

function makeTileTextureVariant(source, turn) {
  const texture = source.clone();
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.center.set(.5, .5);
  texture.rotation = turn * Math.PI / 3;
  texture.repeat.set(1.08, 1.08);
  texture.needsUpdate = true;
  return texture;
}

function tileVariantFor(q, r) {
  // Stable on every client, so multiplayer boards remain visually identical.
  return Math.abs(q * 17 + r * 31 + q * r * 7) % 6;
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

const DOME_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  void main(){
    vUv=uv;
    vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
    vNormalView=normalize(normalMatrix*normal);
    vViewDirection=normalize(-viewPosition.xyz);
    gl_Position=projectionMatrix*viewPosition;
  }
`;

const DOME_FRAGMENT = `
  uniform float uTime;
  uniform float uPower;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  void main(){
    float facing=max(dot(normalize(vNormalView),normalize(vViewDirection)),0.0);
    float fresnel=pow(1.0-facing,2.35);
    float branchA=pow(1.0-abs(sin(vUv.x*35.0+sin(vUv.y*19.0+uTime*.9)*2.2)),42.0);
    float branchB=pow(1.0-abs(sin((vUv.x+vUv.y)*26.0-cos(vUv.x*17.0-uTime*.7)*1.8)),48.0);
    float pulse=.78+.22*sin(uTime*2.1+vUv.y*8.0);
    float lightning=(branchA+branchB)*(.12+fresnel*.38)*pulse;
    float alpha=(.035+fresnel*.29+lightning*.72)*uPower;
    vec3 color=uColor*(.34+fresnel*1.28+lightning*2.35);
    gl_FragColor=vec4(color,clamp(alpha,0.0,.72));
  }
`;

const FAULTLINE_VERTEX = `
  varying vec2 vUv;
  void main(){
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`;

const FAULTLINE_FRAGMENT = `
  uniform float uTime;
  uniform float uMajor;
  uniform float uQuality;
  varying vec2 vUv;
  float hash11(float p){return fract(sin(p*127.1)*43758.5453123);}
  void main(){
    vec2 p=(vUv-.5)*2.0;
    float radius=length(p);
    float edge=1.0-smoothstep(.78,1.0,radius);
    float core=exp(-radius*3.25);
    float breath=.84+.16*sin(uTime*(uMajor>.5?2.15:.72));
    float base=(mix(.035,.09,uMajor)+core*mix(.105,.245,uMajor))*breath*edge;

    float cycle=mix(8.7,3.65,uMajor);
    float epoch=floor(uTime/cycle);
    float phase=fract(uTime/cycle);
    float strike=smoothstep(.006,.018,phase)*(1.0-smoothstep(.055,.092,phase));
    float seed=hash11(epoch+19.7);
    float angle=seed*6.2831853;
    float theta=atan(p.y,p.x);
    float delta=atan(sin(theta-angle),cos(theta-angle));
    float jag=.052*sin(radius*39.0+seed*21.0)+.023*sin(radius*83.0+seed*9.0);
    float trunk=1.0-smoothstep(.018,.062,abs(delta+jag));
    float forkMask=smoothstep(.31,.43,radius);
    float forkA=(1.0-smoothstep(.014,.052,abs(delta+jag-(radius-.31)*.28)))*forkMask;
    float forkB=(1.0-smoothstep(.014,.052,abs(delta+jag+(radius-.31)*.23)))*forkMask;
    float bolt=max(trunk,max(forkA,forkB))*(1.0-smoothstep(.9,.99,radius));
    float lightning=bolt*strike*uQuality*edge;
    vec3 quiet=mix(vec3(.20,.025,.34),vec3(.43,.055,.68),core);
    vec3 flash=mix(vec3(.62,.18,1.0),vec3(.95,.55,1.0),bolt);
    vec3 color=quiet*base+flash*lightning*1.35;
    float alpha=clamp(base+lightning*.92,0.0,.82);
    gl_FragColor=vec4(color,alpha);
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
    this.templeLights = [];
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
    this.renderer.toneMappingExposure = 1.34;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
      P: 'assets/astral-obsidian-v2.jpg', T: 'assets/astral-teal-v2.jpg',
      G: 'assets/astral-limestone-v2.jpg', wall: 'assets/ruin-wall-texture.png'
    };
    this.textures = {};
    await Promise.all(Object.entries(sources).map(async ([key, url]) => { this.textures[key] = await this.loadTexture(url); }));
    for (const texture of Object.values(this.textures)) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(keyTextureRepeat(texture), keyTextureRepeat(texture));
    }
  }

  makeLights() {
    this.hemisphereLight = new THREE.HemisphereLight(0x877ba8, 0x160b08, .78);
    this.scene.add(this.hemisphereLight);

    this.ambientLight = new THREE.AmbientLight(0x21101f, .16);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0xd8d0ff, 4.25);
    this.moonLight.position.set(-9, 18, 10);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.left = this.moonLight.shadow.camera.bottom = -19;
    this.moonLight.shadow.camera.right = this.moonLight.shadow.camera.top = 19;
    this.moonLight.shadow.bias = -.00035;
    this.moonLight.shadow.normalBias = .035;
    this.scene.add(this.moonLight);

    this.rimLight = new THREE.DirectionalLight(0x6f3696, 2.05);
    this.rimLight.position.set(11, 8, -13);
    this.scene.add(this.rimLight);

    const glowTexture = makeLanternGlowTexture();
    const flameGeometry = new THREE.SphereGeometry(.1, 8, 6);
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      const x = Math.sin(angle) * 14.8, z = Math.cos(angle) * 14.8;
      const light = new THREE.PointLight(i % 2 ? 0xffb35a : 0xff7d2d, 30, 7.8, 2);
      light.position.set(x, 1.65, z);
      light.userData.baseIntensity = 30;
      light.userData.phase = i * 1.73;
      const flame = new THREE.Mesh(
        flameGeometry,
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd48a : 0xffad54 })
      );
      flame.position.copy(light.position);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture, color: 0xff9b42, transparent: true,
        opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      glow.position.copy(light.position);
      glow.scale.set(1.75, 1.75, 1);
      this.scene.add(light, flame, glow);
      this.templeLights.push({ light, flame, glow, phase: i * 1.73 });
    }
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

    this.faultlineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMajor: { value: 0 },
        uQuality: { value: 1 }
      },
      vertexShader: FAULTLINE_VERTEX,
      fragmentShader: FAULTLINE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.faultlinePlane = new THREE.Mesh(new THREE.CircleGeometry(16.55, 96), this.faultlineMaterial);
    this.faultlinePlane.rotation.x = -Math.PI / 2;
    this.faultlinePlane.position.y = -.066;
    this.faultlinePlane.renderOrder = 1;
    this.scene.add(this.faultlinePlane);

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
      const source = this.textures[type] || this.textures.wall;
      topMaterials[type] = Array.from({ length: 6 }, (_, variant) => {
        const map = makeTileTextureVariant(source, variant);
        const relief = makeTileTextureVariant(source, variant);
        relief.colorSpace = THREE.NoColorSpace;
        const tint = new THREE.Color(TILE_TINTS[type]);
        tint.offsetHSL(0, 0, (variant - 2.5) * .009);
        return new THREE.MeshStandardMaterial({
          map,
          bumpMap: relief,
          bumpScale: type === 'B' ? .035 : type === 'W' ? .058 : .074,
          roughnessMap: relief,
          color: tint,
          emissive: type === 'P' ? 0x16081e : type === 'T' ? 0x03100e : 0x090705,
          emissiveIntensity: type === 'P' ? .095 : .025,
          roughness: type === 'W' ? .7 : type === 'P' ? .83 : .91,
          metalness: type === 'W' ? .2 : type === 'T' ? .07 : .035
        });
      });
      sideMaterials[type] = new THREE.MeshStandardMaterial({
        color: TILE_SIDES[type], roughness: type === 'W' ? .78 : .96,
        metalness: type === 'W' ? .18 : .015
      });
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
      const variant = tileVariantFor(cell.q, cell.r);
      const mesh = new THREE.Mesh(geometry, [sideMaterials[cell.type], topMaterials[cell.type][variant], sideMaterials[cell.type]]);
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
    }
  }

  makePortal() {
    this.portal = new THREE.Group();
    const well = new THREE.Mesh(
      new THREE.CylinderGeometry(2.06, 2.1, .28, 64),
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
      annularSegmentGeometry(1.78, 2.06, span, .22),
      this.portalStoneMaterial,
      segmentCount
    );
    const transform = new THREE.Matrix4();
    for (let i = 0; i < segmentCount; i++) {
      transform.makeRotationY(i / segmentCount * Math.PI * 2);
      transform.setPosition(0, .45 + (i % 3 === 0 ? .018 : 0), 0);
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
    const capGeometry = new THREE.RingGeometry(1.8, 2.025, 8, 4, -span / 2, span);
    capGeometry.rotateX(-Math.PI / 2);
    this.portalCaps = new THREE.InstancedMesh(capGeometry, this.portalCapMaterial, segmentCount);
    for (let i = 0; i < segmentCount; i++) {
      transform.makeRotationY(i / segmentCount * Math.PI * 2);
      transform.setPosition(0, .485 + (i % 3 === 0 ? .018 : 0), 0);
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
      new THREE.Mesh(new THREE.TorusGeometry(1.765, .06, 8, 96), lipMaterial),
      new THREE.Mesh(new THREE.TorusGeometry(2.04, .045, 8, 96), lipMaterial)
    ];
    this.portalLips.forEach(lip => {
      lip.rotation.x = Math.PI / 2;
      lip.position.y = .47;
      lip.castShadow = lip.receiveShadow = true;
      lip.userData.pickPortal = true;
      this.portal.add(lip);
    });

    this.portalEnergyMaterial = new THREE.MeshBasicMaterial({
      color: 0xd561ff, transparent: true, opacity: .78,
      depthWrite: false, blending: THREE.AdditiveBlending
    });
    this.portalEnergyRims = [
      new THREE.Mesh(new THREE.TorusGeometry(1.75, .02, 6, 96), this.portalEnergyMaterial),
      new THREE.Mesh(new THREE.TorusGeometry(2.015, .014, 6, 96), this.portalEnergyMaterial)
    ];
    this.portalEnergyRims.forEach(rim => {
      rim.rotation.x = Math.PI / 2;
      rim.position.y = .505;
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
    this.portalVortex = new THREE.Mesh(new THREE.CircleGeometry(1.76, 96), this.portalVortexMaterial);
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
    this.portalMist = new THREE.Mesh(new THREE.CircleGeometry(1.88, 96), this.portalMistMaterial);
    this.portalMist.rotation.x = -Math.PI / 2;
    this.portalMist.position.y = .53;
    this.portal.add(this.portalMist);

    this.portalRuneMaterial = new THREE.MeshBasicMaterial({
      map: makePortalRuneTexture(), color: 0xc961ff, transparent: true,
      opacity: .9, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.portalRunes = new THREE.Mesh(new THREE.CircleGeometry(2.035, 96), this.portalRuneMaterial);
    this.portalRunes.rotation.x = -Math.PI / 2;
    this.portalRunes.position.y = .505;
    this.portal.add(this.portalRunes);

    this.portalDomeMaterial = new THREE.ShaderMaterial({
      vertexShader: DOME_VERTEX,
      fragmentShader: DOME_FRAGMENT,
      uniforms: {
        uTime: { value: 0 }, uPower: { value: 1 },
        uColor: { value: new THREE.Color(0xc95cff) }
      },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.portalDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.74, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      this.portalDomeMaterial
    );
    this.portalDome.position.y = .48;
    this.portalDome.userData.pickPortal = true;
    this.portal.add(this.portalDome);

    this.portalArcs = [];
    for (let i = 0; i < 7; i++) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
      const material = new THREE.LineBasicMaterial({
        color: 0xef9cff, transparent: true, opacity: .78,
        depthWrite: false, blending: THREE.AdditiveBlending
      });
      const arc = new THREE.Line(geometry, material);
      arc.userData.phase = i / 7 * Math.PI * 2;
      this.portal.add(arc);
      this.portalArcs.push(arc);
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

    this.portalSpotlight = new THREE.SpotLight(0xc955ff, 18, 13, Math.PI / 4.5, .72, 1.7);
    this.portalSpotlight.position.set(0, 8.5, 0);
    this.portalSpotlight.target.position.set(0, 0, 0);
    this.scene.add(this.portalSpotlight, this.portalSpotlight.target);
    this.portal.userData.pickPortal = true;
    this.scene.add(this.portal);
    this.pickables.push(well, stones, this.portalCaps, this.portalVortex, this.portalDome, ...this.portalLips);
    [well, stones, this.portalCaps, this.portalVortex, this.portalDome, ...this.portalLips].forEach(mesh => { mesh.userData.pickPortal = true; });
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

  makeEquipment(type) {
    const group = new THREE.Group();
    const bronze = new THREE.MeshStandardMaterial({ color: 0x9d6428, roughness: .38, metalness: .78 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe3b454, roughness: .3, metalness: .86 });
    const teal = new THREE.MeshStandardMaterial({ color: 0x176f75, roughness: .44, metalness: .62 });
    if (type === 'S') {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .075, 12, 1, false), bronze);
      plate.rotation.x = Math.PI / 2;
      plate.position.y = .31;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.245, .027, 6, 12), gold);
      rim.position.set(0, .31, .045);
      const boss = new THREE.Mesh(new THREE.SphereGeometry(.075, 12, 7), gold);
      boss.scale.z = .45;
      boss.position.set(0, .31, .075);
      const spokeA = new THREE.Mesh(new THREE.BoxGeometry(.32, .028, .035), gold);
      const spokeB = spokeA.clone();
      spokeA.position.set(0, .31, .073);
      spokeB.position.set(0, .31, .073);
      spokeB.rotation.z = Math.PI / 2;
      group.add(plate, rim, boss, spokeA, spokeB);
    } else {
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(.155, .23, .34, 6), teal);
      torso.position.y = .31;
      const collar = new THREE.Mesh(new THREE.TorusGeometry(.13, .025, 6, 12), gold);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = .49;
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(.235, .19, 6, 1, true), bronze);
      skirt.position.y = .1;
      const shoulderGeometry = new THREE.SphereGeometry(.095, 10, 6);
      const left = new THREE.Mesh(shoulderGeometry, gold);
      const right = left.clone();
      left.scale.set(1.25, .72, .9);
      right.scale.copy(left.scale);
      left.position.set(-.19, .42, 0);
      right.position.set(.19, .42, 0);
      const chest = new THREE.Mesh(new THREE.BoxGeometry(.05, .25, .025), gold);
      chest.position.set(0, .31, .16);
      group.add(torso, collar, skirt, left, right, chest);
    }
    group.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = node.receiveShadow = true;
    });
    group.rotation.y = -.24;
    group.userData.equipment = true;
    return group;
  }

  makeRuneDie() {
    const group = new THREE.Group();
    const geometry = new THREE.DodecahedronGeometry(.29, 0);
    const stone = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: this.textures.P, color: 0x5a397a, emissive: 0x35105f,
        emissiveIntensity: .42, roughness: .68, metalness: .28
      })
    );
    const inner = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xb974ff, transparent: true, opacity: .2,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    inner.scale.setScalar(.82);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 12),
      new THREE.LineBasicMaterial({ color: 0xe4b8ff, transparent: true, opacity: .82 })
    );
    group.add(stone, inner, edges);
    group.traverse(node => { if (node.isMesh) node.castShadow = node.receiveShadow = true; });
    group.userData.rune = true;
    return group;
  }

  makeOccupancyGlow(actor) {
    const major = actor.kind === 'monster' && actor.major;
    const radius = major ? .8 : actor.kind === 'monster' ? .66 : .61;
    const color = new THREE.Color(actor.kind === 'player' ? actor.color : major ? '#d95cff' : '#ff526d');
    const geometry = new THREE.RingGeometry(radius * .7, radius, 6);
    geometry.rotateX(-Math.PI / 2);
    const glow = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: major ? .48 : .35,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
      })
    );
    glow.rotation.y = Math.PI / 6;
    glow.position.copy(worldFor(actor.pos));
    glow.position.y = .135;
    glow.userData.occupancy = true;
    glow.userData.baseOpacity = major ? .48 : .35;
    glow.userData.phase = actor.id.length * .73 + actor.pos.length * .19;
    this.highlightRoot.add(glow);
  }

  makeActor(actor) {
    const group = new THREE.Group();
    const major = actor.major;
    const color = new THREE.Color(actor.color || (major ? '#d842db' : '#ef4f9c'));
    const radius = major ? .68 : .5;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * .96, radius, .15, 6),
      new THREE.MeshStandardMaterial({
        map: this.textures.wall, bumpMap: this.stoneHeightTexture, bumpScale: .07,
        color: major ? 0x332333 : 0x4a4039, roughness: .86, metalness: .12
      })
    );
    base.position.y = .12;
    // CylinderGeometry is point-top by default, matching the original board.
    base.rotation.y = 0;
    base.castShadow = base.receiveShadow = true;
    group.add(base);
    const inset = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * .79, radius * .82, .035, 6),
      new THREE.MeshStandardMaterial({
        color: 0x171319, emissive: color,
        emissiveIntensity: actor.active ? .2 : .085, roughness: .62, metalness: .34
      })
    );
    inset.position.y = .205;
    inset.rotation.y = 0;
    inset.castShadow = inset.receiveShadow = true;
    group.add(inset);
    const trimGeometry = new THREE.RingGeometry(radius * .81, radius * .91, 6);
    trimGeometry.rotateX(-Math.PI / 2);
    const trim = new THREE.Mesh(
      trimGeometry,
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: actor.active ? .28 : .13,
        roughness: .42, metalness: .72, side: THREE.DoubleSide
      })
    );
    trim.rotation.y = Math.PI / 6;
    trim.position.y = .228;
    group.add(trim);
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
    this.majorPresent = state.monsters.some(monster => monster.major);
    this.clearGroup(this.actorRoot);
    this.clearGroup(this.itemRoot);
    this.clearGroup(this.highlightRoot);
    this.actors.clear();
    state.players.forEach(player => { const actor = { ...player, kind: 'player' }; this.makeActor(actor); this.makeOccupancyGlow(actor); });
    state.monsters.forEach(monster => { const actor = { ...monster, kind: 'monster' }; this.makeActor(actor); this.makeOccupancyGlow(actor); });
    state.equipment.forEach(([pos, items]) => items.forEach((item, index) => {
      const equipment = this.makeEquipment(item);
      equipment.position.copy(worldFor(pos));
      equipment.position.x += (index - (items.length - 1) / 2) * .34;
      equipment.position.y = .2;
      this.itemRoot.add(equipment);
    }));
    state.runes.forEach(([pos, count]) => {
      if (count < 1) return;
      const die = this.makeRuneDie();
      die.position.copy(worldFor(pos));
      die.position.y = .55;
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
    if (this.faultlineMaterial) this.faultlineMaterial.uniforms.uQuality.value = quality === 'ultra' ? 0 : quality === 'lite' ? .5 : 1;
    const enabledLights = quality === 'full' ? 6 : quality === 'auto' ? 4 : 3;
    this.templeLights.forEach((entry, index) => {
      // The three-light pattern is evenly spaced, retaining depth on low-power devices.
      const enabled = enabledLights === 6 || (enabledLights === 4 ? index !== 1 && index !== 4 : index % 2 === 0);
      entry.light.visible = enabled;
      entry.glow.material.opacity = enabled ? .7 : .22;
    });
    this.portalArcs?.forEach((arc, index) => {
      arc.visible = quality === 'full' || quality === 'auto' || index % 2 === 0;
    });
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
    if (this.faultlineMaterial) {
      this.faultlineMaterial.uniforms.uTime.value = time;
      const target = this.majorPresent ? 1 : 0;
      this.faultlineMaterial.uniforms.uMajor.value += (target - this.faultlineMaterial.uniforms.uMajor.value) * .035;
    }
    this.controls.update();
    this.templeLights.forEach(entry => {
      const flicker = 1 + Math.sin(time * 7.7 + entry.phase) * .055 + Math.sin(time * 13.1 + entry.phase * 1.7) * .026;
      entry.light.intensity = entry.light.userData.baseIntensity * flicker;
      entry.flame.scale.y = 1 + Math.sin(time * 9.3 + entry.phase) * .16;
      if (entry.light.visible) entry.glow.material.opacity = .66 + Math.sin(time * 5.4 + entry.phase) * .11;
    });
    const look = PORTAL_LOOKS[this.portalState] || PORTAL_LOOKS.idle;
    const intensity = look[0] * (.94 + Math.sin(time * 2.15) * .06);
    this.portalLight.intensity += (intensity - this.portalLight.intensity) * .06;
    this.portalSpotlight.color.lerp(look[3], .04);
    this.portalSpotlight.intensity += (look[0] * .74 - this.portalSpotlight.intensity) * .045;
    this.portalVortexMaterial.uniforms.uTime.value = time;
    this.portalMistMaterial.uniforms.uTime.value = time;
    this.portalDomeMaterial.uniforms.uTime.value = time;
    this.portalVortexMaterial.uniforms.uPower.value += (look[1] - this.portalVortexMaterial.uniforms.uPower.value) * .045;
    this.portalMistMaterial.uniforms.uPower.value = this.portalVortexMaterial.uniforms.uPower.value;
    this.portalDomeMaterial.uniforms.uPower.value = .82 + (this.portalVortexMaterial.uniforms.uPower.value - 1) * .32;
    const colorA = look[2], colorB = look[3];
    this.portalVortexMaterial.uniforms.uColorA.value.lerp(colorA, .04);
    this.portalVortexMaterial.uniforms.uColorB.value.lerp(colorB, .04);
    this.portalMistMaterial.uniforms.uColorA.value.copy(this.portalVortexMaterial.uniforms.uColorA.value);
    this.portalMistMaterial.uniforms.uColorB.value.copy(this.portalVortexMaterial.uniforms.uColorB.value);
    this.portalDomeMaterial.uniforms.uColor.value.lerp(colorB, .045);
    this.portalRuneMaterial.color.lerp(colorB, .045);
    this.portalRuneMaterial.opacity = .76 + Math.sin(time * 2.35) * .16;
    this.portalEnergyMaterial.color.lerp(colorB, .045);
    this.portalEnergyMaterial.opacity = .64 + Math.sin(time * 2.9) * .2;
    this.portalArcs.forEach((arc, index) => {
      arc.material.color.lerp(colorB, .08);
      arc.material.opacity = .48 + Math.sin(time * 11.7 + index * 1.9) * .28;
      const positions = arc.geometry.attributes.position.array;
      const phase = arc.userData.phase + time * (.08 + index * .004);
      for (let point = 0; point < 8; point++) {
        const progress = point / 7;
        const angle = phase + (progress - .5) * .22;
        const jitter = Math.sin(time * 23 + point * 7.3 + index * 3.1) * .026;
        const radius = 1.79 + jitter;
        positions[point * 3] = Math.sin(angle) * radius;
        positions[point * 3 + 1] = .54 + Math.sin(progress * Math.PI) * (.12 + .05 * Math.sin(time * 8 + index));
        positions[point * 3 + 2] = Math.cos(angle) * radius;
      }
      arc.geometry.attributes.position.needsUpdate = true;
    });
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
      if (item.userData.rune) {
        item.rotation.y = time * .72 + index;
        item.rotation.x = .18 + Math.sin(time * .58 + index) * .08;
        item.position.y = .5 + Math.sin(time * 1.8 + index) * .055;
      } else if (item.userData.equipment) {
        item.rotation.y = time * .82 + index * 1.7;
        item.position.y = .2 + Math.sin(time * 1.55 + index) * .035;
      }
    });
    this.highlightRoot.children.forEach(glow => {
      if (!glow.userData.occupancy) return;
      const pulse = .88 + Math.sin(time * 2.6 + glow.userData.phase) * .08;
      glow.scale.setScalar(pulse);
      glow.material.opacity = glow.userData.baseOpacity * (.86 + Math.sin(time * 2.6 + glow.userData.phase) * .14);
    });
    this.renderer.render(this.scene, this.camera);
  }
}

function keyTextureRepeat() { return 1; }
