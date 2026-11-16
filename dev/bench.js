/* ---------- module simulator (top of the Modules page): one module at a time, connected to the data bus ----------
   Each module has its inputs (control lines, switches, modes), a model of what one clock pulse does,
   and what it drives onto the bus. The bus strip shows the 8 data wires: you set them by clicking,
   unless the module itself is driving the bus. */
const bt=k=>(BT[k]?BT[k][LI]:k);
const BENCHMODS=["clk","pc","mar","ram","reg","alu","out","ctl"];
const BTYPE={clk:"clk",pc:"pc",mar:"mar",ram:"ram",reg:"reg",alu:"alu",out:"out",ctl:"ctl"};
const BUSUSE={clk:0,ctl:0,pc:4,mar:4,ram:8,reg:8,alu:8,out:8}; // data wires each module is connected to
let bm="reg",bvar="a",bs=null,bin_={},bnote="",bclkTimer=null;

/* ---- the modules ---- each: inputs the panel shows, clock(s,i), reset(s,i), busOut(s,i), loads(i), vals for the LEDs, read() for the outputs table */
const BM={
 reg:{
  sigs:()=>bvar==="a"?["AI","AO"]:bvar==="b"?["BI"]:["II","IO"],
  ins:[],
  init:()=>({v:0}),
  loads:i=>i[bvar==="a"?"AI":bvar==="b"?"BI":"II"],
  clock(s,i){if(this.loads(i))s.v=i.bus;},
  reset(s){s.v=0;},
  busOut(s,i){return(bvar==="a"?i.AO:bvar==="ir"?i.IO:0)?(bvar==="ir"?s.v&15:s.v):null;},
  vals:s=>({[bvar]:s.v}),
  read(s,i){return[[bt("rStored"),s.v,bin8(s.v)]].concat(bvar==="ir"?[[bt("rToCtl"),s.v>>4,bin(s.v>>4,4)]]:[]);}
 },
 pc:{
  sigs:()=>["PCE","JMP","PCO"],ins:[],
  init:()=>({v:0}),
  loads:i=>i.JMP,
  clock(s,i){if(i.JMP)s.v=i.bus&15;else if(i.PCE)s.v=(s.v+1)&15;},
  reset(s){s.v=0;},
  busOut:(s,i)=>i.PCO?s.v:null,
  vals:s=>({pc:s.v}),
  read(s){return[[bt("rCount"),s.v,bin(s.v,4)]];}
 },
 mar:{
  sigs:()=>["MI"],ins:["prog","sw4"],
  init:()=>({v:0}),
  loads:i=>i.MI&&!i.prog,
  clock(s,i){if(!i.prog&&i.MI)s.v=i.bus&15;},
  reset(s,i){if(!i.prog)s.v=0;},
  addr:(s,i)=>i.prog?i.sw4:s.v,
  busOut:()=>null,
  vals(s,i){return{mar:this.addr(s,i)};},
  read(s,i){return[[bt("rStored"),s.v,bin(s.v,4)],[bt("rAddr"),this.addr(s,i),bin(this.addr(s,i),4)]];}
 },
 ram:{
  sigs:()=>["RI","RO"],ins:["prog","sw4","sw8"],acts:["write"],
  init:()=>({m:new Array(16).fill(0)}),
  loads:i=>i.RI&&!i.prog,
  clock(s,i){if(!i.prog&&i.RI)s.m[i.sw4]=i.bus;},
  write(s,i){if(i.prog)s.m[i.sw4]=i.sw8;},
  reset(){},
  busOut:(s,i)=>i.RO?s.m[i.sw4]:null,
  vals:(s,i)=>({ramv:s.m[i.sw4]}),
  read(s,i){return[[bt("rAddrIn"),i.sw4,bin(i.sw4,4)],[bt("rByte"),s.m[i.sw4],bin8(s.m[i.sw4])]];}
 },
 alu:{
  sigs:()=>["SUB","EO","FI"],ins:["ra","rb"],
  init:()=>({cf:0,zf:0}),
  loads:()=>0,
  calc(i){const b=i.SUB?(~i.rb&255):i.rb,t=i.ra+b+(i.SUB?1:0);return{r:t&255,c:t>255?1:0,z:(t&255)?0:1};},
  clock(s,i){if(i.FI){const k=this.calc(i);s.cf=k.c;s.zf=k.z;}},
  reset(s){s.cf=0;s.zf=0;},
  busOut(s,i){return i.EO?this.calc(i).r:null;},
  vals(s,i){return{alu:this.calc(i).r,cf:s.cf,zf:s.zf};},
  read(s,i){const k=this.calc(i);return[[bt("rResult"),k.r,i.ra+(i.SUB?" − ":" + ")+i.rb],[bt("rCarryNow"),k.c,""],[bt("rZeroNow"),k.z,""],[bt("rFlags"),"C="+s.cf+" Z="+s.zf,""]];}
 },
 out:{
  sigs:()=>["OUT"],ins:["signed"],
  init:()=>({v:0}),
  loads:i=>i.OUT,
  clock(s,i){if(i.OUT)s.v=i.bus;},
  reset(s){s.v=0;},
  shown:(s,i)=>String(i.signed&&s.v>127?s.v-256:s.v),
  busOut:()=>null,
  vals:()=>({}),
  read(s,i){return[[bt("rStored"),s.v,bin8(s.v)],[bt("rDisplay"),this.shown(s,i),""]];}
 },
 ctl:{
  sigs:()=>[],ins:["op","flags"],
  init:()=>({step:0}),
  loads:()=>0,
  clock(s){s.step=(s.step+1)%6;},
  reset(s){s.step=0;},
  cw:(s,i)=>microcode(i.op,s.step,i.C,i.Z),
  busOut:()=>null,
  vals(s,i){return{cw:this.cw(s,i),T:1<<s.step};},
  read(s,i){const w=this.cw(s,i);return[[bt("rStep"),"T"+s.step,""],[bt("rOpcode"),OPS[i.op]||t("unused"),bin(i.op,4)],[bt("rEeprom"),(i.op<<5|s.step<<2|i.C<<1|i.Z),bin(i.op<<5|s.step<<2|i.C<<1|i.Z,9)],[bt("rLines"),cwNames(w)||"·",""]];}
 },
 clk:{
  sigs:()=>["HLT"],ins:["auto","speed"],
  init:()=>({lvl:0,edges:0,wave:[]}),
  loads:()=>0,
  press(s,i){if(i.auto||i.HLT)return 0;s.edges++;return 1;},
  clock(){},reset(){},
  busOut:()=>null,
  vals:(s,i)=>({ast:i.auto?1:0,man:i.auto?0:1,clk:s.lvl}),
  read(s,i){return[[bt("rMode"),i.auto?bt("auto"):t("manual"),""],[bt("rClk"),s.lvl,""],[bt("rEdges"),s.edges,""]];}
 }
};
function benchInputs(){const i={bus:0,prog:0,sw4:0,sw8:0,ra:0,rb:0,op:0,C:0,Z:0,signed:0,auto:0,speed:2,HLT:0};for(const k of SIGS)i[k]=0;return i;}
function benchNew(){bs=BM[bm].init();bin_=benchInputs();bnote="";benchClkStop();}
/* what is on the bus now: the module's value when it drives the bus, else the value you set */
function busNow(){const o=BM[bm].busOut(bs,bin_);if(o!=null)return{v:o,by:"mod"};return BUSUSE[bm]?{v:bin_.bus,by:"you"}:{v:null,by:"none"};}
function benchClkStop(){if(bclkTimer){clearInterval(bclkTimer);bclkTimer=null;}}
function benchClkSync(){benchClkStop();if(bm!=="clk"||!bin_.auto||bin_.HLT||!$("view-modules").classList.contains("active"))return;
  bclkTimer=setInterval(()=>{bs.lvl^=1;if(bs.lvl)bs.edges++;benchWave();renderBenchLive();},500/bin_.speed);}
