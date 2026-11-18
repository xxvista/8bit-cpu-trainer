/* ---------- Arduino kit: 3D board built from the KiCad data (A3D), drawn with three.js (vendor/three.min.js, loaded on demand) ---------- */
const V3={ready:false,loading:null,el:null,state:null};
function ard3dLoadLib(){
  if(window.THREE)return Promise.resolve();
  if(V3.loading)return V3.loading;
  V3.loading=new Promise((ok,bad)=>{const s=document.createElement("script");s.src="vendor/three.min.js";s.onload=ok;s.onerror=bad;document.head.appendChild(s);});
  return V3.loading;
}
function ard3dCanGL(){try{const c=document.createElement("canvas");return!!(c.getContext("webgl2")||c.getContext("webgl"));}catch(e){return false;}}
/* which part is it? returns a key of ASK */
function ard3dKind(p){
  const f=p.f,v=p.v,r=p.r;
  if(/ATmega/.test(v))return"mcu";if(/CH340/.test(v))return"usb";if(/LCD/.test(v))return"lcd";if(/MCP23008/.test(v))return"expander";
  if(/BUZZER/.test(v))return"buzzer";if(/REY5/.test(f))return"relay";if(/3\.5MM/.test(f))return"terminal";if(/ULTRA/.test(f))return"ultra";
  if(/LHI778/.test(v))return"pir";if(/BIS0001/.test(v))return"pirchip";if(/DHT20/.test(v))return"dht";if(/BH1750/.test(f))return"light";
  if(/MPU-6050/.test(v))return"imu";if(/D6MM/.test(f))return"mic";if(/LMV358/.test(v))return"opamp";if(/45\.6X10/.test(f))return"pot";
  if(/LED-8MM/.test(f))return"led";if(/LED/.test(f))return"smdled";if(/KEY_12/.test(f))return"button";if(/BUTTON/.test(f))return"reset";
  if(/VS1838/.test(f))return"ir";if(/CRYSTAL/.test(f))return"crystal";if(/SOT223|TO252/.test(f))return"power";if(/L1040|201209/.test(f))return"inductor";
  if(/TWIG|2\.0_1X4/.test(f+v))return"conn";if(/2X3P/.test(f))return"icsp";if(/TXS0102/.test(v))return"level";if(/SOT23/.test(f))return"transistor";
  if(/SOD123|SMA/.test(f))return"diode";if(/^R/.test(r))return"res";if(/^C|^E/.test(r)||/CAP|AVX/.test(f))return"cap";return"part";
}
/* modules whose body is bigger than their footprint: placed from the board's silkscreen (mm from the top-left corner) */
const A3MOD={lcd:{x:100.2,y:25.4},servo:{x:163.4,y:31.4},ultra:{x:63.6,y:58.8},dht:{x:20.6,y:104}};
function ard3dBuild(host){
  const T=THREE,B=A3D,W=B.w,H=B.h;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  if(T.sRGBEncoding)renderer.outputEncoding=T.sRGBEncoding;
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(32,1.6,5,2000);
  scene.add(new T.HemisphereLight(0xffffff,0x445566,0.9));
  const sun=new T.DirectionalLight(0xffffff,0.75);sun.position.set(-80,220,140);scene.add(sun);
  const fill=new T.DirectionalLight(0xbfd4ff,0.35);fill.position.set(140,90,-120);scene.add(fill);
  const M={},mat=(k,o)=>M[k]||(M[k]=new T.MeshStandardMaterial(Object.assign({roughness:.6,metalness:0},o)));
  const black=mat("black",{color:0x1c1d21,roughness:.5}),metal=mat("metal",{color:0xc9ccd2,metalness:.85,roughness:.35}),gold=mat("gold",{color:0xd9b34a,metalness:.8,roughness:.3});
  const white=mat("white",{color:0xf1f1ec,roughness:.7}),beige=mat("beige",{color:0xb89a64}),blueb=mat("blueb",{color:0x2a5fd0,roughness:.45}),greenT=mat("greenT",{color:0x1f8a4c,roughness:.6});
  const root=new T.Group();scene.add(root);
  const X=mm=>mm-W/2,Z=mm=>mm-H/2;
  /* the board: its top face is our drawing of the copper and silkscreen */
  /* the board drawing is embedded (A3SVG) and loaded from a blob, so the texture also works when the page is opened from a file */
  const svg=A3SVG.replace(/width="[\d.]+" height="[\d.]+"/,'width="2400" height="'+Math.round(2400*(H+4)/(W+4))+'"');
  const tex=new T.TextureLoader().load(URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"})),()=>ard3dRender());
  if(T.sRGBEncoding)tex.encoding=T.sRGBEncoding;tex.anisotropy=8;
  tex.repeat.set(W/(W+4),H/(H+4));tex.offset.set(2/(W+4),2/(H+4));
  const edge=mat("edge",{color:0x165c3a}),topM=new T.MeshStandardMaterial({map:tex,roughness:.75});
  const board=new T.Mesh(new T.BoxGeometry(W,1.6,H),[edge,edge,topM,edge,edge,edge]);board.position.y=-0.8;root.add(board);
  const pick=[];const live={};
  const box=(w,h,d,m)=>new T.Mesh(new T.BoxGeometry(w,h,d),m);
  const cyl=(r,h,m,seg=24)=>new T.Mesh(new T.CylinderGeometry(r,r,h,seg),m);
  function place(g,p,mx,my,rot){g.position.set(X(mx),0,Z(my));g.rotation.y=(rot||0)*Math.PI/180;root.add(g);}
  function partGroup(p,kind){const g=new T.Group();g.userData.part={kind,ref:p.r,val:p.v};return g;}
  const longX=p=>{if(p.p.length<2)return p.w>=p.h;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;p.p.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);});return x1-x0>=y1-y0;};
  function chip(g,p,L,Wd,Ht,m,ends){ // two-terminal chip part along its pads
    const lx=longX(p),b=box(lx?L:Wd,Ht,lx?Wd:L,m);b.position.set(p.bx,Ht/2,p.by);g.add(b);
    if(ends)[-1,1].forEach(s=>{const e=box(lx?L*.18:Wd*1.02,Ht*1.02,lx?Wd*1.02:L*.18,metal);e.position.set(p.bx+(lx?s*L*.42:0),Ht/2,p.by+(lx?0:s*L*.42));g.add(e);});
  }
  function ic(g,p,L,Wd,Ht,label){ // packaged chip: body plus a silver lead on every pad
    const lx=p.w>=p.h&&!(p.p.length===8&&/SO08|VSSOP/.test(p.f)&&p.h>p.w);
    const bw=lx?L:Wd,bd=lx?Wd:L,b=box(bw,Ht,bd,black);b.position.set(p.bx,Ht/2+.1,p.by);g.add(b);
    const dot=cyl(.35,.05,mat("dot",{color:0x3a3c42}));dot.position.set(p.bx-bw/2+.9,Ht+.12,p.by-bd/2+.9);g.add(dot);
    p.p.forEach(q=>{if(q[2]*q[3]<.05)return;const s=box(Math.max(.25,q[2]*.7),.18,Math.max(.25,q[3]*.7),metal);s.position.set(q[0],.09,q[1]);g.add(s);});
  }
  for(const p of B.parts){
    const kind=ard3dKind(p),g=partGroup(p,kind);let mx=p.x,my=p.y,rot=p.a;
    const mod=A3MOD[kind];
    switch(kind){
      case"res":chip(g,p,1.6,.8,.45,black,true);break;
      case"cap":if(/CAP_SMD_6\.3/.test(p.f)){const base=box(6.6,1,6.6,black);base.position.set(p.bx,.5,p.by);g.add(base);const can=cyl(3.1,5.4,metal,32);can.position.set(p.bx,3.2,p.by);g.add(can);const st=cyl(3.12,.6,mat("capstripe",{color:0x23262c}),32);st.position.set(p.bx,5.6,p.by);g.add(st);}
        else if(/AVX/.test(p.f))chip(g,p,3.2,1.6,1.6,mat("tant",{color:0xd98a1c}),false);
        else chip(g,p,/0805/.test(p.f)?2:1.6,/0805/.test(p.f)?1.25:.8,.8,beige,true);break;
      case"smdled":{const c=/BLUE/.test(p.v)?0x3b7bff:0xff3b30,m=new T.MeshStandardMaterial({color:0xe9e3c9,emissive:c,emissiveIntensity:0,roughness:.3});chip(g,p,1.6,.8,.6,m,false);live["led_"+p.r]=m;break;}
      case"led":{const m=new T.MeshPhysicalMaterial({color:0xd62828,emissive:0xff2a1a,emissiveIntensity:0,roughness:.15,transmission:0,clearcoat:1});
        const body=cyl(4,6,m,32);body.position.set(p.bx,3.6,p.by);g.add(body);const dome=new T.Mesh(new T.SphereGeometry(4,32,16,0,Math.PI*2,0,Math.PI/2),m);dome.position.set(p.bx,6.6,p.by);g.add(dome);
        const rim=cyl(4.5,1,m,32);rim.position.set(p.bx,.9,p.by);g.add(rim);
        const glow=new T.Mesh(new T.SphereGeometry(9,24,12),new T.MeshBasicMaterial({color:0xff4030,transparent:true,opacity:0,depthWrite:false}));glow.position.set(p.bx,6,p.by);g.add(glow);live.led=m;live.ledGlow=glow;break;}
      case"crystal":chip(g,p,3.2,2.5,.8,metal,false);break;
      case"inductor":if(/L1040/.test(p.f)){const b=box(10,4,10,mat("ind",{color:0x3b3f46,roughness:.8}));b.position.set(p.bx,2,p.by);g.add(b);}else chip(g,p,2,1.25,.9,black,false);break;
      case"transistor":ic(g,p,2.9,1.3,1,"");break;
      case"diode":chip(g,p,/SMA/.test(p.f)?4.3:2.7,/SMA/.test(p.f)?2.6:1.6,/SMA/.test(p.f)?2.1:1.1,black,false);break;
      case"mcu":ic(g,p,7,7,1.2);break;
      case"usb":case"pirchip":ic(g,p,10,3.9,1.6);break;
      case"expander":ic(g,p,7.2,5.3,1.8);break;
      case"opamp":ic(g,p,4.9,3.9,1.6);break;
      case"level":ic(g,p,2.3,2,.9);break;
      case"imu":ic(g,p,4,4,.9);break;
      case"light":ic(g,p,3,1.6,.7);break;
      case"power":ic(g,p,/TO252/.test(p.f)?6.5:6.5,/TO252/.test(p.f)?6.1:3.5,/TO252/.test(p.f)?2.3:1.7);break;
      case"reset":{const b=box(4.2,1.6,3.2,metal);b.position.set(p.bx,.8,p.by);g.add(b);const c=cyl(.9,1,black);c.position.set(p.bx,2,p.by);g.add(c);break;}
      case"button":{const b=box(12,3.5,12,black);b.position.set(p.bx,1.75,p.by);g.add(b);const cap=cyl(4.2,3.8,mat("btncap",{color:0x1fa04a,roughness:.4}),32);cap.position.set(p.bx,5.4,p.by);g.add(cap);live.btnCap=cap;break;}
      case"buzzer":{const b=cyl(6,9.5,black,40);b.position.set(p.bx,4.75,p.by);g.add(b);const h=cyl(1,.1,mat("hole",{color:0x050505}));h.position.set(p.bx,9.56,p.by);g.add(h);
        const ring=new T.Mesh(new T.TorusGeometry(8,.35,8,48),new T.MeshBasicMaterial({color:0xf2b33d,transparent:true,opacity:0}));ring.rotation.x=Math.PI/2;ring.position.set(p.bx,10,p.by);g.add(ring);live.buzzRing=ring;break;}
      case"relay":{const b=box(19,15.3,15.5,blueb);b.position.set(p.bx,7.65,p.by);g.add(b);const lab=box(10,.1,6,white);lab.position.set(p.bx,15.32,p.by);g.add(lab);break;}
      case"terminal":{const b=box(10.5,10,7.5,greenT);b.position.set(p.bx,5,p.by);g.add(b);[-3.5,0,3.5].forEach(o=>{const s=cyl(1.3,.6,metal);s.position.set(p.bx+o,10.2,p.by);g.add(s);const sl=box(2,.2,.35,black);sl.position.set(p.bx+o,10.55,p.by);g.add(sl);});break;}
      case"conn":{const b=box(10,6,5.8,white);b.position.set(p.bx,3,p.by-.4);g.add(b);const o=box(8.6,4.2,.2,mat("connin",{color:0x8a8a84}));o.position.set(p.bx,3.2,p.by+2.5);g.add(o);break;}
      case"icsp":{const b=box(5.08,2.5,7.62,black);b.position.set(p.bx,1.25,p.by);g.add(b);p.p.forEach(q=>{const pin=box(.64,6,.64,gold);pin.position.set(q[0],3,q[1]);g.add(pin);});break;}
      case"ir":{const b=box(5.6,6.5,4,black);b.position.set(p.bx,3.25,p.by);g.add(b);const d=new T.Mesh(new T.SphereGeometry(1.6,20,12),black);d.position.set(p.bx,4,p.by-2.1);g.add(d);break;}
      case"mic":{const b=cyl(4.85,6.7,black,32);b.position.set(p.bx,3.35,p.by);g.add(b);const m=cyl(4.2,.1,mat("mesh",{color:0x6b6e75,roughness:.9}),32);m.position.set(p.bx,6.75,p.by);g.add(m);break;}
      case"pir":{const can=cyl(4.6,4.5,metal,32);can.position.set(p.bx,2.25,p.by);g.add(can);
        const dome=new T.Mesh(new T.SphereGeometry(6.5,32,16,0,Math.PI*2,0,Math.PI/2),new T.MeshPhysicalMaterial({color:0xf4f3ee,roughness:.35,transmission:.15,transparent:true,opacity:.95}));dome.position.set(p.bx,4.5,p.by);g.add(dome);break;}
      case"pot":{const b=box(45.6,5.8,9.6,mat("pot",{color:0x2a2d33,metalness:.3,roughness:.5}));b.position.set(p.bx,2.9,p.by);g.add(b);
        const slot=box(30,.1,1.2,black);slot.position.set(p.bx,5.82,p.by);g.add(slot);
        const knob=box(4,6,9,white);knob.position.set(p.bx,8.8,p.by);g.add(knob);live.potKnob=knob;live.potX=p.bx;break;}
      case"ultra":{const pcb=box(45,1.6,20,mat("upcb",{color:0x1b4fa8}));pcb.position.set(0,10,0);g.add(pcb);
        [-13,13].forEach(o=>{const c=cyl(8,12,metal,40);c.position.set(o,16.8,0);g.add(c);const mesh=cyl(7.2,.1,mat("umesh",{color:0x2b2d31,roughness:.95}),40);mesh.position.set(o,22.85,0);g.add(mesh);});
        const post=box(10,10,2.5,black);post.position.set(0,5,-6);g.add(post);mx=A3MOD.ultra.x;my=A3MOD.ultra.y;rot=0;break;}
      case"dht":{const b=box(15.5,5.5,12,white);b.position.set(0,2.75,0);g.add(b);for(let i=0;i<4;i++)for(let j=0;j<3;j++){const h=box(1.6,.1,1.6,mat("dhthole",{color:0x9a9a94}));h.position.set(-4.5+i*3,5.56,-3+j*3);g.add(h);}
        mx=A3MOD.dht.x;my=A3MOD.dht.y;rot=0;break;}
      case"lcd":{const pcb=box(80,1.6,36,mat("lpcb",{color:0x1f7a4a}));pcb.position.set(0,10,0);g.add(pcb);
        const frame=box(71.2,7,24.2,mat("lframe",{color:0x24262b,metalness:.4,roughness:.4}));frame.position.set(0,14.3,1.2);g.add(frame);
        const cv=document.createElement("canvas");cv.width=512;cv.height=112;const ctex=new T.CanvasTexture(cv);if(T.sRGBEncoding)ctex.encoding=T.sRGBEncoding;
        const scr=new T.Mesh(new T.PlaneGeometry(64.5,13.8),new T.MeshBasicMaterial({map:ctex}));scr.rotation.x=-Math.PI/2;scr.position.set(0,17.85,1.2);g.add(scr);
        for(let i=0;i<16;i++){const pin=box(.64,9,.64,gold);pin.position.set(-26.3+i*2.54,4.5,-15.5);g.add(pin);}
        [[-37.5,-15.5],[37.5,-15.5],[-37.5,15.5],[37.5,15.5]].forEach(([a,b2])=>{const s=cyl(1.4,9,metal,12);s.position.set(a,4.5,b2);g.add(s);});
        live.lcdCanvas=cv;live.lcdTex=ctex;mx=A3MOD.lcd.x;my=A3MOD.lcd.y;rot=0;break;}
      default:{const b=box(Math.max(.8,p.w*.7),.9,Math.max(.8,p.h*.7),black);b.position.set(p.bx,.45,p.by);g.add(b);}
    }
    place(g,p,mx,my,rot);pick.push(g);
  }
  /* the servo motor has no footprint of its own on the board: it is screwed on, its cable goes to D9 */
  {const g=new T.Group();g.userData.part={kind:"servo",ref:"D9",val:"SG90"};
    const body=box(12.2,22.7,22.5,blueb);body.position.set(0,11.35,0);g.add(body);
    const tab=box(12.2,2.5,32.2,blueb);tab.position.set(0,15.8,0);g.add(tab);
    const top=cyl(5.9,4,blueb,32);top.position.set(0,24.7,-5.4);g.add(top);
    const hub=cyl(2.4,3.2,white,24);hub.position.set(0,28.3,-5.4);g.add(hub);
    const arm=new T.Group();arm.position.set(0,29.4,-5.4);const a1=box(4,1.6,17,white);a1.position.set(0,0,6.5);arm.add(a1);const tip=cyl(2,1.6,white,16);tip.position.set(0,0,15);arm.add(tip);g.add(arm);
    live.servoArm=arm;place(g,null,A3MOD.servo.x,A3MOD.servo.y,0);pick.push(g);}
  const st={renderer,scene,cam,root,pick,live,theta:-.55,phi:.82,dist:300,target:new T.Vector3(0,0,8),raf:0,sel:null};
  V3.state=st;
  ard3dLcd(["",""]);
  return st;
}
function ard3dLcd(lines){
  const L=V3.state&&V3.state.live;if(!L||!L.lcdCanvas)return;const c=L.lcdCanvas.getContext("2d"),w=512,h=112;
  c.fillStyle="#2e4fd8";c.fillRect(0,0,w,h);
  for(let r=0;r<2;r++)for(let i=0;i<16;i++){c.fillStyle="rgba(255,255,255,.07)";c.fillRect(8+i*31.2,10+r*50,28,44);}
  c.fillStyle="#eef3ff";c.font="bold 38px 'Spline Sans Mono',ui-monospace,Menlo,Consolas,monospace";c.textBaseline="top";
  for(let r=0;r<2;r++){const s=(lines[r]||"").padEnd(16).slice(0,16);for(let i=0;i<16;i++)c.fillText(s[i],10+i*31.2,14+r*50);}
  L.lcdTex.needsUpdate=true;
}
function ard3dCamera(){
  const s=V3.state;if(!s)return;const{cam,theta,phi,dist,target}=s;
  cam.position.set(target.x+dist*Math.sin(phi)*Math.sin(theta),target.y+dist*Math.cos(phi),target.z+dist*Math.sin(phi)*Math.cos(theta));cam.lookAt(target);
}
function ard3dRender(){const s=V3.state;if(!s||!V3.el)return;if(s.raf)return;s.raf=requestAnimationFrame(()=>{s.raf=0;ard3dCamera();s.renderer.render(s.scene,s.cam);});}
function ard3dResize(){
  const s=V3.state,host=V3.el;if(!s||!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  s.renderer.setSize(w,h,false);s.cam.aspect=w/h;s.cam.updateProjectionMatrix();
  if(!s.userZoom)s.dist=ard3dFit();ard3dRender();
}
function ard3dFit(){const s=V3.state,t=Math.tan(s.cam.fov*Math.PI/360);return Math.max(230,Math.min(700,Math.max(118/(t*s.cam.aspect),96/t)));}
function ard3dView(top){const s=V3.state;if(!s)return;s.userZoom=false;if(top){s.theta=0;s.phi=.001;}else{s.theta=-.55;s.phi=.82;}s.dist=ard3dFit()*(top?1.02:1);s.target.set(0,0,top?0:8);ard3dRender();}
/* pointer controls: drag to turn, wheel or pinch to zoom, tap to pick a part */
function ard3dControls(cv){
  const s=V3.state,pts=new Map();let moved=0,startD=0,startDist=0;
  cv.addEventListener("pointerdown",e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;
    if(pts.size===2){const[a,b]=[...pts.values()];startD=Math.hypot(a.x-b.x,a.y-b.y);startDist=s.dist;}});
  cv.addEventListener("pointermove",e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
    if(pts.size===2){const[a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(startD){s.dist=Math.min(700,Math.max(60,startDist*startD/d));s.userZoom=true;}}
    else{s.theta-=dx*.008;s.phi=Math.min(1.45,Math.max(.001,s.phi-dy*.008));}ard3dRender();});
  const up=e=>{const was=pts.size;pts.delete(e.pointerId);if(was===1&&moved<6)ard3dPick(e);};
  cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",e=>pts.delete(e.pointerId));
  cv.addEventListener("wheel",e=>{e.preventDefault();s.dist=Math.min(700,Math.max(60,s.dist*(1+Math.sign(e.deltaY)*.1)));s.userZoom=true;ard3dRender();},{passive:false});
  cv.addEventListener("keydown",e=>{const k=e.key;if(k==="ArrowLeft")s.theta-=.1;else if(k==="ArrowRight")s.theta+=.1;else if(k==="ArrowUp")s.phi=Math.max(.001,s.phi-.08);else if(k==="ArrowDown")s.phi=Math.min(1.45,s.phi+.08);else if(k==="+"||k==="=")s.dist=Math.max(60,s.dist*.9);else if(k==="-")s.dist=Math.min(700,s.dist*1.1);else return;e.preventDefault();ard3dRender();});
}
function ard3dPick(e){
  const s=V3.state,T=THREE,r=V3.el.getBoundingClientRect(),v=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  const ray=new T.Raycaster();ray.setFromCamera(v,s.cam);const hit=ray.intersectObjects(s.pick,true)[0];
  let g=hit&&hit.object;while(g&&!(g.userData&&g.userData.part))g=g.parent;
  ard3dSelect(g||null);
}
function ard3dSelect(g){
  const s=V3.state;
  if(s.sel){s.sel.traverse(o=>{if(o.isMesh&&o.userData.oldMat){o.material=o.userData.oldMat;delete o.userData.oldMat;}});}
  s.sel=g;
  if(g)g.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&o.material.isMeshStandardMaterial){o.userData.oldMat=o.material;const m=o.material.clone();m.emissive=new THREE.Color(0x1746d1);m.emissiveIntensity=.45;o.material=m;}});
  const info=$("a3info");
  if(info){if(g){const P=g.userData.part,K=ASK[P.kind]||ASK.part;info.innerHTML='<b>'+K[0][LI]+"</b>"+(P.ref&&!/^(D9)$/.test(P.ref)?' <i class="ltr">'+esc(P.ref)+(P.val&&!/LCD|ULTRA|^$/.test(P.val)?" · "+esc(P.val):"")+"</i>":"")+"<span>"+K[1][LI]+'</span><button type="button" class="ib" data-a3="close" aria-label="'+esc(ast("close"))+'">×</button>';info.hidden=false;}
    else info.hidden=true;}
  ard3dRender();
}
/* show the simulator's outputs on the 3D board */
function ard3dShow(o){
  const s=V3.state;if(!s)return;const L=s.live;
  if(L.led){const k=o.led/255;L.led.emissiveIntensity=k*1.6;L.ledGlow.material.opacity=k*.28;}
  Object.keys(L).forEach(k=>{if(/^led_/.test(k))L[k].emissiveIntensity=/D130/.test(k)?(o.power?1.2:0):(o.serialBlink?1.4:0);});
  if(L.servoArm)L.servoArm.rotation.y=(90-o.servo)*Math.PI/180;
  if(L.buzzRing)L.buzzRing.material.opacity=o.buzz?(.35+.35*Math.sin(performance.now()/60)):0;
  if(L.btnCap)L.btnCap.position.y=o.btn?4.6:5.4;
  s.root.rotation.z=(o.tilt||0)*Math.PI/180;
  if(L.potKnob)L.potKnob.position.x=L.potX+(o.pot/1023-.5)*28;
  if(o.lcdChanged)ard3dLcd(o.lcd);
  ard3dRender();
}
function ard3dMount(host){
  V3.el=host;
  if(!ard3dCanGL()){host.classList.add("nogl");return Promise.resolve(false);}
  return ard3dLoadLib().then(()=>{
    if(!V3.state){ard3dBuild(host);ard3dControls(V3.state.renderer.domElement);
      const cv=V3.state.renderer.domElement;cv.tabIndex=0;cv.setAttribute("role","img");
      if(window.ResizeObserver)new ResizeObserver(()=>ard3dResize()).observe(host);}
    const cv=V3.state.renderer.domElement;cv.setAttribute("aria-label",ast("hint"));
    if(cv.parentNode!==host)host.insertBefore(cv,host.firstChild);
    host.classList.add("ready");ard3dResize();if(typeof ardsimPaint==="function")ardsimPaint();return true;
  }).catch(()=>{host.classList.add("nogl");return false;});
}
