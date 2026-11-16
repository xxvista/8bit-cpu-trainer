/* ---------- test bench: take one module out of the computer and test it on its own ----------
   Each module has: its inputs (bus value, switches, control lines), a model of what one clock pulse does,
   what it drives onto the bus, a test plan,
   and faults (several are the real mistakes from his first boards). */
const bt=k=>(BT[k]?BT[k][LI]:k);
const BENCHMODS=["clk","pc","mar","ram","reg","alu","out","ctl"];
const BTYPE={clk:"clk",pc:"pc",mar:"mar",ram:"ram",reg:"reg",alu:"alu",out:"out",ctl:"ctl"};
let bm="reg",bvar="a",bfault="",bs=null,bin_={},bresult=null,bnote="",bclkTimer=null,bflick=0;

/* expected control words, written out from the instruction set (independent of microcode()) */
const XCW=(()=>{const F=[S.MI|S.PCO,S.RO|S.II|S.PCE],J=[S.IO|S.JMP];
  const T={0:[],1:[S.IO|S.MI,S.RO|S.AI],2:[S.IO|S.MI,S.AO|S.RI],3:[S.IO|S.MI,S.RO|S.BI],4:[S.IO|S.MI,S.EO|S.AI|S.FI],5:[S.IO|S.MI,S.EO|S.SUB|S.AI|S.FI],
    6:J,7:"C",8:"Z",14:[S.AO|S.OUT],15:[S.HLT]};
  return(op,step,c,z)=>{if(step<2)return F[step];let r=T[op]||[];if(r==="C")r=c?J:[];if(r==="Z")r=z?J:[];return r[step-2]||0;};})();

