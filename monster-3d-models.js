import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const mat=(color,roughness=.76,metalness=0,emissive=0,emissiveIntensity=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity});
const M={stone:mat(0x241d21,.94),stone2:mat(0x3b2b28,.9),stone3:mat(0x59402f,.86),obsidian:mat(0x100d14,.8,.18),void:mat(0x09060d,.7,.08),rune:mat(0xff45d4,.24,.16,0xd800a9,1.8),runeHot:mat(0xff8bec,.18,.12,0xff1ed1,2.8),horn:mat(0x9a6a3a,.72,.18),claw:mat(0xc09a6c,.62,.28),bronze:mat(0x9b632c,.34,.7),cloth:mat(0x211827,.98),clothPale:mat(0xb5a895,.94),shadow:mat(0x09070b,.96)};
function mesh(g,m,p,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1]){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.rotation.set(...rot);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
function rounded(w,h,d,m,p,pos,rot=[0,0,0],radius=.06){return mesh(new RoundedBoxGeometry(w,h,d,3,radius),m,p,pos,rot)}
function capsule(rad,len,m,p,pos,rot=[0,0,0]){return mesh(new THREE.CapsuleGeometry(rad,len,5,9),m,p,pos,rot)}
function hexBase(root,r,color){const base=mesh(new THREE.CylinderGeometry(r,r*1.08,.24,6),mat(0x151016,.84,.22),root,[0,.02,0]);const ring=mesh(new THREE.TorusGeometry(r*.78,.05,7,6),mat(color,.25,.6,color,.4),root,[0,.16,0],[Math.PI/2,0,Math.PI/6]);base.userData.galleryPlatform=ring.userData.galleryPlatform=true;return{base,ring}}
function runeDisc(parent,pos,scale=.22){const g=new THREE.Group();parent.add(g);g.position.set(...pos);mesh(new THREE.TorusGeometry(scale,scale*.11,6,16),M.rune,g);mesh(new THREE.OctahedronGeometry(scale*.55,0),M.runeHot,g,[0,0,0],[0,0,Math.PI/4],[1,1,.25]);return g}
function claw(parent,pos,rot=[0,0,0],scale=1){return mesh(new THREE.ConeGeometry(.075*scale,.28*scale,7),M.claw,parent,pos,rot)}

export function createMinorMonster(){
  const root=new THREE.Group();root.name='Minor_Monster_3D';const base=hexBase(root,1.42,0xf04dad),beast=new THREE.Group();root.add(beast);
  const body=mesh(new THREE.SphereGeometry(.86,16,12),M.stone2,beast,[0,1.05,0],[0,0,0],[1.18,.72,1.42]);
  const shell=new THREE.Group();beast.add(shell);shell.position.set(0,1.42,-.08);
  const plates=[];for(let i=0;i<11;i++){const row=i<5?0:1,j=row?i-5:i,a=(j-(row?2.5:2))*.48;const plate=mesh(new THREE.IcosahedronGeometry(row?.36:.42,1),i%3?M.stone:M.stone3,shell,[a,row*.22,(row?.08:-.05)-Math.abs(a)*.1],[0,a*.22,a*.08],[1.05,.72,1.25]);plates.push(plate);if(i%2===0)runeDisc(plate,[0,.03,.34],.13)}
  const head=new THREE.Group();beast.add(head);head.position.set(0,.95,1.12);mesh(new THREE.IcosahedronGeometry(.55,2),M.stone,head,[0,0,0],[0,0,0],[1.1,.78,.92]);rounded(.52,.27,.42,M.stone2,head,[0,-.18,.42],[.16,0,0],.1);
  const eyes=[];for(const x of [-.23,.23])eyes.push(mesh(new THREE.SphereGeometry(.075,10,7),M.runeHot,head,[x,.08,.46],[0,0,0],[1.35,.72,.5]));
  for(const x of [-.3,.3]){mesh(new THREE.ConeGeometry(.13,.68,9),M.horn,head,[x,.28,.05],[Math.PI*.55,0,x>0?-.42:.42]);claw(head,[x*.42,-.24,.67],[Math.PI*.62,0,0],1.2)}
  const jaw=rounded(.58,.2,.38,M.stone3,head,[0,-.34,.48],[-.1,0,0],.08);for(const x of [-.2,0,.2])claw(head,[x,-.43,.67],[Math.PI*.72,0,0],.7);
  const legs=[];for(const x of [-.63,.63])for(const z of [-.53,.55]){const leg=new THREE.Group();beast.add(leg);leg.position.set(x,.67,z);capsule(.22,.45,M.stone,leg,[0,-.18,.1],[Math.PI*.22,0,x*.2]);const paw=mesh(new THREE.SphereGeometry(.27,11,8),M.stone3,leg,[0,-.48,.28],[0,0,0],[1.15,.55,1.45]);for(const dx of [-.14,0,.14])claw(leg,[dx,-.52,.58],[Math.PI/2,0,0],.72);legs.push(leg)}
  const rocks=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rocks.push(mesh(new THREE.IcosahedronGeometry(.07+(i%3)*.025,0),M.stone3,beast,[Math.cos(a)*1.08,1.28+Math.sin(a*2)*.2,Math.sin(a)*1.05]))}
  let mode='idle';root.userData.setMode=v=>mode=v;root.userData.update=t=>{const pulse=(Math.sin(t*3)+1)*.5;body.position.y=1.05+Math.sin(t*2)*.025;head.rotation.x=(mode==='summon'?-0.25:0)+Math.sin(t*1.3)*.025;jaw.rotation.x=(mode==='summon'?.18:.02)+pulse*.025;eyes.forEach(e=>e.material.emissiveIntensity=2.2+pulse*1.5);shell.rotation.z=Math.sin(t*.7)*.012;rocks.forEach((r,i)=>{const a=t*(mode==='summon'?1.35:.42)+i/8*Math.PI*2;r.position.x=Math.cos(a)*(mode==='summon'?1.3:1.08);r.position.z=Math.sin(a)*(mode==='summon'?1.3:1.05);r.position.y=1.25+Math.sin(a*2+i)*.22});legs.forEach((l,i)=>l.rotation.z=Math.sin(t*1.6+i)*.015);base.ring.material.emissiveIntensity=.28+pulse*.25};
  return root;
}

