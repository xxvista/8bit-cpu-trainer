/* ---------- Logic Gates Kit page: the board drawn from its KiCad file, with switches and jumper wires you can try ---------- */
const gt=(k,...a)=>(GT[k]?GT[k][LI]:k).replace(/\{(\d)\}/g,(m,i)=>a[i]);
const GGATES=[ // name, inputs, output, function (the output net is the Y pin)
 ["AND",["AND_A","AND_B"],"AND_Y",(a,b)=>a&&b],["NAND",["NAND_A","NAND_B"],"NAND_Y",(a,b)=>!(a&&b)],
 ["OR",["OR_A","OR_B"],"OR_Y",(a,b)=>a||b],["NOR",["NOR_A","NOR_B"],"NOR_Y",(a,b)=>!(a||b)],
 ["XOR",["XOR_A","XOR_B"],"XOR_Y",(a,b)=>a!==b],["XNOR",["XNOR_A","XNOR_B"],"XNOR_Y",(a,b)=>a===b],
 ["BUFFER",["BUF_IN"],"BUF_Y",a=>a],["NOT",["NOT_IN"],"NOT_Y",a=>!a]];
const GS={power:true,sw:Array(10).fill(false),wires:[],sel:null,msg:""};
const gIsSrc=n=>/^SW\d+$/.test(n)||/_Y$/.test(n);
const gPinName=n=>n.replace("BUF_","BUFFER ").replace(/_(A|B|IN|Y)$/," $1").replace(/^OUT(\d)$/,"LED $1");
let gVals={},gOut={};
function gCompute(){
  const par={};const f=a=>{if(!(a in par))par[a]=a;while(par[a]!==a)a=par[a]=par[par[a]];return a;};
  for(const[a,b]of GS.wires)par[f(a)]=f(b);
  const src={};for(const[a,b]of GS.wires)for(const n of[a,b])if(gIsSrc(n))src[f(n)]=n;
  const pinVal=n=>{if(!GS.power)return false;if(gIsSrc(n))return srcVal(n);const s=src[f(n)];return s?srcVal(s):false;};
  const srcVal=n=>/^SW/.test(n)?GS.power&&GS.sw[+n.slice(2)-1]:!!gOut[n];
  gOut={};
  for(let pass=0;pass<10;pass++)for(const[,ins,y,fn]of GGATES)gOut[y]=GS.power&&!!fn(...ins.map(pinVal));
  gVals={};
  for(const p of GPCB.parts)if(p.k==="hdr")gVals[p.n]=pinVal(p.n);
}
function gWirePath(a,b){const A=gPin[a],B=gPin[b];if(!A||!B)return"";const dx=B[0]-A[0],dy=B[1]-A[1],d=Math.hypot(dx,dy),sag=Math.min(14,4+d*.18);
  return"M"+A[0]+" "+A[1]+" C"+(A[0]+dx*.25)+" "+(A[1]+dy*.25+sag)+" "+(A[0]+dx*.75)+" "+(A[1]+dy*.75+sag)+" "+B[0]+" "+B[1];}
