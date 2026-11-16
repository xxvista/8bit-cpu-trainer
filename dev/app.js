/*CORE-START*/
const S={PCO:1,SUB:2,FI:4,JMP:8,HLT:16,PCE:32,AI:64,AO:128,OUT:256,BI:512,EO:1024,IO:2048,II:4096,RI:8192,RO:16384,MI:32768};
const OPS={0:"NOP",1:"LDA",2:"STA",3:"LDB",4:"ADD",5:"SUB",6:"JMP",7:"JMPC",8:"JMPZ",14:"OUT",15:"HLT"};
const HAS_ARG={LDA:1,STA:1,LDB:1,JMP:1,JMPC:1,JMPZ:1};
const MNEM={};for(const k in OPS)MNEM[OPS[k]]=+k;MNEM.HALT=15;MNEM.JC=7;MNEM.JZ=8;MNEM.NOOP=0;
function microcode(op,step,cf,zf){
  if(step===0)return S.MI|S.PCO;
  if(step===1)return S.RO|S.II|S.PCE;
  const jmp=[S.IO|S.JMP];
  const t={1:[S.IO|S.MI,S.RO|S.AI],2:[S.IO|S.MI,S.AO|S.RI],3:[S.IO|S.MI,S.RO|S.BI],
    4:[S.IO|S.MI,S.EO|S.AI|S.FI],5:[S.IO|S.MI,S.EO|S.SUB|S.AI|S.FI],6:jmp,
    7:cf?jmp:[],8:zf?jmp:[],14:[S.AO|S.OUT],15:[S.HLT]}[op]||[];
  return t[step-2]||0;
}
function newState(ram){return{pc:0,mar:0,ir:0,a:0,b:0,out:0,cf:0,zf:0,step:0,halted:false,ticks:0,ram:ram?ram.slice():new Array(16).fill(0)};}
const rev8=v=>{let r=0;for(let i=0;i<8;i++)r=(r<<1)|((v>>i)&1);return r;};
function aluIn(st){let a=st.a,b=st.b;if(st.fault==="aRev")a=rev8(a);if(st.fault==="bShift")b=(b<<1)&255;return[a,b];}
function ramOut(st,ad){const v=st.ram[ad];return st.fault==="ram7"?v&127:v;}
function alu(st,cw){const[a,b]=aluIn(st);const sub=cw&S.SUB?1:0;const bb=sub?(~b&255):b;const sum=a+bb+sub;return{res:sum&255,c:sum>255?1:0,z:(sum&255)===0?1:0,sub};}
function view(st){ // cw: what the Control card drives (its LEDs); eff: what actually reaches the cards
  let op=st.ir>>4;if(st.fault==="op0")op&=14;
  const cw=microcode(op,st.step,st.cf,st.zf);let eff=cw;
  if(st.fault==="fiDead")eff&=~S.FI;if(st.fault==="biDead")eff&=~S.BI;if(st.fault==="jmpDead")eff&=~S.JMP;
  const al=alu(st,cw);
  let bus=0,src=null;
  if(cw&S.PCO){bus=st.pc;src="pc";}
  if(cw&S.RO){bus=ramOut(st,st.mar);src="ram";}
  if(cw&S.IO){bus=st.ir;src="ir";}
  if(cw&S.AO){bus=st.a;src="a";}
  if(cw&S.EO){bus=al.res;src="alu";}
  return{cw,eff,bus,src,al};
}
function tick(st){
  if(st.halted)return st;
  const {eff:cw,bus,al}=view(st);
  if(cw&S.HLT){st.halted=true;return st;}
  if(cw&S.RI)st.ram[st.mar]=bus;
  if(cw&S.MI)st.mar=bus&15;
  if(cw&S.II)st.ir=bus;
  if(cw&S.FI){st.cf=al.c;st.zf=al.z;}
  if(cw&S.AI)st.a=bus;
  if(cw&S.BI)st.b=bus;
  if(cw&S.OUT)st.out=bus;
  if(cw&S.PCE)st.pc=(st.pc+1)&15;
  if(cw&S.JMP)st.pc=bus&15;
  st.step=(st.step+1)%6;st.ticks++;
  return st;
}
function num(t){
  if(/^0b[01]+$/i.test(t))return parseInt(t.slice(2),2);
  if(/^0x[0-9a-f]+$/i.test(t))return parseInt(t,16);
  if(/^\d+$/.test(t))return parseInt(t,10);
  return NaN;
}
function assemble(src){ // errors come back as {line, code, args} so the page can word them in any language
  const ram=new Array(16).fill(0),used={},labels={},items=[];let addr=0;
  const E=(line,code,...args)=>({error:{line,code,args}});
  const lines=src.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    let l=lines[i].replace(/[;#].*$/,"").trim();if(!l)continue;
    let m;
    while((m=l.match(/^([^:\s]+)\s*:\s*(.*)$/))){
      const a=num(m[1]);
      if(!isNaN(a)){if(a>15)return E(i+1,"aAddr");addr=a;}
      else if(/^[A-Za-z_]\w*$/.test(m[1])){const k=m[1].toLowerCase();if(k.toUpperCase() in MNEM)return E(i+1,"aLabIns",m[1]);if(k in labels)return E(i+1,"aLabTwice",m[1]);labels[k]=addr;}
      else return E(i+1,"aNotAddr",m[1]);
      l=m[2].trim();
    }
    if(!l)continue;
    if(addr>15)return E(i+1,"aPast");
    if(used[addr])return E(i+1,"aUsed",addr,used[addr]);
    used[addr]=i+1;items.push({addr,l,line:i+1});addr++;
  }
  for(const it of items){
    const p=it.l.split(/\s+/);let byte;
    const n=num(p[0]);
    if(!isNaN(n)){if(n>255)return E(it.line,"aData");if(p.length>1)return E(it.line,"aExtra");byte=n;}
    else{
      const name=p[0].toUpperCase();if(!(name in MNEM))return E(it.line,"aUnknown",p[0]);
      const canon=OPS[MNEM[name]];let arg=0;
      if(HAS_ARG[canon]){
        if(p.length<2)return E(it.line,"aNeed",canon);
        arg=num(p[1]);if(isNaN(arg)&&p[1].toLowerCase() in labels)arg=labels[p[1].toLowerCase()];
        if(isNaN(arg))return E(it.line,"aNotKnown",p[1]);
        if(arg>15)return E(it.line,"aNeed",canon);
      }else if(p.length>1)return E(it.line,"aNoArg",canon);
      byte=(MNEM[name]<<4)|arg;
    }
    ram[it.addr]=byte;
  }
  return{ram,count:items.length};
}
function disasm(b){const n=OPS[b>>4];if(!n)return"";return HAS_ARG[n]?n+" "+(b&15):n;}
function runProgram(ram,max){
  const st=newState(ram),outs=[];
  for(let i=0;i<max&&!st.halted;i++){const v=view(st);tick(st);if(v.cw&S.OUT)outs.push(st.out);}
  return{st,outs};
}
/*CORE-END*/

/* ---------- language ---------- */
let LI=0;
const tr=x=>Array.isArray(x)?x[LI]:x;
const t=(k,...a)=>(U[k]?U[k][LI]:k).replace(/\{(\d)\}/g,(m,i)=>a[i]);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const $=id=>document.getElementById(id);

/* ---------- shop settings: edit prices here (numbers in DA, or null for "price on request") ---------- */
/* ---------- company name: placeholder, change it here (the last word is shown in the accent colour) ---------- */
const BRAND="Electronics Kits Lab";

/* ---------- kits shown on the home page. status "soon" = placeholder page with a contact button ---------- */
const ICONS={
 gates:'<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M38 12h22a28 28 0 0 1 0 56H38z"/><path d="M10 28h28M10 52h28M88 40h22"/><circle cx="10" cy="28" r="3" fill="currentColor"/><circle cx="10" cy="52" r="3" fill="currentColor"/><circle cx="110" cy="40" r="3" fill="currentColor"/></svg>',
 arduino:'<svg viewBox="0 0 120 84" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="10" width="108" height="66" rx="6"/><rect x="0" y="22" width="18" height="16" rx="2"/><rect x="2" y="50" width="14" height="16" rx="2"/><rect x="48" y="36" width="34" height="18" rx="2"/><path d="M30 10V4M38 10V4M46 10V4M54 10V4M62 10V4M70 10V4M78 10V4M86 10V4M94 10V4M102 10V4M50 82v-6M58 82v-6M66 82v-6M74 82v-6M88 82v-6M96 82v-6M104 82v-6"/><circle cx="100" cy="24" r="4"/></svg>'
};
const KITS=[
 {id:"cpu",status:"live",name:()=>"8-Bit CPU Trainer",desc:()=>t("hCpuD"),img:"img/p044.jpg"},
 {id:"gates",status:"soon",name:()=>t("gName"),desc:()=>t("gD")},
 {id:"arduino",status:"soon",name:()=>t("aName"),desc:()=>t("aD")}
];
function renderBrand(){const w=BRAND.trim().split(/\s+/),last=w.pop();$("brandName").innerHTML=(w.length?esc(w.join(" "))+" ":"")+"<span>"+esc(last)+"</span>";}
function kitPic(k){return k.img?'<img src="'+k.img+'" alt="'+esc(k.name())+'" loading="lazy">':ICONS[k.id];}
function renderHome(){
  $("homeBody").innerHTML='<div class="homehero"><h2>'+t("hTitle")+'</h2><p class="lead">'+t("hLead")+'</p><div class="audience">'+[1,2,3,4].map(i=>"<span>"+t("hAud"+i)+"</span>").join("")+"</div></div>"+
   '<h2 class="sec">'+t("hChoose")+'</h2><div class="kits">'+KITS.map(k=>{const live=k.status==="live";
     return'<article class="kitcard'+(live?" live":"")+'"><a class="pic" href="#'+(live?"simulator":k.id)+'" tabindex="-1">'+kitPic(k)+'</a><div class="body"><span class="badge '+(live?"ok":"soon")+'">'+t(live?"hAvail":"hSoon")+"</span><h3"+(k.id==="cpu"?' class="ltr"':"")+">"+k.name()+"</h3><p>"+k.desc()+'</p><div class="ctas">'+
       (live?'<a class="btn primary" href="#simulator">'+t("hExplore")+'</a><a class="btn" href="#kit">'+t("hOrder")+"</a>":'<a class="btn" href="#'+k.id+'">'+t("hMore")+"</a>")+"</div></div></article>";}).join("")+"</div>"+
   '<p class="creditline">'+t("credit")+"</p>";
}
function renderSoon(id){
  const k=KITS.find(x=>x.id===id);if(!k)return;const msg=t("sMsg",k.name());
  $("soonBody").innerHTML='<a class="backlink" href="#home">← '+t("sBack")+'</a><div class="soonpage"><div><span class="badge soon">'+t("hSoon")+"</span><h2>"+k.name()+'</h2><p class="lead">'+k.desc()+"</p><p style=\"margin-top:14px\">"+t("sPlanned")+"</p><ul>"+[1,2,3,4].map(i=>"<li>"+t("sP"+i)+"</li>").join("")+"</ul><p>"+t("sNotify")+'</p><div class="ctas" style="margin-top:12px"><a class="btn primary big" target="_blank" rel="noopener" href="https://wa.me/'+SHOP.whatsapp+"?text="+encodeURIComponent(msg)+'">WhatsApp</a><a class="btn big" href="mailto:'+SHOP.email+"?subject="+encodeURIComponent(k.name())+"&body="+encodeURIComponent(msg)+'">Email</a></div>'+contactHtml()+'</div><div class="pic">'+ICONS[k.id]+"</div></div>";
}

const SHOP={email:"abdelkafiabdellah419@gmail.com",whatsapp:"213666020037",phone:"0666 02 00 37",currency:"DA",prices:{assembled:null,solder:null}};
const PHOTOS={pc:"img/p027.jpg",reg:"img/p040.jpg",alu:"img/p041.jpg",mar:"img/p042.jpg",ctl:"img/p043.jpg"};

const EXAMPLES=[
 {id:"count3",src:"; Shows 3, 6, 9 ... and wraps past 255\n      LDB three   ; B = 3\nloop: ADD         ; A = A + B\n      OUT         ; show A\n      JMP loop    ; again\n14:\nthree: 3"},
 {id:"add",src:"; 28 + 14 = 42\n0:  LDA 14     ; A = 28\n1:  LDB 15     ; B = 14\n2:  ADD\n3:  OUT\n4:  HLT\n14: 28\n15: 14"},
 {id:"sub",src:"; 30 - 12 = 18\n0:  LDA 14     ; A = 30\n1:  LDB 15     ; B = 12\n2:  SUB\n3:  OUT\n4:  HLT\n14: 30\n15: 12"},
 {id:"down",src:"; 10, 9, 8 ... 0 then stop\n0:  LDA 15     ; A = 10\n1:  LDB 14     ; B = 1\n2:  OUT\n3:  SUB\n4:  JMPZ 6     ; leave the loop when A is 0\n5:  JMP 2\n6:  OUT\n7:  HLT\n14: 1\n15: 10"},
 {id:"carry",src:"; Adds 50 until the sum passes 255\n0:  LDB 15     ; B = 50\n1:  ADD\n2:  OUT\n3:  JMPC 5     ; carry set: stop\n4:  JMP 1\n5:  HLT\n15: 50"},
 {id:"mul",src:"; Adds 3 to a running total, 5 times. Uses all 16 bytes.\n0:  LDA 13     ; total\n1:  LDB 15     ; + 3\n2:  ADD\n3:  STA 13\n4:  OUT\n5:  LDA 14     ; counter\n6:  LDB 12     ; - 1\n7:  SUB\n8:  STA 14\n9:  JMPZ 11\n10: JMP 0\n11: HLT\n12: 1\n13: 0          ; total\n14: 5          ; counter\n15: 3"},
 {id:"fetch",src:"; Three NOPs then halt. Watch T0 and T1.\n0:  NOP\n1:  NOP\n2:  NOP\n3:  HLT"}
];
const SIGS=["MI","RI","RO","II","IO","PCO","PCE","JMP","AI","AO","BI","EO","SUB","FI","OUT","HLT"];
const sigName=k=>SIGT[k][LI][0],sigDesc=k=>SIGT[k][LI][1];
const ISA=[["0000","NOP"],["0001","LDA n"],["0010","STA n"],["0011","LDB n"],["0100","ADD"],["0101","SUB"],["0110","JMP n"],["0111","JMPC n"],["1000","JMPZ n"],["1110","OUT"],["1111","HLT"]];
const MODORDER=["bus","clk","pc","mar","ram","reg","alu","out","ctl"];
const LABEX=["fetch","add","sub","count3","down","mul"];
const haltTxt=x=>x.st.halted?t("chHalt"):t("chNoHalt");
const CHECKS=[
 r=>{const x=runProgram(r,4000);return x.st.halted&&x.st.out===100?null:["100, "+t("chHalt"),x.st.out+", "+haltTxt(x)];},
 r=>{for(const n of[21,7,100]){const m=r.slice();m[15]=n;const x=runProgram(m,4000);if(!x.st.halted||x.st.out!==(2*n&255))return[t("chWith",n)+(2*n&255)+", "+t("chHalt"),x.st.out+", "+haltTxt(x)];}return null;},
 r=>{const x=runProgram(r,6000),w="5, 4, 3, 2, 1, 0";return x.st.halted&&x.outs.join(", ")===w?null:[w+", "+t("chHalt"),(x.outs.slice(0,10).join(", ")||t("chNothing"))+", "+haltTxt(x)];},
 r=>{const x=runProgram(r,20000),w=[];for(let i=7;i<256;i+=7)w.push(i);return x.st.halted&&x.outs.join(",")===w.join(",")?null:["7, 14, 21 … 252 (36), "+t("chHalt"),(x.outs.length?x.outs.slice(0,4).join(", ")+" … "+x.outs[x.outs.length-1]+" ("+x.outs.length+")":t("chNothing"))+", "+haltTxt(x)];},
 r=>{const x=runProgram(r,20000);return x.st.halted&&x.st.out===54?null:["54, "+t("chHalt"),x.st.out+", "+haltTxt(x)];}
];

/* ---------- PCB drawing ---------- */
const CARDKEY={clk:"cClk",mar:"cMar",ram:"cRam",ir:"cIr",ctl:"cCtl",pc:"cPc",a:"cA",alu:"cAlu",b:"cB",out:"cOut",bus:"cBus"};
function ledDef(inst,ref){
  const n=+ref.slice(1);
  switch(inst){
    case"bus":return["bus",n-1,""];
    case"alu":return n<=8?["alu",8-n,"g"]:n===9?["cf",0,"b"]:["zf",0,"b"];
    case"clk":return n===1?["ast",0,"y"]:n===2?["man",0,"y"]:["clk",0,"b"];
    case"ctl":if(n>=17)return["T",n-17,""];
      return["cw",[0,S.HLT,S.MI,S.AI,S.AO,S.II,S.IO,S.BI,S.JMP,S.PCO,S.PCE,S.RI,S.RO,S.EO,S.SUB,S.FI,S.OUT][n],"b"];
    case"mar":return["mar",4-n,""];
    case"pc":return["pc",4-n,"g"];
    case"ram":return["ramv",8-n,""];
    case"a":case"b":case"ir":return[inst,n-1,n>4?"b":""];
  }
  return null;
}
function bbox(p){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<p.length;i+=2){x0=Math.min(x0,p[i]);x1=Math.max(x1,p[i]);y0=Math.min(y0,p[i+1]);y1=Math.max(y1,p[i+1]);}return{x0,y0,x1,y1,cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0,h:y1-y0};}
function silkText(tx){
  const[txt,x,y,rot,sz,j]=tx;const fs=(sz*1.25).toFixed(2);const lines=txt.split("\n");
  const anchor=j==="s"?"start":j==="e"?"end":"middle";
  const fmt=s=>esc(s).replace(/~\{([^}]*)\}/g,'<tspan text-decoration="overline">$1</tspan>');
  const y0=y-(lines.length-1)*sz*0.75;
  return'<text class="silk" font-size="'+fs+'" text-anchor="'+anchor+'" transform="rotate('+(-rot)+" "+x+" "+y+')">'+
    lines.map((l,i)=>'<tspan x="'+x+'" y="'+(y0+i*sz*1.5+sz*0.42).toFixed(2)+'">'+fmt(l)+"</tspan>").join("")+"</text>";
}
function sevenSeg(x,y,w,h,id){
  const tt=h*0.1,g=tt*0.25,L=x,R=x+w,T=y,M=y+h/2,B=y+h;
  const hz=(xa,xb,yc)=>`${xa+g},${yc} ${xa+g+tt/2},${yc-tt/2} ${xb-g-tt/2},${yc-tt/2} ${xb-g},${yc} ${xb-g-tt/2},${yc+tt/2} ${xa+g+tt/2},${yc+tt/2}`;
  const vt=(xc,ya,yb)=>`${xc},${ya+g} ${xc+tt/2},${ya+g+tt/2} ${xc+tt/2},${yb-g-tt/2} ${xc},${yb-g} ${xc-tt/2},${yb-g-tt/2} ${xc-tt/2},${ya+g+tt/2}`;
  const segs=[hz(L,R,T),vt(R,T,M),vt(R,M,B),hz(L,R,B),vt(L,M,B),vt(L,T,M),hz(L,R,M)];
  return segs.map((p,i)=>'<polygon class="seg" id="'+id+"-"+i+'" points="'+p+'"/>').join("");
}
function drawBoard(type,inst,live){
  const B=PCB[type];let s="";
  const tipA=h=>' data-tip="'+esc(h)+'"';
  s+='<rect class="mask" data-card="'+inst+'" x="0" y="0" width="'+B.w+'" height="'+B.h+'" rx="1.6"/>';
  s+='<path class="tr" d="'+B.tr+'"/>';
  for(const tx of B.silk)s+=silkText(tx);
  let leds="";
  for(const p of B.parts){
    const bb=bbox(p.p),tip=p.v?tipA("<b>"+p.r+" · "+p.v+"</b>"+(CHIPT[p.v]?"<br>"+CHIPT[p.v][LI]:"")):"";
    const pads=(r)=>{let o="";for(let i=0;i<p.p.length;i+=2)o+='<circle class="pad" cx="'+p.p[i]+'" cy="'+p.p[i+1]+'" r="'+r+'"/>';return o;};
    if(p.k==="hole")s+='<circle class="hole" cx="'+bb.cx+'" cy="'+bb.cy+'" r="1.3"/>';
    else if(p.k==="hdr")s+='<rect class="hdr" x="'+(bb.x0-1.27)+'" y="'+(bb.y0-1.27)+'" width="'+(bb.w+2.54)+'" height="'+(bb.h+2.54)+'" rx=".3"/>'+pads(.55);
    else if(p.k==="usb")s+='<g'+tipA("<b>USB-C</b> 5 V")+'><rect class="metal" x="'+(bb.x0-.8)+'" y="'+(bb.y0-.8)+'" width="'+(bb.w+1.6)+'" height="'+(bb.h+2.6)+'" rx="1"/></g>';
    else if(p.k==="ic"){
      const horiz=bb.w>=bb.h;const x=horiz?bb.x0-1.3:bb.x0+1,y=horiz?bb.y0+1:bb.y0-1.3,w=horiz?bb.w+2.6:bb.w-2,h=horiz?bb.h-2:bb.h+2.6;
      const fs=Math.min(2.1,(horiz?w:h)/(p.v.length*0.62));
      const nx=horiz?(p.p[0]<bb.cx?x+1.1:x+w-1.1):bb.cx,ny=horiz?bb.cy:(p.p[1]<bb.cy?y+1.1:y+h-1.1);
      s+="<g"+tip+">"+pads(.6)+'<rect class="icb" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx=".5"/><circle cx="'+nx+'" cy="'+ny+'" r=".6" fill="#555"/>'+
        '<text class="ict" font-size="'+fs.toFixed(2)+'" text-anchor="middle" x="'+bb.cx+'" y="'+(bb.cy+fs*0.35).toFixed(2)+'"'+(horiz?"":' transform="rotate(-90 '+bb.cx+" "+bb.cy+')"')+">"+esc(p.v)+"</text></g>";
    }
    else if(p.k==="res"){const[x1,y1,x2,y2]=p.p,dx=x2-x1,dy=y2-y1;s+="<g"+tipA("<b>"+p.r+"</b> "+TIPS.res[LI]+" "+p.v+" Ω")+'><line class="lead" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/><line class="resb" x1="'+(x1+dx*.26)+'" y1="'+(y1+dy*.26)+'" x2="'+(x1+dx*.74)+'" y2="'+(y1+dy*.74)+'"/>'+pads(.5)+"</g>";}
    else if(p.k==="cap"){const d=Math.hypot(bb.w,bb.h);s+="<g"+tipA("<b>"+p.r+"</b> "+TIPS.cap[LI]+" "+p.v)+">"+(d<2.2?'<circle class="capp" cx="'+bb.cx+'" cy="'+bb.cy+'" r="2.3"/>':'<ellipse class="capb" cx="'+bb.cx+'" cy="'+bb.cy+'" rx="'+(bb.w/2+(bb.w>bb.h?1:.2)+.9)+'" ry="'+(bb.h/2+(bb.h>bb.w?1:.2)+.9)+'"/>')+"</g>";}
    else if(p.k==="xtal")s+="<g"+tip+'><rect class="metal" x="'+(bb.x0-2.2)+'" y="'+(bb.y0-1.8)+'" width="'+(bb.w+4.4)+'" height="'+(bb.h+3.6)+'" rx="1.8"/></g>';
    else if(p.k==="pot")s+='<g class="'+(live?"act":"")+'" data-act="pot"'+tipA(TIPS.pot[LI])+'><circle class="potb hl" cx="'+bb.cx+'" cy="'+bb.cy+'" r="4.6"/><line '+(live?'id="potline" ':"")+'x1="'+bb.cx+'" y1="'+bb.cy+'" x2="'+bb.cx+'" y2="'+(bb.cy-4)+'" stroke="#fff" stroke-width=".9" stroke-linecap="round"/></g>';
    else if(p.k==="btn"){const act=inst==="clk"?"pulse":inst==="ctl"?"reset":"write";
      s+='<g class="'+(live?"act":"")+'" data-act="'+act+'"'+tipA(TIPS[act][LI])+'><rect class="btnb hl" x="'+(bb.cx-3.3)+'" y="'+(bb.cy-3.3)+'" width="6.6" height="6.6" rx=".8"/><circle class="btnc" cx="'+bb.cx+'" cy="'+bb.cy+'" r="1.9"/></g>';}
    else if(p.k==="slide"){const act=inst==="clk"?"mode":"prog";const horiz=bb.w>=bb.h;
      s+='<g class="'+(live?"act":"")+'" data-act="'+act+'"'+tipA(TIPS[act][LI])+'><rect class="swb hl" x="'+(bb.x0-(horiz?2:2.2))+'" y="'+(bb.y0-(horiz?2.2:2))+'" width="'+(bb.w+(horiz?4:4.4))+'" height="'+(bb.h+(horiz?4.4:4))+'" rx=".5"/><rect class="swk" id="sw-'+act+(live?"":"-x")+'" data-h="'+(horiz?1:0)+'" data-a="'+(horiz?bb.x0:bb.y0)+'" data-b="'+(horiz?bb.x1:bb.y1)+'" x="'+(horiz?bb.x0-1.2:bb.cx-1.5)+'" y="'+(horiz?bb.cy-1.5:bb.y0-1.2)+'" width="'+(horiz?2.6:3)+'" height="'+(horiz?3:2.6)+'" rx=".3"/></g>';}
    else if(p.k==="dipsw"){const n=p.p.length/4;const which=inst==="mar"?"da":"dd";
      s+='<rect class="dipb" x="'+(bb.x0-1.4)+'" y="'+(bb.y0-1.4)+'" width="'+(bb.w+2.8)+'" height="'+(bb.h+2.8)+'" rx=".4"/>';
      for(let i=0;i<n;i++){const ax=p.p[i*2],ay=p.p[i*2+1],j=2*n-1-i,bx=p.p[j*2],by=p.p[j*2+1];const bit=inst==="mar"?n-1-i:i;
        const ux=(bx-ax),uy=(by-ay);const sx=ax+ux*.18,sy=ay+uy*.18,ex=ax+ux*.82,ey=ay+uy*.82;
        s+='<g class="'+(live?"act":"")+'" data-act="'+which+'" data-bit="'+bit+'"'+tipA(TIPS[which][LI].replace("{0}",bit))+'><line x1="'+sx+'" y1="'+sy+'" x2="'+ex+'" y2="'+ey+'" stroke="#5d1010" stroke-width="1.5" stroke-linecap="round"/>'+
          '<rect class="swk hl" id="'+which+"-"+bit+(live?"":"-x")+'" data-sx="'+sx+'" data-sy="'+sy+'" data-ex="'+ex+'" data-ey="'+ey+'" x="'+(ex-.75)+'" y="'+(ey-.75)+'" width="1.5" height="1.5" rx=".2"/></g>';}
    }
    else if(p.k==="disp"){const W=50.3,H=19,x=Math.max(1,Math.min(B.w-W-1,bb.cx-W/2)),y=Math.max(1,Math.min(B.h-H-1,bb.cy-H/2));
      s+="<g"+tipA(TIPS.disp[LI])+'><rect class="dispb" x="'+x+'" y="'+y+'" width="'+W+'" height="'+H+'" rx=".8"/>';
      for(let d=0;d<4;d++)s+=sevenSeg(x+5.2+d*11.4,y+3.2,6.6,12.6,(live?"dg":"dgx")+d);
      s+="</g>";}
    else if(p.k==="led"){const d=ledDef(inst,p.r)||["",0,""];
      leds+='<circle class="halo '+d[2]+'"'+(live?' id="H-'+inst+"-"+p.r+'"':"")+' cx="'+bb.cx+'" cy="'+bb.cy+'" r="4.3"/><circle class="led '+d[2]+'"'+(live?' id="L-'+inst+"-"+p.r+'"':"")+' cx="'+bb.cx+'" cy="'+bb.cy+'" r="2.45"/>';}
  }
  s+=leds;
  if(live&&(inst==="a"||inst==="b"||inst==="ir"))s+='<text class="cardname" x="'+(B.w/2)+'" y="'+(B.h-1.6)+'" font-size="3.4" text-anchor="middle">'+({a:"REGISTER A",b:"REGISTER B",ir:"INSTRUCTION REGISTER"})[inst]+"</text>";
  s+='<rect class="outline" id="O-'+inst+(live?"":"-x")+'" x="-.6" y="-.6" width="'+(B.w+1.2)+'" height="'+(B.h+1.2)+'" rx="2"/>';
  return s;
}
const ORDER=["clk","mar","ram","ir","ctl","pc","a","alu","b","out"];
const RECTS={bus:{x:0,y:0,w:PCB.bus.w,h:PCB.bus.h}};
ORDER.forEach(k=>{const[tp,[x,y]]=PLACE[k];RECTS[k]={x,y,w:PCB[tp].w,h:PCB[tp].h,t:tp};});
const FULL=(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const k in RECTS){const r=RECTS[k];x0=Math.min(x0,r.x);y0=Math.min(y0,r.y);x1=Math.max(x1,r.x+r.w);y1=Math.max(y1,r.y+r.h);}return[x0-5,y0-9,x1-x0+10,y1-y0+14];})();
let vb=FULL.slice(),zoomed=null,ledEls=null;
function buildPcb(){
  let s='<g>'+drawBoard("bus","bus",true)+"</g>";
  ORDER.forEach(k=>{const r=RECTS[k];s+='<g transform="translate('+r.x+" "+r.y+')">'+drawBoard(r.t,k,true)+"</g>";});
  $("pcb").innerHTML=s;ledEls=null;
  document.querySelectorAll("#pcbwrap .pill").forEach(e=>e.remove());
  $("pcbwrap").insertAdjacentHTML("beforeend",Object.keys(RECTS).map(k=>'<div class="pill" dir="auto" id="P-'+k+'"></div>').join(""));
  setVB(vb);
}
function setVB(v){vb=v.slice();$("pcb").setAttribute("viewBox",vb.join(" "));placePills();}
function placePills(){
  for(const k in RECTS){const r=RECTS[k],el=$("P-"+k);if(!el)continue;
    const cx=r.x+r.w/2,cy=k==="bus"?r.y+20:r.y+3.5;
    const px=(cx-vb[0])/vb[2]*100,py=(cy-vb[1])/vb[3]*100;
    el.style.left=px+"%";el.style.top=py+"%";el.style.display=(px<2||px>98||py<1||py>99)?"none":"";}
}
function zoomTo(k){
  if(!k||zoomed===k){zoomed=null;setVB(FULL);}
  else{zoomed=k;const r=RECTS[k],m=7;let w=r.w+2*m,h=r.h+2*m+6;const ar=FULL[2]/FULL[3];if(w/h<ar)w=h*ar;setVB([r.x+r.w/2-w/2,r.y-m-6,w,h]);}
  $("stage").classList.toggle("zoomed",!!zoomed);$("bWhole").disabled=!zoomed;
}