/* ---- the modules ---- each: init(), inputs (what the panel shows), clock(s,i), reset(s,i), out(s,i) -> readouts, vals for the LEDs, plan(api) */
const BM={
 reg:{
  sigs:()=>bvar==="a"?["AI","AO"]:bvar==="b"?["BI"]:["II","IO"],
  ins:["bus"],faults:["regFloat","regBit3"],
  init:()=>({v:0}),
  load:(s,i)=>i[bvar==="a"?"AI":bvar==="b"?"BI":"II"],
  drives:(s,i)=>(bvar==="a"?i.AO:bvar==="ir"?i.IO:0)||s.fault==="regFloat",
  clock(s,i){if(this.load(s,i)){s.v=i.bus;if(s.fault==="regBit3")s.v&=~8;}},
  reset(s){s.v=0;},
  busOut(s,i){return this.drives(s,i)?(bvar==="ir"?s.v&15:s.v):null;},
  vals:s=>({[bvar]:s.v}),
  read(s,i){return[[bt("rStored"),s.v,bin8(s.v)],[bt("rBusOut"),...busCell(this.busOut(s,i))]].concat(bvar==="ir"?[[bt("rToCtl"),s.v>>4,bin(s.v>>4,4)]]:[]);},
  plan(T){const L=bvar==="a"?"AI":bvar==="b"?"BI":"II",O=bvar==="a"?"AO":bvar==="ir"?"IO":null,mask=bvar==="ir"?15:255;
   T.step("tRegIn",()=>{T.set({bus:0x5A,[L]:1});T.pulse();T.set({[L]:0});T.check("rStored",0x5A,T.s.v);if(!O)T.check("rBusOut",null,T.bus());else T.check("rBusOut",null,T.bus());});
   if(O)T.step("tRegOut",()=>{T.set({[O]:1});T.check("rBusOut",0x5A&mask,T.bus());T.set({[O]:0});});
   else T.step("tRegNoOut",()=>{T.check("rBusOut",null,T.bus());});
   T.step("tReset",()=>{T.reset();T.check("rStored",0,T.s.v);});
   T.step("tNoop",()=>{T.set({bus:0x33,[L]:1});T.pulse();T.set({[L]:0});for(const v of [0,255,0x0F]){T.set({bus:v});T.pulse();T.check("rStored",0x33,T.s.v);}});
   T.step("tAll",()=>{for(let v=0;v<256;v++){T.set({bus:v,[L]:1});T.pulse();T.set({[L]:0});if(O){T.set({[O]:1});T.check("rBusOut",v&mask,T.bus(),v);T.set({[O]:0});}else T.check("rStored",v,T.s.v,v);}});}
 },
 pc:{
  sigs:()=>["PCE","JMP","PCO"],ins:["bus"],faults:["pcSolder","pcNoJmp"],
  init:()=>({v:0,n:0}),
  clock(s,i){if(i.JMP&&s.fault!=="pcNoJmp")s.v=i.bus&15;else if(i.PCE){s.n++;if(!(s.fault==="pcSolder"&&s.n%5===3))s.v=(s.v+1)&15;}},
  reset(s){s.v=0;},
  busOut(s,i){return i.PCO?s.v:null;},
  vals:s=>({pc:s.v}),
  read(s,i){return[[bt("rCount"),s.v,bin(s.v,4)],[bt("rBusOut"),...busCell(this.busOut(s,i))]];},
  plan(T){
   T.step("tPcCount",()=>{T.reset();T.set({PCE:1});for(let k=1;k<16;k++){T.pulse();T.check("rCount",k,T.s.v,k);}T.set({PCE:0});});
   T.step("tPcHold",()=>{T.reset();T.set({PCE:1});T.pulse();T.set({PCE:0});for(let k=0;k<3;k++){T.pulse();T.check("rCount",1,T.s.v);}});
   T.step("tPcJmp",()=>{for(let v=0;v<16;v++){T.set({bus:v,JMP:1});T.pulse();T.check("rCount",v,T.s.v,v);}T.set({JMP:0});});
   T.step("tReset",()=>{T.set({bus:9,JMP:1});T.pulse();T.set({JMP:0});T.reset();T.check("rCount",0,T.s.v);});
   T.step("tPcOut",()=>{T.set({bus:6,JMP:1});T.pulse();T.set({JMP:0});T.check("rBusOut",null,T.bus());T.set({PCO:1});T.check("rBusOut",6,T.bus());T.set({PCO:0});});
   T.step("tPcWrap",()=>{T.set({bus:15,JMP:1});T.pulse();T.set({JMP:0,PCE:1});T.pulse();T.set({PCE:0});T.check("rCount",0,T.s.v);});}
 },
 mar:{
  sigs:()=>["MI"],ins:["bus","prog","sw4"],faults:["marMix","marBit0"],
  init:()=>({v:0}),
  clock(s,i){if(i.prog||!i.MI)return;let v=i.bus&15;if(s.fault==="marMix")v=(v&12)|(i.sw4&3);if(s.fault==="marBit0")v|=1;s.v=v;},
  reset(s,i){if(!i.prog)s.v=0;},
  addr(s,i){return i.prog?i.sw4:s.v;},
  busOut:()=>null,
  vals(s,i){return{mar:this.addr(s,i)};},
  read(s,i){return[[bt("rStored"),s.v,bin(s.v,4)],[bt("rAddr"),this.addr(s,i),bin(this.addr(s,i),4)]];},
  plan(T){
   T.step("tMarIn",()=>{T.set({prog:0,sw4:0});for(const v of [9,6,3]){T.set({bus:v,MI:1});T.pulse();T.check("rAddr",v,T.m.addr(T.s,T.i),v);}T.set({MI:0});});
   T.step("tMarProg",()=>{T.set({bus:5,MI:1});T.pulse();T.set({prog:1,sw4:12,bus:3});T.pulse();T.check("rAddr",12,T.m.addr(T.s,T.i));T.set({prog:0,MI:0});T.check("rStored",5,T.s.v);});
   T.step("tReset",()=>{T.reset();T.check("rStored",0,T.s.v);});
   T.step("tMarAll",()=>{T.set({prog:0,sw4:0,MI:1});for(let v=0;v<16;v++){T.set({bus:v});T.pulse();T.check("rAddr",v,T.m.addr(T.s,T.i),v);}T.set({MI:0});});}
 },
 ram:{
  sigs:()=>["RI","RO"],ins:["bus","prog","sw4","sw8"],faults:["ramBtn","ram7"],acts:["write"],
  init:()=>({m:new Array(16).fill(0),pressed:false}),
  st:(s,v)=>s.fault==="ram7"?v&127:v,
  clock(s,i){if(!i.prog&&i.RI)s.m[i.sw4]=this.st(s,i.bus);},
  write(s,i){if(!i.prog)return;if(s.fault==="ramBtn"&&s.pressed)return;s.pressed=true;s.m[i.sw4]=this.st(s,i.sw8);},
  reset(){},
  busOut(s,i){return i.RO?s.m[i.sw4]:null;},
  vals:(s,i)=>({ramv:s.m[i.sw4]}),
  read(s,i){return[[bt("rAddrIn"),i.sw4,bin(i.sw4,4)],[bt("rByte"),s.m[i.sw4],bin8(s.m[i.sw4])],[bt("rBusOut"),...busCell(this.busOut(s,i))]];},
  plan(T){
   T.step("tRamWrite",()=>{T.set({prog:0,RI:1});for(let a=0;a<16;a++){T.set({sw4:a,bus:(a*17+3)&255});T.pulse();}T.set({RI:0});T.check("rByte",3,T.s.m[0]);});
   T.step("tRamRead",()=>{T.set({RO:1});for(let a=0;a<16;a++){T.set({sw4:a});T.check("rBusOut",(a*17+3)&255,T.bus(),a);}T.set({RO:0});});
   T.step("tNoop",()=>{T.set({sw4:4,bus:0});for(let k=0;k<3;k++)T.pulse();T.check("rByte",(4*17+3)&255,T.s.m[4]);});
   T.step("tAll",()=>{T.set({sw4:5});for(let v=0;v<256;v++){T.set({bus:v,RI:1});T.pulse();T.set({RI:0,RO:1});T.check("rBusOut",v,T.bus(),v);T.set({RO:0});}});
   T.step("tRamProgLock",()=>{T.set({sw4:2,bus:0,RI:1});T.pulse();T.set({prog:1,bus:99});T.pulse();T.set({RI:0,prog:0});T.check("rByte",0,T.s.m[2]);});
   T.step("tRamBtn",()=>{T.set({prog:1,sw4:7});for(const v of [11,22,33]){T.set({sw8:v});T.act("write");T.check("rByte",v,T.s.m[7],v);}T.set({prog:0});});}
 },
 alu:{
  sigs:()=>["SUB","EO","FI"],ins:["ra","rb"],faults:["aluCarry","aluFlags"],
  init:()=>({cf:0,zf:0}),
  calc(s,i){const a=i.ra,b=i.SUB?(~i.rb&255):i.rb,c0=i.SUB?1:0;
    if(s.fault==="aluCarry"){const lo=(a&15)+(b&15)+c0,hi=(a>>4)+(b>>4);const r=((hi&15)<<4)|(lo&15);return{r,c:hi>>4,z:r?0:1};}
    const t=a+b+c0;return{r:t&255,c:t>255?1:0,z:(t&255)?0:1};},
  clock(s,i){if(i.FI||s.fault==="aluFlags"){const k=this.calc(s,i);s.cf=k.c;s.zf=k.z;}},
  reset(s){s.cf=0;s.zf=0;},
  busOut(s,i){return i.EO?this.calc(s,i).r:null;},
  vals(s,i){return{alu:this.calc(s,i).r,cf:s.cf,zf:s.zf};},
  read(s,i){const k=this.calc(s,i);return[[bt("rResult"),k.r,i.ra+(i.SUB?" − ":" + ")+i.rb],[bt("rCarryNow"),k.c,""],[bt("rZeroNow"),k.z,""],[bt("rFlags"),"C="+s.cf+" Z="+s.zf,""],[bt("rBusOut"),...busCell(this.busOut(s,i))]];},
  plan(T){
   T.step("tAluA",()=>{T.set({rb:0,SUB:0,EO:1});for(let k=0;k<8;k++){T.set({ra:1<<k});T.check("rBusOut",1<<k,T.bus(),1<<k);}});
   T.step("tAluB",()=>{T.set({ra:0});for(let k=0;k<8;k++){T.set({rb:1<<k});T.check("rBusOut",1<<k,T.bus(),1<<k);}});
   T.step("tAluNeg",()=>{T.set({ra:0,SUB:1});for(let k=0;k<8;k++){T.set({rb:1<<k});T.check("rBusOut",(256-(1<<k))&255,T.bus(),1<<k);}T.set({SUB:0});});
   T.step("tAluFloat",()=>{T.set({ra:7,rb:8,EO:0});T.check("rBusOut",null,T.bus());T.set({EO:1});});
   T.step("tAluAdd",()=>{T.set({SUB:0,FI:1});for(let a=0;a<256;a++)for(let b=0;b<256;b++){T.set({ra:a,rb:b});T.pulse();const r=(a+b)&255;T.check("rResult",r,T.bus(),a+"+"+b);T.check("rFlags","C="+(a+b>255?1:0)+" Z="+(r?0:1),"C="+T.s.cf+" Z="+T.s.zf,a+"+"+b);}});
   T.step("tAluSub",()=>{T.set({SUB:1});for(let a=0;a<256;a++)for(let b=0;b<256;b++){T.set({ra:a,rb:b});T.pulse();const r=(a-b)&255;T.check("rResult",r,T.bus(),a+"−"+b);T.check("rFlags","C="+(a>=b?1:0)+" Z="+(r?0:1),"C="+T.s.cf+" Z="+T.s.zf,a+"−"+b);}T.set({SUB:0,FI:0});});
   T.step("tAluFlagsFi",()=>{T.set({ra:0,rb:0,FI:1});T.pulse();T.set({FI:0,ra:200,rb:100});T.pulse();T.check("rFlags","C=0 Z=1","C="+T.s.cf+" Z="+T.s.zf);});
   T.step("tReset",()=>{T.set({ra:0,rb:0,FI:1});T.pulse();T.set({FI:0});T.reset();T.check("rFlags","C=0 Z=0","C="+T.s.cf+" Z="+T.s.zf);});}
 },
 out:{
  sigs:()=>["OUT"],ins:["bus","signed"],faults:["outFloat","outEnable"],
  init:()=>({v:0,ph:0}),
  clock(s,i){if(i.OUT)s.v=i.bus;},
  reset(s){s.v=0;},
  shown(s,i){if(s.fault==="outEnable")return"";let sg=i.signed;if(s.fault==="outFloat")sg=(s.ph++%2)===1;return String(sg&&s.v>127?s.v-256:s.v);},
  busOut:()=>null,
  vals:()=>({}),
  read(s,i){const d=this.shown(s,i);return[[bt("rStored"),s.v,bin8(s.v)],[bt("rDisplay"),d===""?"—":d,""]];},
  plan(T){const sh=()=>T.m.shown(T.s,T.i);
   T.step("tOutAll",()=>{T.set({signed:0,OUT:1});for(let v=0;v<256;v++){T.set({bus:v});T.pulse();T.check("rDisplay",String(v),sh(),v);}T.set({OUT:0});});
   T.step("tOutEnable",()=>{for(let v=0;v<20;v++){T.set({bus:v,OUT:v%2===0?1:0});T.pulse();T.check("rDisplay",String(v-(v%2)),sh(),v);}T.set({OUT:0});});
   T.step("tReset",()=>{T.reset();T.check("rDisplay","0",sh());});
   T.step("tOutSigned",()=>{T.set({signed:1,OUT:1});for(let v=0;v<256;v++){T.set({bus:v});T.pulse();T.check("rDisplay",String(v>127?v-256:v),sh(),v);}T.set({OUT:0,signed:0});});}
 },
 ctl:{
  sigs:()=>[],ins:["op","flags"],faults:["ctlAi","ctlReset"],acts:[],
  init:()=>({step:0}),
  clock(s){if(s.fault==="ctlReset")return;s.step=(s.step+1)%6;},
  reset(s){s.step=0;},
  cw(s,i){let w=microcode(i.op,s.step,i.C,i.Z);if(s.fault==="ctlAi")w&=~S.AI;return w;},
  busOut:()=>null,
  vals(s,i){return{cw:this.cw(s,i),T:1<<s.step};},
  read(s,i){const w=this.cw(s,i);return[[bt("rStep"),"T"+s.step,""],[bt("rOpcode"),OPS[i.op]||t("unused"),bin(i.op,4)],[bt("rEeprom"),(i.op<<5|s.step<<2|i.C<<1|i.Z),bin(i.op<<5|s.step<<2|i.C<<1|i.Z,9)],[bt("rLines"),cwNames(w)||"·",""]];},
  plan(T){
   T.step("tCtlAll",()=>{for(let op=0;op<16;op++)for(let f=0;f<4;f++){T.set({op,C:f>>1,Z:f&1});T.reset();for(let k=0;k<6;k++){const w=T.m.cw(T.s,T.i),x=XCW(op,k,f>>1,f&1);
      T.check("rLines",cwNames(x)||"·",cwNames(w)||"·",(OPS[op]||op)+" T"+k+" C="+(f>>1)+" Z="+(f&1));T.pulse();}}});
   T.step("tCtlWrap",()=>{T.reset();for(let k=0;k<6;k++)T.pulse();T.check("rStep","T0","T"+T.s.step);});
   T.step("tReset",()=>{T.reset();T.pulse();T.pulse();T.reset();T.check("rStep","T0","T"+T.s.step);});}
 },
 clk:{
  sigs:()=>["HLT"],ins:["auto","speed"],faults:["clkBtn","clkPullup"],acts:["press"],
  init:()=>({lvl:0,edges:0,wave:[]}),
  canPulse:(s,i)=>!i.HLT&&s.fault!=="clkPullup"&&s.fault!=="clkBtn",
  press(s,i){if(i.auto)return 0;if(s.fault==="clkBtn"){s.lvl=1;return 0;}if(!this.canPulse(s,i))return 0;s.edges++;return 1;},
  run(s,i,sec){if(!i.auto||i.HLT)return 0;const n=Math.round(sec*i.speed);s.edges+=n;return n;},
  clock(s,i){this.press(s,i);},reset(){},
  busOut:()=>null,
  vals:(s,i)=>({ast:i.auto?1:0,man:i.auto?0:1,clk:s.lvl}),
  read(s,i){return[[bt("rMode"),i.auto?bt("auto"):t("manual"),""],[bt("rClk"),s.fault==="clkBtn"&&!i.auto?1:s.lvl,""],[bt("rEdges"),s.edges,""]];},
  plan(T){
   T.step("tClkPress",()=>{T.set({auto:0,HLT:0});let n=0;for(let k=0;k<3;k++)n+=T.m.press(T.s,T.i);T.check("rEdges",3,n);});
   T.step("tClkHalt",()=>{T.set({HLT:1});let n=T.m.press(T.s,T.i)+T.m.press(T.s,T.i);T.set({auto:1,speed:5});n+=T.m.run(T.s,T.i,1);T.check("rEdges",0,n);T.set({HLT:0,auto:0});});
   T.step("tClkAuto",()=>{T.set({auto:1,speed:5});T.check("rEdges",10,T.m.run(T.s,T.i,2));T.set({auto:0});});}
 }
};
const busCell=v=>v==null?[bt("floating"),""]:[v,bin8(v)];
function benchInputs(){const i={bus:0,prog:0,sw4:0,sw8:0,ra:0,rb:0,op:0,C:0,Z:0,signed:0,auto:0,speed:2,HLT:0};for(const k of SIGS)i[k]=0;return i;}
function benchNew(){bs=BM[bm].init();bs.fault=bfault;bin_=benchInputs();bresult=null;bnote="";benchClkStop();}