function benchWave(){bs.wave.push(bs.lvl);if(bs.wave.length>48)bs.wave.shift();}

/* ---- drawing ---- */
function renderBench(){
  if(!bs)benchNew();
  const m=BM[bm],inst=bm==="reg"?bvar:bm,B=PCB[BTYPE[bm]];
  const chips=BENCHMODS.map(k=>'<button type="button" role="tab" data-bm="'+k+'" aria-selected="'+(k===bm)+'">'+t(CARDKEY[k==="reg"?"a":k]).replace(/ A$/,"")+"</button>").join("");
  const variant=bm==="reg"?'<div class="bvar" role="group">'+["a","b","ir"].map(v=>'<button type="button" data-bv="'+v+'" aria-pressed="'+(v===bvar)+'">'+t(CARDKEY[v])+"</button>").join("")+"</div>":"";
  $("benchBody").innerHTML=
   '<div class="bmods" role="tablist">'+chips+"</div>"+
   '<div class="bench">'+
     '<div class="bcard bboard">'+variant+'<div class="bsvg" dir="ltr"><svg id="bpcb" viewBox="-3 -3 '+(B.w+6)+" "+(B.h+6)+'" xmlns="http://www.w3.org/2000/svg">'+drawBoard(BTYPE[bm],inst,true,"bn-")+"</svg></div>"+
       '<div class="busflow" id="bFlow"></div>'+
       '<div class="busstrip" id="bBus"></div>'+
       (bm==="clk"?'<div class="wave" id="bwave" dir="ltr"></div>':"")+
       '<p class="bdesc">'+(MODT[BTYPE[bm]]?MODT[BTYPE[bm]][LI][2]:"")+"</p></div>"+
     '<div class="bcard bio"><h3>'+bt("inputs")+'</h3><div id="bInputs"></div>'+
       '<div class="bbtns">'+(bm==="clk"?'<button class="tbtn primary" data-bact="press">'+bt("press")+"</button>":'<button class="tbtn primary" data-bact="pulse"><span>'+t("pulse")+"</span></button>"+(bm!=="ram"?'<button class="tbtn" data-bact="reset">'+t("reset")+"</button>":""))+
         ((m.acts||[]).includes("write")?'<button class="tbtn" data-bact="write">'+bt("writeBtn")+"</button>":"")+"</div>"+
       '<p class="bnote" id="bNote" role="status"></p>'+
       '<h3>'+bt("outputs")+'</h3><table class="mono bread"><tbody id="bRead"></tbody></table>'+(bm==="ram"?'<div class="bmem" id="bMem" dir="ltr"></div>':"")+"</div>"+
   "</div>";
  renderBenchInputs();renderBenchLive();benchClkSync();
}
function bitRow(key,n,v,lbl){let h='<div class="bitrow"><span class="blbl">'+lbl+'</span><div class="bits" dir="ltr">';
  for(let k=n-1;k>=0;k--){h+='<button type="button" class="bit'+((v>>k)&1?" on":"")+'" data-bk="'+key+'" data-bb="'+k+'" aria-label="'+esc(lbl)+" bit "+k+'">'+((v>>k)&1)+"</button>";if(k===4&&n===8)h+='<span class="gap"></span>';}
  return h+'</div><b class="bval ltr">'+v+"</b></div>";}
