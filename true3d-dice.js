import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const FACE_NORMALS = [
  new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
];
const FACE_SETS = {
  Movement: ['1', '1', '2', '2', '3', '3'],
  Action: ['TAKE', 'TAKE', 'TAKE', 'GIVE', 'GIVE', 'STEAL'],
  Rune: ['×2', '×3', 'SWAP', 'PLUNDER', 'RIFT', 'WILD']
};

function faceTexture(label, kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  const movement = kind === 'Movement';
  const rune = kind === 'Rune';
  const glow = movement ? '#ffb52f' : rune ? '#55e8ff' : '#b248ff';
  const glowLight = movement ? '#fff0a0' : rune ? '#d9fbff' : '#f2b9ff';
  const metal = movement ? '#dca543' : rune ? '#a99ce9' : '#c6a06f';

  // Dark volcanic stone with a warm-metal or violet-metal identity.
  const base = context.createRadialGradient(170, 125, 20, 256, 256, 360);
  base.addColorStop(0, movement ? '#30251d' : rune ? '#132d37' : '#25162f');
  base.addColorStop(.48, movement ? '#171310' : rune ? '#0b171f' : '#140d19');
  base.addColorStop(1, '#050507');
  context.fillStyle = base; context.fillRect(0, 0, 512, 512);

  // Fine stone grain and restrained glowing cracks.
  let seed = label.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), movement ? 73 : 191);
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let index = 0; index < 850; index++) {
    const shade = 18 + Math.floor(random() * 28);
    context.fillStyle = `rgba(${shade + (movement ? 8 : 5)},${shade},${shade + (movement ? 0 : 11)},${.05 + random() * .12})`;
    context.fillRect(random() * 512, random() * 512, 1 + random() * 3, 1 + random() * 3);
  }
  context.save(); context.strokeStyle = movement ? 'rgba(255,170,41,.22)' : rune ? 'rgba(76,227,255,.3)' : 'rgba(185,70,255,.3)'; context.lineWidth = 2;
  for (let crack = 0; crack < 8; crack++) {
    let x = 95 + random() * 320, y = 85 + random() * 340; context.beginPath(); context.moveTo(x, y);
    for (let step = 0; step < 4; step++) { x += (random() - .5) * 54; y += 16 + random() * 30; context.lineTo(x, y); }
    context.stroke();
  }
  context.restore();

  // Double metallic filigree frame.
  context.lineJoin = 'round'; context.strokeStyle = metal; context.shadowColor = glow; context.shadowBlur = 10; context.lineWidth = 18;
  context.strokeRect(30, 30, 452, 452); context.shadowBlur = 0; context.lineWidth = 4; context.strokeStyle = glowLight; context.strokeRect(55, 55, 402, 402);
  context.strokeStyle = movement ? 'rgba(255,202,91,.72)' : rune ? 'rgba(160,245,255,.78)' : 'rgba(215,146,255,.72)'; context.lineWidth = 3;
  [[72,72,1,1],[440,72,-1,1],[72,440,1,-1],[440,440,-1,-1]].forEach(([x,y,sx,sy]) => {
    context.beginPath(); context.moveTo(x, y + sy * 54); context.quadraticCurveTo(x, y, x + sx * 54, y); context.stroke();
    context.beginPath(); context.moveTo(x + sx * 17, y + sy * 17); context.lineTo(x + sx * 34, y + sy * 34); context.stroke();
  });

  const orb = (x, y, radius = 46) => {
    context.save(); context.shadowColor = glow; context.shadowBlur = 30;
    context.fillStyle = movement ? '#ff9e20' : rune ? '#27cfe8' : '#9b28ed'; context.beginPath(); context.arc(x, y, radius + 9, 0, Math.PI * 2); context.fill();
    const core = context.createRadialGradient(x - radius * .24, y - radius * .3, 2, x, y, radius);
    core.addColorStop(0, '#fffde4'); core.addColorStop(.25, glowLight); core.addColorStop(.62, glow); core.addColorStop(1, movement ? '#743100' : rune ? '#003c52' : '#35004f');
    context.fillStyle = core; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
    context.shadowBlur = 0; context.strokeStyle = metal; context.lineWidth = 10; context.stroke();
    context.strokeStyle = 'rgba(255,255,255,.52)'; context.lineWidth = 3; context.beginPath(); context.arc(x, y, radius - 10, -.9, 1.45); context.stroke(); context.restore();
  };

  const drawMovement = value => {
    const positions = value === 1 ? [[256,256]] : value === 2 ? [[178,178],[334,334]] : [[166,166],[256,256],[346,346]];
    positions.forEach(([x,y]) => orb(x,y,value === 3 ? 42 : 49));
  };
  const symbolStroke = () => { context.strokeStyle = glowLight; context.lineWidth = 18; context.lineCap = 'round'; context.lineJoin = 'round'; context.shadowColor = glow; context.shadowBlur = 24; };
  const arrowHead = (x, y, angle) => {
    const length = 29, spread = .62; context.beginPath();
    context.moveTo(x - Math.cos(angle - spread) * length, y - Math.sin(angle - spread) * length); context.lineTo(x, y);
    context.lineTo(x - Math.cos(angle + spread) * length, y - Math.sin(angle + spread) * length); context.stroke();
  };
  const drawAction = action => {
    context.save(); symbolStroke(); orb(256,256,34);
    if (action === 'TAKE') {
      // Three converging paths: the world is drawn into the Traveler's keeping.
      [[256,112,Math.PI/2],[128,342,-.48],[384,342,Math.PI+.48]].forEach(([x,y,a]) => {
        const tx = 256 + Math.cos(a) * -64, ty = 256 + Math.sin(a) * -64;
        context.beginPath(); context.moveTo(x,y); context.lineTo(tx,ty); context.stroke(); arrowHead(tx,ty,a);
      });
    } else if (action === 'GIVE') {
      // Three radiating paths: the held treasure is offered outward.
      [[256,112,-Math.PI/2],[128,342,Math.PI-.48],[384,342,.48]].forEach(([x,y,a]) => {
        const sx = 256 + Math.cos(a) * 64, sy = 256 + Math.sin(a) * 64;
        context.beginPath(); context.moveTo(sx,sy); context.lineTo(x,y); context.stroke(); arrowHead(x,y,a);
      });
    } else {
      // A hooked spectral claw closes around the central treasure.
      context.beginPath(); context.arc(256,256,122,-1.2,1.2); context.stroke();
      context.beginPath(); context.arc(256,256,122,Math.PI-1.2,Math.PI+1.2); context.stroke();
      [[177,164,-.72],[335,164,-2.42],[177,348,.72],[335,348,2.42]].forEach(([x,y,a]) => arrowHead(x,y,a));
      context.strokeStyle = metal; context.lineWidth = 5; context.beginPath(); context.arc(256,256,155,0,Math.PI*2); context.stroke();
    }
    context.restore();
  };

  const drawRune = power => {
    context.save(); symbolStroke(); context.strokeStyle = glowLight; context.fillStyle = glowLight; context.translate(256,256);
    const runeGem = (x,y,r=24) => {
      context.save(); context.shadowColor=glow; context.shadowBlur=24; context.fillStyle=glow;
      context.beginPath(); context.arc(x,y,r,0,Math.PI*2); context.fill(); context.strokeStyle=metal; context.lineWidth=7; context.stroke(); context.restore();
    };
    if (power === '×2' || power === '×3') {
      const count = power === '×2' ? 2 : 3;
      for (let index = 0; index < count; index++) {
        const x = (index - (count - 1) / 2) * 83;
        context.beginPath(); context.moveTo(x - 23,-55); context.lineTo(x + 23,55); context.moveTo(x + 23,-55); context.lineTo(x - 23,55); context.stroke();
      }
    } else if (power === 'SWAP') {
      context.beginPath(); context.arc(0,0,112,-2.65,-.18); context.stroke(); arrowHead(108,-20,.42);
      context.beginPath(); context.arc(0,0,112,.5,2.95); context.stroke(); arrowHead(-108,20,Math.PI+.42);
      runeGem(-58,0); runeGem(58,0);
    } else if (power === 'PLUNDER') {
      [[-105,-78],[105,-78],[0,118]].forEach(([x,y]) => {
        runeGem(x,y,22); const tx=x*.28,ty=y*.28;
        context.beginPath(); context.moveTo(x*.72,y*.72); context.lineTo(tx,ty); context.stroke(); arrowHead(tx,ty,Math.atan2(-y,-x));
      });
      runeGem(0,0,39);
    } else if (power === 'RIFT') {
      context.beginPath(); context.ellipse(0,0,68,132,0,0,Math.PI*2); context.stroke();
      context.beginPath(); context.moveTo(-138,0); context.lineTo(-78,0); context.moveTo(78,0); context.lineTo(138,0); context.stroke();
      context.beginPath(); context.moveTo(0,-104); context.lineTo(-28,-42); context.lineTo(19,-5); context.lineTo(-23,45); context.lineTo(0,105); context.stroke();
    } else {
      context.beginPath(); context.moveTo(-34,-134); context.lineTo(40,-48); context.lineTo(2,-22); context.lineTo(58,20); context.lineTo(-28,134); context.lineTo(-4,42); context.lineTo(-62,4); context.closePath(); context.fill();
      context.strokeStyle=metal; context.lineWidth=5; context.beginPath(); context.arc(0,0,158,0,Math.PI*2); context.stroke();
    }
    context.restore();
  };

  if (movement) drawMovement(Number(label)); else if (rune) drawRune(label); else drawAction(label);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8; return texture;
}