/* run a module's test plan on a fresh copy, with the selected fault */
function benchTest(){
  const m=BM[bm],s=m.init();s.fault=bfault;const i=benchInputs(),steps=[];let cur=null;
  const T={s,i,m,
    set(o){Object.assign(i,o);},pulse(){m.clock(s,i);},reset(){m.reset(s,i);},act(a){m[a](s,i);},bus(){return m.busOut(s,i);},
    step(k,f){cur={k,n:0,fail:null};steps.push(cur);f();},
    check(what,exp,act,at){cur.n++;if(!cur.fail&&String(exp)!==String(act))cur.fail={what,exp,act,at};}};
  m.plan(T);return steps;
}
function benchClkStop(){if(bclkTimer){clearInterval(bclkTimer);bclkTimer=null;}}
function benchClkSync(){benchClkStop();if(bm!=="clk"||!bin_.auto||bin_.HLT||!$("view-bench").classList.contains("active"))return;
  bclkTimer=setInterval(()=>{bs.lvl^=1;if(bs.lvl)bs.edges++;benchWave();renderBenchLive();},500/bin_.speed);}
function benchWave(){bs.wave.push(bs.fault==="clkBtn"&&!bin_.auto?1:bs.lvl);if(bs.wave.length>48)bs.wave.shift();}

