import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createJustinPilot } from './character-3d-justin.js';

const mat=(color,roughness=.72,metalness=0,emissive=0,emissiveIntensity=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity});
const skin={warm:mat(0xa9562d),light:mat(0xd78354),deep:mat(0x744124)};
const neutral={hair:mat(0x21100d,.9),leather:mat(0x42251a,.86),dark:mat(0x151016,.9),steel:mat(0xb9c9d3,.22,.82),white:mat(0xf0dfc4,.82),eye:mat(0x0b0808,.55),gold:mat(0xd89528,.28,.7),bronze:mat(0x8f4c20,.4,.65)};

function mesh(geometry,material,parent,p=[0,0,0],r=[0,0,0],s=[1,1,1]){const o=new THREE.Mesh(geometry,material);o.position.set(...p);o.rotation.set(...r);o.scale.set(...s);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function capsule(radius,length,material,parent,p,r=[0,0,0]){return mesh(new THREE.CapsuleGeometry(radius,length,5,9),material,parent,p,r)}
function rounded(w,h,d,material,parent,p,r=[0,0,0],radius=.06){return mesh(new RoundedBoxGeometry(w,h,d,3,radius),material,parent,p,r)}
function hairClump(parent,p,material=neutral.hair,s=[1,1,1]){return mesh(new THREE.IcosahedronGeometry(.18,1),material,parent,p,[0,0,0],s)}

function platform(root,color){
  const base=mesh(new THREE.CylinderGeometry(1.1,1.24,.2,6),mat(0x171116,.8,.18),root,[0,.02,0]);
  const glow=mesh(new THREE.TorusGeometry(.91,.045,7,6),mat(color,.24,.55,color,.25),root,[0,.15,0],[Math.PI/2,0,Math.PI/6]);
  base.userData.galleryPlatform=glow.userData.galleryPlatform=true;
  return {base,glow};
}

function face(parent,{tone=skin.light,hair=neutral.hair,hairStyle='short',eye=0x20100c}){
  const head=new THREE.Group();parent.add(head);head.position.set(0,3.82,.05);
  mesh(new THREE.SphereGeometry(.43,16,12),tone,head,[0,0,0],[0,0,0],[.88,1,.88]);
  mesh(new THREE.SphereGeometry(.11,10,7),tone,head,[0,-.02,.39],[0,0,0],[.72,1,.72]);
  const iris=mat(eye,.45);for(const x of [-.15,.15]){mesh(new THREE.SphereGeometry(.052,9,6),neutral.white,head,[x,.08,.37],[0,0,0],[1.35,.72,.45]);mesh(new THREE.SphereGeometry(.026,8,6),iris,head,[x,.08,.407]);}
  rounded(.24,.045,.04,hair,head,[-.15,.18,.4],[0,0,-.11],.015);rounded(.24,.045,.04,hair,head,[.15,.18,.4],[0,0,.11],.015);
  for(let i=0;i<8;i++){const a=-1.85+i*.51;hairClump(head,[Math.sin(a)*.36,.34+Math.cos(a)*.17,-.03+Math.cos(a)*.21],hair,[1.12,.95,1]);}
  if(hairStyle==='pony'){
    const pony=new THREE.Group();head.add(pony);pony.position.set(0,.24,-.34);
    for(let i=0;i<4;i++)hairClump(pony,[0,.15+i*.13,-.08-i*.12],hair,[1.18,1.2,1]);
    head.userData.pony=pony;
  }else if(hairStyle==='long'){
    for(let i=0;i<5;i++)for(const side of [-1,1])hairClump(head,[side*(.34+i*.015),.05-i*.15,-.12],hair,[.9,1.3,.82]);
  }else if(hairStyle==='wild'){
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;hairClump(head,[Math.sin(a)*.42,.25+Math.cos(a)*.28,-.12],hair,[1.25,1.25,1]);}
  }
  return head;
}