/* ---------- simulator ---------- */
let fault=null,faultTries=0;
const fresh=ram=>{const s=newState(ram);s.fault=fault;return s;};
let st=newState(),timer=null,hist=[],trace=[],bps=new Set(),prog=false,dipA=0,dipD=0,flash={},note="";
const SPEEDS=[1,2,5,10,20,40,60];
const SRCKEY={pc:"sPc",ram:"sRam",ir:"sIr",a:"sA",alu:"sAlu"};
const bin=(v,n)=>v.toString(2).padStart(n,"0");
const bin8=v=>bin(v,8).replace(/(....)(....)/,"$1 $2");
const addr=()=>prog?dipA:st.mar;
const cwNames=cw=>SIGS.filter(k=>cw&S[k]).join(" ");
const opName=op=>OPS[op]||t("unused");
function explain(v){
  const cw=v.cw;
  if(prog)return t("eProg",dipA,dipD,bin8(dipD));
  if(st.halted)return t("eHalted");
  if(cw&S.HLT)return t("eHlt");
  if(!cw)return t("eIdle");
  const d=[];if(cw&S.MI)d.push(t("dMar"));if(cw&S.RI)d.push(t("dRam",st.mar));if(cw&S.II)d.push(t("dIr"));
  if(cw&S.AI)d.push(t("dA"));if(cw&S.BI)d.push(t("dB"));if(cw&S.OUT)d.push(t("dOut"));if(cw&S.JMP)d.push(t("dPc"));
  let s="";
  if(v.src){s=v.src==="alu"?t("eAlu",st.a+(v.al.sub?" − ":" + ")+st.b,v.bus,bin8(v.bus)):t("ePuts",t(SRCKEY[v.src]),v.bus,bin8(v.bus));
    s+=" "+(d.length?t("eStore",d.join(t("and"))):t("eNoStore"));}
  if(cw&S.PCE)s+=" "+t("ePce",(st.pc+1)&15);
  if(cw&S.FI)s+=" "+t("eFi",v.al.c,v.al.z);
  return s.trim();
}
function render(){
  const v=view(st),cw=prog?0:v.cw,op=st.ir>>4,name=opName(op),hasArg=HAS_ARG[OPS[op]];
  const bus=prog?0:v.bus;
  const vals={bus,alu:v.al.res,cf:st.cf,zf:st.zf,mar:addr(),pc:st.pc,ramv:ramOut(st,addr()),a:st.a,b:st.b,ir:st.ir,T:st.halted?0:1<<st.step,cw,ast:flash.ast?1:0,man:flash.man?1:0,clk:flash.clk?1:0};
  if(!ledEls){ledEls=[];document.querySelectorAll("#pcb .led[id]").forEach(el=>{const[,inst,ref]=el.id.split("-");const d=ledDef(inst,ref);if(d)ledEls.push({el,halo:$("H-"+inst+"-"+ref),d});});}
  for(const L of ledEls){const on=L.d[0]==="cw"?!!(vals.cw&L.d[1]):!!((vals[L.d[0]]>>L.d[1])&1);L.el.classList.toggle("on",on);L.halo.classList.toggle("on",on);}
  const digs=String(st.out).padStart(4," ");const SEG={"0":"abcdef","1":"bc","2":"abdeg","3":"abcdg","4":"bcfg","5":"acdfg","6":"acdefg","7":"abc","8":"abcdefg","9":"abcdfg"," ":""};
  for(let d=0;d<4;d++)for(let i=0;i<7;i++){const e=$("dg"+d+"-"+i);if(e)e.classList.toggle("on",SEG[digs[d]].includes("abcdefg"[i]));}
  const mv=(el,on)=>{if(!el)return;const h=el.dataset.h==="1",a=+el.dataset.a,b=+el.dataset.b;if(h)el.setAttribute("x",(on?b:a)-1.3);else el.setAttribute("y",(on?b:a)-1.3);};
  mv($("sw-mode"),!!timer);mv($("sw-prog"),prog);
  const dip=(id,on)=>{const e=$(id);if(!e)return;const x=on?+e.dataset.sx:+e.dataset.ex,y=on?+e.dataset.sy:+e.dataset.ey;e.setAttribute("x",x-.75);e.setAttribute("y",y-.75);};
  for(let i=0;i<4;i++)dip("da-"+i,(dipA>>i)&1);for(let i=0;i<8;i++)dip("dd-"+i,(dipD>>i)&1);
  const sp=+$("speed").value,ang=-135+270*Math.log(sp)/Math.log(60),pl=$("potline");
  if(pl){const cx=+pl.getAttribute("x1"),cy=+pl.getAttribute("y1");pl.setAttribute("x2",cx+4*Math.sin(ang*Math.PI/180));pl.setAttribute("y2",cy-4*Math.cos(ang*Math.PI/180));}
  const io={mar:[0,cw&S.MI],ram:[cw&S.RO,cw&S.RI],ir:[cw&S.IO,cw&S.II],pc:[cw&S.PCO,cw&S.JMP],a:[cw&S.AO,cw&S.AI],b:[0,cw&S.BI],alu:[cw&S.EO,0],out:[0,cw&S.OUT],clk:[0,0],ctl:[0,0],bus:[0,0]};
  const pv={clk:st.halted?t("haltedW"):timer?$("speed").value+" Hz":t("manual"),mar:addr(),ram:ramOut(st,addr()),ir:name+(hasArg?" "+(st.ir&15):""),ctl:"T"+st.step,pc:st.pc,a:st.a,alu:v.al.res,b:st.b,out:st.out,bus:bus};
  for(const k in io){const o=$("O-"+k);if(o){o.classList.toggle("drive",!!io[k][0]);o.classList.toggle("latch",!io[k][0]&&!!io[k][1]);}
    const p=$("P-"+k);if(!p)continue;p.className="pill"+(io[k][0]?" drive":io[k][1]?" latch":"");
    p.innerHTML=t(CARDKEY[k])+" <b class='ltr'>"+pv[k]+"</b>"+(io[k][0]?"<i>"+t("pDrive")+"</i>":io[k][1]?"<i>"+t("pStore")+"</i>":"");}
  $("phase").textContent=prog?t("phProg"):st.halted?t("phHalt"):st.step<2?t("phFetch"):t("phExec");
  $("phaseSub").textContent=prog?t("subIgn"):t("subStep",st.step)+(st.step>=2?" · "+name:"")+" · "+t("subPulse",st.ticks);
  $("now").className="now"+(prog?" prog":st.halted?" halted":"");
  $("nowText").textContent=note||explain(v);
  const row=(n,val,extra)=>"<tr><td>"+n+"</td><td class='m'><b>"+val+"</b></td><td class='m'>"+extra+"</td></tr>";
  $("regBody").innerHTML=row(t("rPc"),st.pc,bin(st.pc,4))+row(t("rMar"),addr(),bin(addr(),4))+row(t("rRamAt"),ramOut(st,addr()),bin8(ramOut(st,addr())))+
    row(t("rIr"),name+(hasArg?" "+(st.ir&15):""),bin8(st.ir))+row(t("rA"),st.a,bin8(st.a))+row(t("rB"),st.b,bin8(st.b))+
    row(t("rAlu"),v.al.res,st.a+(v.al.sub?" − ":" + ")+st.b)+row(t("rFlags"),"C="+st.cf+" Z="+st.zf,"<span dir='auto'>"+t("savedByFi")+"</span>")+row(t("rBus"),bus,"<span dir='auto'>"+(v.src&&!prog?t("from",t(SRCKEY[v.src])):t("idle"))+"</span>")+row(t("rOut"),st.out,"");
  $("sigs").innerHTML=SIGS.map(k=>'<div class="sig'+(cw&S[k]?" on":"")+'" title="'+esc(sigDesc(k))+'"><b class="ltr">'+k+"</b>"+sigName(k)+"</div>").join("");
  $("ramBody").innerHTML=st.ram.map((b,i)=>{let bits='<div class="bits">';for(let k=7;k>=0;k--){bits+='<button class="bit'+((b>>k)&1?" on":"")+'" data-a="'+i+'" data-k="'+k+'" aria-label="Address '+i+" bit "+k+'">'+((b>>k)&1)+"</button>";if(k===4)bits+='<span class="gap"></span>';}
    return'<tr class="'+(i===addr()?"mar":"")+'"><td><button class="bp'+(bps.has(i)?" on":"")+'" data-bp="'+i+'" aria-label="Breakpoint at address '+i+'" aria-pressed="'+bps.has(i)+'"></button></td><td>'+String(i).padStart(2,"0")+(i===st.pc?' <span class="pcm">PC</span>':"")+"</td><td>"+bits+"</div></td><td>"+b+"</td><td>"+disasm(b)+"</td></tr>";}).join("");
  $("ucBody").innerHTML=Object.keys(OPS).map(k=>{k=+k;const cond=k===7?" (C=1)":k===8?" (Z=1)":"";const cur=k===op;
    const c=[0,1,2,3].map(s=>{const w=microcode(k,s,1,1);return'<td class="'+(cur&&st.step===s&&!prog?"cur":"")+'">'+(cwNames(w)||"·")+(s===2&&cond?cond:"")+"</td>";}).join("");
    return'<tr class="'+(cur?"cur":"")+'"><td><b>'+OPS[k]+"</b></td>"+c+'<td class="'+(cur&&st.step>=4&&!prog?"cur":"")+'">·</td></tr>';}).join("");
  $("trBody").innerHTML=trace.length?trace.slice(-150).reverse().map(x=>"<tr><td>"+x.n+"</td><td>T"+x.s+"</td><td>"+(x.i||t("fetchW"))+"</td><td>"+(x.c||"·")+"</td><td>"+x.b+"</td></tr>").join(""):'<tr><td colspan="5" class="empty" style="font-family:var(--f-body)">'+t("noPulses")+"</td></tr>";
  $("bStep").disabled=$("bIns").disabled=st.halted||prog;
  $("runLbl").textContent=timer?t("pause"):t("run");$("bRun").disabled=(st.halted||prog)&&!timer;
  $("bBack").disabled=!hist.length;
  $("fbadge").hidden=!fault;$("fbadge").textContent=t("fActive");
  if($("tab-timing").classList.contains("active"))renderTiming();
}
function renderTiming(){
  const box=$("tmBox"),N=32,rows=trace.slice(-N);
  if(!rows.length){box.innerHTML='<p class="empty" style="padding:0 10px">'+t("noPulses")+"</p>";return;}
  const W=22,RH=15,lanes=["CLK","T"].concat(SIGS,["BUS"]),top=16,H=top+lanes.length*RH+4,width=rows.length*W+4;
  const used=new Set();rows.forEach(r=>SIGS.forEach(k=>{if(r.cw&S[k])used.add(k);}));
  let lab='<svg class="tm" width="46" height="'+H+'" viewBox="0 0 46 '+H+'">';
  let s='<svg class="tm" viewBox="0 0 '+width+" "+H+'" width="'+width+'" height="'+H+'">';
  const lx=i=>i*W;
  s+='<rect class="tmcur" x="'+lx(rows.length-1)+'" y="'+(top-2)+'" width="'+W+'" height="'+(lanes.length*RH+2)+'"/>';
  rows.forEach((r,i)=>{if(r.n%4===0)s+='<text class="tmn" x="'+(lx(i)+W/2)+'" y="10" text-anchor="middle">'+r.n+"</text>";});
  lanes.forEach((ln,li)=>{
    const y=top+li*RH,hi=y+2,lo=y+RH-3;
    s+='<line class="tmg" x1="0" x2="'+width+'" y1="'+(y+RH)+'" y2="'+(y+RH)+'"/>';
    lab+='<line class="tmg" x1="0" x2="46" y1="'+(y+RH)+'" y2="'+(y+RH)+'"/><text class="tml'+(SIGS.includes(ln)&&!used.has(ln)?" dim":"")+'" x="40" y="'+(y+RH-4)+'" text-anchor="end">'+ln+"</text>";
    if(ln==="CLK"){let d="";rows.forEach((r,i)=>{const x=lx(i);d+=(i?"L":"M")+x+" "+lo+"L"+x+" "+hi+"L"+(x+W/2)+" "+hi+"L"+(x+W/2)+" "+lo+"L"+(x+W)+" "+lo;});s+='<path class="tmw act" d="'+d+'"/>';}
    else if(ln==="T"||ln==="BUS"){rows.forEach((r,i)=>{const x=lx(i),v=ln==="T"?"T"+r.s:r.b;if(ln==="BUS"&&v==="·")return;
      s+='<rect class="tmbox'+(ln==="BUS"?" bus":"")+'" x="'+(x+1)+'" y="'+hi+'" width="'+(W-2)+'" height="'+(lo-hi)+'" rx="2"/><text class="tmv" x="'+(x+W/2)+'" y="'+(lo-2.5)+'" text-anchor="middle">'+v+"</text>";});}
    else{let d="",prev=null;rows.forEach((r,i)=>{const x=lx(i),on=!!(r.cw&S[ln]),yy=on?hi:lo;
      if(on)s+='<rect class="tmfill" x="'+x+'" y="'+hi+'" width="'+W+'" height="'+(lo-hi)+'"/>';
      d+=(prev===null?"M"+x+" "+yy:(prev!==yy?"L"+x+" "+yy:""))+"L"+(x+W)+" "+yy;prev=yy;});
      s+='<path class="tmw'+(used.has(ln)?" act":"")+'" d="'+d+'"/>';}
  });
  box.innerHTML='<div class="tmlab">'+lab+'</svg></div><div class="tmscroll" id="tmScroll">'+s+"</svg></div>";
  const sc=$("tmScroll");sc.scrollLeft=sc.scrollWidth;
}
function renderFaultTab(){
  const opts='<option value="">'+t("fPick")+"</option>"+Object.keys(FAULTS).map(k=>'<option value="'+k+'">'+FAULTS[k][LI]+"</option>").join("");
  $("faultBody").innerHTML='<p class="sub">'+t("fIntro")+'</p><div class="rowf"><button class="btn primary" id="bFault">'+t("fStart")+'</button></div>'+
    '<div class="callout" id="fStatus" style="margin:10px 0">'+(fault?t("fOn",faultTries):t("fNone"))+"</div>"+
    (fault?'<p class="sub">'+t("fTip")+'</p><div class="rowf"><label for="fGuess" class="sub" style="margin:0">'+t("fGuess")+'</label><select id="fGuess" style="flex:1;min-width:200px">'+opts+'</select></div><div class="rowf"><button class="btn primary" id="bFCheck">'+t("fCheck")+'</button><button class="btn" id="bFReveal">'+t("fReveal")+"</button></div>":"")+
    '<div class="result" id="fResult" role="status"></div>';
}
function setFault(f){fault=f;st.fault=f;hist=hist.map(h=>{const o=JSON.parse(h);o.fault=f;return JSON.stringify(o);});}
function doTick(kind){
  if(st.halted||prog)return false;
  const v=view(st),before={step:st.step,ir:st.ir};
  hist.push(JSON.stringify(st));if(hist.length>2000)hist.shift();
  const was=st.ticks;tick(st);
  if(st.ticks!==was){trace.push({n:st.ticks,s:before.step,i:before.step<2?"":(OPS[before.ir>>4]||"?"),c:cwNames(v.cw),cw:v.cw,b:v.src?v.bus:"·"});if(trace.length>600)trace.shift();}
  flash={clk:1};flash[kind]=1;clearTimeout(doTick.t);doTick.t=setTimeout(()=>{flash={};render();},timer?Math.min(140,500/ +$("speed").value):140);
  return true;
}
function stop(){if(timer){clearInterval(timer);timer=null;}}
function start(){stop();note="";timer=setInterval(()=>{doTick("ast");if(st.halted)stop();else if(st.step===0&&bps.has(st.pc)){stop();note=t("nBp",st.pc);}render();},1000/ +$("speed").value);}
function resetCpu(){stop();st=fresh(st.ram);hist=[];trace=[];note="";render();}
const fmtErr=e=>t("mLine",e.line)+t(e.code,...e.args);
function msg(cls,text){const m=$("asmMsg");m.className=cls;m.textContent=text;}
function load(src,quiet){
  const r=assemble(src);
  if(r.error){msg("err",fmtErr(r.error));return false;}
  stop();st=fresh(r.ram);hist=[];trace=[];note="";prog=false;
  msg("ok",quiet?"":t("mLoaded",r.count));render();return true;
}
function saved(){try{return JSON.parse(localStorage.getItem("cpuTrainer.programs")||"{}");}catch(e){return{};}}
function fillExamples(sel){
  const sv=saved(),names=Object.keys(sv).sort(),cur=sel||$("example").value;
  $("example").innerHTML='<optgroup label="'+esc(t("exGroup"))+'">'+EXAMPLES.map(e=>'<option value="ex:'+e.id+'">'+esc(EXN[e.id][LI])+"</option>").join("")+"</optgroup>"+
    (names.length?'<optgroup label="'+esc(t("myGroup"))+'">'+names.map(n=>'<option value="my:'+esc(n)+'">'+esc(n)+"</option>").join("")+"</optgroup>":"");
  if(cur)$("example").value=cur;if(!$("example").value)$("example").value="ex:count3";
  $("bDel").hidden=!$("example").value.startsWith("my:");
}
function openProgram(val,quiet){
  let src;if(val.startsWith("my:")){src=saved()[val.slice(3)];$("saveName").value=val.slice(3);}else{const e=EXAMPLES.find(x=>"ex:"+x.id===val)||EXAMPLES[0];src=e.src;val="ex:"+e.id;$("saveName").value="";}
  if(src==null)return;$("example").value=val;$("bDel").hidden=!val.startsWith("my:");$("src").value=src;load(src,quiet);
}
function showTab(k){document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===k));document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.id==="tab-"+k));}