const gPin={};
function drawGates(live){
  const B=GPCB;let s='<rect class="mask" x="0" y="0" width="'+B.w+'" height="'+B.h+'" rx="1.6" style="cursor:default"/><path class="tr" d="'+B.tr+'"/>';
  for(let i=0;i<B.via.length;i+=2)s+='<circle class="pad" cx="'+B.via[i]+'" cy="'+B.via[i+1]+'" r=".4"/>';
  s+='<path class="silkl" d="'+B.sl+'"/>';
  for(const tx of B.silk)s+=silkText(tx);
  let leds="",pins="",top="";
  const pads=(p,r)=>{let o="";for(let i=0;i<p.p.length;i+=2)o+='<circle class="pad" cx="'+p.p[i]+'" cy="'+p.p[i+1]+'" r="'+r+'"/>';return o;};
  for(const p of B.parts){const bb=bbox(p.p);
    if(p.k==="hole")s+='<circle class="hole" cx="'+bb.cx+'" cy="'+bb.cy+'" r="1.6"/>';
    else if(p.k==="ic")s+='<g data-tip="'+esc("<b>"+p.r+" · "+p.v+"</b><br>"+gt("chip"+p.v))+'">'+pads(p,.6)+'<rect class="icb" x="'+(bb.x0+1)+'" y="'+(bb.y0-1.3)+'" width="'+(bb.w-2)+'" height="'+(bb.h+2.6)+'" rx=".5"/><circle cx="'+bb.cx+'" cy="'+(bb.y0+.2)+'" r=".7" fill="#555"/><text class="ict" font-size="1.9" text-anchor="middle" transform="rotate(-90 '+bb.cx+" "+bb.cy+')" x="'+bb.cx+'" y="'+(bb.cy+.7)+'">'+esc(p.v)+"</text></g>";
    else if(p.k==="res"){const[x1,y1,x2,y2]=p.p,cx=(x1+x2)/2,cy=(y1+y2)/2;s+='<g data-tip="'+esc("<b>"+p.r+"</b> "+TIPS.res[LI]+" "+p.v+" Ω")+'"><line class="lead" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>'+pads(p,.5)+'<circle class="resv" cx="'+x1+'" cy="'+y1+'" r="1.25"/></g>';}
    else if(p.k==="sip")s+='<g data-tip="'+esc("<b>"+p.r+"</b> "+gt("sip"))+'">'+pads(p,.5)+'<rect class="sipb" x="'+(bb.x0-1.2)+'" y="'+(bb.y0-1.1)+'" width="'+(bb.w+2.4)+'" height="2.2" rx=".6"/></g>';
    else if(p.k==="cap")s+='<g data-tip="'+esc("<b>"+p.r+"</b> "+TIPS.cap[LI]+" "+p.v)+'"><ellipse class="capb" cx="'+bb.cx+'" cy="'+bb.cy+'" rx="'+(bb.w/2+1.4)+'" ry="1.3"/></g>';
    else if(p.k==="capp")s+='<g data-tip="'+esc("<b>"+p.r+"</b> "+TIPS.cap[LI]+" "+p.v)+'"><circle class="capp" cx="'+bb.cx+'" cy="'+bb.cy+'" r="3.1"/></g>';
    else if(p.k==="fuse")s+='<g data-tip="'+esc("<b>"+p.r+"</b> "+gt("fuse"))+'"><ellipse class="fuseb" cx="'+bb.cx+'" cy="'+bb.cy+'" rx="'+(bb.w/2+1.6)+'" ry="2.2"/></g>';
    else if(p.k==="usb")s+='<g data-tip="'+esc("<b>USB-C</b> "+gt("usb"))+'"><rect class="metal" x="'+(bb.x0-.4)+'" y="'+(bb.y0-1.2)+'" width="'+(bb.w+.8)+'" height="'+(bb.h+2.4)+'" rx="1"/></g>';
    else if(p.k==="slide"){const x=bb.x0-2,w=bb.w+4,on=GS.power;
      top+='<g class="'+(live?"act":"")+'" data-g="power" data-tip="'+esc(gt("pwrTip"))+'"><rect class="swb hl" x="'+x+'" y="'+(bb.cy-2.2)+'" width="'+w+'" height="4.4" rx=".5"/><rect class="swk" id="'+(live?"gPwr":"gPwrX")+'" x="'+(on?x+w-4:x+1)+'" y="'+(bb.cy-1.5)+'" width="3" height="3" rx=".3"/></g>';}
    else if(p.k==="dipsw"){const n=p.p.length/4;
      s+='<rect class="dipb" x="'+(bb.x0-1.4)+'" y="'+(bb.y0-1.4)+'" width="'+(bb.w+2.8)+'" height="'+(bb.h+2.8)+'" rx=".4"/>';
      for(let i=0;i<n;i++){const ax=p.p[i*2],ay=p.p[i*2+1],j=2*n-1-i,bx=p.p[j*2],by=p.p[j*2+1],on=GS.sw[i];
        top+='<g class="'+(live?"act":"")+'" data-g="sw" data-i="'+i+'" data-tip="'+esc(gt("swTip",i+1))+'"><rect x="'+(ax-.6)+'" y="'+(ay-1.1)+'" width="'+(bx-ax+1.2)+'" height="2.2" fill="transparent"/><line x1="'+(ax+1.2)+'" y1="'+ay+'" x2="'+(bx-1.2)+'" y2="'+by+'" stroke="#5d1010" stroke-width="1.5" stroke-linecap="round"/>'+
          '<rect class="swk hl"'+(live?' id="gSw'+i+'"':"")+' x="'+((on?bx-2.2:ax+.7))+'" y="'+(ay-.75)+'" width="1.5" height="1.5" rx=".2"/></g>';}
      s+='<text class="silk" font-size="1.2" x="'+(bb.x1-.5)+'" y="'+(bb.y0-2.2)+'" text-anchor="middle">ON</text>';}
    else if(p.k==="led"){const c=p.v==="green"?"g":"";
      leds+='<circle class="halo '+c+'"'+(live?' id="gH-'+p.n+'"':"")+' cx="'+bb.cx+'" cy="'+bb.cy+'" r="3.4"/><circle class="led '+c+'"'+(live?' id="gL-'+p.n+'"':"")+' cx="'+bb.cx+'" cy="'+bb.cy+'" r="1.9"/>';}
    else if(p.k==="hdr"){gPin[p.n]=[p.p[0],p.p[1]];
      pins+='<g class="'+(live?"act gpin":"")+'" data-g="pin" data-n="'+p.n+'" data-tip="'+esc("<b>"+gPinName(p.n)+"</b> "+gt(gIsSrc(p.n)?"pinSrc":"pinIn"))+'"><circle cx="'+p.p[0]+'" cy="'+p.p[1]+'" r="2.2" fill="transparent"/><rect class="hdr hl"'+(live?' id="gP-'+p.n+'"':"")+' x="'+(p.p[0]-1.27)+'" y="'+(p.p[1]-1.27)+'" width="2.54" height="2.54" rx=".3"/><rect class="pinm" x="'+(p.p[0]-.32)+'" y="'+(p.p[1]-.32)+'" width=".64" height=".64"/></g>';}
  }
  s+=leds;
  if(live)s+='<g id="gWires"></g>';
  else s+=GS.wires.map(([a,b])=>'<path class="gwire" d="'+gWirePath(a,b)+'"/>').join("");
  return s+top+pins; // switches and pins stay clickable above the wires
}
function gUpdate(){
  gCompute();
  for(const p of GPCB.parts){
    if(p.k==="led"){const on=p.n==="power"?GS.power:!!gVals[p.n];const L=$("gL-"+p.n),H=$("gH-"+p.n);if(L){L.classList.toggle("on",on);H.classList.toggle("on",on);}}
    if(p.k==="hdr"){const e=$("gP-"+p.n);if(e){e.classList.toggle("sel",GS.sel===p.n);e.classList.toggle("hi",!!gVals[p.n]);}}
  }
  GS.sw.forEach((on,i)=>{const k=$("gSw"+i);if(!k)return;const p=GPCB.parts.find(x=>x.k==="dipsw"),n=p.p.length/4,ax=p.p[i*2],bx=p.p[(2*n-1-i)*2];k.setAttribute("x",on?bx-2.2:ax+.7);});
  const pw=$("gPwr");if(pw){const p=GPCB.parts.find(x=>x.k==="slide"),bb=bbox(p.p);pw.setAttribute("x",GS.power?bb.x0-2+bb.w+4-4:bb.x0-1);}
  const W=$("gWires");if(W)W.innerHTML=GS.wires.map(([a,b],i)=>'<g class="act" data-g="wire" data-i="'+i+'" data-tip="'+esc(gt("wireTip",gPinName(a),gPinName(b)))+'"><path class="gwirehit" d="'+gWirePath(a,b)+'"/><path class="gwire'+(gVals[a]?" hi":"")+'" d="'+gWirePath(a,b)+'"/></g>').join("");
  const m=$("gMsg");if(m)m.textContent=GS.msg||gt(GS.sel?"msgSel":"msgStart",GS.sel?gPinName(GS.sel):"");
  const T=$("gTables");if(T)T.innerHTML=GGATES.map(([nm,ins,y,fn])=>{const iv=ins.map(n=>!!gVals[n]),ov=!!gOut[y],used=GS.wires.some(w=>w.includes(y)||ins.some(n=>w.includes(n)));
    const rows=ins.length===2?[[0,0],[0,1],[1,0],[1,1]]:[[0],[1]];
    return'<div class="gtt'+(used?" used":"")+'"><b>'+nm+'</b><table dir="ltr"><tr>'+(ins.length===2?"<th>A</th><th>B</th>":"<th>A</th>")+"<th>Y</th></tr>"+rows.map(r=>{const cur=GS.power&&r.every((v,i)=>!!v===iv[i]);return'<tr'+(cur?' class="cur"':"")+">"+r.map(v=>"<td>"+v+"</td>").join("")+"<td>"+(fn(...r.map(Boolean))?1:0)+"</td></tr>";}).join("")+"</table></div>";}).join("");
}
function gClick(e){
  const g=e.target.closest("[data-g]");if(!g)return;const k=g.dataset.g;GS.msg="";
  if(k==="power")GS.power=!GS.power;
  else if(k==="sw")GS.sw[+g.dataset.i]=!GS.sw[+g.dataset.i];
  else if(k==="wire"){GS.wires.splice(+g.dataset.i,1);GS.msg=gt("msgDel");}
  else if(k==="pin"){const n=g.dataset.n,has=x=>GS.wires.some(w=>w.includes(x));
    if(!GS.sel){if(has(n))GS.msg=gt("msgBusy",gPinName(n));else GS.sel=n;}
    else if(GS.sel===n)GS.sel=null;
    else if(has(n))GS.msg=gt("msgBusy",gPinName(n));
    else if(gIsSrc(GS.sel)&&gIsSrc(n)){GS.msg=gt("msgShort");GS.sel=null;}
    else{GS.wires.push([GS.sel,n]);GS.sel=null;}}
  else if(k==="clear"){GS.wires=[];GS.sel=null;}
  else if(k==="ex"){const v=$("gEx").value;GS.sel=null;GS.sw.fill(false);
    if(v==="ab")GS.wires=[["SW1","AND_A"],["SW2","NOT_IN"],["NOT_Y","AND_B"],["AND_Y","OUT1"]];
    else if(v==="half")GS.wires=[["SW1","XOR_A"],["SW2","XOR_B"],["SW3","AND_A"],["SW4","AND_B"],["XOR_Y","OUT1"],["AND_Y","OUT2"]];
    else{const G=GGATES.find(x=>x[0]===v);GS.wires=G[1].map((n,i)=>["SW"+(i+1),n]).concat([[G[2],"OUT1"]]);}
    GS.msg=gt(v==="half"?"exHalfN":v==="ab"?"exAbN":"exGateN",v);}
  gUpdate();
}
function renderGates(){
  const k=KITS.find(x=>x.id==="gates"),msg=t("sMsg",k.name());
  const li=(key,n)=>"<ul>"+Array.from({length:n},(_,i)=>"<li>"+gt(key+(i+1))+"</li>").join("")+"</ul>";
  $("gatesBody").innerHTML='<a class="backlink" href="#home">← '+t("sBack")+'</a>'+
   '<div class="ghead"><span class="badge soon">'+t("hDesigned")+"</span><h2>"+k.name()+'</h2><p class="lead">'+gt("lead")+"</p></div>"+
   '<div class="gsim"><div class="gboard" dir="ltr"><svg id="gSvg" viewBox="-2 -2 '+(GPCB.w+4)+" "+(GPCB.h+4)+'" role="img" aria-label="'+esc(gt("boardAlt"))+'">'+drawGates(true)+"</svg></div>"+
     '<aside class="gside"><h3>'+gt("tryT")+"</h3><p>"+gt("tryP")+'</p><p class="gmsg" id="gMsg" role="status"></p>'+
     '<label class="gex">'+gt("exL")+' <select id="gEx">'+GGATES.map(g=>'<option value="'+g[0]+'">'+gt("exGate",g[0])+"</option>").join("")+'<option value="ab">'+gt("exAb")+'</option><option value="half">'+gt("exHalf")+'</option></select></label><div class="ctas"><button type="button" class="btn primary" data-g="ex">'+gt("exGo")+'</button><button type="button" class="btn" data-g="clear">'+gt("clear")+"</button></div>"+
     "<h3>"+gt("ttT")+'</h3><div class="gtables" id="gTables"></div></aside></div>'+
   '<p class="gnote">'+gt("illus")+"</p>"+
   '<div class="gcols"><section><h3>'+gt("onT")+"</h3>"+li("on",7)+"</section><section><h3>"+gt("learnT")+"</h3>"+li("learn",4)+"</section><section><h3>"+gt("stT")+'</h3><ul class="gstat"><li class="done">'+gt("st1")+'</li><li class="done">'+gt("st2")+"</li><li>"+gt("st3")+"</li><li>"+gt("st4")+"</li></ul><p class='fromprice'>"+t("hPlanned",'<b class="ltr">'+money(SHOP.prices.gates)+"</b>")+"</p></section></div>"+
   "<h3>"+gt("bomT")+'</h3><div class="tablewrap"><table class="gbom"><thead><tr><th>'+gt("bomQ")+"</th><th>"+gt("bomP")+"</th><th>"+gt("bomR")+"</th></tr></thead><tbody>"+GBOM.map(r=>"<tr><td class='m'>"+r[0]+"</td><td>"+r[1][LI]+"</td><td class='m ltr'>"+r[2]+"</td></tr>").join("")+"</tbody></table></div>"+
   '<div class="ctabox gcta"><div><h2>'+gt("ctaT")+'</h2><p class="lead">'+t("sNotify")+'</p></div><div class="ctas"><a class="btn primary big" target="_blank" rel="noopener" href="'+waLink(msg)+'">WhatsApp</a><a class="btn big" href="'+mailLink(k.name(),msg)+'">Email</a></div>'+contactHtml()+"</div>";
  gUpdate();
}
$("gatesBody").addEventListener("click",gClick);