function body(root,{primary,secondary,accent,tone=skin.light,coat=false,skirt=false}){
  const model=new THREE.Group();root.add(model);
  const hips=new THREE.Group();model.add(hips);hips.position.y=0;
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();hips.add(leftLeg,rightLeg);leftLeg.position.x=-.25;rightLeg.position.x=.25;
  capsule(.16,.48,secondary,leftLeg,[0,.77,0]);capsule(.16,.48,secondary,rightLeg,[0,.77,0]);
  rounded(.35,.32,.56,neutral.leather,leftLeg,[0,.33,.13],[0,0,.02],.1);rounded(.35,.32,.56,neutral.leather,rightLeg,[0,.33,.13],[0,0,-.02],.1);
  capsule(.18,.34,secondary,leftLeg,[0,1.18,0]);capsule(.18,.34,secondary,rightLeg,[0,1.18,0]);
  rounded(.92,.38,.5,secondary,model,[0,1.44,0],[0,0,0],.12);
  rounded(.78,.78,.44,primary,model,[0,1.88,0],[0,0,0],.13);
  const torso=new THREE.Group();model.add(torso);torso.position.y=2.52;
  mesh(new THREE.SphereGeometry(.64,15,11),primary,torso,[0,.16,0],[0,0,0],[1,.82,.57]);
  rounded(1.2,.14,.5,neutral.leather,torso,[0,-.34,.03],[0,0,0],.045);rounded(.26,.23,.13,accent,torso,[0,-.34,.33],[0,0,0],.04);
  if(skirt){for(const x of [-.42,0,.42])rounded(.38,.75,.1,primary,torso,[x,-.7,.02],[.05,0,x*.17],.04)}
  if(coat){for(const x of [-.43,.43])rounded(.5,1.18,.11,primary,torso,[x,-.48,-.02],[.06,0,x*.16],.06)}
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();torso.add(leftArm,rightArm);leftArm.position.set(.62,.2,0);rightArm.position.set(-.62,.2,0);
  mesh(new THREE.SphereGeometry(.23,10,7),primary,torso,[-.61,.34,0],[0,0,0],[1.1,.85,1]);mesh(new THREE.SphereGeometry(.23,10,7),primary,torso,[.61,.34,0],[0,0,0],[1.1,.85,1]);
  capsule(.18,.38,secondary,leftArm,[.08,-.2,.02],[0,0,-.25]);capsule(.18,.38,secondary,rightArm,[-.08,-.2,.02],[0,0,.25]);
  const leftForearm=new THREE.Group(),rightForearm=new THREE.Group();leftArm.add(leftForearm);rightArm.add(rightForearm);
  leftForearm.position.set(.18,-.43,.04);rightForearm.position.set(-.18,-.43,.04);leftForearm.rotation.z=-.16;rightForearm.rotation.z=.16;
  capsule(.155,.34,tone,leftForearm,[.04,-.18,.04],[0,0,-.12]);capsule(.155,.34,tone,rightForearm,[-.04,-.18,.04],[0,0,.12]);
  const leftHand=new THREE.Group(),rightHand=new THREE.Group();leftForearm.add(leftHand);rightForearm.add(rightHand);leftHand.position.set(.08,-.42,.12);rightHand.position.set(-.08,-.42,.12);
  mesh(new THREE.SphereGeometry(.15,10,7),tone,leftHand);mesh(new THREE.SphereGeometry(.15,10,7),tone,rightHand);
  capsule(.15,.18,tone,model,[0,3.3,.01]);
  const rig={root,model,hips,torso,leftArm,rightArm,leftForearm,rightForearm,leftHand,rightHand,leftLeg,rightLeg};
  root.userData.rig=rig;
  return rig;
}

