/* ---------- Arduino kit: flat drawing of the board with every component, from the KiCad data (A3D) ---------- */
/* which part is it? returns a key of ASK */
function ardKind(p){
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
/* modules bigger than their footprint, placed from the board's silkscreen (mm from the top-left corner) */
const AFMOD={lcd:{x:100.2,y:25.4},servo:{x:163.4,y:31.4},ultra:{x:63.6,y:58.8},dht:{x:20.6,y:104}};
const AF={sel:null,drag:null};
function afSvg(){
  const B=A3D,f=v=>+v.toFixed(2);let o="",parts=[];
  const R=(x,y,w,h,c,extra)=>'<rect x="'+f(x-w/2)+'" y="'+f(y-h/2)+'" width="'+f(w)+'" height="'+f(h)+'" fill="'+c+'"'+(extra||"")+"/>";
  const C=(x,y,r,c,extra)=>'<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(r)+'" fill="'+c+'"'+(extra||"")+"/>";
  const TX=(x,y,s,txt,c,rot)=>'<text x="'+f(x)+'" y="'+f(y+s*.35)+'" font-size="'+s+'" fill="'+(c||"#cfd3da")+'" text-anchor="middle"'+(rot?' transform="rotate('+rot+" "+f(x)+" "+f(y)+')"':"")+">"+esc(txt)+"</text>";
  const longX=p=>{if(p.p.length<2)return p.w>=p.h;let a=1e9,b=-1e9,c=1e9,d=-1e9;p.p.forEach(q=>{a=Math.min(a,q[0]);b=Math.max(b,q[0]);c=Math.min(c,q[1]);d=Math.max(d,q[1]);});return b-a>=d-c;};
  const chip=(p,L,W,col,ends)=>{const lx=longX(p),w=lx?L:W,h=lx?W:L;let s=R(p.bx,p.by,w,h,col,' rx=".15"');if(ends){const e=L*.18;s+=lx?R(p.bx-L/2+e/2,p.by,e,W,"#c8ccd2")+R(p.bx+L/2-e/2,p.by,e,W,"#c8ccd2"):R(p.bx,p.by-L/2+e/2,W,e,"#c8ccd2")+R(p.bx,p.by+L/2-e/2,W,e,"#c8ccd2");}return s;};
  const pins=p=>p.p.map(q=>q[2]*q[3]<.05?"":R(q[0],q[1],Math.max(.25,q[2]*.75),Math.max(.25,q[3]*.75),"#cfd3d8")).join("");
  const ic=(p,L,W,label)=>{const lx=p.w>=p.h,w=lx?L:W,h=lx?W:L,fs=Math.min(1.5,Math.max(.7,(lx?w:h)/(label.length*.62)));
    return pins(p)+R(p.bx,p.by,w,h,"#1d1e22",' rx=".3"')+C(p.bx-w/2+.8,p.by-h/2+.8,.32,"#45474e")+(label&&Math.max(w,h)>3.5?TX(p.bx,p.by,+fs.toFixed(2),label,"#c9ced6",lx?0:-90):"");};
  B.parts.forEach((p,i)=>{
    const k=ardKind(p);let s="",abs=AFMOD[k],extra="";
    switch(k){
      case"res":s=chip(p,1.6,.8,"#1d1d22",true);break;
      case"cap":s=/CAP_SMD_6\.3/.test(p.f)?R(p.bx,p.by,6.6,6.6,"#26282d",' rx=".4"')+C(p.bx,p.by,3.1,"#d5d8dd")+'<path d="M'+f(p.bx-3.1)+" "+f(p.by)+"a3.1 3.1 0 0 1 6.2 0z\" fill=\"#30343b\"/>"+C(p.bx,p.by,2.2,"none",' stroke="#a9aeb6" stroke-width=".3"')
        :/AVX/.test(p.f)?chip(p,3.2,1.6,"#d98a1c",false):chip(p,/0805/.test(p.f)?2:1.6,/0805/.test(p.f)?1.25:.8,"#b8996a",true);break;
      case"smdled":s=chip(p,1.6,.8,"#ece4c6",false)+'<circle class="afglow '+(/BLUE/.test(p.v)?"blue":"red")+'" data-led="'+p.r+'" cx="'+p.bx+'" cy="'+p.by+'" r="1.6"/>';break;
      case"led":s='<circle class="afled" cx="'+p.bx+'" cy="'+p.by+'" r="4.4" fill="#8a1d16"/><circle id="afLed" class="afledc" cx="'+p.bx+'" cy="'+p.by+'" r="3.8"/>'+C(p.bx-1.2,p.by-1.3,1,"rgba(255,255,255,.55)")+'<circle id="afLedGlow" class="afledglow" cx="'+p.bx+'" cy="'+p.by+'" r="9"/>';break;
      case"crystal":s=chip(p,3.2,2.5,"#cfd3d8",false);break;
      case"inductor":s=/L1040/.test(p.f)?R(p.bx,p.by,10,10,"#3b3f46",' rx="1.6"')+TX(p.bx,p.by,1.6,"330","#9aa0aa"):chip(p,2,1.25,"#2b2d33",false);break;
      case"transistor":case"level":case"light":s=ic(p,k==="transistor"?2.9:k==="level"?2.3:3,k==="transistor"?1.3:k==="level"?2:1.6,"");break;
      case"diode":s=chip(p,/SMA/.test(p.f)?4.3:2.7,/SMA/.test(p.f)?2.6:1.6,"#1d1e22",false);break;
      case"mcu":s=ic(p,7,7,"ATmega328P");break;case"usb":s=ic(p,10,3.9,"CH340C");break;case"pirchip":s=ic(p,10,3.9,"BIS0001");break;
      case"expander":s=ic(p,7.2,5.3,"MCP23008");break;case"opamp":s=ic(p,4.9,3.9,"LMV358");break;case"imu":s=ic(p,4,4,"6050");break;
      case"power":s=ic(p,6.5,/TO252/.test(p.f)?6.1:3.5,/TO252/.test(p.f)?"XL6008":"1117");break;
      case"reset":s=R(p.bx,p.by,4.2,3.2,"#c8ccd2",' rx=".3"')+C(p.bx,p.by,.9,"#1d1e22");break;
      case"button":s=R(p.bx,p.by,12,12,"#1d1e22",' rx=".8"')+'<circle class="afbtn" id="afBtn" cx="'+p.bx+'" cy="'+p.by+'" r="4.2"/>';extra=" afpress";break;
      case"buzzer":s=C(p.bx,p.by,6,"#1d1e22")+C(p.bx,p.by,5.2,"none",' stroke="#34363c" stroke-width=".4"')+C(p.bx,p.by,1,"#050506")+'<g class="afwaves" id="afWaves"><circle cx="'+p.bx+'" cy="'+p.by+'" r="8"/><circle cx="'+p.bx+'" cy="'+p.by+'" r="10.5"/></g>';break;
      case"relay":s='<rect id="afRelay" class="afrelay" x="'+f(p.bx-9.5)+'" y="'+f(p.by-7.75)+'" width="19" height="15.5" rx=".8"/>'+R(p.bx,p.by-2,11,4.6,"#f1f1ec",' rx=".3"')+TX(p.bx,p.by-2,1.7,"SRD-05VDC","#203a7a")+TX(p.bx,p.by+3.6,1.5,"5V RELAY","#dfe8ff");break;
      case"terminal":{const lx=longX(p);s=R(p.bx,p.by,lx?10.5:7.5,lx?7.5:10.5,"#1f8a4c",' rx=".4"');p.p.forEach(q=>{s+=C(q[0],q[1],1.3,"#c8ccd2")+R(q[0],q[1],lx?.35:2,lx?2:.35,"#3a3c42");});break;}
      case"conn":{const lx=p.w>=p.h;s=R(p.bx,p.by,lx?10:5.8,lx?5.8:10,"#f1f1ec",' rx=".3"')+R(p.bx,p.by+(lx?1.6:0),lx?8.6:2,lx?2:8.6,"#b9b9b2");break;}
      case"icsp":s=R(p.bx,p.by,p.w,p.h,"#1d1e22")+p.p.map(q=>R(q[0],q[1],.9,.9,"#d9b34a")).join("");break;
      case"ir":s=R(p.bx,p.by,5.6,4,"#1d1e22",' rx=".6"')+C(p.bx,p.by,1.6,"#34363c");break;
      case"mic":s=C(p.bx,p.by,4.85,"#1d1e22")+C(p.bx,p.by,4.1,"#6b6e75")+Array.from({length:6},(_,j)=>C(p.bx+2.3*Math.cos(j*1.047),p.by+2.3*Math.sin(j*1.047),.45,"#3a3c42")).join("")+C(p.bx,p.by,.45,"#3a3c42");break;
      case"pir":s=C(p.bx,p.by,6.6,"#e9e7e0")+[5.3,4,2.7,1.4].map(r=>C(p.bx,p.by,r,"none",' stroke="#c9c6bd" stroke-width=".35"')).join("")+'<circle id="afPirRing" class="afpir" cx="'+p.bx+'" cy="'+p.by+'" r="8.2"/>';extra=" afpress";break;
      case"pot":s=R(p.bx,p.by,45.6,9.6,"#2a2d33",' rx=".8"')+R(p.bx,p.by,30,1.2,"#0e0f12")+'<g id="afKnob" class="afknob" data-x="'+p.bx+'"><rect x="'+f(p.bx-2)+'" y="'+f(p.by-4.5)+'" width="4" height="9" rx=".7" fill="#f1f1ec"/><rect x="'+f(p.bx-.3)+'" y="'+f(p.by-3.5)+'" width=".6" height="7" fill="#9aa0aa"/></g>';extra=" afpress";break;
      case"ultra":s=R(0,0,45,20,"#1b4fa8",' rx="1"')+[-13,13].map(x=>C(x,0,8,"#c8ccd2")+C(x,0,7,"#26282d")+'<circle cx="'+x+'" cy="0" r="6.4" fill="url(#afMesh)"/>').join("")+TX(-13,-9,1.6,"T","#dfe8ff")+TX(13,-9,1.6,"R","#dfe8ff");break;
      case"dht":s=R(0,0,15.5,12,"#f1f1ec",' rx=".6"');for(let a=0;a<4;a++)for(let b=0;b<3;b++)s+=R(-4.5+a*3,-3+b*3,1.6,1.6,"#a3a39c",' rx=".2"');break;
      case"lcd":s=R(0,0,80,36,"#1f7a4a",' rx="1"')+Array.from({length:16},(_,j)=>C(-26.3+j*2.54,-15.5,.6,"#d9b34a")).join("")+[[-37.5,-15.5],[37.5,-15.5],[-37.5,15.5],[37.5,15.5]].map(([x,y])=>C(x,y,1.5,"#c8ccd2")).join("")+
        R(0,1.2,71.2,24.2,"#24262b",' rx=".6"')+R(0,1.2,64.5,13.8,"#2e4fd8")+'<text id="afLcd0" class="aflcd" x="-31" y="-.6"></text><text id="afLcd1" class="aflcd" x="-31" y="5.6"></text>';break;
      default:s=R(p.bx,p.by,Math.max(.8,p.w*.7),Math.max(.8,p.h*.7),"#1d1e22");
    }
    const tr=abs?'translate('+abs.x+" "+abs.y+')':'translate('+p.x+" "+p.y+")"+(p.a?" rotate("+(-p.a)+")":"");
    parts.push('<g class="afp'+extra+'" data-i="'+i+'" data-k="'+k+'" transform="'+tr+'">'+s+"</g>");
  });
  /* the servo has no footprint of its own: it is screwed on the board and its cable goes to D9 */
  const sv=AFMOD.servo;
  parts.push('<g class="afp" data-i="-1" data-k="servo" transform="translate('+sv.x+" "+sv.y+')">'+R(0,0,12.2,32.2,"#3a6fe0",' rx=".8"')+R(0,0,12.2,22.5,"#2a5fd0",' rx=".6"')+C(0,-5.4,5.9,"#2353bd")+
    '<g id="afHorn" transform="translate(0 -5.4)"><rect x="-2" y="-1.6" width="4" height="17" rx="1.6" fill="#f1f1ec"/>'+C(0,0,2.6,"#f1f1ec")+C(0,0,.8,"#9aa0aa")+"</g>"+TX(0,8,1.6,"SG90","#dfe8ff")+"</g>");
  o='<svg id="afSvg" viewBox="-2 -2 '+(B.w+4)+" "+(B.h+4)+'" role="img" aria-label="'+esc(at("alt"))+'"><defs><pattern id="afMesh" width="1.2" height="1.2" patternUnits="userSpaceOnUse"><rect width="1.2" height="1.2" fill="#3a3d44"/><circle cx=".6" cy=".6" r=".35" fill="#1a1b1f"/></pattern></defs>'+
    '<g id="afBoard"><image href="img/arduino-board.svg" x="-2" y="-2" width="'+(B.w+4)+'" height="'+(B.h+4)+'" preserveAspectRatio="none"/>'+parts.join("")+"</g></svg>";
  return o;
}
function afShow(o){
  const svg=$("afSvg");if(!svg)return;
  const k=o.led/255,L=$("afLed"),G=$("afLedGlow");if(L){L.style.fill=k>0?"rgb("+Math.round(140+115*k)+","+Math.round(30+40*k)+","+Math.round(22+20*k)+")":"";G.style.opacity=(k*.55).toFixed(2);}
  svg.querySelectorAll(".afglow").forEach(e=>{const r=e.dataset.led;e.classList.toggle("on",/D130/.test(r)?!!o.power:!!o.serialBlink);});
  const h=$("afHorn");if(h)h.setAttribute("transform","translate(0 -5.4) rotate("+(o.servo-90)+")");
  const w=$("afWaves");if(w)w.classList.toggle("on",!!o.buzz);
  const rl=$("afRelay");if(rl)rl.classList.toggle("on",!!o.relay);
  const b=$("afBtn");if(b)b.classList.toggle("down",!!o.btn);
  const pr=$("afPirRing");if(pr)pr.classList.toggle("on",!!o.pir);
  const kn=$("afKnob");if(kn)kn.setAttribute("transform","translate("+((o.pot/1023-.5)*28).toFixed(2)+" 0)");
  const bd=$("afBoard");if(bd){const B=A3D;bd.setAttribute("transform",o.tilt?"rotate("+(o.tilt/3).toFixed(1)+" "+B.w/2+" "+B.h/2+")":"");}
  for(let r=0;r<2;r++){const t=$("afLcd"+r);if(t)t.textContent=(o.lcd[r]||"").padEnd(16).slice(0,16).replace(/ /g," ");}
}
function afInfo(i,k){
  const info=$("afInfo");if(!info)return;
  document.querySelectorAll("#afSvg .afp.sel").forEach(e=>e.classList.remove("sel"));
  if(k==null){info.hidden=true;return;}
  const g=document.querySelector('#afSvg .afp[data-i="'+i+'"]');if(g)g.classList.add("sel");
  const p=i>=0?A3D.parts[i]:null,K=ASK[k]||ASK.part;
  info.innerHTML="<b>"+K[0][LI]+"</b>"+(p?' <i class="ltr">'+esc(p.r)+(p.v&&!/LCD|ULTRA/.test(p.v)?" · "+esc(p.v):"")+"</i>":"")+"<span>"+K[1][LI]+'</span><button type="button" class="ib" data-af="close" aria-label="'+esc(ast("close"))+'">×</button>';
  info.hidden=false;
}
/* pointer handling on the drawing: tap = info; press the button; drag the potentiometer knob; tap the PIR to wave */
function afWire(host){
  const pt=e=>{const s=$("afSvg"),m=s.getScreenCTM().inverse(),p=s.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(m);};
  host.addEventListener("pointerdown",e=>{
    const g=e.target.closest(".afp");if(!g)return;const k=g.dataset.k;
    if(k==="button"){SIM.in.btn=true;simInputChanged();host.setPointerCapture(e.pointerId);AF.drag={k,id:e.pointerId};e.preventDefault();}
    else if(k==="pot"){host.setPointerCapture(e.pointerId);AF.drag={k,id:e.pointerId};afPot(pt(e));e.preventDefault();}
    afInfo(+g.dataset.i,k);
  });
  host.addEventListener("pointermove",e=>{if(AF.drag&&AF.drag.k==="pot"&&AF.drag.id===e.pointerId)afPot(pt(e));});
  const end=e=>{if(!AF.drag||AF.drag.id!==e.pointerId)return;if(AF.drag.k==="button"){SIM.in.btn=false;simInputChanged();}AF.drag=null;};
  host.addEventListener("pointerup",end);host.addEventListener("pointercancel",end);
  host.addEventListener("click",e=>{const g=e.target.closest(".afp");if(g&&g.dataset.k==="pir"){SIM.in.pir=!SIM.in.pir;simInputChanged();}
    if(e.target.closest('[data-af="close"]'))afInfo(0,null);});
  function afPot(q){const p=A3D.parts.find(x=>ardKind(x)==="pot");if(!p)return;const d=q.x-(p.x+p.bx);SIM.in.pot=Math.round(Math.max(0,Math.min(1023,(d/28+.5)*1023)));simInputChanged();}
}