/* ---- drawing ---- */
function renderBench(){
  if(!bs)benchNew();
  const m=BM[bm],inst=bm==="reg"?bvar:bm,B=PCB[BTYPE[bm]];
  const chips=BENCHMODS.map(k=>'<button type="button" role="tab" data-bm="'+k+'" aria-selected="'+(k===bm)+'">'+t(CARDKEY[k==="reg"?"a":k]).replace(/ A$/,"")+"</button>").join("");
  const variant=bm==="reg"?'<div class="bvar" role="group">'+["a","b","ir"].map(v=>'<button type="button" data-bv="'+v+'" aria-pressed="'+(v===bvar)+'">'+t(CARDKEY[v])+"</button>").join("")+"</div>":"";
  const faults='<option value="">'+bt("noFault")+"</option>"+m.faults.map(f=>'<option value="'+f+'"'+(f===bfault?" selected":"")+">"+bt("f_"+f)+"</option>").join("");
  $("benchBody").innerHTML=
   '<div class="bhead"><h2>'+bt("title")+'</h2><p class="lead">'+bt("lead")+'</p></div>'+
   '<div class="bmods" role="tablist">'+chips+"</div>"+
   '<div class="bench">'+
     '<div class="bcard bboard">'+variant+'<div class="bsvg" dir="ltr"><svg id="bpcb" viewBox="-3 -3 '+(B.w+6)+" "+(B.h+6)+'" xmlns="http://www.w3.org/2000/svg">'+drawBoard(BTYPE[bm],inst,true,"bn-")+"</svg></div>"+
       (bm==="clk"?'<div class="wave" id="bwave" dir="ltr"></div>':"")+
       '<p class="bdesc">'+(MODT[BTYPE[bm]]?MODT[BTYPE[bm]][LI][2]:"")+"</p></div>"+
     '<div class="bcard bio"><h3>'+bt("inputs")+(bfault?' <span class="fbadge">'+bt("faultOn")+"</span>":"")+'</h3><div id="bInputs"></div>'+
       '<div class="bbtns">'+(bm==="clk"?'<button class="tbtn primary" data-bact="press">'+bt("press")+"</button>":'<button class="tbtn primary" data-bact="pulse"><span>'+t("pulse")+"</span></button>"+(bm!=="ram"?'<button class="tbtn" data-bact="reset">'+t("reset")+"</button>":""))+
         ((m.acts||[]).includes("write")?'<button class="tbtn" data-bact="write">'+bt("writeBtn")+"</button>":"")+"</div>"+
       '<p class="bnote" id="bNote" role="status"></p>'+
       '<h3>'+bt("outputs")+'</h3><table class="mono bread"><tbody id="bRead"></tbody></table>'+(bm==="ram"?'<div class="bmem" id="bMem" dir="ltr"></div>':"")+"</div>"+
   "</div>"+
   '<div class="bcard btest"><h3>'+bt("autoT")+'</h3><p class="sub">'+bt("autoL")+'</p>'+
     '<div class="rowf"><label class="sub" for="bFaultSel" style="margin:0">'+bt("insFault")+'</label><select id="bFaultSel">'+faults+'</select><button class="btn primary" type="button" data-bact="test">'+bt("runT")+"</button></div>"+
     '<div id="bRes"></div></div>';
  renderBenchInputs();renderBenchLive();renderBenchResult();benchClkSync();
}
function bitRow(key,n,v,lbl){let h='<div class="bitrow"><span class="blbl">'+lbl+'</span><div class="bits" dir="ltr">';
  for(let k=n-1;k>=0;k--){h+='<button type="button" class="bit'+((v>>k)&1?" on":"")+'" data-bk="'+key+'" data-bb="'+k+'" aria-label="'+esc(lbl)+" bit "+k+'">'+((v>>k)&1)+"</button>";if(k===4&&n===8)h+='<span class="gap"></span>';}
  return h+'</div><b class="bval ltr">'+v+"</b></div>";}
