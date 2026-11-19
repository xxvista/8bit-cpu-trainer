/* ---------- Arduino All-in-One Kit page: board drawing from the KiCad file, its 16 modules, status ---------- */
const at=k=>AT[k]?AT[k][LI]:k;
function renderArduino(){
  const k=KITS.find(x=>x.id==="arduino"),msg=t("sMsg",k.name());
  const li=(key,n)=>"<ul>"+Array.from({length:n},(_,i)=>"<li>"+at(key+(i+1))+"</li>").join("")+"</ul>";
  $("arduinoBody").innerHTML='<a class="backlink" href="#home">← '+t("sBack")+"</a>"+
   '<div class="ghead"><span class="badge soon dsg">'+t("hDesigned")+"</span><h2>"+k.name()+'</h2><p class="lead">'+at("lead")+"</p></div>"+
   ardsimSection()+
   '<section class="asec"><h3>'+at("modT")+"</h3><p>"+at("modL")+'</p><div class="amods">'+AMODS.map(m=>'<div class="amod"><b>'+m[0][LI]+'</b><i class="pin ltr">'+m[1]+"</i><span>"+m[2][LI]+"</span></div>").join("")+"</div></section>"+
   '<div class="gcols"><section><h3>'+at("onT")+"</h3>"+li("on",5)+"</section><section><h3>"+at("learnT")+"</h3>"+li("learn",4)+"</section><section><h3>"+at("stT")+'</h3><ul class="gstat"><li class="done">'+at("st1")+'</li><li class="done">'+at("st2")+"</li><li>"+at("st3")+"</li><li>"+at("st4")+"</li></ul><p class='fromprice'>"+t("hPlanned",'<b class="ltr">'+money(SHOP.prices.arduino)+"</b>")+"</p></section></div>"+
   '<div class="ctabox gcta"><div><h2>'+at("ctaT")+'</h2><p class="lead">'+t("sNotify")+'</p></div><div class="ctas"><a class="btn primary big" target="_blank" rel="noopener" href="'+waLink(msg)+'">WhatsApp</a><a class="btn big" href="'+mailLink(k.name(),msg)+'">Email</a></div>'+contactHtml()+"</div>";
  ardsimMount();
}
