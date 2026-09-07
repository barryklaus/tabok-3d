import * as THREE from 'three';

// Distant detail is baked once. The moving foreground uses one instanced draw
// call, no shadow maps, and a capped update rate independent of game turns.
export function createCosmicSanctuary(scene, stoneMaps) {
  let seed = 71943;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#04050d'; ctx.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 240; i++) {
    const x = random() * 2048, y = 450 + Math.sin(x * .006) * 170 + (random() - .5) * 310;
    const radius = 45 + random() * 170;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, i % 4 ? 'rgba(76,32,117,.12)' : 'rgba(27,91,118,.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(x-radius, y-radius, radius*2, radius*2);
  }
  for (let i = 0; i < 2300; i++) {
    const x=random()*2048, y=random()*1024, r=random()>.985?1.5:.3+random()*.55;
    ctx.fillStyle = `rgba(190,204,239,${.12+random()*.65})`;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  // A remote accretion vortex is part of the sky, never a second game portal.
  ctx.save();ctx.translate(1450,370);ctx.rotate(-.45);ctx.scale(1,.68);
  for(let i=0;i<190;i++){
    const a=random()*Math.PI*2, r=48+random()*165;
    ctx.strokeStyle=`rgba(${220+Math.floor(random()*35)},${65+Math.floor(random()*100)},${40+Math.floor(random()*90)},${.05+random()*.17})`;
    ctx.lineWidth=1+random()*5;ctx.beginPath();ctx.arc(0,0,r,a,a+.35+random()*.8);ctx.stroke();
  }
  const halo=ctx.createRadialGradient(0,0,38,0,0,110);
  halo.addColorStop(0,'#fff0b8');halo.addColorStop(.12,'#f9a35c');halo.addColorStop(.28,'rgba(218,83,48,.55)');halo.addColorStop(1,'rgba(45,12,40,0)');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,110,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#030309';ctx.beginPath();ctx.arc(0,0,39,0,Math.PI*2);ctx.fill();ctx.restore();
  const sky=new THREE.CanvasTexture(canvas);sky.mapping=THREE.EquirectangularReflectionMapping;sky.colorSpace=THREE.SRGBColorSpace;
  scene.background=sky;scene.backgroundIntensity=.7;
  const root=new THREE.Group();root.name='Cosmic sanctuary surrounds';scene.add(root);
  const stone=new THREE.MeshStandardMaterial({map:stoneMaps.map,bumpMap:stoneMaps.bump,bumpScale:.08,color:0x91858b,roughness:.96,metalness:0});
  const object=new THREE.Object3D();
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),stone,84);
  const motion=[];
  for(let i=0;i<84;i++){
    const angle=random()*Math.PI*2, radius=18+random()*19;
    const pos=new THREE.Vector3(Math.sin(angle)*radius,-7+random()*11,Math.cos(angle)*radius);
    const scale=.25+random()*1.45;
    motion.push({pos,phase:random()*6.28,scale,rotation:new THREE.Euler(random()*3,random()*3,random()*3)});
  }
  rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);rocks.frustumCulled=false;root.add(rocks);
  const blocks=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),stone,120);
  let count=0;
  // Ruined pillars and their broken footings remain outside the playable edge.
  for(let i=0;i<12;i++){
    const angle=i/12*Math.PI*2+.12,radius=16.1+random()*.8;
    const x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;
    for(let level=0;level<4;level++){
      object.position.set(x+level*.045,level*.75-.3,z);
      object.rotation.set(.025,angle,.035);object.scale.set(level? .55:.95,.7,level?.65:1.05);object.updateMatrix();blocks.setMatrixAt(count++,object.matrix);
    }
    for(let j=0;j<6;j++){
      object.position.set(x+(random()-.5)*2.5,-.85+random()*.35,z+(random()-.5)*2.5);
      object.rotation.set(random()*.5,random()*6.28,random()*.3);object.scale.set(.35+random()*.65,.25+random()*.4,.4+random()*.6);object.updateMatrix();blocks.setMatrixAt(count++,object.matrix);
    }
  }
  blocks.count=count;blocks.instanceMatrix.needsUpdate=true;blocks.receiveShadow=true;root.add(blocks);
  let last=-Infinity;
  return {
    update(time, quality, reducedMotion){
      const interval=quality==='ultra'?1/12:1/24;if(time-last<interval)return;last=time;
      rocks.count=quality==='ultra'?36:84;
      motion.slice(0,rocks.count).forEach((m,i)=>{
        object.position.copy(m.pos);object.position.y+=reducedMotion?0:Math.sin(time*.16+m.phase)*.18;
        object.rotation.copy(m.rotation);if(!reducedMotion)object.rotation.y+=time*.008;
        object.scale.set(m.scale*.75,m.scale*1.6,m.scale);object.updateMatrix();rocks.setMatrixAt(i,object.matrix);
      });rocks.instanceMatrix.needsUpdate=true;
    },
    dispose(){root.removeFromParent();rocks.geometry.dispose();blocks.geometry.dispose();stone.dispose();sky.dispose();}
  };
}