function resultFaceIndex(labels, result) {
  const wanted = String(result).toUpperCase();
  const matches = labels.map((label, index) => String(label).toUpperCase() === wanted ? index : -1).filter(index => index >= 0);
  return matches[Math.floor(Math.random() * matches.length)] ?? 2;
}

export class TabokDice3D {
  constructor(host) {
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fate-dice-canvas'; this.canvas.setAttribute('aria-label', 'Physical 3D Movement, Action, and Rune dice');
    host.before(this.canvas); host.classList.add('fate-dice-fallback');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 2.2, .1, 50); this.camera.position.set(0, 7.2, 8.6); this.camera.lookAt(0, .55, 0);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.add(new THREE.HemisphereLight(0xbda8ff, 0x1a0c05, 2.1));
    this.key = new THREE.SpotLight(0xffd895, 58, 25, Math.PI / 4, .48, 1.4); this.key.position.set(-3, 7, 5); this.key.castShadow = true; this.scene.add(this.key);
    const violet = new THREE.PointLight(0xa249ff, 28, 12, 2); violet.position.set(4, 2, 2); this.scene.add(violet);
    this.makeTray(); this.dice = [];
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.canvas); this.resize();
  }

  makeTray() {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.7, .42, 64), new THREE.MeshStandardMaterial({ color: 0x100a0d, roughness: .72, metalness: .15 }));
    tray.position.y = -.28; tray.receiveShadow = true; this.scene.add(tray);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4.85, .13, 10, 96), new THREE.MeshStandardMaterial({ color: 0xb27a3e, emissive: 0x5b2712, emissiveIntensity: .35, roughness: .42, metalness: .72 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = -.04; this.scene.add(rim);
    for (let index = 0; index < 3; index++) {
      const rune = new THREE.Mesh(new THREE.TorusGeometry(2.65 + index * .55, .018, 5, 72), new THREE.MeshBasicMaterial({ color: index % 2 ? 0x9b55d8 : 0xd7a755, transparent: true, opacity: .32 }));
      rune.rotation.x = Math.PI / 2; rune.position.y = -.045; this.scene.add(rune);
    }
  }

  supports(specs) {
    const runeOnly=specs?.length===1&&specs[0].label==='Rune';
    const turnCast=(specs?.length===2||specs?.length===3)&&specs[0].label==='Movement'&&specs[1].label==='Action'&&(specs.length===2||specs[2].label==='Rune');
    return (runeOnly||turnCast)&&specs.every(spec=>spec.rolling!==false);
  }

  clearDice() {
    this.dice.forEach(die => { this.scene.remove(die); die.geometry.dispose(); die.material.forEach(material => { material.map?.dispose(); material.dispose(); }); });
    this.dice = [];
  }

  buildDice(kind, x) {
    const labels = FACE_SETS[kind];
    const materials = labels.map(label => {
      const texture = faceTexture(label, kind);
      return new THREE.MeshStandardMaterial({
        map: texture, bumpMap: texture, bumpScale: .045,
        color: 0xffffff, roughness: .31, metalness: .62
      });
    });
    const die = new THREE.Mesh(new RoundedBoxGeometry(2.05, 2.05, 2.05, 4, .18), materials);
    die.position.set(x, 1.05, 0); die.castShadow = true; die.receiveShadow = true; die.userData = { kind, labels };
    this.scene.add(die); this.dice.push(die); return die;
  }

  prepare(specs, color = '#9d62d4') {
    if (!this.supports(specs)) return false;
    this.clearDice(); this.key.color.set(color);
    const positions = specs.length === 3 ? [-2.45,0,2.45] : specs.length === 2 ? [-1.45,1.45] : [0];
    specs.forEach((spec,index) => this.buildDice(spec.label,positions[index]));
    this.canvas.dataset.diceCount=String(specs.length); this.canvas.classList.add('active'); this.resize(); return true;
  }

  targetQuaternion(die, result, index) {
    const face = resultFaceIndex(die.userData.labels, result);
    die.userData.resultFace = face;
    const align = new THREE.Quaternion().setFromUnitVectors(FACE_NORMALS[face], new THREE.Vector3(0, 1, 0));
    const turns = this.dice.length === 3 ? [.16,0,-.16] : this.dice.length === 2 ? [.14,-.16] : [0];
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turns[index]);
    return turn.multiply(align);
  }

  cast(specs, duration = 1750, color = '#9d62d4') {
    if (!this.prepare(specs, color)) return Promise.resolve(false);
    const landings = this.dice.length === 3 ? [-2.45,0,2.45] : this.dice.length === 2 ? [-1.45,1.45] : [0];
    const launches = this.dice.length === 3 ? [-4.1,0,4.1] : this.dice.length === 2 ? [-2.8,2.8] : [-2.5];
    const starts = this.dice.map((die, index) => {
      const direction=index%2?-1:1;
      die.position.set(launches[index],4.1+index*.28,-1.5+index*.28);
      die.rotation.set(direction>0?-1.2:1.7,direction>0?1.4:-.9,direction>0?-1.5:.7);
      return { quaternion: die.quaternion.clone(), target: this.targetQuaternion(die, specs[index].result, index) };
    });
    this.canvas.classList.add('casting'); const begun = performance.now(); let brakingStarted = false;
    return new Promise(resolve => {
      const frame = now => {
        const t = Math.min(1, (now - begun) / duration), brake = Math.max(0, (t - .62) / .38);
        this.dice.forEach((die, index) => {
          const direction = index % 2 ? -1 : 1;
          if (!brakingStarted) {
            die.rotation.x += (.19 - t * .08) * direction; die.rotation.y += .24 - t * .1; die.rotation.z += .15 * direction;
          }
          const landingX = landings[index];
          die.position.x = THREE.MathUtils.lerp(launches[index],landingX,Math.min(1,t*1.28));
          die.position.z = THREE.MathUtils.lerp(-1.5 + index * .35, 0, Math.min(1, t * 1.35));
          die.position.y = 1.05 + Math.abs(Math.sin(t * Math.PI * 4.4 + index * .42)) * 2.65 * Math.pow(1 - t, 1.35);
          if (brake > 0) die.quaternion.slerp(starts[index].target, .045 + brake * .16);
        });
        if (t >= .62 && !brakingStarted) { brakingStarted = true; starts.forEach((start, index) => { start.quaternion.copy(this.dice[index].quaternion); }); }
        this.render();
        if (t < 1) requestAnimationFrame(frame); else {
          this.dice.forEach((die, index) => {
            die.position.set(landings[index],1.05,0); die.quaternion.copy(starts[index].target);
            const material = die.material[die.userData.resultFace];
            material.emissive.set(die.userData.kind === 'Movement' ? 0x7b3514 : die.userData.kind === 'Rune' ? 0x075f73 : 0x53216f); material.emissiveIntensity = .32;
          });
          this.canvas.classList.remove('casting'); this.canvas.classList.add('revealed'); this.render(); resolve(true);
        }
      };
      requestAnimationFrame(frame);
    });
  }

  claim(duration=2600,color='#a887ff') {
    if(!this.prepare([{label:'Rune'}],color))return Promise.resolve(false);
    const die=this.dice[0],begun=performance.now();
    this.canvas.classList.add('rune-claim-3d');
    return new Promise(resolve=>{
      const frame=now=>{
        const t=Math.min(1,(now-begun)/duration),arrive=1-Math.pow(1-Math.min(1,t/.34),3),depart=Math.max(0,(t-.78)/.22);
        die.position.x=0;
        die.position.y=THREE.MathUtils.lerp(.25,1.55,arrive)+Math.sin(t*Math.PI*5)*.14*(1-depart);
        die.position.z=THREE.MathUtils.lerp(1.7,0,arrive);
        die.rotation.x+=.025*(1-t*.55);die.rotation.y+=.052*(1-t*.55);die.rotation.z+=.014;
        const scale=1+Math.sin(Math.min(1,t/.38)*Math.PI)*.16+depart*.34;die.scale.setScalar(scale);
        this.render();
        if(t<1)requestAnimationFrame(frame);else{this.canvas.classList.remove('rune-claim-3d');resolve(true)}
      };
      requestAnimationFrame(frame);
    });
  }

  hide() { this.canvas.classList.remove('active', 'casting', 'revealed'); }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth || 720), height = Math.max(1, this.canvas.clientHeight || 300);
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.render();
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