function togg(key,lbl,sub){return'<button type="button" class="btog'+(bin_[key]?" on":"")+'" data-bt="'+key+'" aria-pressed="'+!!bin_[key]+'"><b class="ltr">'+lbl+"</b>"+(sub?"<span>"+sub+"</span>":"")+"</button>";}
function renderBenchInputs(){
  const m=BM[bm],I=m.ins,h=[];
  if(I.includes("bus"))h.push(bitRow("bus",8,bin_.bus,bt("busIn")));
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
  const o=$("bn-O-"+inst);if(o){const out=m.busOut(bs,bin_);o.classList.toggle("drive",out!=null);}
  $("bRead").innerHTML=m.read(bs,bin_).map(r=>"<tr><td>"+r[0]+"</td><td><b>"+r[1]+"</b></td><td>"+r[2]+"</td></tr>").join("");
  if(bm==="ram")$("bMem").innerHTML=bs.m.map((b,a)=>'<span class="'+(a===bin_.sw4?"cur":"")+'"><i>'+a+"</i>"+b+"</span>").join("");
  if(bm==="clk"){const w=bs.wave,n=48;let d="";w.forEach((l,k)=>{const x=(n-w.length+k)*4,y=l?4:20;d+=(k?"L":"M")+x+" "+y+"H"+(x+4);});
    $("bwave").innerHTML='<svg viewBox="0 0 192 24" preserveAspectRatio="none"><path d="'+d+'"/></svg>';}
  $("bNote").textContent=bnote;
}
function renderBenchResult(){
  if(!bresult){$("bRes").innerHTML="";return;}
  const ok=bresult.every(r=>!r.fail),tot=bresult.reduce((n,r)=>n+r.n,0);
  $("bRes").innerHTML='<div class="result '+(ok?"ok":"err")+'">'+(ok?bt("allPass").replace("{0}",tot):bt("someFail"))+"</div>"+
   '<div class="tablewrap"><table class="bres"><thead><tr><th>'+bt("plan")+"</th><th>"+bt("checks")+"</th><th>"+bt("verdict")+"</th></tr></thead><tbody>"+
   bresult.map((r,k)=>"<tr><td>"+(k+1)+". "+bt(r.k)+'</td><td class="m">'+r.n+"</td><td>"+(r.fail?'<b class="bad">'+bt("fail")+"</b><br><span class=\"sub\">"+(r.fail.at!=null?'<span class="ltr">'+esc(r.fail.at)+"</span> · ":"")+bt(r.fail.what)+": "+bt("expected")+' <b class="ltr">'+esc(r.fail.exp==null?bt("floating"):r.fail.exp)+"</b>, "+bt("got")+' <b class="ltr">'+esc(r.fail.act==null?bt("floating"):r.fail.act)+"</b></span>":'<b class="good">'+bt("pass")+"</b>")+"</td></tr>").join("")+"</tbody></table></div>";
}