$("bStep").onclick=()=>{stop();note="";doTick("man");render();};
$("bIns").onclick=()=>{stop();note="";do{if(!doTick("man"))break;}while(st.step!==0&&!st.halted);render();};
$("bRun").onclick=()=>{if(timer)stop();else start();render();};
$("bBack").onclick=()=>{stop();note="";if(hist.length){st=JSON.parse(hist.pop());st.fault=fault;trace.pop();}render();};
$("bReset").onclick=resetCpu;
$("speed").oninput=()=>{$("speedV").textContent=$("speed").value+" Hz";if(timer)start();render();};
$("bLoad").onclick=()=>load($("src").value);
$("example").onchange=e=>openProgram(e.target.value,true);
$("bSave").onclick=()=>{const n=$("saveName").value.trim();if(!n){msg("err",t("mNeedName"));return;}
  try{const sv=saved();sv[n]=$("src").value;localStorage.setItem("cpuTrainer.programs",JSON.stringify(sv));fillExamples("my:"+n);msg("ok",t("mSaved",n));}
  catch(e){msg("err",t("mNoSave"));}};
$("bDel").onclick=()=>{const v=$("example").value;if(!v.startsWith("my:"))return;try{const sv=saved();delete sv[v.slice(3)];localStorage.setItem("cpuTrainer.programs",JSON.stringify(sv));}catch(e){}fillExamples("ex:count3");msg("ok",t("mDeleted"));};
$("bCopy").onclick=async()=>{const r=assemble($("src").value);if(r.error){msg("err",fmtErr(r.error));return;}
  const txt="addr  data        \n"+r.ram.map((b,i)=>bin(i,4)+"  "+bin8(b)+"   "+disasm(b)).join("\n");
  try{await navigator.clipboard.writeText(txt);msg("ok",t("mCopied"));}catch(e){msg("err",t("mNoCopy"));}};
