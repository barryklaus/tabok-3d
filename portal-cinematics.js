import * as THREE from 'three';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const DURATIONS = { major: 6800, minor: 2800, crossing: 3400, rejection: 2900, death: 5200 };
const ORIGIN = new THREE.Vector3(0, .42, 0);

// One board-owned timeline: state snapshots cannot snap or delete an actor midway
// through an event. Deadlines also release the game when a browser suspends rAF.
export class PortalCinematics {
  constructor(board, worldFor, disposeObject) {
    this.board = board; this.worldFor = worldFor; this.disposeObject = disposeObject;
    this.queue = []; this.active = null; this.seen = new Set(); this.corpses = [];
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.label = document.createElement('div');
    this.label.className = 'portal-magic-words';
    this.label.setAttribute('role', 'status'); this.label.setAttribute('aria-live', 'polite');
    document.body.append(this.label);
    this.shells = [0, 1].map(index => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.74, 24, 14, index * Math.PI, Math.PI, 0, Math.PI / 2), board.portalDomeMaterial);
      mesh.visible = false; mesh.userData.pickPortal = true; board.portal.add(mesh); return mesh;
    });
    board.controls.addEventListener('start',()=>{if(this.active?.camera)this.active.camera.cancelled=true;});
  }

  play(event) {
    if (!event || !DURATIONS[event.type] || !event.actor?.id || !event.id) return Promise.resolve();
    if (this.seen.has(event.id)) return Promise.resolve();
    this.seen.add(event.id);
    if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value);
    let actor = this.board.actors.get(event.actor.id);
    if (!actor) actor = this.board.makeActor(event.actor);
    if(!actor.userData.cinematicLocks)delete actor.userData.cinematicSnapshotPos;
    actor.userData.cinematicLocks = (actor.userData.cinematicLocks || 0) + 1;
    if (event.type === 'major' || event.type === 'minor') actor.visible = false;
    return new Promise(resolve => {
      const duration=DURATIONS[event.type]*({cinematic:1,fast:.78,instant:.18}[event.speed]||1);
      const task = { event, actor, resolve, queued:performance.now(), duration: this.reduced ? Math.min(1500, duration) : duration };
      this.queue.push(task); this.next();
    });
  }

  next() {
    if (this.active || !this.queue.length) return;
    if(this.queue[0].event.type==='death'&&document.querySelector('#messageOverlay:not(.hidden):not(.portal-local)')&&performance.now()-this.queue[0].queued<6500){
      clearTimeout(this.retry);this.retry=setTimeout(()=>this.next(),150);return;
    }
    const task = this.active = this.queue.shift(), {event, actor} = task, board = this.board;
    task.started = performance.now(); task.start = actor.position.clone(); task.scale = actor.scale.clone();
    task.end = this.worldFor(event.destination || event.actor.pos);
    task.rotation = actor.rotation.clone(); task.impulses = new Set();
    if(event.type==='major'&&!this.reduced){
      const position=board.camera.position.clone(),target=board.controls.target.clone();
      const focus=new THREE.Vector3(0,.7,0),offset=position.clone().sub(target);
      offset.setLength(Math.min(offset.length(),11));
      task.camera={position,target,focus,destination:focus.clone().add(offset),cancelled:false};
    }
    actor.visible = true;
    const visual = actor.userData.visual3D;
    clearTimeout(actor.userData.actionTimer);actor.userData.actionResolve?.();actor.userData.actionResolve=null;
    // The plinth stays on the ground: only the figure travels through the air.
    task.hiddenBase = actor.children.filter(child => child !== visual && child.visible);
    task.hiddenBase.forEach(child => child.visible = false);
    const glow = board.occupancyGlows.get(event.actor.id); if (glow) glow.visible = false;
    this.label.dataset.kind = event.type;
    const name = String(event.actor.name || event.actor.id).slice(0, 64);
    this.label.replaceChildren();
    const kicker = document.createElement('small'), title = document.createElement('strong');
    kicker.textContent = {major:'THE SEAL IS BROKEN',minor:'SOMETHING ANSWERED',crossing:'THE WAY OPENS',rejection:'THE VEIL REFUSES',death:'CLAIMED BY THE RUINS'}[event.type];
    title.textContent = {major:'The Sovereign rises',minor:'A ruin beast emerges',crossing:name + ' crosses',rejection:name + ' is rejected',death:name + ' has fallen'}[event.type];
    this.label.append(kicker, title);
    this.label.classList.add('visible');
    board.portalState = event.type === 'crossing' ? 'crossing' : event.type === 'rejection' ? 'rejected' : 'reckoning';
    visual?.userData.setMode?.(event.type === 'crossing' ? 'victory' : event.type === 'rejection' ? 'receive' : 'summon');
    if (event.type === 'major' || event.type === 'minor') {
      actor.position.copy(ORIGIN); actor.position.y = -.9; actor.scale.setScalar(.02);
      board.summonCinematic = {major:event.type === 'major', started:task.started, duration:task.duration};
    }
    if (event.type === 'death') this.breakApart(task);
    task.deadline = setTimeout(() => this.finish(task), task.duration + 100);
    this.update(performance.now());
  }

  impulse(task, key, at, time, action) {
    if (time < at || task.impulses.has(key)) return;
    task.impulses.add(key); if (!this.reduced) action();
  }

  openSphere(amount) {
    const open = clamp(amount), board = this.board;
    board.portalDome.visible = open < .002;
    this.shells.forEach((shell, index) => {
      const side = index ? -1 : 1;
      shell.visible = open >= .002;
      shell.position.set(0, .48 - open * .18, side * open * .8);
      shell.rotation.x = side * open * .98;
      shell.scale.set(1, 1 - open * .55, 1);
    });
    board.portalVortexMaterial.uniforms.uPower.value = Math.max(board.portalVortexMaterial.uniforms.uPower.value,1+open*1.2);
  }

  update(now) {
    this.positionLabels();
    const task = this.active; if (!task) return;
    const {event,actor} = task, board = this.board, u = clamp((now - task.started) / task.duration);
    if(event.type!=='death')board.portalState=event.type==='crossing'?'crossing':event.type==='rejection'?'rejected':'reckoning';
    const open = smooth(u / .22) * (1 - smooth((u - .79) / .21));
    if (event.type !== 'death') this.openSphere(open);
    const visual = actor.userData.visual3D;
    if(task.camera&&!task.camera.cancelled){
      const weight=smooth(u/.22)*(1-smooth((u-.8)/.2)),c=task.camera;
      board.camera.position.lerpVectors(c.position,c.destination,weight);
      board.controls.target.lerpVectors(c.target,c.focus,weight);board.camera.lookAt(board.controls.target);
    }
    if (event.type === 'major' || event.type === 'minor') {
      const major = event.type === 'major', riseEnd = major ? .57 : .32;
      const rise = smooth((u - .12) / (riseEnd - .12)), flight = smooth((u - riseEnd) / (1 - riseEnd));
      actor.position.lerpVectors(ORIGIN, task.end, flight);
      actor.position.y = flight > 0 ? THREE.MathUtils.lerp(major ? 2.1 : 1.1, task.end.y, flight) + Math.sin(flight * Math.PI) * (major ? .7 : 1.65) : -.9 + rise * (major ? 3 : 2);
      actor.scale.setScalar(.02 + rise * .98);
      actor.rotation.y = major ? Math.sin(rise * Math.PI) * .26 : flight * Math.PI * 2;
      if (major) {
        [.15,.3,.49].forEach((at,index) => this.impulse(task,'bolt'+index,at,u,()=>board.lightningStrike(index===2?ORIGIN:new THREE.Vector3(index?2.6:-2.8,0,index?-2:2),index===2?1.2:.65)));
      } else this.impulse(task,'spit',.27,u,()=>board.createSkyBeam(ORIGIN,0xe27aff,950,.9));
    } else if (event.type === 'crossing') {
      const leap = smooth((u - .33) / .47), sink = smooth((u - .68) / .18);
      actor.position.lerpVectors(task.start, ORIGIN, leap);
      actor.position.y += Math.sin(leap * Math.PI) * (this.reduced ? .25 : 1.9) - sink * 1.6;
      actor.scale.copy(task.scale).multiplyScalar(1 - sink * .98);
      this.impulse(task,'jump',.32,u,()=>visual?.userData.setMode?.('portal'));
      this.impulse(task,'beam',.68,u,()=>board.createSkyBeam(ORIGIN,0x98ffe2,900,1));
      actor.visible = u < .87;
    } else if (event.type === 'rejection') {
      const charge = smooth(u / .27), flight = smooth((u - .28) / .62);
      actor.position.lerpVectors(task.start, task.end, flight);
      actor.position.y += Math.sin(flight * Math.PI) * (this.reduced ? .1 : 3.5);
      actor.rotation.x = -Math.sin(flight * Math.PI) * (this.reduced ? .1 : 1.8);
      this.impulse(task,'blast',.26,u,()=>{
        board.createSkyBeam(ORIGIN,0xff588d,900,1.7); board.lightningStrike(ORIGIN,.8);
        board.summonCinematic = {major:false,started:performance.now(),duration:380};
      });
      board.portalDomeMaterial.uniforms.uPower.value += charge * (1-flight) * 1.5;
    } else if (event.type === 'death') this.updateFragments(task, u * DURATIONS.death / 1000);
    this.label.style.opacity = String(Math.min(1,u*10,(1-u)*8));
    if (u >= 1) this.finish(task);
  }

  breakApart(task) {
    const visual = task.actor.userData.visual3D, rig = visual?.userData.rig;
    task.fragments = []; task.fragmentMaterials = new Set();
    if (!rig) { task.actor.visible = false; return; }
    visual.userData.cinematicFrozen = true;
    visual.updateWorldMatrix(true,true);
    // Detach distal joints first, preserving their world transforms and held gear.
    const names = ['leftHand','rightHand','leftForearm','rightForearm','leftArm','rightArm','leftFoot','rightFoot','leftKnee','rightKnee','leftLeg','rightLeg','head','neck','torso','hips'];
    let seed = [...task.event.id].reduce((sum,ch) => (sum*31+ch.charCodeAt(0))>>>0,7);
    const random = () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    names.forEach((name,index) => {
      const part = rig[name]; if (!part) return;
      this.board.effectRoot.attach(part);
      const origin = part.position.clone(), angle = index * 2.399 + random() * .4;
      part.traverse(node => {
        if (!node.isMesh) return;
        for (const mat of (Array.isArray(node.material)?node.material:[node.material])) {
          task.fragmentMaterials.add(mat); mat.transparent = true; mat.depthWrite = false;
        }
      });
      task.fragments.push({part,origin,velocity:new THREE.Vector3(Math.cos(angle)*(.7+random()),1.9+random()*1.6,Math.sin(angle)*(.7+random())),spin:new THREE.Vector3(random()*5-2.5,random()*5-2.5,random()*5-2.5),rotation:part.rotation.clone(),floor:.21+random()*.1});
    });
    this.impulse(task,'death',0,0,()=>this.board.createSkyBeam(task.start,0xa83b64,600,.65));
  }

  updateFragments(task, seconds) {
    for (const item of task.fragments || []) {
      const {part,origin,velocity,spin,rotation,floor} = item;
      const hit = (velocity.y + Math.sqrt(velocity.y**2+18*Math.max(0,origin.y-floor)))/9;
      const fall = Math.min(seconds,hit), after = Math.max(0,seconds-hit);
      const slide = fall + (1-Math.exp(-after*5))*.13;
      part.position.set(origin.x+velocity.x*slide,Math.max(floor,origin.y+velocity.y*fall-4.5*fall*fall)+Math.max(0,Math.sin(after*13))*.11*Math.exp(-after*5),origin.z+velocity.z*slide);
      part.rotation.set(rotation.x+spin.x*(fall+Math.min(after,.25)),rotation.y+spin.y*fall,rotation.z+spin.z*(fall+Math.min(after,.25)));
      if(after>0){const bounds=new THREE.Box3().setFromObject(part);if(Number.isFinite(bounds.min.y))part.position.y+=Math.max(0,.14-bounds.min.y);}
    }
    const opacity = 1-smooth((seconds-3)/2.2);
    task.fragmentMaterials?.forEach(material=>material.opacity=opacity);
  }

  finish(task) {
    if (task !== this.active) return;
    clearTimeout(task.deadline);
    if(task.camera&&!task.camera.cancelled){this.board.camera.position.copy(task.camera.position);this.board.controls.target.copy(task.camera.target);}
    const {actor,event} = task;
    if (event.type === 'death') {
      // A single ownership pass avoids disposing shared per-character materials twice.
      const remains = new THREE.Group(); (task.fragments||[]).forEach(item=>remains.add(item.part));
      this.disposeObject(remains);
    }
    actor.position.copy(task.end); actor.rotation.copy(task.rotation); actor.scale.copy(task.scale);
    if(actor.userData.cinematicSnapshotPos)actor.position.copy(this.worldFor(actor.userData.cinematicSnapshotPos));
    delete actor.userData.cinematicSnapshotPos;
    actor.userData.cinematicLocks = Math.max(0,(actor.userData.cinematicLocks||1)-1);
    actor.userData.visual3D?.userData.setMode?.('idle');
    const departing = event.type === 'crossing' || event.type === 'death';
    actor.visible = !departing; task.hiddenBase?.forEach(child=>child.visible=true);
    const glow = this.board.occupancyGlows.get(event.actor.id); if (glow) glow.visible=!departing;
    if (departing || actor.userData.pendingRemoval) {
      actor.userData.pendingRemoval=false; this.board.removeActor(event.actor.id);
    }
    this.openSphere(0); this.board.summonCinematic=null; this.board.canvas.style.transform='';
    this.label.classList.remove('visible'); this.label.style.opacity='';
    this.active=null; task.resolve(); this.next();
  }

  positionLabels() {
    const board=this.board;if(!board.camera)return;
    const rect=board.canvas.getBoundingClientRect(),p=new THREE.Vector3(0,1.6,0).project(board.camera);
    const x=rect.left+(p.x+1)*rect.width/2,y=rect.top+(1-p.y)*rect.height/2;
    // Root variables aren't in the multiplayer UI observer: orbiting never floods peers.
    const key=x.toFixed(1)+','+y.toFixed(1);if(key===this.anchorKey)return;this.anchorKey=key;
    document.documentElement.style.setProperty('--portal-screen-x',x.toFixed(1)+'px');
    document.documentElement.style.setProperty('--portal-screen-y',y.toFixed(1)+'px');
  }

  reset() {
    clearTimeout(this.retry);
    const queued=this.queue.splice(0);queued.forEach(task=>{task.actor.userData.cinematicLocks=0;task.resolve();});
    if(this.active)this.finish(this.active);
    this.seen.clear();this.label.classList.remove('visible');
  }
}
