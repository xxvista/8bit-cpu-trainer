/* ---------- Arduino kit: Scratch-style blocks. Editor, Arduino code from the blocks, and the runner used by the simulator ---------- */
const abt=k=>ASB[k]?ASB[k][LI]:k;
/* block types: category, inputs (n number, b condition, oo on/off, ro relay on/off, ln line 1/2, tx text, vr variable), c = has inner blocks (2 = with else) */
const BDEF={
 wait:{cat:"ctl",in:{a:"n"}},repeat:{cat:"ctl",in:{a:"n"},c:1},if:{cat:"ctl",in:{a:"b"},c:1},ifelse:{cat:"ctl",in:{a:"b"},c:2},
 led:{cat:"out",in:{a:"oo"}},ledpwm:{cat:"out",in:{a:"n"}},tone:{cat:"out",in:{a:"n",b:"n"}},notone:{cat:"out",in:{}},relay:{cat:"out",in:{a:"ro"}},servo:{cat:"out",in:{a:"n"}},
 clear:{cat:"lcd",in:{}},print:{cat:"lcd",in:{a:"ln",b:"tx"}},printv:{cat:"lcd",in:{a:"ln",b:"tx",c:"n"}},serial:{cat:"lcd",in:{a:"n"}},
 set:{cat:"var",in:{a:"vr",b:"n"}},change:{cat:"var",in:{a:"vr",b:"n"}}
};
const BCATS=[["ctl","#ffab19"],["out","#4c97ff"],["lcd","#9966ff"],["in","#2ea9cf"],["op","#40b65a"],["var","#ff8c1a"]];
const SENS=["pot","temp","hum","dist","lux","snd","tilt","btn","pir","ir","ms"];
/* expression helpers */
const eN=v=>({k:"n",v}),eS=s=>({k:"s",s}),eV=n=>({k:"v",n}),eA=(o,a,b)=>({k:"ar",o,a,b}),eC=(o,a,b)=>({k:"cmp",o,a,b}),eM=(a,b,c,d,e)=>({k:"map",a,b:eN(b),c:eN(c),d:eN(d),e:eN(e)});
const bk=(t,a,c,e)=>{const o={t,a:a||{}};if(BDEF[t].c)o.c=c||[];if(BDEF[t].c===2)o.e=e||[];return o;};
function blkDefault(t){
  const d={wait:{a:eN(500)},repeat:{a:eN(3)},if:{a:eS("btn")},ifelse:{a:eS("btn")},led:{a:"on"},ledpwm:{a:eN(50)},tone:{a:eN(1000),b:eN(200)},relay:{a:"on"},servo:{a:eN(90)},
    print:{a:"1",b:"Hello"},printv:{a:"1",b:"Pot: ",c:eS("pot")},serial:{a:eS("pot")},set:{a:(AB.prog.vars[0]||""),b:eN(0)},change:{a:(AB.prog.vars[0]||""),b:eN(1)}}[t]||{};
  return bk(t,JSON.parse(JSON.stringify(d)));
}
/* the 10 examples, as block programs */
const ABX={
 blink:()=>({vars:[],setup:[],loop:[bk("led",{a:"on"}),bk("wait",{a:eN(500)}),bk("led",{a:"off"}),bk("wait",{a:eN(500)})]}),
 button:()=>({vars:[],setup:[],loop:[bk("ifelse",{a:eS("btn")},[bk("led",{a:"on"}),bk("print",{a:"1",b:"Button: pressed"})],[bk("led",{a:"off"}),bk("print",{a:"1",b:"Button: released"})]),bk("wait",{a:eN(50)})]}),
 servo:()=>({vars:["angle"],setup:[],loop:[bk("set",{a:"angle",b:eM(eS("pot"),0,1023,0,180)}),bk("servo",{a:eV("angle")}),bk("printv",{a:"1",b:"Pot: ",c:eS("pot")}),bk("printv",{a:"2",b:"Angle: ",c:eV("angle")}),bk("wait",{a:eN(20)})]}),
 distance:()=>({vars:["cm"],setup:[],loop:[bk("set",{a:"cm",b:eS("dist")}),bk("printv",{a:"1",b:"Distance cm: ",c:eV("cm")}),bk("serial",{a:eV("cm")}),
   bk("if",{a:eC("<",eV("cm"),eN(50))},[bk("tone",{a:eN(2000),b:eN(50)}),bk("wait",{a:eA("*",eV("cm"),eN(10))})]),bk("wait",{a:eN(100)})]}),
 weather:()=>({vars:[],setup:[bk("clear")],loop:[bk("printv",{a:"1",b:"Temp C: ",c:eS("temp")}),bk("printv",{a:"2",b:"Hum %: ",c:eS("hum")}),
   bk("ifelse",{a:eC(">",eS("temp"),eN(30))},[bk("relay",{a:"on"})],[bk("relay",{a:"off"})]),bk("serial",{a:eS("temp")}),bk("wait",{a:eN(1000)})]}),
 night:()=>({vars:["level"],setup:[],loop:[bk("set",{a:"level",b:eA("/",eA("-",eN(500),eS("lux")),eN(5))}),bk("if",{a:eC("<",eV("level"),eN(0))},[bk("set",{a:"level",b:eN(0)})]),
   bk("ledpwm",{a:eV("level")}),bk("printv",{a:"1",b:"Light lx: ",c:eS("lux")}),bk("printv",{a:"2",b:"LED %: ",c:eV("level")}),bk("wait",{a:eN(200)})]}),
 alarm:()=>({vars:[],setup:[],loop:[bk("ifelse",{a:eS("pir")},[bk("relay",{a:"on"}),bk("print",{a:"1",b:"Motion detected!"}),bk("tone",{a:eN(1500),b:eN(200)}),bk("wait",{a:eN(400)})],
   [bk("relay",{a:"off"}),bk("print",{a:"1",b:"All quiet"}),bk("wait",{a:eN(100)})])]}),
 tilt:()=>({vars:[],setup:[],loop:[bk("printv",{a:"1",b:"Tilt deg: ",c:eS("tilt")}),
   bk("ifelse",{a:{k:"and",a:eC("<",eS("tilt"),eN(2)),b:eC(">",eS("tilt"),eN(-2))}},[bk("led",{a:"on"}),bk("print",{a:"2",b:"Level!"})],[bk("led",{a:"off"}),bk("print",{a:"2",b:"Not level"})]),bk("wait",{a:eN(100)})]}),
 clap:()=>({vars:["sound","on"],setup:[],loop:[bk("set",{a:"sound",b:eS("snd")}),
   bk("if",{a:eC(">",eV("sound"),eN(600))},[bk("ifelse",{a:eC("=",eV("on"),eN(1))},[bk("set",{a:"on",b:eN(0)}),bk("relay",{a:"off"})],[bk("set",{a:"on",b:eN(1)}),bk("relay",{a:"on"})]),bk("wait",{a:eN(300)})]),
   bk("printv",{a:"1",b:"Sound: ",c:eV("sound")}),bk("wait",{a:eN(20)})]}),
 remote:()=>({vars:["key"],setup:[bk("print",{a:"1",b:"Press a key"})],loop:[bk("set",{a:"key",b:eS("ir")}),
   bk("if",{a:eC(">",eV("key"),eN(-1))},[bk("printv",{a:"1",b:"Key: ",c:eV("key")}),bk("if",{a:eC("=",eV("key"),eN(1))},[bk("relay",{a:"on"})]),bk("if",{a:eC("=",eV("key"),eN(0))},[bk("relay",{a:"off"})])]),bk("wait",{a:eN(50)})]}),
 empty:()=>({vars:[],setup:[],loop:[]})
};
const AB={ex:"servo",prog:null,mine:null,cur:null,drag:null};
function abLoad(){
  try{const s=JSON.parse(localStorage.getItem("ardBlocks.v1")||"null");if(s&&s.prog&&Array.isArray(s.prog.loop)){AB.mine=s.mine||null;AB.ex=s.ex||"servo";AB.prog=s.prog;}}catch(e){}
  if(!AB.prog)AB.prog=ABX[AB.ex]?ABX[AB.ex]():ABX.servo();
  AB.cur={list:AB.prog.loop,i:AB.prog.loop.length};
}
function abSave(){try{localStorage.setItem("ardBlocks.v1",JSON.stringify({ex:AB.ex,prog:AB.prog,mine:AB.mine}));}catch(e){}}
function abEdited(){if(AB.ex!=="mine"){AB.ex="mine";const s=$("axSel");if(s){if(!s.querySelector('option[value="mine"]'))s.insertAdjacentHTML("afterbegin",'<option value="mine">'+esc(ast("mine"))+"</option>");s.value="mine";}}AB.mine=AB.prog;abSave();abCode();}
function abPick(ex){
  if(ex==="mine"){if(AB.mine)AB.prog=AB.mine;}else{AB.prog=ABX[ex]();}
  AB.ex=ex;AB.cur={list:AB.prog.loop,i:AB.prog.loop.length};abSave();abRender();
}
/* ---- expression editor: a chip with a menu of kinds; numbers are typed in ---- */
function abExprKinds(){
  const o=[["n",abt("k_num")]];SENS.forEach(s=>o.push(["s:"+s,abt("s_"+s)]));AB.prog.vars.forEach(v=>o.push(["v:"+v,v]));
  o.push(["ar",abt("o_arith")],["cmp",abt("o_cmp")],["and",abt("o_and")],["or",abt("o_or")],["not",abt("o_not")],["map",abt("o_map")],["rand",abt("o_rand")]);return o;
}
function abExprKey(e){return e.k==="s"?"s:"+e.s:e.k==="v"?"v:"+e.n:e.k;}
function abNewExpr(key,old){
  if(key==="n")return eN(0);if(key.startsWith("s:"))return eS(key.slice(2));if(key.startsWith("v:"))return eV(key.slice(2));
  const keep=old&&old.k!=="ar"&&old.k!=="cmp"?old:eN(0);
  if(key==="ar")return eA("+",keep,eN(1));if(key==="cmp")return eC("<",keep,eN(100));if(key==="and"||key==="or")return{k:key,a:eC("<",eS("pot"),eN(512)),b:eS("btn")};
  if(key==="not")return{k:"not",a:eS("btn")};if(key==="map")return eM(keep.k==="n"?eS("pot"):keep,0,1023,0,180);if(key==="rand")return{k:"rand",a:eN(1),b:eN(10)};return eN(0);
}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function abExprEl(holder,key){
  const e=holder[key],w=el("span","rep rep-"+e.k);
  const sel=el("select","rsel");sel.setAttribute("aria-label",abt("v_"));
  abExprKinds().forEach(([v,l])=>{const o=el("option",null,l);o.value=v;sel.appendChild(o);});
  const k=abExprKey(e);if(![...sel.options].some(o=>o.value===k)){const o=el("option",null,e.n||k);o.value=k;sel.appendChild(o);}
  sel.value=k;sel.addEventListener("change",()=>{holder[key]=abNewExpr(sel.value,e);abEdited();abRender();});
  const num=(obj,prop)=>{const i=el("input","rnum");i.type="number";i.step="any";i.value=obj[prop].v;i.setAttribute("aria-label",abt("k_num"));
    i.addEventListener("input",()=>{const v=parseFloat(i.value);obj[prop].v=isNaN(v)?0:v;abEdited();});return i;};
  const pick=()=>{const p=el("span","rpick","▾");p.appendChild(sel);return p;};
  if(e.k==="n"){w.classList.add("lit");w.appendChild(num(holder,key));w.appendChild(pick());return w;}
  if(e.k==="s"||e.k==="v"){w.appendChild(sel);return w;}
  const opSel=(ops,prop)=>{const s=el("select","rop");ops.forEach(o=>{const x=el("option",null,o==="*"?"×":o==="/"?"÷":o==="<="?"≤":o===">="?"≥":o==="!="?"≠":o);x.value=o;s.appendChild(x);});s.value=e[prop];s.addEventListener("change",()=>{e[prop]=s.value;abEdited();});return s;};
  w.appendChild(pick());
  if(e.k==="ar"){w.append(abExprEl(e,"a"),opSel(["+","-","*","/","%"],"o"),abExprEl(e,"b"));}
  else if(e.k==="cmp"){w.append(abExprEl(e,"a"),opSel(["<",">","=","<=",">=","!="],"o"),abExprEl(e,"b"));}
  else if(e.k==="and"||e.k==="or"){w.append(abExprEl(e,"a"),el("span","rw",abt(e.k)),abExprEl(e,"b"));}
  else if(e.k==="not"){w.append(el("span","rw",abt("not")),abExprEl(e,"a"));}
  else if(e.k==="map"||e.k==="rand"){const parts=abt(e.k).split(/(\{[a-e]\})/);parts.forEach(p=>{const m=p.match(/^\{([a-e])\}$/);if(m)w.appendChild(abExprEl(e,m[1]));else if(p.trim())w.appendChild(el("span","rw",p.trim()));});}
  return w;
}
/* ---- statement blocks ---- */
function abInput(b,name,kind){
  if(kind==="n"||kind==="b")return abExprEl(b.a,name);
  if(kind==="tx"){const i=el("input","rtext");i.type="text";i.maxLength=16;i.value=b.a[name]||"";i.setAttribute("aria-label",abt("text"));i.addEventListener("input",()=>{b.a[name]=i.value.replace(/[^\x20-\x7e]/g,"");abEdited();});return i;}
  const opts=kind==="oo"?[["on",abt("on")],["off",abt("off")]]:kind==="ro"?[["on",abt("ron")],["off",abt("roff")]]:kind==="ln"?[["1","1"],["2","2"]]:AB.prog.vars.map(v=>[v,v]);
  const s=el("select","rdrop");opts.forEach(([v,l])=>{const o=el("option",null,l);o.value=v;s.appendChild(o);});s.value=b.a[name];s.addEventListener("change",()=>{b.a[name]=s.value;abEdited();});return s;
}
function abLabel(t,b,preview){
  const d=BDEF[t],frag=document.createDocumentFragment();
  abt(t).split(/(\{[a-c]\})/).forEach(p=>{const m=p.match(/^\{([a-c])\}$/);
    if(m){if(preview)frag.appendChild(el("span","rslot"));else frag.appendChild(abInput(b,m[1],d.in[m[1]]));}else if(p)frag.appendChild(el("span","bt",p));});
  return frag;
}
function abBlockEl(b,list,idx){
  const d=BDEF[b.t],w=el("div","blk cat-"+d.cat+(d.c?" cblk":""));w.draggable=true;
  const head=el("div","bkh");head.appendChild(abLabel(b.t,b,false));
  const ctl=el("span","bctl");[["↑","up",-1],["↓","down",1],["✕","del",0]].forEach(([s,k,dir])=>{const x=el("button","bbtn",s);x.type="button";x.title=ast(k);x.setAttribute("aria-label",ast(k));
    x.addEventListener("click",ev=>{ev.stopPropagation();if(!dir){list.splice(idx,1);if(AB.cur.list===list&&AB.cur.i>idx)AB.cur.i--;}else{const j=idx+dir;if(j<0||j>=list.length)return;[list[idx],list[j]]=[list[j],list[idx]];AB.cur={list,i:j+1};}abEdited();abRender();});ctl.appendChild(x);});
  head.appendChild(ctl);w.appendChild(head);
  if(d.c){w.appendChild(abListEl(b.c,true));if(d.c===2){const eh=el("div","bkh belse");eh.appendChild(el("span","bt",abt("else")));w.appendChild(eh);w.appendChild(abListEl(b.e,true));}w.appendChild(el("div","bfoot"));}
  if(AB.cur.list===list&&AB.cur.i===idx+1)w.classList.add("sel");
  head.addEventListener("click",ev=>{if(ev.target.closest("input,select,button"))return;AB.cur={list,i:idx+1};abRender();});
  w.addEventListener("dragstart",ev=>{ev.stopPropagation();AB.drag={list,idx,b};ev.dataTransfer.effectAllowed="move";try{ev.dataTransfer.setData("text/plain","b");}catch(_){}w.classList.add("dragging");});
  w.addEventListener("dragend",()=>{AB.drag=null;w.classList.remove("dragging");abDropClear();});
  return w;
}
function abListEl(list,inner){
  const c=el("div","blist"+(inner?" inner":""));c._list=list;
  list.forEach((b,i)=>{if(AB.cur.list===list&&AB.cur.i===i)c.appendChild(el("div","bcur"));c.appendChild(abBlockEl(b,list,i));});
  if(AB.cur.list===list&&AB.cur.i===list.length)c.appendChild(el("div","bcur"));
  if(inner&&!list.length){const z=el("button","bempty","+");z.type="button";z.setAttribute("aria-label",ast("blocks"));z.addEventListener("click",()=>{AB.cur={list,i:0};abRender();});c.appendChild(z);}
  c.addEventListener("dragover",ev=>{if(!AB.drag)return;ev.preventDefault();ev.stopPropagation();abDropClear();const i=abDropIndex(c,ev.clientY);c._drop=i;const kids=[...c.children].filter(x=>x.classList.contains("blk"));const m=el("div","bcur drop");if(i<kids.length)c.insertBefore(m,kids[i]);else c.appendChild(m);});
  c.addEventListener("drop",ev=>{if(!AB.drag)return;ev.preventDefault();ev.stopPropagation();const i=c._drop??list.length,D=AB.drag;abDropClear();
    if(D.b&&abContains(D.b,list))return;
    let b=D.b;if(D.list){D.list.splice(D.idx,1);}else b=blkDefault(D.t);
    let j=i;if(D.list===list&&D.idx<i)j--;list.splice(j,0,b);AB.cur={list,i:j+1};AB.drag=null;abEdited();abRender();});
  return c;
}
function abContains(b,list){if(!b.c)return false;if(b.c===list||b.e===list)return true;return b.c.some(x=>abContains(x,list))||(b.e||[]).some(x=>abContains(x,list));}
function abDropIndex(c,y){const kids=[...c.children].filter(x=>x.classList.contains("blk"));for(let i=0;i<kids.length;i++){const r=kids[i].getBoundingClientRect();if(y<r.top+r.height/2)return i;}return kids.length;}
function abDropClear(){document.querySelectorAll(".bcur.drop").forEach(e=>e.remove());}
function abInsert(t){const b=blkDefault(t);if(b.t==="set"||b.t==="change"){if(!AB.prog.vars.length)return;}AB.cur.list.splice(AB.cur.i,0,b);AB.cur.i++;abEdited();abRender();}
function abPalette(){
  const p=el("div","bpal");
  BCATS.forEach(([cat,col])=>{const sec=el("div","bcat");sec.appendChild(el("h5","bcatt cat-"+cat,abt("cat_"+cat)));
    if(cat==="in"||cat==="op"){const n=el("p","bnote");n.textContent=(cat==="in"?SENS.map(s=>abt("s_"+s)):["+ − × ÷","< > =",abt("and")+" / "+abt("or")+" / "+abt("not"),abt("o_map"),abt("o_rand")]).join(" · ");sec.appendChild(n);}
    Object.keys(BDEF).filter(t=>BDEF[t].cat===cat).forEach(t=>{const b=el("button","blk pv cat-"+cat+(BDEF[t].c?" cblk":""));b.type="button";b.draggable=true;const h=el("span","bkh");h.appendChild(abLabel(t,null,true));if(t==="ifelse")h.appendChild(el("span","bt","… "+abt("else")));b.appendChild(h);
      if((t==="set"||t==="change")&&!AB.prog.vars.length)b.disabled=true;
      b.addEventListener("click",()=>abInsert(t));b.addEventListener("dragstart",ev=>{AB.drag={t};try{ev.dataTransfer.setData("text/plain",t);}catch(_){}});b.addEventListener("dragend",()=>{AB.drag=null;abDropClear();});sec.appendChild(b);});
    if(cat==="var"){const f=el("form","bvar");const i=el("input","rtext");i.placeholder=ast("newVar");i.maxLength=12;i.setAttribute("aria-label",ast("newVar"));const go=el("button","btn small",ast("make"));go.type="submit";
      const msg=el("p","bnote berr");f.append(i,go,msg);f.addEventListener("submit",ev=>{ev.preventDefault();const n=i.value.trim();if(!/^[a-z]{1,12}$/i.test(n)){msg.textContent=ast("varBad");return;}if(!AB.prog.vars.includes(n))AB.prog.vars.push(n);abEdited();abRender();});sec.appendChild(f);
      if(AB.prog.vars.length)sec.appendChild(el("p","bnote",AB.prog.vars.join(" · ")));}
    p.appendChild(sec);});
  return p;
}
function abRender(){
  const host=$("abEditor");if(!host)return;host.innerHTML="";
  const pal=abPalette(),scr=el("div","bscript");
  [["setup",AB.prog.setup],["loop",AB.prog.loop]].forEach(([k,list])=>{const hat=el("div","bhat");const h=el("button","bhathead",abt(k));h.type="button";h.addEventListener("click",()=>{AB.cur={list,i:0};abRender();});hat.appendChild(h);hat.appendChild(abListEl(list,false));scr.appendChild(hat);});
  host.append(pal,scr);abCode();
}
/* ---- Arduino code from the blocks ---- */
function abCodeText(){
  const P=AB.prog,use=new Set();
  const walkE=e=>{if(!e||typeof e!=="object")return;use.add(e.k==="s"?e.s:e.k);["a","b","c","d","e"].forEach(k=>e[k]&&typeof e[k]==="object"&&walkE(e[k]));};
  const walk=l=>l.forEach(b=>{use.add("b_"+b.t);Object.values(b.a).forEach(walkE);if(b.c)walk(b.c);if(b.e)walk(b.e);});walk(P.setup);walk(P.loop);
  const ex=e=>{switch(e.k){case"n":return String(e.v);case"v":return e.n;
    case"s":return{pot:"analogRead(A0)",temp:"readTemperature()",hum:"readHumidity()",dist:"readDistanceCm()",lux:"light.readLightLevel()",snd:"analogRead(A1)",tilt:"readTiltDeg()",btn:"(digitalRead(7) == HIGH)",pir:"(digitalRead(A2) == HIGH)",ir:"readRemoteKey()",ms:"millis()"}[e.s];
    case"ar":return"("+ex(e.a)+" "+e.o+" "+ex(e.b)+")";case"cmp":return"("+ex(e.a)+" "+(e.o==="="?"==":e.o)+" "+ex(e.b)+")";
    case"and":return"("+ex(e.a)+" && "+ex(e.b)+")";case"or":return"("+ex(e.a)+" || "+ex(e.b)+")";case"not":return"!"+ex(e.a);
    case"map":return"map("+ex(e.a)+", "+ex(e.b)+", "+ex(e.c)+", "+ex(e.d)+", "+ex(e.e)+")";case"rand":return"random("+ex(e.a)+", "+ex(e.b)+" + 1)";}return"0";};
  const q=s=>'"'+String(s).replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"';
  const st=(b,ind)=>{const a=b.a,I="  ".repeat(ind),body=(l,i)=>l.map(x=>st(x,i)).join("");switch(b.t){
    case"wait":return I+"delay("+ex(a.a)+");\n";case"repeat":return I+"for (int i = 0; i < "+ex(a.a)+"; i++) {\n"+body(b.c,ind+1)+I+"}\n";
    case"if":return I+"if ("+ex(a.a)+") {\n"+body(b.c,ind+1)+I+"}\n";case"ifelse":return I+"if ("+ex(a.a)+") {\n"+body(b.c,ind+1)+I+"} else {\n"+body(b.e,ind+1)+I+"}\n";
    case"led":return I+"digitalWrite(LED, "+(a.a==="on"?"HIGH":"LOW")+");\n";case"ledpwm":return I+"analogWrite(LED, constrain(map("+ex(a.a)+", 0, 100, 0, 255), 0, 255));\n";
    case"tone":return I+"tone(BUZZER, "+ex(a.a)+", "+ex(a.b)+");\n";case"notone":return I+"noTone(BUZZER);\n";case"relay":return I+"digitalWrite(RELAY, "+(a.a==="on"?"HIGH":"LOW")+");\n";
    case"servo":return I+"servo.write(constrain("+ex(a.a)+", 0, 180));\n";case"clear":return I+"lcd.clear();\n";
    case"print":return I+"lcd.setCursor(0, "+(+a.a-1)+");\n"+I+"lcd.print("+q((a.b||"").padEnd(16))+");\n";
    case"printv":return I+"lcd.setCursor(0, "+(+a.a-1)+");\n"+I+"lcd.print("+q(a.b||"")+");\n"+I+"lcd.print("+ex(a.c)+");\n"+I+"lcd.print(\"      \");\n";
    case"serial":return I+"Serial.println("+ex(a.a)+");\n";case"set":return I+a.a+" = "+ex(a.b)+";\n";case"change":return I+a.a+" += "+ex(a.b)+";\n";}return"";};
  const lcd=use.has("b_print")||use.has("b_printv")||use.has("b_clear");
  let c="";
  if(lcd)c+="#include <Adafruit_LiquidCrystal.h>\n";if(use.has("b_servo"))c+="#include <Servo.h>\n";if(use.has("temp")||use.has("hum"))c+="#include <DHT20.h>\n";
  if(use.has("lux"))c+="#include <BH1750.h>\n";if(use.has("tilt"))c+="#include <Adafruit_MPU6050.h>\n";if(use.has("ir"))c+="#include <IRremote.hpp>\n";
  if(c)c+="\n";
  c+="const int LED = 10, BUZZER = 3, RELAY = 4;\n";if(lcd)c+="Adafruit_LiquidCrystal lcd(1);   // I2C 0x21\n";if(use.has("b_servo"))c+="Servo servo;\n";
  if(use.has("temp")||use.has("hum"))c+="DHT20 dht;\n";if(use.has("lux"))c+="BH1750 light(0x5C);\n";if(use.has("tilt"))c+="Adafruit_MPU6050 mpu;\n";
  P.vars.forEach(v=>c+="float "+v+" = 0;\n");
  if(use.has("temp"))c+="\nfloat readTemperature() {\n  dht.read();\n  return dht.getTemperature();\n}\n";
  if(use.has("hum"))c+="\nfloat readHumidity() {\n  dht.read();\n  return dht.getHumidity();\n}\n";
  if(use.has("dist"))c+="\nint readDistanceCm() {\n  digitalWrite(6, LOW);  delayMicroseconds(2);\n  digitalWrite(6, HIGH); delayMicroseconds(10);\n  digitalWrite(6, LOW);\n  return pulseIn(5, HIGH) / 58;\n}\n";
  if(use.has("tilt"))c+="\nint readTiltDeg() {\n  sensors_event_t a, g, t;\n  mpu.getEvent(&a, &g, &t);\n  return atan2(a.acceleration.x, a.acceleration.z) * 180 / PI;\n}\n";
  if(use.has("ir"))c+="\nint readRemoteKey() {\n  if (!IrReceiver.decode()) return -1;\n  int code = IrReceiver.decodedIRData.command;\n  IrReceiver.resume();\n  const int codes[] = {0x16, 0x0C, 0x18, 0x5E, 0x08, 0x1C, 0x5A, 0x42, 0x52, 0x4A, 0x40};\n  for (int k = 0; k <= 10; k++) if (codes[k] == code) return k;\n  return -1;\n}\n";
  c+="\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  pinMode(RELAY, OUTPUT);\n  pinMode(7, INPUT);\n";
  if(use.has("dist"))c+="  pinMode(6, OUTPUT);\n  pinMode(5, INPUT);\n";if(use.has("b_serial"))c+="  Serial.begin(9600);\n";
  if(lcd)c+="  lcd.begin(16, 2);\n";if(use.has("b_servo"))c+="  servo.attach(9);\n";if(use.has("temp")||use.has("hum")||use.has("lux")||use.has("tilt"))c+="  Wire.begin();\n";
  if(use.has("temp")||use.has("hum"))c+="  dht.begin();\n";if(use.has("lux"))c+="  light.begin();\n";if(use.has("tilt"))c+="  mpu.begin(0x68);\n";if(use.has("ir"))c+="  IrReceiver.begin(2);\n";if(use.has("rand"))c+="  randomSeed(analogRead(A3));\n";
  c+=P.setup.map(b=>st(b,1)).join("")+"}\n\nvoid loop() {\n"+P.loop.map(b=>st(b,1)).join("")+"}\n";
  return c;
}
function abCode(){const c=$("axCode");if(c)c.textContent=abCodeText();}
/* ---- runner: walks the blocks; waits and the end of each loop() hand control back to the simulator ---- */
function abFmt(e,v){if(typeof v==="boolean")v=v?1:0;if(Number.isInteger(v))return String(v);return(Math.round(v*10)/10).toFixed(1);}
function abEval(e,S){switch(e.k){case"n":return+e.v;case"v":return+(S.vars[e.n]||0);
  case"s":{const I=S.in;switch(e.s){case"pot":return Math.round(I.pot);case"temp":return+I.temp;case"hum":return+I.hum;case"dist":return Math.round(I.dist);case"lux":return Math.round(I.lux);case"snd":return Math.round(I.snd);case"tilt":return Math.round(I.tilt);
    case"btn":return I.btn?1:0;case"pir":return I.pir?1:0;case"ir":{const k=I.ir;I.ir=null;return k==null?-1:k;}case"ms":return Math.round(S.ms());}return 0;}
  case"ar":{const a=abEval(e.a,S),b=abEval(e.b,S);return e.o==="+"?a+b:e.o==="-"?a-b:e.o==="*"?a*b:e.o==="/"?(b?a/b:0):(b?a%b:0);}
  case"cmp":{const a=abEval(e.a,S),b=abEval(e.b,S);return(e.o==="<"?a<b:e.o===">"?a>b:e.o==="="?a===b:e.o==="<="?a<=b:e.o===">="?a>=b:a!==b)?1:0;}
  case"and":return abEval(e.a,S)&&abEval(e.b,S)?1:0;case"or":return abEval(e.a,S)||abEval(e.b,S)?1:0;case"not":return abEval(e.a,S)?0:1;
  case"map":{const x=abEval(e.a,S),a=abEval(e.b,S),b=abEval(e.c,S),c=abEval(e.d,S),d=abEval(e.e,S);return b===a?c:Math.trunc((x-a)*(d-c)/(b-a)+c);}
  case"rand":{const a=Math.round(abEval(e.a,S)),b=Math.round(abEval(e.b,S));return a+Math.floor(Math.random()*(b-a+1));}}return 0;}