$("ramBody").onclick=e=>{const b=e.target.closest(".bit");if(b){st.ram[+b.dataset.a]^=1<<+b.dataset.k;render();return;}
  const p=e.target.closest(".bp");if(p){const a=+p.dataset.bp;bps.has(a)?bps.delete(a):bps.add(a);render();}};
$("tabs").onclick=e=>{const b=e.target.closest("button");if(b){showTab(b.dataset.tab);render();}};
$("faultBody").addEventListener("click",e=>{
  const id=e.target.id;
  if(id==="bFault"){const ks=Object.keys(FAULTS).filter(k=>k!==fault);setFault(ks[Math.floor(Math.random()*ks.length)]);faultTries=0;renderFaultTab();render();}
  else if(id==="bFCheck"){const g=$("fGuess").value,out=$("fResult");if(!g)return;faultTries++;
    if(g===fault){setFault(null);renderFaultTab();const o=$("fResult");o.className="result ok";o.textContent=t("fRight",faultTries);render();}
    else{$("fStatus").textContent=t("fOn",faultTries);out.className="result err";out.textContent=t("fWrong");}}
  else if(id==="bFReveal"){const was=FAULTS[fault][LI];setFault(null);renderFaultTab();const o=$("fResult");o.className="result";o.textContent=t("fWas",was);render();}
});
$("labels").onchange=e=>$("stage").classList.toggle("nolabels",!e.target.checked);
$("bWhole").onclick=()=>zoomTo(null);
$("pcb").addEventListener("click",e=>{
  const a=e.target.closest("[data-act]");
  if(a){const act=a.dataset.act;note="";
    if(act==="pulse"){if(prog)note=t("nClkProg");else{stop();doTick("man");}}
    else if(act==="reset")resetCpu();
    else if(act==="mode"){if(timer)stop();else if(!st.halted&&!prog)start();}
    else if(act==="pot"){const i=SPEEDS.findIndex(x=>x>+$("speed").value);$("speed").value=SPEEDS[i<0?0:i];$("speedV").textContent=$("speed").value+" Hz";if(timer)start();}
    else if(act==="prog"){stop();prog=!prog;if(!prog)note=t("nBackRun");}
    else if(act==="da")dipA^=1<<+a.dataset.bit;
    else if(act==="dd")dipD^=1<<+a.dataset.bit;
    else if(act==="write"){if(prog){st.ram[dipA]=dipD;note=t("nStored",dipD,bin8(dipD),dipA);}else note=t("nWriteRun");}
    render();return;}
  const c=e.target.closest("[data-card]");if(c)zoomTo(c.dataset.card);
});
const tip=$("tip");
document.addEventListener("mousemove",e=>{const el=e.target.closest&&e.target.closest("[data-tip]");if(!el){tip.style.display="none";return;}
  tip.innerHTML=el.dataset.tip;tip.style.display="block";const w=tip.offsetWidth,h=tip.offsetHeight;
  tip.style.left=Math.max(8,Math.min(window.innerWidth-w-8,e.clientX+14))+"px";tip.style.top=(e.clientY+18+h>window.innerHeight?e.clientY-h-10:e.clientY+18)+"px";});