function togg(key,lbl,sub){return'<button type="button" class="btog'+(bin_[key]?" on":"")+'" data-bt="'+key+'" aria-pressed="'+!!bin_[key]+'"><b class="ltr">'+lbl+"</b>"+(sub?"<span>"+sub+"</span>":"")+"</button>";}
function renderBenchInputs(){
  const m=BM[bm],I=m.ins,h=[];
  if(I.includes("ra"))h.push(bitRow("ra",8,bin_.ra,t("rA")));
  if(I.includes("rb"))h.push(bitRow("rb",8,bin_.rb,t("rB")));
  if(I.includes("sw4"))h.push(bitRow("sw4",4,bin_.sw4,bm==="ram"?bt("addrIn"):bt("addrSw")));
  if(I.includes("sw8"))h.push(bitRow("sw8",8,bin_.sw8,bt("dataSw")));
  if(I.includes("op"))h.push(bitRow("op",4,bin_.op,bt("opIn")+' <span class="ltr">('+(OPS[bin_.op]||"—")+")</span>"));
  const tg=m.sigs().map(k=>togg(k,k,sigName(k)));
  if(I.includes("prog"))tg.push(togg("prog","PROG",bt("progMode")));
  if(I.includes("signed"))tg.push(togg("signed","2C",bt("signedMode")));
  if(I.includes("flags"))tg.push(togg("C","C",bt("cIn")),togg("Z","Z",bt("zIn")));
  if(I.includes("auto"))tg.push(togg("auto","AUTO",bt("auto")));
  h.push('<div class="btogs">'+tg.join("")+"</div>");
  if(I.includes("speed"))h.push('<div class="speed"><label for="bSpeed">'+t("speed")+'</label><input type="range" id="bSpeed" min="1" max="10" value="'+bin_.speed+'"><span class="ltr">'+bin_.speed+" Hz</span></div>");
  $("bInputs").innerHTML=h.join("");
}
function renderBus(){
  const b=busNow(),use=BUSUSE[bm],m=BM[bm];
  const name=t(CARDKEY[bm==="reg"?bvar:bm]);
  if(b.by==="none"){$("bBus").innerHTML='<p class="busnone">'+bt("busNone")+"</p>";$("bFlow").innerHTML="";return;}
  let w="";for(let k=7;k>=0;k--){const on=(b.v>>k)&1,unused=k>=use;
    w+='<button type="button" class="wire'+(on?" on":"")+(unused?" unused":"")+'" data-wire="'+k+'"'+(b.by==="mod"?" disabled":"")+' aria-label="'+esc(bt("wire"))+" B"+k+'" aria-pressed="'+!!on+'"><i></i><span>B'+k+"</span></button>";}
  $("bBus").innerHTML='<div class="bushead"><b>'+bt("busTitle")+'</b><span class="busval ltr">'+b.v+" · "+bin8(b.v)+'</span><span class="busby'+(b.by==="mod"?" mod":"")+'">'+(b.by==="mod"?bt("busByMod").replace("{0}",name):bt("busByYou"))+"</span></div>"+
    '<div class="buswires" dir="ltr">'+w+"</div>"+(use<8?'<p class="bususe">'+bt("busUse4")+"</p>":"");
  const drives=b.by==="mod",loads=!!m.loads(bin_);
  $("bFlow").innerHTML=drives?'<span class="flow out">↓ '+bt("flowOut").replace("{0}",name).replace("{1}",b.v)+"</span>":loads?'<span class="flow in">↑ '+bt("flowIn").replace("{0}",name).replace("{1}",use<8?b.v&15:b.v)+"</span>":'<span class="flow idle">'+bt("flowIdle")+"</span>";
}
function renderBenchLive(){
  const m=BM[bm],inst=bm==="reg"?bvar:bm,v=m.vals(bs,bin_);
  document.querySelectorAll("#bpcb .led[id]").forEach(el=>{const ref=el.id.split("-").pop(),d=ledDef(inst,ref);if(!d)return;const val=v[d[0]];
    const on=val==null?false:d[0]==="cw"?!!(val&d[1]):!!((val>>d[1])&1);el.classList.toggle("on",on);const hl=$("bn-H-"+inst+"-"+ref);if(hl)hl.classList.toggle("on",on);});
  if(bm==="out"){const txt=m.shown(bs,bin_).padStart(4," ").slice(-4),SEG={"0":"abcdef","1":"bc","2":"abdeg","3":"abcdg","4":"bcfg","5":"acdfg","6":"acdefg","7":"abc","8":"abcdefg","9":"abcdfg","-":"g"," ":""};
    for(let d=0;d<4;d++)for(let k=0;k<7;k++){const e=$("bn-dg"+d+"-"+k);if(e)e.classList.toggle("on",(SEG[txt[d]]||"").includes("abcdefg"[k]));}}
  const mv=(id,on)=>{const el=$(id);if(!el)return;const hz=el.dataset.h==="1",a=+el.dataset.a,b=+el.dataset.b;if(hz)el.setAttribute("x",(on?b:a)-1.3);else el.setAttribute("y",(on?b:a)-1.3);};
  mv("bn-sw-prog",!!bin_.prog);mv("bn-sw-mode",!!bin_.auto);
  const dip=(id,on)=>{const e=$(id);if(!e)return;const x=on?+e.dataset.sx:+e.dataset.ex,y=on?+e.dataset.sy:+e.dataset.ey;e.setAttribute("x",x-.75);e.setAttribute("y",y-.75);};
  for(let k=0;k<4;k++)dip("bn-da-"+k,(bin_.sw4>>k)&1);for(let k=0;k<8;k++)dip("bn-dd-"+k,(bin_.sw8>>k)&1);
  const o=$("bn-O-"+inst);if(o){o.classList.toggle("drive",m.busOut(bs,bin_)!=null);o.classList.toggle("latch",m.busOut(bs,bin_)==null&&!!m.loads(bin_));}
  renderBus();
  $("bRead").innerHTML=m.read(bs,bin_).map(r=>"<tr><td>"+r[0]+"</td><td><b>"+r[1]+"</b></td><td>"+r[2]+"</td></tr>").join("");
  if(bm==="ram")$("bMem").innerHTML=bs.m.map((b,a)=>'<span class="'+(a===bin_.sw4?"cur":"")+'"><i>'+a+"</i>"+b+"</span>").join("");
  if(bm==="clk"){const w=bs.wave,n=48;let d="";w.forEach((l,k)=>{const x=(n-w.length+k)*4,y=l?4:20;d+=(k?"L":"M")+x+" "+y+"H"+(x+4);});
    $("bwave").innerHTML='<svg viewBox="0 0 192 24" preserveAspectRatio="none"><path d="'+d+'"/></svg>';}
  $("bNote").textContent=bnote;
}
function benchPick(k){bm=k;benchNew();renderBench();$("benchBody").scrollIntoView({behavior:"smooth",block:"start"});}