function scarf(parts,color){
  const scarfMat=mat(color,.88);mesh(new THREE.TorusGeometry(.44,.13,7,18),scarfMat,parts.model,[0,3.47,.02],[Math.PI/2,0,0]);
  const tail=new THREE.Group();parts.model.add(tail);tail.position.set(-.34,3.46,-.18);
  rounded(.25,1.2,.08,scarfMat,tail,[0,-.45,0],[0,0,.45],.035);rounded(.23,.9,.07,scarfMat,tail,[-.25,-.5,-.02],[0,0,.72],.035);return tail;
}
function dagger(parent,p,r=[0,0,0]){const g=new THREE.Group();parent.add(g);g.position.set(...p);g.rotation.set(...r);rounded(.11,.34,.11,neutral.leather,g,[0,0,0],[0,0,0],.03);rounded(.38,.08,.12,neutral.gold,g,[0,-.2,0],[0,0,0],.025);const blade=new THREE.Shape();blade.moveTo(-.075,-.23);blade.lineTo(-.09,-.65);blade.lineTo(0,-.9);blade.lineTo(.09,-.65);blade.lineTo(.075,-.23);blade.closePath();mesh(new THREE.ExtrudeGeometry(blade,{depth:.045,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1}),neutral.steel,g,[0,0,0]);mesh(new THREE.SphereGeometry(.08,8,6),neutral.gold,g,[0,.2,0]);return g}
function lantern(parent,p){const g=new THREE.Group();parent.add(g);g.position.set(...p);const frame=mat(0x4b2c16,.34,.72);mesh(new THREE.CylinderGeometry(.29,.32,.07,8),frame,g,[0,-.27,0]);mesh(new THREE.CylinderGeometry(.25,.29,.07,8),frame,g,[0,.27,0]);for(const x of [-.22,.22])for(const z of [-.12,.12])rounded(.035,.5,.035,frame,g,[x,0,z],[0,0,x*.4],.01);mesh(new THREE.SphereGeometry(.2,12,8),mat(0xffc13f,.26,.08,0xff7900,2.4),g,[0,0,.02]);mesh(new THREE.TorusGeometry(.27,.035,6,12,Math.PI),neutral.gold,g,[0,.36,0],[0,0,0]);const light=new THREE.PointLight(0xff9b32,1.6,2.2,2);g.add(light);return g}
function book(parent,p){const g=new THREE.Group();parent.add(g);g.position.set(...p);g.rotation.set(-.35,0,0);rounded(.62,.12,.78,mat(0x6b2b1f,.8),g,[0,0,0],[0,0,0],.05);rounded(.52,.13,.68,mat(0xe2cda4,.92),g,[0,.025,0],[0,0,0],.035);rounded(.045,.15,.77,neutral.gold,g,[-.31,0,0],[0,0,0],.015);return g}