document.addEventListener("keydown",e=>{
  if(e.target.closest("textarea,input,select")||e.ctrlKey||e.metaKey||e.altKey)return;
  if(!$("view-simulator").classList.contains("active"))return;
  if(e.key===" "){e.preventDefault();$("bStep").disabled||$("bStep").click();}
  else if(e.key==="Enter"&&!e.target.closest("button,a")){e.preventDefault();$("bIns").disabled||$("bIns").click();}
  else if(e.key==="r"||e.key==="R"){$("bRun").disabled||$("bRun").click();}
  else if(e.key==="Backspace"){e.preventDefault();$("bBack").disabled||$("bBack").click();}
  else if(e.key==="Escape")zoomTo(null);
});
const BOARDCOLS={green:"#1f7a4a",white:"#eeede6",black:"#1c1e22",blue:"#1c4c9a",red:"#a3262b"};
$("swatches").innerHTML=Object.keys(BOARDCOLS).map(k=>'<button style="background:'+BOARDCOLS[k]+'" data-col="'+k+'" aria-label="'+k+' boards" aria-pressed="'+(k==="green")+'"></button>').join("");
function setBoard(c){document.body.dataset.board=c;document.querySelectorAll("#swatches button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.col===c));try{localStorage.setItem("cpuTrainer.board",c);}catch(e){}}
$("swatches").onclick=e=>{const b=e.target.closest("button");if(b)setBoard(b.dataset.col);};

/* ---------- kit page and ordering ---------- */
const order={qa:0,qs:0,name:"",org:"",phone:"",email:"",city:"",pay:"0",note:"",text:""};
const BOARDLIST=[["bus",1],["clk",1],["pc",1],["mar",1],["ram",1],["reg",3],["alu",1],["out",1],["ctl",1]];
const partsOf=b=>BOM[b].reduce((n,r)=>n+r[0],0);
const TOTALPARTS=BOARDLIST.reduce((n,[b,q])=>n+partsOf(b)*q,0);
const money=n=>n.toLocaleString("en-US").replace(/,/g," ")+" "+SHOP.currency;
function priceHtml(k){const p=SHOP.prices[k];return p==null?'<div class="price req">'+t("kOnReq")+"</div>":'<div class="price ltr">'+money(p)+"</div>";}
function stepper(k){return'<div class="stepper"><span>'+t("kQty")+'</span><button type="button" data-q="'+k+'" data-d="-1" aria-label="-">−</button><output id="q-'+k+'">'+order[k]+'</output><button type="button" data-q="'+k+'" data-d="1" aria-label="+">+</button></div>';}
function renderKit(){
  const boards=BOARDLIST.map(([b,q])=>"<li>"+(q>1?q+" × ":"")+MODT[b][LI][0]+'<span>'+PCB[b].w.toFixed(0)+" × "+PCB[b].h.toFixed(0)+" mm · "+t("kBParts",partsOf(b))+"</span></li>").join("");
  const gal=[["img/p040.jpg","reg"],["img/p041.jpg","alu"],["img/p042.jpg","mar"],["img/p043.jpg","ctl"],["img/p027.jpg","pc"]].map(([src,b])=>'<figure><img src="'+src+'" alt="'+esc(MODT[b][LI][0])+'" loading="lazy"><figcaption>'+MODT[b][LI][0]+"</figcaption></figure>").join("");
  const bom=BOARDLIST.map(([b,q])=>'<details class="bom"><summary>'+(q>1?q+" × ":"")+MODT[b][LI][0]+"<span>"+t("kBParts",partsOf(b))+'</span></summary><div class="tablewrap"><table><thead><tr><th>'+t("kBQty")+"</th><th>"+t("kBVal")+"</th><th>"+t("kBRef")+"</th></tr></thead><tbody>"+
    BOM[b].map(r=>"<tr><td class='m'>"+r[0]+"</td><td class='m'>"+esc(r[1])+"</td><td class='m' style='white-space:normal'>"+esc(r[2])+"</td></tr>").join("")+"</tbody></table></div></details>").join("");
  const f=(id,key,type,req)=>'<label for="f-'+id+'">'+t(key)+(req?" *":"")+'<input id="f-'+id+'" data-f="'+id+'" type="'+type+'" value="'+esc(order[id])+'"'+(id==="phone"||id==="email"?' dir="ltr"':"")+"></label>";
  $("kitBody").innerHTML=
   '<div class="hero"><div><h2>'+t("kTitle")+'</h2><p class="lead">'+t("kLead")+'</p><div class="facts"><div><b>11</b>'+t("kF1")+"</div><div><b>"+TOTALPARTS+"</b>"+t("kF2")+"</div><div><b>82</b>"+t("kF3")+"</div><div><b>16</b>"+t("kF4")+'</div></div><div class="ctas"><a class="btn primary big" href="#kit" data-go="order">'+t("kOrderCta")+'</a><a class="btn big" href="#simulator">'+t("kTry")+'</a></div></div><img src="img/p044.jpg" alt="'+esc(t("kPhotos"))+'"></div>'+
   '<h2 class="sec">'+t("kChoose")+'</h2><div class="products">'+
     '<div class="product'+(order.qa?" sel":"")+'"><h3>'+t("kP1")+"</h3><p>"+t("kP1d")+"</p>"+priceHtml("assembled")+stepper("qa")+"</div>"+
     '<div class="product'+(order.qs?" sel":"")+'"><h3>'+t("kP2")+"</h3><p>"+t("kP2d")+"</p>"+priceHtml("solder")+stepper("qs")+"</div>"+
     '<div class="product"><h3>'+t("kP3")+"</h3><p>"+t("kP3d")+'</p><button type="button" class="btn" data-pack="1" style="margin-top:auto;align-self:flex-start">'+t("kPackSet")+"</button></div></div>"+
   '<h2 class="sec">'+t("kBox")+'</h2><div class="boxgrid"><div><ul class="boxlist">'+boards+'</ul></div><div class="prose"><p>'+t("kBoxAlso")+"</p><p>"+t("kNeed")+"</p></div></div>"+
   '<h2 class="sec">'+t("kPhotos")+'</h2><div class="gallery">'+gal+"</div>"+
   '<h2 class="sec">'+t("kBom")+'</h2><p class="sub" style="margin-top:6px">'+t("kBomL")+"</p>"+bom+
   '<h2 class="sec" id="orderTop">'+t("kOrder")+'</h2><p class="lead" style="margin-top:6px;max-width:70ch">'+t("kOrderL")+'</p>'+
   '<div class="orderbox"><form class="form" id="orderForm" novalidate>'+
     '<div class="rowf" style="margin:0;gap:22px"><div><b>'+t("kP1")+"</b>"+stepper("qa")+"</div><div><b>"+t("kP2")+"</b>"+stepper("qs")+"</div></div>"+
     f("name","fName","text",1)+f("org","fOrg","text")+f("phone","fPhone","tel",1)+f("email","fEmail","email")+f("city","fCity","text",1)+
     '<label for="f-pay">'+t("fPay")+'<select id="f-pay" data-f="pay">'+[1,2,3].map(i=>'<option value="'+(i-1)+'"'+(order.pay==i-1?" selected":"")+">"+t("fPay"+i)+"</option>").join("")+"</select></label>"+
     '<label for="f-note">'+t("fNote")+'<textarea id="f-note" data-f="note">'+esc(order.note)+"</textarea></label>"+
     '<button class="btn primary big" type="submit">'+t("fMake")+'</button><div class="result err" id="orderErr" role="alert"></div></form>'+
     '<div class="ordersum" id="orderSum">'+orderSumHtml()+"</div></div>"+
   '<p class="creditline">'+t("credit")+"</p>";
}
function contactHtml(){return'<p class="contact">'+t("oOr")+'<br>WhatsApp <b class="ltr">'+SHOP.phone+'</b><br><b class="ltr">'+SHOP.email+"</b></p>";}
function orderSumHtml(){
  if(!order.text)return"<h3>"+t("kOrder")+"</h3>"+contactHtml();
  const wa="https://wa.me/"+SHOP.whatsapp+"?text="+encodeURIComponent(order.text);
  const ml="mailto:"+SHOP.email+"?subject="+encodeURIComponent(t("oHead"))+"&body="+encodeURIComponent(order.text);
  return"<h3>"+t("oReady")+'</h3><pre id="orderText">'+esc(order.text)+'</pre><p class="sub" style="margin:0">'+t("oSendHow")+'</p><div class="ctas"><a class="btn primary" href="'+wa+'" target="_blank" rel="noopener">'+t("oWa")+'</a><a class="btn" href="'+ml+'">'+t("oMail")+'</a><button class="btn" type="button" id="bOrderCopy">'+t("oCopy")+'</button></div><div class="result" id="orderCopyMsg" role="status"></div>'+contactHtml();
}
function buildOrderText(){
  const L=[t("oHead"),""];
  if(order.qa)L.push(order.qa+" × "+t("kP1")+(SHOP.prices.assembled!=null?"  ("+money(SHOP.prices.assembled*order.qa)+")":""));
  if(order.qs)L.push(order.qs+" × "+t("kP2")+(SHOP.prices.solder!=null?"  ("+money(SHOP.prices.solder*order.qs)+")":""));
  const priced=(!order.qa||SHOP.prices.assembled!=null)&&(!order.qs||SHOP.prices.solder!=null);
  L.push(priced?t("oTotal")+": "+money((SHOP.prices.assembled||0)*order.qa+(SHOP.prices.solder||0)*order.qs):t("oToQuote"));
  L.push("",t("fName")+": "+order.name);
  if(order.org)L.push(t("fOrg").replace(/\s*\(.*\)/,"")+": "+order.org);
  L.push(t("fPhone")+": "+order.phone);
  if(order.email)L.push(t("fEmail").replace(/\s*\(.*\)/,"")+": "+order.email);
  L.push(t("fCity")+": "+order.city,t("fPay")+": "+t("fPay"+(+order.pay+1)));
  if(order.note)L.push(t("fNote").replace(/\s*\(.*\)/,"")+": "+order.note);
  return L.join("\n");
}
$("kitBody").addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.f;if(k)order[k]=e.target.value;});
$("kitBody").addEventListener("click",e=>{
  const q=e.target.closest("[data-q]");
  if(q){const k=q.dataset.q;order[k]=Math.max(0,Math.min(200,order[k]+ +q.dataset.d));order.text="";renderKit();return;}
  if(e.target.closest("[data-pack]")){order.qa=1;order.qs=10;order.text="";renderKit();$("orderTop").scrollIntoView({behavior:"smooth"});return;}
  if(e.target.closest("[data-go]")){e.preventDefault();$("orderTop").scrollIntoView({behavior:"smooth"});return;}
  if(e.target.id==="bOrderCopy"){const m=$("orderCopyMsg");navigator.clipboard.writeText(order.text).then(()=>{m.className="result ok";m.textContent=t("oCopied");},()=>{m.className="result err";m.textContent=t("oNoCopy");});}
});
$("kitBody").addEventListener("submit",e=>{e.preventDefault();const er=$("orderErr");
  if(!order.qa&&!order.qs){er.textContent=t("fErrQty");return;}
  if(!order.name.trim()||!order.phone.trim()||!order.city.trim()){er.textContent=t("fErrReq");return;}
  er.textContent="";order.text=buildOrderText();$("orderSum").innerHTML=orderSumHtml();$("orderSum").scrollIntoView({behavior:"smooth",block:"nearest"});});