$("benchBody").addEventListener("click",e=>{
  const c=e.target.closest("[data-bm],[data-bv],[data-bk],[data-bt],[data-wire],[data-bact],#bpcb [data-act]");if(!c)return;const m=BM[bm];
  if(c.dataset.bm){bm=c.dataset.bm;benchNew();renderBench();return;}
  if(c.dataset.bv){bvar=c.dataset.bv;benchNew();renderBench();return;}
  if(c.dataset.wire){if(busNow().by!=="you")return;bin_.bus^=1<<+c.dataset.wire;bnote="";renderBenchLive();return;}
  if(c.dataset.bk){bin_[c.dataset.bk]^=1<<+c.dataset.bb;bnote="";renderBenchInputs();renderBenchLive();return;}
  if(c.dataset.bt){bin_[c.dataset.bt]=bin_[c.dataset.bt]?0:1;bnote="";renderBenchInputs();renderBenchLive();benchClkSync();return;}
  const a=c.dataset.bact||c.dataset.act;
  if(bm==="clk"&&(a==="pulse"||a==="press")){const n=m.press(bs,bin_);if(n){bs.lvl=1;benchWave();renderBenchLive();setTimeout(()=>{bs.lvl=0;benchWave();renderBenchLive();},220);}else benchWave();bnote=n?bt("didPress"):bt("noPress");renderBenchLive();return;}
  if(a==="write"&&!m.write)return;
  const before=JSON.stringify(bs);
  if(a==="pulse"){const b=busNow();m.clock(bs,Object.assign({},bin_,{bus:b.v==null?0:b.v}));bnote=bt("didPulse");}
  else if(a==="reset"){m.reset(bs,bin_);bnote=bt("didReset");}
  else if(a==="write"){m.write(bs,bin_);bnote=bin_.prog?bt("didWrite"):bt("needProg");}
  else if(a==="prog"){bin_.prog^=1;renderBenchInputs();bnote="";}
  else if(a==="mode"){bin_.auto^=1;renderBenchInputs();benchClkSync();bnote="";}
  else if(a==="da"){bin_.sw4^=1<<+c.dataset.bit;renderBenchInputs();bnote="";}
  else if(a==="dd"){bin_.sw8^=1<<+c.dataset.bit;renderBenchInputs();bnote="";}
  else return;
  if((a==="pulse"||a==="reset"||a==="write")&&before===JSON.stringify(bs))bnote+=" "+bt("noChange");
  renderBenchLive();
});
$("benchBody").addEventListener("input",e=>{if(e.target.id==="bSpeed"){bin_.speed=+e.target.value;e.target.nextElementSibling.textContent=bin_.speed+" Hz";benchClkSync();}});
