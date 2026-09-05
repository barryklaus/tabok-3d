import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const M = {
  skin: new THREE.MeshStandardMaterial({color:0xa9562d,roughness:.72}),
  skinLight: new THREE.MeshStandardMaterial({color:0xcd7441,roughness:.72}),
  hair: new THREE.MeshStandardMaterial({color:0x2a120b,roughness:.9}),
  hairWarm: new THREE.MeshStandardMaterial({color:0x4b2010,roughness:.86}),
  cloth: new THREE.MeshStandardMaterial({color:0x2c1b16,roughness:.96}),
  leather: new THREE.MeshStandardMaterial({color:0x4a2818,roughness:.82}),
  darkLeather: new THREE.MeshStandardMaterial({color:0x24140f,roughness:.9}),
  gold: new THREE.MeshStandardMaterial({color:0xd98d16,metalness:.68,roughness:.28}),
  goldHot: new THREE.MeshStandardMaterial({color:0xffc443,emissive:0x7a3500,emissiveIntensity:.18,metalness:.72,roughness:.22}),
  steel: new THREE.MeshStandardMaterial({color:0xb8c6cf,metalness:.88,roughness:.2}),
  steelDark: new THREE.MeshStandardMaterial({color:0x4b555b,metalness:.78,roughness:.3}),
  fur: new THREE.MeshStandardMaterial({color:0xd7c1a1,roughness:1}),
  furShade: new THREE.MeshStandardMaterial({color:0x8f765e,roughness:1}),
  eye: new THREE.MeshStandardMaterial({color:0x130b08,roughness:.5}),
  white: new THREE.MeshStandardMaterial({color:0xf4dfc4,roughness:.7}),
  cape: new THREE.MeshStandardMaterial({color:0xb66509,roughness:.86,side:THREE.DoubleSide}),
  rune: new THREE.MeshStandardMaterial({color:0xffcf63,emissive:0xb35408,emissiveIntensity:.7,metalness:.58,roughness:.25})
};

function mesh(geometry, material, parent, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]) {
  const object=new THREE.Mesh(geometry,material);
  object.position.set(...position); object.rotation.set(...rotation); object.scale.set(...scale);
  object.castShadow=true; object.receiveShadow=true; parent.add(object); return object;
}

function capsule(radius,length,material,parent,position,rotation=[0,0,0]) {
  return mesh(new THREE.CapsuleGeometry(radius,length,5,10),material,parent,position,rotation);
}

function makeCape(parent) {
  const shape=new THREE.Shape();
  shape.moveTo(-.62,1.2); shape.lineTo(-.92,-1.12); shape.lineTo(-.32,-1.42);
  shape.lineTo(0,-1.18); shape.lineTo(.35,-1.48); shape.lineTo(.9,-1.08); shape.lineTo(.62,1.2); shape.closePath();
  const cape=mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1}),M.cape,parent,[0,2.7,-.37],[-.04,0,0]);
  cape.userData.baseRotation=-.04; return cape;
}

function makeSword(parent) {
  const sword=new THREE.Group(); parent.add(sword); sword.position.set(-.92,2.05,.1); sword.rotation.z=.19;
  const bladeShape=new THREE.Shape(); bladeShape.moveTo(-.105,-.82); bladeShape.lineTo(-.13,.64); bladeShape.lineTo(0,.94); bladeShape.lineTo(.13,.64); bladeShape.lineTo(.105,-.82); bladeShape.closePath();
  mesh(new THREE.ExtrudeGeometry(bladeShape,{depth:.055,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1}),M.steel,sword,[0,-.42,.02]);
  mesh(new RoundedBoxGeometry(.62,.1,.13,2,.03),M.goldHot,sword,[0,-1.22,.02]);
  mesh(new THREE.CylinderGeometry(.075,.08,.52,8),M.darkLeather,sword,[0,-1.51,.02]);
  mesh(new THREE.SphereGeometry(.13,10,7),M.gold,sword,[0,-1.8,.02]);
  sword.userData.baseZ=.19; return sword;
}