function animate(root,parts,extras={},movement='walk'){
  const state={mode:'idle',started:null};root.userData.movementStyle=movement;root.userData.setMode=mode=>{state.mode=mode==='celebrate'?'victory':mode;state.started=null};
  root.userData.update=t=>{if(state.started===null)state.started=t;const age=t-state.started,b=Math.sin(t*2.05),slow=Math.sin(t*.86),cycle=Math.sin(age*10),pulse=Math.sin(Math.min(1,age/1.2)*Math.PI);
    parts.model.position.set(0,0,0);parts.model.scale.setScalar(1);parts.model.rotation.x=0;parts.model.rotation.z=0;parts.hips.rotation.set(0,0,0);parts.torso.position.y=2.52+b*.018;parts.torso.scale.set(1,1+b*.01,1);parts.torso.rotation.set(0,0,slow*.008);parts.leftArm.rotation.set(0,0,-.05+slow*.025);parts.rightArm.rotation.set(0,0,.05-slow*.025);parts.leftForearm.rotation.set(0,0,-.16);parts.rightForearm.rotation.set(0,0,.16);parts.leftLeg.rotation.set(0,0,0);parts.rightLeg.rotation.set(0,0,0);
    if(state.mode==='move'){
      if(movement==='glide'){parts.model.position.y=.05+Math.sin(age*8)*.025;parts.model.rotation.z=Math.sin(age*4)*.025;parts.leftArm.rotation.z=-.18;parts.rightArm.rotation.z=.18;}
      else if(movement==='jump'){parts.model.position.y=Math.max(0,Math.sin(Math.min(1,age/.42)*Math.PI))*.34;parts.hips.rotation.x=-.08;parts.leftLeg.rotation.x=-.28;parts.rightLeg.rotation.x=.2;parts.leftArm.rotation.z=-.32;parts.rightArm.rotation.z=.32;}
      else{parts.model.position.y=Math.abs(cycle)*.045;parts.leftLeg.rotation.x=cycle*.42;parts.rightLeg.rotation.x=-cycle*.42;parts.leftArm.rotation.x=-cycle*.34;parts.rightArm.rotation.x=cycle*.34;parts.torso.rotation.y=cycle*.025;}
    }else if(state.mode==='dice'){parts.torso.rotation.x=-.09*pulse;parts.leftArm.rotation.x=-.75*pulse;parts.rightArm.rotation.x=-.75*pulse;parts.leftArm.rotation.z=-.38*pulse;parts.rightArm.rotation.z=.38*pulse;parts.leftForearm.rotation.x=-.52*pulse;parts.rightForearm.rotation.x=-.52*pulse;}
    else if(state.mode==='grab'||state.mode==='take'){parts.torso.rotation.y=-.18*pulse;parts.rightArm.rotation.x=-1.02*pulse;parts.rightArm.rotation.z=.28;parts.rightForearm.rotation.x=-.72*pulse;}
    else if(state.mode==='give'){parts.torso.rotation.y=.3*pulse;parts.rightArm.rotation.x=-1.35*pulse;parts.rightArm.rotation.z=-.22*pulse;parts.rightForearm.rotation.x=.55*pulse;}
    else if(state.mode==='steal'){parts.model.position.z=-.06*pulse;parts.torso.rotation.x=.12*pulse;parts.leftArm.rotation.x=-1.05*pulse;parts.rightArm.rotation.x=-1.05*pulse;parts.leftArm.rotation.z=-.24;parts.rightArm.rotation.z=.24;parts.leftForearm.rotation.x=-.85*pulse;parts.rightForearm.rotation.x=-.85*pulse;}
    else if(state.mode==='receive'){parts.model.position.z=-.08*pulse;parts.leftArm.rotation.x=-.92*pulse;parts.rightArm.rotation.x=-.92*pulse;parts.leftArm.rotation.z=-.2;parts.rightArm.rotation.z=.2;parts.leftForearm.rotation.x=-.55*pulse;parts.rightForearm.rotation.x=-.55*pulse;}
    else if(state.mode==='rune'){parts.model.position.y=pulse*.12;parts.leftArm.rotation.z=-.92*pulse;parts.rightArm.rotation.z=.92*pulse;parts.leftForearm.rotation.x=-.35*pulse;parts.rightForearm.rotation.x=-.35*pulse;parts.torso.rotation.y=age*1.1;}
    else if(state.mode==='victory'){const hop=Math.max(0,Math.sin(age*4.2));parts.model.position.y=hop*.36;parts.leftArm.rotation.z=-.75-hop*.28;parts.rightArm.rotation.z=.82+hop*.25;parts.torso.rotation.z=Math.sin(age*4.2)*.055;}
    else if(state.mode==='portal'){const u=Math.min(1,age/1.2);parts.model.position.y=Math.sin(u*Math.PI)*.65;parts.model.position.z=-u*.35;parts.model.rotation.x=-u*.48;parts.model.scale.setScalar(1-u*.35);parts.leftArm.rotation.z=-.62;parts.rightArm.rotation.z=.62;parts.leftLeg.rotation.x=-.42;parts.rightLeg.rotation.x=.3;}
    if(parts.head)parts.head.rotation.y=Math.sin(t*.61)*.04;if(extras.tail)extras.tail.rotation.z=Math.sin(t*1.4)*.045;if(extras.lantern)extras.lantern.rotation.z=Math.sin(t*1.65)*.08;if(extras.staff)extras.staff.rotation.z=(extras.staff.userData.z||0)+Math.sin(t*.8)*.025;if(extras.pony)extras.pony.rotation.z=Math.sin(t*1.35)*.05;if(extras.backpack)extras.backpack.rotation.z=Math.sin(t*.75)*.012;parts.platform.base.rotation.y=t*.03;parts.platform.glow.material.emissiveIntensity=.22+(b+1)*.06;};
  return root;
}

