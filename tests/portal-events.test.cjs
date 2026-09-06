const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const bridge=fs.readFileSync(path.join(root,'portal-events.js'),'utf8');
const multiplayer=fs.readFileSync(path.join(root,'multiplayer.js'),'utf8');
const event={id:'host-session-1',type:'rejection',actor:{id:'P1',kind:'player',pos:'PORTAL',charId:'misty',name:'Custom Name'},destination:'0,0'};

function context(board){
 const calls=[];const c={window:{},game:{round:1},webglBoard:board,performance,console,setTimeout,clearTimeout,Date,Promise,
 requestAnimationFrame:fn=>{},cpuTimer:null,portalRevealTimer:null,busy:false,
 els:{message:{classList:{add(){}}}},pauseAmbient(){},renderTokens(){},renderPlayers(){},syncTrue3DBoard(){}};
 if(!board)c.webglBoard={isTrue3D:true,cinematics:{},ready:Promise.resolve(),playPortalEvent:e=>{calls.push(e);return Promise.resolve()},resetPortalEvents(){}};
 vm.createContext(c);vm.runInContext(bridge,c);return{c,calls};
}

test('game scripts parse, including the inline engine',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');let count=0;
 for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  if(/src=|importmap|type="module"/.test(match[1]))continue;
  new vm.Script(match[2]);count++;
 }
 assert.ok(count>0);
 new vm.Script(multiplayer);new vm.Script(bridge);
});

test('visual descriptors preserve custom names and start destinations without changing rules',async()=>{
 const {c,calls}=context();const sent=[];c.window.TabokBroadcastVisual=e=>sent.push(e);
 const hero={p:'P1',name:'Custom Name',charId:'misty',pos:'PORTAL',color:'#fa8774',inventory:[2,1,0]};
 await c.emitPortalVisual('rejection',hero,'0,0');
 assert.equal(hero.pos,'PORTAL');assert.deepEqual(hero.inventory,[2,1,0]);
 assert.equal(sent[0].actor.name,'Custom Name');assert.equal(sent[0].destination,'0,0');assert.equal(calls.length,1);
 assert.equal(vm.runInContext('portalVisualPending.size',c),0);
});

test('invalid network events cannot create actors',async()=>{
 const {c,calls}=context();
 for(const invalid of [{...event,type:'other'},{...event,actor:{...event.actor,id:'P999'}},{...event,destination:'not-a-hex'},{...event,actor:{...event.actor,pos:'99,INVALID'}}])await c.receivePortalVisual(invalid);
 assert.equal(calls.length,0);
});

test('a state snapshot during renderer startup does not drop a visual event',async()=>{
 let ready;const received=[];const {c}=context({isTrue3D:true,ready:new Promise(r=>ready=r),playPortalEvent:e=>{received.push(e);return Promise.resolve()}});
 const pending=c.receivePortalVisual(event);c.game={round:2};ready();await pending;
 assert.equal(received.length,1);
});

test('reset cancels events still waiting for renderer startup',async()=>{
 let ready;const received=[];const {c}=context({isTrue3D:true,ready:new Promise(r=>ready=r),playPortalEvent:e=>{received.push(e);return Promise.resolve()},resetPortalEvents(){}});
 const pending=c.receivePortalVisual(event);c.resetPortalVisuals();ready();await pending;assert.equal(received.length,0);
});

test('only host broadcasts; the guest receives the explicit event once through the network handler',()=>{
 const sent=[],played=[];let snapshots=0;
 const c={window:{TabokReceiveVisual:e=>played.push(e)},isHost:true,room:{phase:'game'},broadcast:data=>sent.push(data),queueSnapshot:()=>snapshots++,applyGameSnapshot(){},applyUI(){},showRoomNotice(){}};
 vm.createContext(c);
 const install=multiplayer.split('\n').find(line=>line.includes('window.TabokBroadcastVisual='));vm.runInContext(install,c);
 c.window.TabokBroadcastVisual(event);assert.equal(sent.length,1);assert.equal(snapshots,1);assert.equal(sent[0].type,'visual-event');
 c.isHost=false;c.window.TabokBroadcastVisual(event);assert.equal(sent.length,1);
 const receive=multiplayer.match(/  function receiveFromHost\(data\) \{[\s\S]+?\n  \}/)[0];vm.runInContext(receive,c);
 c.receiveFromHost(sent[0]);assert.equal(played.length,1);assert.equal(played[0],event);
});

test('rejected or crossed actors are emitted before their rule-state changes',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/function cross\(p,source\)\{[^\n]*emitPortalVisual\('crossing'[\s\S]*?p.status='crossed'/);
 assert.match(html,/function reject\(p\)\{emitPortalVisual\('rejection',p,p.start\);p.pos=p.start/);
 assert.match(html,/function kill\(p,events\)\{emitPortalVisual\('death',p,p.pos\);p.status='dead'/);
 assert.ok(!html.includes('webglBoard?.portalExit'));
});
