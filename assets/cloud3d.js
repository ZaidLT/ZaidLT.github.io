import * as T from './vendor/three.module.min.js';
// Each group is a named responsibility, not a physical cloud topology.
export function createWorld(host){
 const canvas=host.querySelector('canvas');const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,100),rig=new T.Group();scene.add(rig);
 scene.add(new T.HemisphereLight(0xcfe7f0,0x122a33,2.5));const light=new T.DirectionalLight(0xddeef4,3.5);light.position.set(3,8,5);scene.add(light);
 const fill=new T.PointLight(0x8ec5db,30,25);fill.position.set(-5,4,2);scene.add(fill);
 const material=(color,glow=0)=>new T.MeshStandardMaterial({color,roughness:.35,metalness:.35,emissive:color,emissiveIntensity:glow});
 const blue=material(0x4fa5c7,.15),teal=material(0x45bab2,.15),violet=material(0xda8173,.15),amber=material(0xd6a05c,.15),dark=material(0x122d38),paper=material(0xbcddea),glass=new T.MeshPhysicalMaterial({color:0x89c3da,transparent:true,opacity:.13,roughness:.15,depthWrite:false,side:T.DoubleSide});
 const anchors={},envs=[],groups=[],paths=[];let value=0,dragX=0,dragY=0,active=true,pending=false,disposed=false;
 function box(w,h,d,m,parent,x=0,y=0,z=0){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
 function edge(mesh,color=0x99cbdf){mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry),new T.LineBasicMaterial({color,transparent:true,opacity:.7})));return mesh}
 function anchor(name,parent,x=0,y=0,z=0){const a=new T.Object3D();a.position.set(x,y,z);parent.add(a);anchors[name]=a}
 function line(points,color,parent){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color}));parent.add(l);return l}
 function slab(parent,x=0,z=0){const g=new T.Group();parent.add(g);g.position.set(x,0,z);edge(box(2.7,.18,2.35,dark,g));edge(box(2.7,.045,2.35,glass,g,0,.13,0));return g}
 const envGroup=new T.Group();rig.add(envGroup);
 ['dev','stage','prod'].forEach((key,i)=>{const g=slab(envGroup,(i-1)*3.2,0);const m=[blue,teal,violet][i];for(let j=0;j<3;j++){edge(box(.55,.45,.65,m,g,(j-1)*.7,.4,0),[0x99cbdf,0x80d3cd,0xefa69b][i]);}anchor(key,g,0,.25,1.45);envs.push(g)});
 function group(){const g=new T.Group();rig.add(g);groups.push(g);return g}
 const delivery=group();
 const config=slab(delivery,-2.25,2.7);for(let i=0;i<3;i++)edge(box(1.1,.06,1.3,paper,config,i*.1,.3+i*.14,-i*.06));for(let i=0;i<4;i++)box(.7,.025,.055,blue,config,0,.66,-.4+i*.21);anchor('iac',config,0,.3,1.55);
 const actions=slab(delivery,2.25,2.7);const hex=new T.Mesh(new T.CylinderGeometry(.7,.7,.35,6),blue);hex.position.y=.4;actions.add(hex);const play=new T.Mesh(new T.ConeGeometry(.25,.45,3),paper);play.rotation.z=-Math.PI/2;play.position.y=.65;actions.add(play);anchor('actions',actions,0,.3,1.55);
 line([[-.9,.25,2.7],[.9,.25,2.7]],0x98cbdf,delivery);const arrow=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(.1,.25,2.7),.8,0x98cbdf,.22,.13);delivery.add(arrow);
 // Independent branches express delivery responsibilities, never an environment order.
 for(let i=0;i<3;i++){line([[2.25,.17,1.45],[2.25,.17,.75],[(i-1)*3.2,.17,.75],[(i-1)*3.2,.17,-.7]],0x98cbdf,delivery);delivery.add(new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3((i-1)*3.2,.17,-.3),.4,0x98cbdf,.18,.12));}
 const access=group();
 ['identity','secrets','network'].forEach((key,i)=>{const g=slab(access,(i-1)*3.2,2.6);anchor(key,g,0,.25,1.5);if(i===0){const head=new T.Mesh(new T.SphereGeometry(.25,24,16),violet);head.position.set(0,.95,0);g.add(head);box(.7,.38,.45,violet,g,0,.45,0)}if(i===1){box(.85,.55,.45,teal,g,0,.45,0);const shackle=new T.Mesh(new T.TorusGeometry(.29,.07,8,32,Math.PI),teal);shackle.position.set(0,.76,0);g.add(shackle);box(.06,.18,.05,paper,g,0,.45,.25)}if(i===2){box(.45,.35,.5,blue,g,-.65,.4,0);box(.45,.35,.5,blue,g,.65,.4,0);line([[-.42,.4,0],[.42,.4,0]],0xc8e3ee,g);const ring=new T.Mesh(new T.TorusGeometry(.25,.035,8,32),teal);ring.rotation.y=Math.PI/2;ring.position.y=.4;g.add(ring)}});
 const boundaries=new T.Group();rig.add(boundaries);envs.forEach((e,i)=>{const frame=box(2.95,1.6,2.6,glass,boundaries,(i-1)*3.2,.8,-2);edge(frame,0x7aa9bb)});
 const operations=group();
 ['monitor','recovery','runbooks'].forEach((key,i)=>{const g=slab(operations,(i-1)*3.2,2.6);anchor(key,g,0,.25,1.5);if(i===0){edge(box(1.25,.8,.12,dark,g,0,.7,0),0xe3ac64);line([[-.5,.6,.08],[-.3,.6,.08],[-.15,.96,.08],[0,.4,.08],[.15,.7,.08],[.5,.7,.08]],0xffc071,g)}if(i===1){const arc=new T.Mesh(new T.TorusGeometry(.5,.065,8,40,Math.PI*1.6),amber);arc.position.y=.75;g.add(arc);const arrow=new T.Mesh(new T.ConeGeometry(.16,.32,3),amber);arrow.position.set(.46,.62,0);arrow.rotation.z=Math.PI;g.add(arrow)}if(i===2){for(let j=0;j<3;j++)edge(box(.9,.07,1.2,paper,g,j*.07,.3+j*.15,0),0xe3ac64);for(let j=0;j<3;j++)box(.6,.025,.06,amber,g,0,.65,-.35+j*.25)}});
 const grid=new T.GridHelper(24,24,0x235265,0x122e39);grid.position.y=-.25;grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
 const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
 function request(){if(!active||pending||disposed)return;pending=true;requestAnimationFrame(()=>{pending=false;if(active&&!disposed)renderer.render(scene,camera)})}
 function set(p){value=p;const t=p*3,open=smooth(t),weights=[Math.max(0,1-Math.abs(t-1)),Math.max(0,1-Math.abs(t-2)),Math.max(0,1-Math.abs(t-3))];
 envGroup.position.z=-2*open;envGroup.position.y=.25*open;
 groups.forEach((g,i)=>{const w=smooth(weights[i]);g.visible=w>.01;g.position.y=-(1-w)*.65;g.scale.setScalar(.85+.15*w);g.traverse(o=>{if(o.isMesh)o.visible=w>.15})});boundaries.visible=weights[1]>.4;
 rig.rotation.y=-.08+dragX;rig.rotation.x=dragY;
 const distance=16*Math.max(1,1.3/camera.aspect);camera.position.set(2.8,10,distance);camera.lookAt(0,0,.5);camera.updateMatrixWorld(true);rig.updateMatrixWorld(true);
 const phase=Math.round(t);host.dataset.phase=phase;
 for(const [key,a] of Object.entries(anchors)){const el=host.querySelector(`[data-cloud-label="${key}"]`),env=['dev','stage','prod'].includes(key),index=['iac','actions'].includes(key)?0:['identity','secrets','network'].includes(key)?1:2;const show=env||weights[index]>.55;el.hidden=!show;if(show){const v=a.getWorldPosition(new T.Vector3()).project(camera);el.style.left=((v.x+1)*50)+'%';el.style.top=((-v.y+1)*50)+'%';}}
 request();}
 const resize=new ResizeObserver(()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();set(value)});resize.observe(host);
 let start;function down(e){start={x:e.clientX,y:e.clientY,dx:dragX,dy:dragY};canvas.setPointerCapture(e.pointerId)}function move(e){if(!start)return;dragX=Math.max(-.35,Math.min(.35,start.dx+(e.clientX-start.x)*.004));dragY=Math.max(-.15,Math.min(.15,start.dy+(e.clientY-start.y)*.003));set(value)}function end(){start=null}function key(e){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();dragX=Math.max(-.35,Math.min(.35,dragX+(e.key==='ArrowLeft'?-.08:e.key==='ArrowRight'?.08:0)));dragY=Math.max(-.15,Math.min(.15,dragY+(e.key==='ArrowUp'?-.04:e.key==='ArrowDown'?.04:0)));set(value)}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('keydown',key);
 const visibility=new IntersectionObserver(e=>{active=e[0].isIntersecting;if(active)request()});visibility.observe(host);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.dataset.ready='false';host.dataset.static='true';active=false});host.dataset.ready='true';set(0);
 return{set,reset(){dragX=dragY=0;set(value)},dispose(){disposed=true;visibility.disconnect();resize.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);canvas.removeEventListener('keydown',key);scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});renderer.dispose()}};
}