function misty(){const root=new THREE.Group();const colors={red:mat(0xb3211d,.82),silver:mat(0xd4c4a9,.45,.3),brown:mat(0x5a2b1b,.86)};const p=body(root,{primary:colors.silver,secondary:colors.brown,accent:neutral.gold,tone:skin.light,skirt:true});p.platform=platform(root,0xff5a49);p.head=face(p.model,{tone:skin.light,hair:mat(0x2b100c,.92),hairStyle:'pony',eye:0x4a170c});const tail=scarf(p,0xc51f1c);rounded(.72,.62,.13,colors.silver,p.torso,[0,.13,.41],[0,0,0],.08);mesh(new THREE.IcosahedronGeometry(.25,1),colors.brown,p.torso,[-.62,.34,.03],[0,0,-.12],[1.2,.7,1]);mesh(new THREE.IcosahedronGeometry(.25,1),colors.brown,p.torso,[.62,.34,.03],[0,0,.12],[1.2,.7,1]);rounded(.65,.75,.18,colors.brown,p.torso,[-.48,-.28,-.24],[0,.1,.08],.08);dagger(p.rightHand,[0,-.02,.02],[0,0,.2]);return animate(root,p,{tail,pony:p.head.userData.pony},'walk')}

function cliff(){const root=new THREE.Group();const blue=mat(0x185f9d,.76),cream=mat(0xe7d6bd,.85),orange=mat(0x7a3517,.88);const p=body(root,{primary:blue,secondary:cream,accent:neutral.gold,tone:skin.light,coat:true});p.platform=platform(root,0x45b7ff);p.head=face(p.model,{tone:skin.light,hair:orange,hairStyle:'wild',eye:0x2b1b0e});for(const x of [-.15,.15])mesh(new THREE.TorusGeometry(.105,.023,6,16),mat(0x4cbcff,.18,.45,0x1266aa,.5),p.head,[x,.08,.43]);rounded(.12,.025,.025,neutral.bronze,p.head,[0,.08,.44],[0,0,0],.008);rounded(.18,.82,.08,cream,p.torso,[-.2,.05,.43],[0,0,-.22],.035);rounded(.18,.82,.08,cream,p.torso,[.2,.05,.43],[0,0,.22],.035);const pack=new THREE.Group();p.model.add(pack);pack.position.set(-.38,2.85,-.37);mesh(new THREE.CylinderGeometry(.24,.3,1.18,12),neutral.bronze,pack,[0,.1,0],[0,0,-.28]);mesh(new THREE.TorusGeometry(.29,.06,7,14),neutral.gold,pack,[-.16,.67,0],[0,0,-.28]);const tome=book(p.torso,[0,-.28,.65]);return animate(root,p,{backpack:pack,book:tome},'glide')}

function paige(){const root=new THREE.Group();const green=mat(0x438326,.82),cream=mat(0xeee0bd,.88),darkGreen=mat(0x173f22,.88);const p=body(root,{primary:green,secondary:cream,accent:neutral.gold,tone:skin.deep,skirt:true});p.platform=platform(root,0x79e458);p.head=face(p.model,{tone:skin.deep,hair:mat(0x24140e,.94),hairStyle:'long',eye:0x28120b});const braid=new THREE.Group();p.head.add(braid);braid.position.set(-.35,.18,-.12);for(let i=0;i<6;i++)hairClump(braid,[-.02-i*.035,-.18-i*.16,0],neutral.hair,[.72,.95,.72]);rounded(.68,.82,.12,cream,p.torso,[0,.05,.42],[0,0,0],.06);rounded(.17,1.1,.08,neutral.gold,p.torso,[0,-.12,.49],[0,0,-.55],.03);rounded(.72,1.25,.08,darkGreen,p.torso,[.35,-.43,-.25],[.08,0,-.18],.05);const lamp=lantern(p.leftHand,[0,-.26,.04]);return animate(root,p,{lantern:lamp,pony:braid},'glide')}

