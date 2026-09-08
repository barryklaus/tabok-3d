import * as THREE from 'three';
import { createSculptedTraveler } from './sculpted-travelers.js?v=20260908D1';

function disposeModel(root){
  root?.traverse(node=>{
    if(!node.isMesh)return;
    node.geometry?.dispose?.();
    for(const material of(Array.isArray(node.material)?node.material:[node.material]))material?.dispose?.();
  });
}

export class TabokBustPreview {
  constructor(){
    this.canvas=document.createElement('canvas');
    this.canvas.className='character-bust-canvas';
    this.canvas.setAttribute('aria-hidden','true');
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(25,1,.1,20);
    this.camera.position.set(0,2.78,5.15);
    this.camera.lookAt(0,2.72,0);
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.18;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));
    this.scene.add(new THREE.HemisphereLight(0xf0d9ad,0x100b13,2.15));
    const key=new THREE.DirectionalLight(0xffd796,4.8);key.position.set(-3,5,5);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x7c56a8,3.2);rim.position.set(4,3,-3);this.scene.add(rim);
    this.clock=new THREE.Clock();this.visible=false;this.lastFrame=0;this.boundFrame=now=>this.frame(now);
    this.observer=new IntersectionObserver(entries=>{this.visible=Boolean(entries[0]?.isIntersecting);if(this.visible)this.requestFrame()},{threshold:.05});
  }

  attach(host){
    if(!host)return;
    host.append(this.canvas);this.visible=true;this.observer.disconnect();this.observer.observe(host);this.resize();this.requestFrame();
  }

  show(id){
    if(this.id===id&&this.model)return;
    if(this.model){this.scene.remove(this.model);disposeModel(this.model)}
    this.id=id;this.model=createSculptedTraveler(id);this.model.scale.setScalar(1.12);this.model.position.set(0,.02,0);this.model.rotation.y=.08;
    this.scene.add(this.model);this.clock.start();this.renderOnce();this.requestFrame();
  }

  hide(){this.visible=false}

  resize(){
    const rect=this.canvas.parentElement?.getBoundingClientRect();if(!rect)return;
    const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
    this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderOnce();
  }

  requestFrame(){if(!this.frameRequest)this.frameRequest=requestAnimationFrame(this.boundFrame)}

  frame(now){
    this.frameRequest=0;if(!this.visible||!this.model||document.hidden)return;
    // The bust is intentionally capped at 15 fps. At this small size it still
    // reads as alive while leaving the main 3D board nearly the full GPU budget.
    if(now-this.lastFrame>=66){this.lastFrame=now;if(!document.documentElement.classList.contains('effects-paused'))this.model.userData.update?.(this.clock.getElapsedTime());this.renderer.render(this.scene,this.camera)}
    this.requestFrame();
  }

  renderOnce(){if(this.model)this.renderer.render(this.scene,this.camera)}
}