function makeShield(parent) {
  const shield=new THREE.Group(); parent.add(shield); shield.position.set(.88,2.58,.5); shield.rotation.set(-.08,-.18,-.08);
  mesh(new THREE.CylinderGeometry(.88,.88,.15,32),M.darkLeather,shield,[0,0,0],[Math.PI/2,0,0]);
  mesh(new THREE.TorusGeometry(.82,.085,8,32),M.goldHot,shield,[0,0,.095]);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,ray=mesh(new RoundedBoxGeometry(.09,.43,.055,2,.02),M.gold,shield,[Math.sin(a)*.43,Math.cos(a)*.43,.105],[0,0,-a]);
    ray.scale.y=1.06;
  }
  mesh(new THREE.CylinderGeometry(.31,.35,.18,20),M.goldHot,shield,[0,0,.15],[Math.PI/2,0,0]);
  mesh(new THREE.SphereGeometry(.16,16,10),M.rune,shield,[0,0,.29],[0,0,0],[1,1,.45]);
  shield.userData.baseY=2.58; return shield;
}

function makeHead(parent) {
  const head=new THREE.Group(); parent.add(head); head.position.set(0,4.17,.03);
  mesh(new THREE.SphereGeometry(.48,18,14),M.skin,head,[0,0,0],[0,0,0],[.88,1, .88]);
  mesh(new THREE.SphereGeometry(.13,12,8),M.skinLight,head,[0,-.02,.43],[0,0,0],[.75,1.05,.8]);
  mesh(new THREE.SphereGeometry(.048,10,7),M.white,head,[-.17,.09,.4],[0,0,0],[1.4,.74,.5]);
  mesh(new THREE.SphereGeometry(.048,10,7),M.white,head,[.17,.09,.4],[0,0,0],[1.4,.74,.5]);
  mesh(new THREE.SphereGeometry(.027,8,6),M.eye,head,[-.17,.09,.435]);
  mesh(new THREE.SphereGeometry(.027,8,6),M.eye,head,[.17,.09,.435]);
  mesh(new RoundedBoxGeometry(.28,.06,.055,2,.02),M.hair,head,[-.17,.19,.43],[0,0,-.12]);
  mesh(new RoundedBoxGeometry(.28,.06,.055,2,.02),M.hair,head,[.17,.19,.43],[0,0,.12]);
  for(let i=0;i<9;i++){
    const a=-1.9+i*.48;
    mesh(new THREE.IcosahedronGeometry(.18+(i%2)*.025,1),i%3?M.hair:M.hairWarm,head,[Math.sin(a)*.38,.35+Math.cos(a)*.19,-.05+Math.cos(a)*.25]);
  }
  for(let i=0;i<7;i++){
    const a=-1.15+i*.38;
    mesh(new THREE.IcosahedronGeometry(.16+(i%2)*.02,1),i%2?M.hair:M.hairWarm,head,[Math.sin(a)*.31,-.31+Math.cos(a)*.13,.31]);
  }
  mesh(new THREE.ConeGeometry(.27,.4,8),M.hair,head,[0,-.43,.28],[0,0,Math.PI]);
  mesh(new THREE.TorusGeometry(.16,.025,6,16,Math.PI),M.hairWarm,head,[0,-.11,.43],[0,0,0]);
  return head;
}