function raggedPanel(parent,x,y,z,width,height,material,tilt=0){const s=new THREE.Shape();s.moveTo(-width/2,height/2);s.lineTo(width/2,height/2);s.lineTo(width*.42,-height*.36);s.lineTo(width*.12,-height/2);s.lineTo(-width*.06,-height*.4);s.lineTo(-width*.32,-height*.52);s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth:.055,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:1}),material,parent,[x,y,z],[0,tilt,0])}
function monolith(parent,i){const g=new THREE.Group();parent.add(g);const stone=mesh(new THREE.IcosahedronGeometry(.42,1),M.stone,g,[0,0,0],[0,0,i*.3],[.7,1.25,.38]);runeDisc(stone,[0,0,.35],.17);for(let k=0;k<3;k++)rounded(.025,.55,.025,M.runeHot,stone,[0,(k-1)*.13,.36],[0,0,k*Math.PI/3],.008);return g}

export function createMajorMonster(){
  const root=new THREE.Group();root.name='Major_Monster_3D';const base=hexBase(root,1.65,0xd91cff),lord=new THREE.Group();root.add(lord);
  const pelvis=mesh(new THREE.IcosahedronGeometry(.58,1),M.obsidian,lord,[0,2.05,0],[0,0,0],[1,.8,.62]);
  const torso=mesh(new THREE.IcosahedronGeometry(.88,2),M.stone,lord,[0,3.08,0],[0,0,0],[.84,1.28,.54]);runeDisc(torso,[0,.08,.55],.22);
  for(const side of [-1,1]){mesh(new THREE.IcosahedronGeometry(.48,1),M.stone2,lord,[side*.72,3.54,0],[0,0,side*.15],[1.35,.62,.9]);rounded(.17,.82,.13,M.bronze,lord,[side*.68,3.48,.45],[0,0,side*.12],.03)}
  const head=new THREE.Group();lord.add(head);head.position.set(0,4.5,.04);mesh(new THREE.IcosahedronGeometry(.48,2),M.obsidian,head,[0,0,0],[0,0,0],[.72,1.15,.72]);mesh(new THREE.ConeGeometry(.28,.62,7),M.obsidian,head,[0,-.32,.2],[Math.PI,0,0]);const eyes=[];for(const x of [-.15,.15])eyes.push(mesh(new THREE.SphereGeometry(.05,9,6),M.runeHot,head,[x,.08,.38],[0,0,0],[1.5,.55,.4]));
  for(let i=0;i<7;i++){const a=-1.1+i*(2.2/6);mesh(new THREE.ConeGeometry(.065,.72+(i%2)*.18,6),M.bronze,head,[Math.sin(a)*.42,.42+Math.cos(a)*.12,-.03],[0,0,-a])}
  const arms=[];for(const side of [-1,1]){const arm=new THREE.Group();lord.add(arm);arm.position.set(side*.78,3.35,0);capsule(.18,1.15,M.stone,arm,[side*.24,-.48,.03],[0,0,-side*.32]);rounded(.34,.18,.42,M.bronze,arm,[side*.42,-.92,.05],[0,0,side*.3],.04);const hand=new THREE.Group();arm.add(hand);hand.position.set(side*.49,-1.18,.12);mesh(new THREE.IcosahedronGeometry(.22,1),M.obsidian,hand);for(let i=0;i<4;i++)claw(hand,[side*(.14+i*.055),-.16+i*.025,.08],[0,0,-side*.45],.8);arms.push(arm)}
  const legs=[];for(const side of [-1,1]){const leg=new THREE.Group();lord.add(leg);leg.position.set(side*.34,1.82,0);capsule(.23,1.32,M.stone,leg,[0,-.55,0],[0,0,-side*.05]);rounded(.42,.2,.72,M.obsidian,leg,[side*.05,-1.34,.22],[0,0,0],.08);for(const x of [-.14,0,.14])claw(leg,[x+side*.05,-1.39,.57],[Math.PI/2,0,0],.9);legs.push(leg)}
  for(let i=0;i<5;i++)raggedPanel(lord,(i-2)*.28,2.25,-.15,.42,2.25,i%2?M.cloth:M.shadow,(i-2)*.08);raggedPanel(lord,-.42,3.05,.32,.38,2.65,M.clothPale,-.08);raggedPanel(lord,.42,3.05,.32,.38,2.65,M.clothPale,.08);rounded(.88,.16,.48,M.bronze,lord,[0,2.22,.42],[0,0,0],.04);runeDisc(lord,[0,2.22,.7],.19);
  const halo=new THREE.Group();lord.add(halo);halo.position.set(0,5.25,-.08);const stones=[];for(let i=0;i<5;i++){const s=monolith(halo,i);stones.push(s)}
  const energy=new THREE.Mesh(new THREE.TorusGeometry(1.28,.022,6,48),new THREE.MeshBasicMaterial({color:0xff35db,transparent:true,opacity:.72}));energy.position.copy(halo.position);lord.add(energy);const innerEnergy=new THREE.Mesh(new THREE.TorusGeometry(.94,.012,5,40),new THREE.MeshBasicMaterial({color:0xa14bff,transparent:true,opacity:.55}));innerEnergy.position.copy(halo.position);lord.add(innerEnergy);
  let mode='idle';root.userData.setMode=v=>mode=v;root.userData.update=t=>{const pulse=(Math.sin(t*2.6)+1)*.5,spread=mode==='summon'?1.55:1.22;torso.scale.y=1.28+Math.sin(t*1.6)*.012;head.rotation.y=Math.sin(t*.55)*.035;eyes.forEach(e=>e.material.emissiveIntensity=2.2+pulse*1.8);arms[0].rotation.z=(mode==='summon'?-.72:-.04)-Math.sin(t*.8)*.025;arms[1].rotation.z=(mode==='summon'?.72:.04)+Math.sin(t*.8)*.025;stones.forEach((s,i)=>{const a=t*(mode==='summon'?.48:.18)+i/5*Math.PI*2;s.position.set(Math.cos(a)*spread,Math.sin(a)*.56,Math.sin(a)*.26);s.rotation.y=-a+t*.2;s.rotation.z=Math.sin(t+i)*.08});energy.scale.setScalar(spread/1.22);energy.material.opacity=.5+pulse*.35;energy.rotation.z=t*.12;innerEnergy.scale.setScalar(1+(spread/1.22-1)*.55);innerEnergy.rotation.z=-t*.2;innerEnergy.material.opacity=.34+pulse*.28;lord.position.y=mode==='summon'?Math.max(0,Math.sin(t*2.2))*.08:0;base.ring.material.emissiveIntensity=.35+pulse*.35};
  return root;
}

export const MONSTER_3D={minor:{name:'Minor Monster',title:'Riftback',color:'#f04dad',create:createMinorMonster,camera:[5.6,3.4,7.4],target:[0,1.2,0]},major:{name:'Major Monster',title:'The Ruin Sovereign',color:'#d91cff',create:createMajorMonster,camera:[7.2,5.4,10.8],target:[0,2.65,0]}};
export function createMonsterPilot(id){return(MONSTER_3D[id]||MONSTER_3D.minor).create()}