$("benchBody").addEventListener("click",e=>{
  const c=e.target.closest("[data-bm],[data-bv],[data-bk],[data-bt],[data-bact],#bpcb [data-act]");if(!c)return;const m=BM[bm];
  if(c.dataset.bm){bm=c.dataset.bm;bfault="";benchNew();renderBench();return;}
  if(c.dataset.bv){bvar=c.dataset.bv;bfault="";benchNew();renderBench();return;}
  if(c.dataset.bk){bin_[c.dataset.bk]^=1<<+c.dataset.bb;bnote="";renderBenchInputs();renderBenchLive();return;}
  if(c.dataset.bt){bin_[c.dataset.bt]=bin_[c.dataset.bt]?0:1;bnote="";renderBenchInputs();renderBenchLive();benchClkSync();return;}
  const a=c.dataset.bact||c.dataset.act;
  if(a==="test"){bresult=benchTest();renderBenchResult();track("bench-test-"+bm+(bfault?"-fault":""),1);return;}
  const before=JSON.stringify(bs);
  if(bm==="clk"&&(a==="pulse"||a==="press")){const n=m.press(bs,bin_);if(n){bs.lvl=1;benchWave();renderBenchLive();setTimeout(()=>{bs.lvl=0;benchWave();renderBenchLive();},220);}else benchWave();bnote=n?bt("didPress"):bt("noPress");renderBenchLive();return;}
  if(a==="write"&&!m.write)return;
  if(a==="pulse"){m.clock(bs,bin_);bnote=bt("didPulse");}
  else if(a==="reset"){if(m.reset)m.reset(bs,bin_);bnote=bt("didReset");}
  else if(a==="write"){m.write(bs,bin_);bnote=bin_.prog?bt("didWrite"):bt("needProg");}
  else if(a==="prog"){bin_.prog^=1;renderBenchInputs();}
  else if(a==="mode"){bin_.auto^=1;renderBenchInputs();benchClkSync();}
  else if(a==="da"){bin_.sw4^=1<<+c.dataset.bit;renderBenchInputs();}
  else if(a==="dd"){bin_.sw8^=1<<+c.dataset.bit;renderBenchInputs();}
  else return;
  if(a!=="pulse"&&a!=="reset"&&a!=="write")bnote="";
  else if(before===JSON.stringify(bs))bnote+=" "+bt("noChange");
  renderBenchLive();
});
$("benchBody").addEventListener("change",e=>{if(e.target.id==="bFaultSel"){bfault=e.target.value;benchNew();renderBench();}});
$("benchBody").addEventListener("input",e=>{if(e.target.id==="bSpeed"){bin_.speed=+e.target.value;e.target.nextElementSibling.textContent=bin_.speed+" Hz";benchClkSync();}});