function sue(){const root=new THREE.Group();const pink=mat(0xd62270,.76),black=mat(0x21151c,.87),wine=mat(0x641c36,.84);const p=body(root,{primary:black,secondary:wine,accent:neutral.gold,tone:skin.light,skirt:true});p.platform=platform(root,0xff4ea8);p.head=face(p.model,{tone:skin.light,hair:pink,hairStyle:'pony',eye:0x771036});rounded(.78,.18,.24,wine,p.torso,[0,.38,.35],[0,0,0],.055);rounded(.72,.55,.13,wine,p.torso,[.34,-.35,-.22],[0,0,-.16],.05);const d1=dagger(p.leftHand,[0,-.02,.02],[0,0,-.35]),d2=dagger(p.rightHand,[0,-.02,.02],[0,0,.35]);return animate(root,p,{pony:p.head.userData.pony,d1,d2},'jump')}

function wanday(){const root=new THREE.Group();const violet=mat(0x6740a0,.78),lavender=mat(0xb99ad6,.83),purpleHair=mat(0x7845a8,.88);const p=body(root,{primary:violet,secondary:lavender,accent:neutral.gold,tone:skin.light,coat:true});p.platform=platform(root,0xb77aff);p.head=face(p.model,{tone:skin.light,hair:purpleHair,hairStyle:'wild',eye:0x612777});for(const x of [-.38,.38])mesh(new THREE.IcosahedronGeometry(.24,1),neutral.white,p.torso,[x,.48,.2],[0,0,0],[1.25,.7,1]);rounded(.6,.62,.12,lavender,p.torso,[0,.04,.42],[0,0,0],.06);const pack=new THREE.Group();p.model.add(pack);pack.position.set(-.2,2.85,-.48);rounded(1.15,1.45,.56,neutral.leather,pack,[0,0,0],[0,0,-.07],.16);for(const x of [-.32,.28])mesh(new THREE.CylinderGeometry(.14,.18,.65,9),x<0?mat(0x195f89,.35,.15,0x0c3155,.25):mat(0xc66b16,.38,.2),pack,[x,.62,0],[0,0,x]);mesh(new THREE.SphereGeometry(.24,12,8),mat(0xf0a623,.45,.2),pack,[-.38,-.08,.32]);mesh(new THREE.TorusGeometry(.11,.035,6,12),neutral.gold,pack,[-.38,-.08,.56]);const staff=new THREE.Group();p.rightHand.add(staff);staff.position.set(.12,.15,.04);staff.userData.z=-.08;staff.rotation.z=-.08;mesh(new THREE.CylinderGeometry(.055,.07,2.25,8),neutral.bronze,staff,[0,.2,0]);mesh(new THREE.OctahedronGeometry(.25,0),mat(0x4ac8ff,.18,.2,0x1766aa,1.25),staff,[0,1.46,0]);mesh(new THREE.TorusGeometry(.29,.045,6,12,Math.PI*1.55),neutral.gold,staff,[0,1.35,0],[0,0,.65]);return animate(root,p,{staff,backpack:pack},'glide')}

export const TRAVELER_3D={
  misty:{name:'Misty',title:'Mist Scout',color:'#ff745c',create:misty},
  cliff:{name:'Cliff',title:'Relic Archivist',color:'#4cb5ff',create:cliff},
  paige:{name:'Paige',title:'Portal Mystic',color:'#8ce563',create:paige},
  justin:{name:'Justin',title:'Ruin Guardian',color:'#f0b842',create:createJustinPilot},
  sue:{name:'Sue',title:'Treasure Rogue',color:'#ff78c8',create:sue},
  wanday:{name:'Wanday',title:'Oddity Collector',color:'#c391ff',create:wanday}
};

export function createTravelerPilot(id){return (TRAVELER_3D[id]||TRAVELER_3D.justin).create()}