export function createJustinPilot() {
  const root=new THREE.Group(); root.name='Justin_3D_Pilot';
  const model=new THREE.Group(); root.add(model); model.rotation.y=.04;
  const platform=mesh(new THREE.CylinderGeometry(1.15,1.28,.22,6),new THREE.MeshStandardMaterial({color:0x261a13,metalness:.25,roughness:.78}),root,[0,.02,0]);
  mesh(new THREE.TorusGeometry(.94,.055,7,6),M.gold,root,[0,.16,0],[Math.PI/2,0,Math.PI/6]);
  const cape=makeCape(model);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group(); model.add(leftLeg,rightLeg); leftLeg.position.x=-.32; rightLeg.position.x=.32;
  capsule(.18,.54,M.cloth,leftLeg,[0,.83,0]); capsule(.18,.54,M.cloth,rightLeg,[0,.83,0]);
  mesh(new RoundedBoxGeometry(.43,.34,.63,3,.11),M.leather,leftLeg,[0,.36,.12],[0,0,.02]);
  mesh(new RoundedBoxGeometry(.43,.34,.63,3,.11),M.leather,rightLeg,[0,.36,.12],[0,0,-.02]);
  mesh(new RoundedBoxGeometry(.3,.2,.72,3,.08),M.darkLeather,leftLeg,[0,.15,.23]);
  mesh(new RoundedBoxGeometry(.3,.2,.72,3,.08),M.darkLeather,rightLeg,[0,.15,.23]);
  const torso=new THREE.Group(); model.add(torso); torso.position.y=2.52;
  mesh(new THREE.SphereGeometry(.76,18,12),M.gold,torso,[0,.22,0],[0,0,0],[1,.82,.58]);
  mesh(new THREE.SphereGeometry(.61,16,10),M.cloth,torso,[0,.05,.35],[0,0,0],[1,.75,.22]);
  mesh(new THREE.SphereGeometry(.38,14,9),M.goldHot,torso,[0,.22,.48],[0,0,0],[1.15,1,.3]);
  mesh(new THREE.IcosahedronGeometry(.34,1),M.goldHot,torso,[-.68,.43,.02],[0,0,-.2],[1.25,.72,1]);
  mesh(new THREE.IcosahedronGeometry(.34,1),M.goldHot,torso,[.68,.43,.02],[0,0,.2],[1.25,.72,1]);
  mesh(new RoundedBoxGeometry(1.35,.16,.56,3,.05),M.darkLeather,torso,[0,-.38,.04]);
  mesh(new RoundedBoxGeometry(.31,.27,.14,3,.05),M.goldHot,torso,[0,-.38,.36]);
  const strap=mesh(new RoundedBoxGeometry(.18,1.55,.12,2,.04),M.leather,torso,[0,.18,.4],[0,0,-.62]); strap.castShadow=true;
  const leftArm=new THREE.Group(),rightArm=new THREE.Group(); torso.add(leftArm,rightArm); leftArm.position.set(.72,.23,0); rightArm.position.set(-.72,.23,0);
  capsule(.2,.56,M.leather,leftArm,[.12,-.22,.02],[0,0,-.3]); capsule(.2,.56,M.leather,rightArm,[-.1,-.22,.02],[0,0,.3]);
  mesh(new THREE.CylinderGeometry(.24,.2,.38,8),M.gold,leftArm,[.23,-.55,.06],[0,0,-.27]);
  mesh(new THREE.CylinderGeometry(.22,.19,.4,8),M.gold,rightArm,[-.22,-.56,.06],[0,0,.28]);
  mesh(new THREE.SphereGeometry(.17,12,8),M.skin,leftArm,[.3,-.79,.12]); mesh(new THREE.SphereGeometry(.17,12,8),M.skin,rightArm,[-.31,-.8,.12]);
  const fur=new THREE.Group(); torso.add(fur); fur.position.set(0,.72,-.02);
  for(let i=0;i<11;i++){const a=-1.42+i*.284;mesh(new THREE.IcosahedronGeometry(.19+(i%3)*.018,1),i%2?M.fur:M.furShade,fur,[Math.sin(a)*.72,Math.cos(a)*.2,Math.cos(a)*.2]);}
  const head=makeHead(model),shield=makeShield(model),sword=makeSword(model);
  const state={mode:'idle'};
  root.userData.setMode=mode=>{state.mode=mode};
  root.userData.update=time=>{
    const breathe=Math.sin(time*2.15),slow=Math.sin(time*1.08);
    if(state.mode==='celebrate'){
      const hop=Math.max(0,Math.sin(time*3.2)); model.position.y=hop*.42;
      torso.rotation.z=Math.sin(time*3.2)*.055; leftArm.rotation.z=-.75-hop*.28; rightArm.rotation.z=.82+hop*.25;
      sword.rotation.z=sword.userData.baseZ-.55-hop*.18; shield.position.y=shield.userData.baseY+.22+hop*.2;
    } else {
      model.position.y=0; torso.scale.y=1+breathe*.012; torso.position.y=2.52+breathe*.018;
      torso.rotation.z=slow*.008; leftArm.rotation.z=-.07+slow*.025; rightArm.rotation.z=.06-slow*.02;
      sword.rotation.z=sword.userData.baseZ+slow*.018; shield.position.y=shield.userData.baseY+breathe*.018;
    }
    head.rotation.y=Math.sin(time*.67)*.035; cape.rotation.x=cape.userData.baseRotation+Math.sin(time*1.15)*.018;
    platform.rotation.y=time*.035;
  };
  return root;
}
