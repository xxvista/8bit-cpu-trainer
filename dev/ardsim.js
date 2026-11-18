/* ---------- Arduino kit simulator: runs the block program (dev/ardblocks.js) on a model of the board; outputs on the flat drawing (dev/ardflat.js) and in the panel ---------- */
const ast=k=>AS[k]?AS[k][LI]:k;
const IRKEYS=[["1",1],["2",2],["3",3],["4",4],["5",5],["6",6],["7",7],["8",8],["9",9],["0",0],["OK",10]];
const SIM={run:false,t0:0,timer:0,gen:null,wake:0,in:{temp:24,hum:45,dist:60,lux:300,snd:10,tilt:0,pot:512,btn:false,pir:false,ir:null},out:null,m:{},vars:{},serial:[],sound:true,audio:null,osc:null,err:""};
function simReset(power){SIM.out={power:!!power,led:0,buzz:0,relay:false,servo:90,lcd:["",""],serialBlink:false};SIM.m={};SIM.vars={};SIM.serial=[];SIM.err="";simMirror();}
function simMirror(){const o=SIM.out,i=SIM.in;o.btn=i.btn;o.pot=i.pot;o.tilt=i.tilt;o.pir=i.pir;}
simReset(false);
function simCtx(){
  return{in:SIM.in,out:SIM.out,m:SIM.m,vars:SIM.vars,ms:()=>performance.now()-SIM.t0,
    lcd:(r,s)=>{SIM.out.lcd[r]=String(s).padEnd(16).slice(0,16);},
    print:s=>{SIM.serial.push(s);if(SIM.serial.length>8)SIM.serial.shift();SIM.m.serUntil=performance.now()+80;}};
}
function simTick(){
  const now=performance.now(),S=SIM.ctx;
  if(now>=SIM.wake){let steps=0;
    try{while(performance.now()-now<6&&steps<4000){const r=SIM.gen.next();if(r.done)break;steps++;
      if(r.value>0){SIM.wake=performance.now()+r.value;break;}}}
    catch(e){SIM.err=String(e&&e.message||e);simStop(true);return;}}
  if(SIM.m.buzzUntil&&S.ms()>SIM.m.buzzUntil){SIM.out.buzz=0;SIM.m.buzzUntil=0;}
  SIM.out.serialBlink=!!(SIM.m.serUntil&&now<SIM.m.serUntil);
  simMirror();simSound();ardsimPaint();
}
function simStart(){simReset(true);SIM.run=true;SIM.t0=performance.now();SIM.wake=0;SIM.ctx=simCtx();SIM.gen=abProgram(SIM.ctx);clearInterval(SIM.timer);SIM.timer=setInterval(simTick,30);simTick();ardsimBar();}
function simStop(keepErr){const e=SIM.err;SIM.run=false;clearInterval(SIM.timer);SIM.gen=null;simReset(false);if(keepErr)SIM.err=e;simSound();ardsimPaint();ardsimBar();}
function simInputChanged(){simMirror();ardsimPaint(true);}
function simSound(){
  const f=SIM.run&&SIM.sound?SIM.out.buzz:0;
  try{if(f&&!SIM.audio)SIM.audio=new (window.AudioContext||window.webkitAudioContext)();
    if(!SIM.audio)return;
    if(f&&!SIM.osc){SIM.osc=SIM.audio.createOscillator();const g=SIM.audio.createGain();g.gain.value=.04;SIM.osc.type="square";SIM.osc.connect(g).connect(SIM.audio.destination);SIM.osc.frequency.value=f;SIM.osc.start();}
    else if(!f&&SIM.osc){SIM.osc.stop();SIM.osc=null;}
    else if(f&&SIM.osc)SIM.osc.frequency.value=f;}catch(e){}
}
/* ---- the panel ---- */
function ardsimBar(){
  const b=$("axRun"),s=$("axState");if(b)b.textContent=ast(SIM.run?"stop":"run");
  if(s){s.className="axstate"+(SIM.run?" on":"")+(SIM.err?" err":"");s.textContent=SIM.err?ast("err").replace("{0}",SIM.err):ast(SIM.run?"running":"stopped");}
}
function ardsimPanelHTML(){
  const slider=(k,min,max,step,unit)=>'<label class="asl"><span>'+ast(k)+' <b class="ltr" id="axv-'+k+'"></b></span><input type="range" id="ax-'+k+'" data-in="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+SIM.in[k]+'" data-unit="'+unit+'"></label>';
  const opt=(v,l)=>'<option value="'+v+'"'+(AB.ex===v?" selected":"")+">"+esc(l)+"</option>";
  return'<div class="axbar"><label class="axsel"><span>'+ast("ex")+'</span><select id="axSel">'+(AB.mine||AB.ex==="mine"?opt("mine",ast("mine")):"")+ASX.map(x=>opt(x[0],x[1][LI])).join("")+opt("empty",ast("empty"))+"</select></label>"+
    '<button type="button" class="btn primary" id="axRun" data-ax="run"></button><span id="axState" class="axstate" role="status"></span></div>'+
   '<p class="axdesc" id="axDesc"></p>'+
   '<div class="axlcd" dir="ltr" aria-label="'+esc(ast("lcd"))+'"><div id="axL0"></div><div id="axL1"></div></div>'+
   '<div class="axouts" id="axOuts"></div>'+
   "<h4>"+ast("sensors")+'</h4><div class="axins">'+slider("pot",0,1023,1,"")+slider("temp",-10,50,.5," °C")+slider("hum",0,100,1," %")+slider("dist",2,200,1," cm")+slider("lux",0,1000,5," lx")+slider("snd",0,1023,1,"")+slider("tilt",-45,45,1,"°")+
   '<div class="axtog"><button type="button" class="btn" id="axBtn">'+ast("btn")+"</button></div>"+
   '<label class="axtog axchk"><input type="checkbox" id="axPir"> '+ast("pir")+"</label>"+
   '<div class="axtog axremote"><span>'+ast("remote")+'</span><div class="keys" dir="ltr">'+IRKEYS.map(k=>'<button type="button" class="key" data-ir="'+k[1]+'">'+k[0]+"</button>").join("")+"</div></div></div>"+
   '<label class="axchk axsound"><input type="checkbox" id="axSound"'+(SIM.sound?" checked":"")+"> "+ast("sound")+"</label>"+
   "<h4>"+ast("serial")+'</h4><pre class="axserial" id="axSerial" dir="ltr"></pre>';
}
function ardsimDesc(){const d=$("axDesc");if(!d)return;const x=ASX.find(x=>x[0]===AB.ex);d.textContent=x?x[2][LI]:"";}
function ardsimPaint(all){
  const o=SIM.out;if(!o)return;
  if($("axL0")){$("axL0").textContent=(o.lcd[0]||"").padEnd(16);$("axL1").textContent=(o.lcd[1]||"").padEnd(16);}
  const outs=$("axOuts");
  if(outs)outs.innerHTML=
    '<div class="aout"><span>'+ast("led")+'</span><i class="lbar"><i style="width:'+Math.round(o.led/2.55)+'%"></i></i><b class="ltr">'+Math.round(o.led/2.55)+" %</b></div>"+
    '<div class="aout"><span>'+ast("buzz")+'</span><b class="apill'+(o.buzz?" hot":"")+'">'+(o.buzz?o.buzz+" Hz":ast("off"))+"</b></div>"+
    '<div class="aout"><span>'+ast("relay")+'</span><b class="apill'+(o.relay?" hot":"")+'">'+ast(o.relay?"on":"off")+"</b></div>"+
    '<div class="aout"><span>'+ast("servo")+'</span><b class="ltr">'+o.servo+"°</b></div>";
  Object.keys(SIM.in).forEach(k=>{const e=$("axv-"+k),r=$("ax-"+k);if(e&&r){e.textContent=(+SIM.in[k]).toString()+(r.dataset.unit||"");if(all&&document.activeElement!==r)r.value=SIM.in[k];}});
  const pc=$("axPir");if(pc)pc.checked=SIM.in.pir;const bb=$("axBtn");if(bb)bb.classList.toggle("down",SIM.in.btn);
  const ser=$("axSerial");if(ser)ser.textContent=SIM.serial.join("\n");
  afShow(o);
}
function ardsimWire(root){
  root.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.in;if(k){SIM.in[k]=+e.target.value;simInputChanged();}});
  root.addEventListener("change",e=>{const id=e.target.id;
    if(id==="axSel"){const was=SIM.run;if(was)simStop();abPick(e.target.value);ardsimDesc();if(was)simStart();}
    else if(id==="axPir"){SIM.in.pir=e.target.checked;simInputChanged();}
    else if(id==="axSound"){SIM.sound=e.target.checked;simSound();}});
  root.addEventListener("click",e=>{const b=e.target.closest("[data-ax],[data-ir]");if(!b)return;
    if(b.dataset.ax==="run"){SIM.run?simStop():simStart();}
    else if(b.dataset.ir){SIM.in.ir=+b.dataset.ir;if(!SIM.run)simStart();}});
  const hold=v=>e=>{const b=e.target.closest&&e.target.closest("#axBtn");if(!b)return;if(v&&b.setPointerCapture)b.setPointerCapture(e.pointerId);SIM.in.btn=v;simInputChanged();};
  root.addEventListener("pointerdown",hold(true));root.addEventListener("pointerup",hold(false));root.addEventListener("pointercancel",hold(false));
  root.addEventListener("keydown",e=>{if(e.target.id==="axBtn"&&(e.key===" "||e.key==="Enter")&&!e.repeat){e.preventDefault();SIM.in.btn=true;simInputChanged();}});
  root.addEventListener("keyup",e=>{if(e.target.id==="axBtn"&&(e.key===" "||e.key==="Enter")){SIM.in.btn=false;simInputChanged();}});
}
/* the section the Arduino page puts in */
function ardsimSection(){
  return'<section class="asec a3sec"><h3>'+ast("secT")+"</h3><p>"+ast("secL")+"</p>"+
   '<div class="asim"><div><div class="afhost" id="afHost" dir="ltr">'+afSvg()+'<div class="a3info" id="afInfo" hidden></div></div>'+
     '<p class="gnote">'+ast("hint")+'</p><p class="gnote">'+ast("illusF")+"</p></div>"+
   '<div class="axpanel" id="axPanel">'+ardsimPanelHTML()+"</div></div>"+
   '<div class="abwrap"><div class="abhead"><h4>'+ast("blocks")+" · "+ast("script")+'</h4><p class="gnote">'+ast("howto")+'</p></div><div class="abed" id="abEditor"></div></div>'+
   '<details class="axcode"><summary>'+ast("code")+'</summary><pre dir="ltr"><code id="axCode"></code></pre></details></section>';
}
function ardsimMount(){
  const sec=document.querySelector("#arduinoBody .a3sec");if(!sec)return;
  if(!AB.prog)abLoad();
  abRender();ardsimDesc();ardsimBar();ardsimPaint(true);
  afWire($("afHost"));ardsimWire(sec);
}