function* abRunList(list,S){for(const b of list){yield* abRunBlock(b,S);}}
function* abRunBlock(b,S){
  const a=b.a,O=S.out;yield 0;
  switch(b.t){
    case"wait":yield Math.max(0,abEval(a.a,S));break;
    case"repeat":{const n=Math.max(0,Math.round(abEval(a.a,S)));for(let i=0;i<n;i++)yield* abRunList(b.c,S);break;}
    case"if":if(abEval(a.a,S))yield* abRunList(b.c,S);break;
    case"ifelse":if(abEval(a.a,S))yield* abRunList(b.c,S);else yield* abRunList(b.e,S);break;
    case"led":O.led=a.a==="on"?255:0;break;case"ledpwm":O.led=Math.max(0,Math.min(255,Math.round(abEval(a.a,S)*2.55)));break;
    case"tone":O.buzz=Math.max(31,Math.round(abEval(a.a,S)));S.m.buzzUntil=S.ms()+Math.max(0,abEval(a.b,S));break;case"notone":O.buzz=0;break;
    case"relay":O.relay=a.a==="on";break;case"servo":O.servo=Math.max(0,Math.min(180,Math.round(abEval(a.a,S))));break;
    case"clear":S.lcd(0,"");S.lcd(1,"");break;
    case"print":S.lcd(+a.a-1,a.b||"");break;
    case"printv":S.lcd(+a.a-1,(a.b||"")+abFmt(a.c,abEval(a.c,S)));break;
    case"serial":S.print(abFmt(a.a,abEval(a.a,S)));break;
    case"set":if(a.a)S.vars[a.a]=abEval(a.b,S);break;case"change":if(a.a)S.vars[a.a]=(+S.vars[a.a]||0)+abEval(a.b,S);break;
  }
}
function* abProgram(S){yield* abRunList(AB.prog.setup,S);for(;;){yield* abRunList(AB.prog.loop,S);yield -1;}}