/* ---------- static views, rebuilt on language change ---------- */
function renderStatic(){
  document.querySelectorAll("[data-t]").forEach(el=>{el.innerHTML=t(el.dataset.t);});
  $("saveName").placeholder=t("saveName");
  $("guideBody").innerHTML=GUIDE[LI];const G=GUIDE2[LI];
  $("guideSide").innerHTML='<h3 style="margin-top:0">'+G.isa+"</h3><p>"+G.isaP+'</p><div class="tablewrap"><table><thead><tr><th>'+G.thO+"</th><th>"+G.thN+"</th><th>"+G.thW+"</th></tr></thead><tbody>"+
    ISA.map(r=>"<tr><td><code>"+r[0]+"</code></td><td><code>"+r[1]+"</code></td><td>"+ISAT[r[1]][LI]+"</td></tr>").join("")+'</tbody></table></div><div class="callout">'+G.note+"</div><h3>"+G.ctl+'</h3><div class="tablewrap"><table><thead><tr><th>'+G.thL+"</th><th>"+G.thE+"</th></tr></thead><tbody>"+
    SIGS.map(k=>"<tr><td><code>"+k+"</code> "+sigName(k)+"</td><td>"+sigDesc(k)+".</td></tr>").join("")+"</tbody></table></div><h3>"+G.fl+"</h3><p>"+G.flP+"</p>";
  $("modCards").innerHTML=MODORDER.map(b=>{const B=PCB[b],m=MODT[b][LI];
    const svg=b==="bus"?'<svg viewBox="-2 -2 '+(B.h+4)+" "+(B.w+4)+'"><g transform="translate(0 '+B.w+') rotate(-90)">'+drawBoard(b,b,false)+"</g></svg>":'<svg viewBox="-2 -2 '+(B.w+4)+" "+(B.h+4)+'">'+drawBoard(b,b==="reg"?"a":b,false)+"</svg>";
    return'<article class="card"><div dir="ltr">'+svg+"</div><h3>"+m[0]+'</h3><div class="slot" dir="auto">'+m[1]+" · "+B.w.toFixed(0)+" × "+B.h.toFixed(0)+" mm</div><p>"+m[2]+"</p><dl><dt>"+t("dtChips")+"</dt><dd>"+m[3]+"</dd><dt>"+t("dtLeds")+"</dt><dd>"+m[4]+"</dd><dt>"+t("dtWatch")+"</dt><dd>"+m[5]+"</dd></dl>"+(PHOTOS[b]?'<img src="'+PHOTOS[b]+'" alt="'+esc(t("photo"))+'" loading="lazy">':"")+"</article>";}).join("");
  $("labCards").innerHTML=LABT.map((l,i)=>{const L=l[LI],e=EXAMPLES.find(x=>x.id===LABEX[i]);
    return'<article class="card"><div class="num">'+t("lab")+" "+(i+1)+"</div><h3>"+L[0]+"</h3><p>"+L[1]+"</p><pre>"+esc(e.src)+"</pre><ul>"+L[2].map(s=>"<li>"+s+"</li>").join("")+'</ul><button class="btn primary" data-lab="'+e.id+'">'+t("openSim")+"</button></article>";}).join("");
  $("chCards").innerHTML=CHT.map((c,i)=>'<article class="card"><div class="num">'+t("challenge")+" "+(i+1)+"</div><h3>"+c[LI][0]+"</h3><p>"+c[LI][1]+'</p><div class="result" id="chR'+i+'" role="status"></div><button class="btn" data-ch="'+i+'">'+t("chCheck")+"</button></article>").join("");
  $("crBody").innerHTML=COURSE.map(r=>"<tr><td>"+r[0][LI]+"</td><td>"+r[1][LI]+"</td><td>"+r[2][LI]+"</td><td class='m'>"+r[3]+"</td></tr>").join("");
  $("plBody").innerHTML=PLAN.map((r,i)=>"<tr><td class='m'>"+(i+1)+"</td><td>"+r[LI][0]+"</td><td>"+r[LI][1]+"</td></tr>").join("");
  $("aboutBody").innerHTML=ABOUT[LI]+contactHtml();
  renderFaultTab();
  renderKit();
  renderBrand();renderHome();if(soonId)renderSoon(soonId);
}
$("labCards").onclick=e=>{const b=e.target.closest("[data-lab]");if(!b)return;openProgram("ex:"+b.dataset.lab,true);showTab("state");location.hash="#simulator";route();window.scrollTo(0,0);};
$("chCards").onclick=e=>{const b=e.target.closest("[data-ch]");if(!b)return;const i=+b.dataset.ch,out=$("chR"+i),r=assemble($("src").value);
  if(r.error){out.className="result err";out.textContent=t("chNoAsm")+fmtErr(r.error);return;}
  const res=CHECKS[i](r.ram);out.className="result "+(res?"err":"ok");out.textContent=res?t("chFail",res[0],res[1]):t("chPass");};

function setLang(i,save){
  LI=i;const code=["en","fr","ar"][i];document.documentElement.lang=code;document.documentElement.dir=i===2?"rtl":"ltr";$("lang").value=String(i);
  if(save)try{localStorage.setItem("cpuTrainer.lang",code);}catch(e){}
  renderStatic();buildPcb();fillExamples();note="";render();
}
$("lang").onchange=e=>setLang(+e.target.value,true);

const CPUVIEWS=["simulator","guide","modules","labs","course","about","kit"];
const VIEWS=["home","soon",...CPUVIEWS];
let soonId=null;
function route(){
  let h=location.hash.replace("#","");
  soonId=KITS.some(k=>k.id===h&&k.status==="soon")?h:null;
  let v=soonId?"soon":(CPUVIEWS.includes(h)?h:"home");
  if(v!=="simulator")stop();
  if(soonId)renderSoon(soonId);
  VIEWS.forEach(x=>$("view-"+x).classList.toggle("active",x===v));
  const cpu=CPUVIEWS.includes(v);$("kitbar").hidden=!cpu;
  document.title=cpu?"8-Bit CPU Trainer · "+BRAND:soonId?KITS.find(k=>k.id===soonId).name()+" · "+BRAND:BRAND;
  document.querySelectorAll("#nav a").forEach(a=>{if(a.getAttribute("href")==="#"+v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  render();
}
window.addEventListener("hashchange",()=>{route();window.scrollTo(0,0);});
function boot(data){
  let li=0;try{const c=localStorage.getItem("cpuTrainer.lang")||(navigator.language||"en").slice(0,2);li=Math.max(0,["en","fr","ar"].indexOf(c));}catch(e){}
  try{const c=localStorage.getItem("cpuTrainer.board");if(c&&BOARDCOLS[c])setBoard(c);}catch(e){}
  setLang(li,false);
  if(data&&data.st&&Array.isArray(data.st.ram)&&data.st.ram.length===16){
    st=data.st;$("src").value=data.src||EXAMPLES[0].src;if(data.ex)$("example").value=data.ex;dipA=data.dipA|0;dipD=data.dipD|0;prog=!!data.prog;if(data.order)Object.assign(order,data.order);fault=data.fault||null;faultTries=data.faultTries|0;st.fault=fault;renderKit();renderFaultTab();
  }else openProgram("ex:count3",true);
  route();
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot)hot.snapshot(()=>({st,src:$("src").value,ex:$("example").value,dipA,dipD,prog,order,fault,faultTries}));
if(hot&&hot.ready)hot.ready(boot);else boot((hot&&hot.data)||{});
