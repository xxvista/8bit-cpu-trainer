/* ---------- Arduino kit simulator: example programs run on a model of the board, outputs shown in 3D (dev/ard3d.js) and in the panel ---------- */
const ast=k=>AS[k]?AS[k][LI]:k;
const LCDH="#include <Adafruit_LiquidCrystal.h>\nAdafruit_LiquidCrystal lcd(1);      // I2C 0x21\n";
const IRKEYS=[["1",0x0C],["2",0x18],["3",0x5E],["4",0x08],["5",0x1C],["6",0x5A],["7",0x42],["8",0x52],["9",0x4A],["0",0x16],["OK",0x40]];
/* each example: the Arduino code shown to the student, the inputs it uses, and a model of what it does (called every 50 ms) */
const AXP={
 blink:{use:[],code:"const int LED = 10;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  delay(500);\n  digitalWrite(LED, LOW);\n  delay(500);\n}",
  step(S){S.out.led=Math.floor(S.ms/500)%2?0:255;}},
 button:{use:["btn"],code:LCDH+"const int BUTTON = 7, LED = 10;\n\nvoid setup() {\n  pinMode(BUTTON, INPUT);\n  pinMode(LED, OUTPUT);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  bool pressed = digitalRead(BUTTON) == HIGH;\n  digitalWrite(LED, pressed ? HIGH : LOW);\n  lcd.setCursor(0, 0);\n  lcd.print(pressed ? \"Button: pressed \" : \"Button: released\");\n  delay(50);\n}",
  step(S){const p=S.in.btn;S.out.led=p?255:0;S.lcd(0,p?"Button: pressed":"Button: released");}},
 servo:{use:["pot"],code:"#include <Servo.h>\n"+LCDH+"Servo servo;\n\nvoid setup() {\n  servo.attach(9);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  int value = analogRead(A0);\n  int angle = map(value, 0, 1023, 0, 180);\n  servo.write(angle);\n  lcd.setCursor(0, 0);\n  lcd.print(\"Pot:   \"); lcd.print(value); lcd.print(\"    \");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Angle: \"); lcd.print(angle); lcd.print(\"    \");\n  delay(20);\n}",
  step(S){const v=Math.round(S.in.pot),a=Math.round(v*180/1023);S.out.servo=a;S.lcd(0,"Pot:   "+v);S.lcd(1,"Angle: "+a);}},
 distance:{use:["dist"],code:LCDH+"const int TRIG = 6, ECHO = 5, BUZZER = 3;\n\nvoid setup() {\n  pinMode(TRIG, OUTPUT);\n  pinMode(ECHO, INPUT);\n  lcd.begin(16, 2);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(TRIG, LOW);  delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH); delayMicroseconds(10);\n  digitalWrite(TRIG, LOW);\n  long us = pulseIn(ECHO, HIGH);\n  int cm = us / 58;\n  lcd.setCursor(0, 0);\n  lcd.print(\"Distance: \"); lcd.print(cm); lcd.print(\" cm  \");\n  Serial.println(cm);\n  if (cm < 50) {\n    tone(BUZZER, 2000, 50);\n    delay(cm * 10);\n  }\n  delay(100);\n}",
  step(S){const cm=Math.round(S.in.dist);S.lcd(0,"Distance: "+cm+" cm");S.lcd(1,"#".repeat(Math.max(0,Math.min(16,Math.round(16-cm/12.5)))));
   const period=cm<50?150+cm*10:250;if(S.ms-(S.m.last||0)>=period){S.m.last=S.ms;S.print(String(cm));if(cm<50)S.m.beepUntil=S.ms+50;}S.out.buzz=S.ms<(S.m.beepUntil||0)?2000:0;}},
 weather:{use:["temp","hum"],code:"#include <DHT20.h>\n"+LCDH+"DHT20 dht;\nconst int RELAY = 4;\n\nvoid setup() {\n  Wire.begin();\n  dht.begin();\n  lcd.begin(16, 2);\n  pinMode(RELAY, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  dht.read();\n  float t = dht.getTemperature();\n  float h = dht.getHumidity();\n  lcd.setCursor(0, 0);\n  lcd.print(\"Temp: \"); lcd.print(t, 1); lcd.print(\" C  \");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Hum:  \"); lcd.print(h, 0); lcd.print(\" %  \");\n  digitalWrite(RELAY, t > 30 ? HIGH : LOW);\n  Serial.print(t); Serial.print(\",\"); Serial.println(h);\n  delay(1000);\n}",
  step(S){if(S.ms-(S.m.last??-1e9)<1000)return;S.m.last=S.ms;const t=S.in.temp,h=S.in.hum;S.lcd(0,"Temp: "+t.toFixed(1)+" C");S.lcd(1,"Hum:  "+Math.round(h)+" %");S.out.relay=t>30;S.print(t.toFixed(2)+","+h.toFixed(2));}},
 night:{use:["lux"],code:"#include <BH1750.h>\n"+LCDH+"BH1750 light(0x5C);\nconst int LED = 10;\n\nvoid setup() {\n  Wire.begin();\n  light.begin();\n  pinMode(LED, OUTPUT);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  float lux = light.readLightLevel();\n  int level = constrain(map(lux, 0, 500, 255, 0), 0, 255);\n  analogWrite(LED, level);\n  lcd.setCursor(0, 0);\n  lcd.print(\"Light: \"); lcd.print((int)lux); lcd.print(\" lx  \");\n  lcd.setCursor(0, 1);\n  lcd.print(\"LED:   \"); lcd.print(level * 100 / 255); lcd.print(\" %  \");\n  delay(200);\n}",
  step(S){const lux=Math.round(S.in.lux),lv=Math.max(0,Math.min(255,Math.round(255-lux*255/500)));S.out.led=lv;S.lcd(0,"Light: "+lux+" lx");S.lcd(1,"LED:   "+Math.floor(lv*100/255)+" %");}},
 alarm:{use:["pir"],code:LCDH+"const int PIR = A2, BUZZER = 3, RELAY = 4;\n\nvoid setup() {\n  pinMode(PIR, INPUT);\n  pinMode(RELAY, OUTPUT);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  if (digitalRead(PIR) == HIGH) {\n    digitalWrite(RELAY, HIGH);\n    lcd.setCursor(0, 0);\n    lcd.print(\"Motion detected!\");\n    tone(BUZZER, 1500, 200);\n    delay(400);\n  } else {\n    digitalWrite(RELAY, LOW);\n    lcd.setCursor(0, 0);\n    lcd.print(\"All quiet       \");\n    delay(100);\n  }\n}",
  step(S){const m=S.in.pir;S.out.relay=m;S.lcd(0,m?"Motion detected!":"All quiet");S.out.buzz=m&&S.ms%400<200?1500:0;}},
 tilt:{use:["tilt"],code:"#include <Adafruit_MPU6050.h>\n"+LCDH+"Adafruit_MPU6050 mpu;\nconst int LED = 10;\n\nvoid setup() {\n  mpu.begin(0x68);\n  pinMode(LED, OUTPUT);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  sensors_event_t a, g, temp;\n  mpu.getEvent(&a, &g, &temp);\n  float angle = atan2(a.acceleration.x, a.acceleration.z) * 180 / PI;\n  bool level = abs(angle) < 2;\n  lcd.setCursor(0, 0);\n  lcd.print(\"Tilt: \"); lcd.print(angle, 0); lcd.print(\" deg  \");\n  lcd.setCursor(0, 1);\n  lcd.print(level ? \"Level!          \" : \"Not level       \");\n  digitalWrite(LED, level ? HIGH : LOW);\n  delay(100);\n}",
  step(S){const a=Math.round(S.in.tilt),lv=Math.abs(a)<2;S.lcd(0,"Tilt: "+a+" deg");S.lcd(1,lv?"Level!":"Not level");S.out.led=lv?255:0;}},
 clap:{use:["snd"],code:LCDH+"const int MIC = A1, RELAY = 4;\nbool on = false;\n\nvoid setup() {\n  pinMode(RELAY, OUTPUT);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  int level = analogRead(MIC);\n  if (level > 600) {\n    on = !on;\n    digitalWrite(RELAY, on ? HIGH : LOW);\n    delay(300);\n  }\n  lcd.setCursor(0, 0);\n  lcd.print(\"Sound: \"); lcd.print(level); lcd.print(\"    \");\n  lcd.setCursor(0, 1);\n  lcd.print(on ? \"Relay: ON \" : \"Relay: OFF\");\n  delay(20);\n}",
  step(S){const lv=Math.round(S.in.snd);if(lv>600&&S.ms>=(S.m.wait||0)){S.m.on=!S.m.on;S.m.wait=S.ms+300;}S.out.relay=!!S.m.on;S.lcd(0,"Sound: "+lv);S.lcd(1,S.m.on?"Relay: ON":"Relay: OFF");}},
 remote:{use:["ir"],code:"#include <IRremote.hpp>\n"+LCDH+"const int RELAY = 4;\n\nvoid setup() {\n  IrReceiver.begin(2);\n  pinMode(RELAY, OUTPUT);\n  lcd.begin(16, 2);\n}\n\nvoid loop() {\n  if (IrReceiver.decode()) {\n    int code = IrReceiver.decodedIRData.command;\n    lcd.setCursor(0, 0);\n    lcd.print(\"Code: 0x\"); lcd.print(code, HEX); lcd.print(\"    \");\n    if (code == 0x0C) digitalWrite(RELAY, HIGH);\n    if (code == 0x16) digitalWrite(RELAY, LOW);\n    IrReceiver.resume();\n  }\n}",
  step(S){const k=S.in.ir;if(k){S.in.ir=null;const name=IRKEYS.find(x=>x[1]===k)[0];S.lcd(0,"Code: 0x"+k.toString(16).toUpperCase());S.lcd(1,"Key: "+name);if(k===0x0C)S.out.relay=true;if(k===0x16)S.out.relay=false;S.out.serialBlink=true;S.m.blinkUntil=S.ms+120;}
   if(S.ms>(S.m.blinkUntil||0)&&!S.m.ser)S.out.serialBlink=false;}}
};
const SIM={ex:"servo",run:false,t0:0,timer:0,in:{temp:24,hum:45,dist:60,lux:300,snd:10,tilt:0,pot:512,btn:false,pir:false,ir:null},out:null,m:{},serial:[],sound:true,audio:null,osc:null};
function simReset(){SIM.out={power:true,led:0,buzz:0,relay:false,servo:90,lcd:["",""],lcdChanged:true,serialBlink:false,btn:SIM.in.btn,pot:SIM.in.pot};SIM.m={};SIM.serial=[];}
simReset();SIM.out.power=false;
function simStep(){
  const S={ms:performance.now()-SIM.t0,in:SIM.in,out:SIM.out,m:SIM.m,
    lcd:(r,s)=>{s=String(s).padEnd(16).slice(0,16);if(SIM.out.lcd[r]!==s){SIM.out.lcd[r]=s;SIM.out.lcdChanged=true;}},
    print:s=>{SIM.serial.push(s);if(SIM.serial.length>8)SIM.serial.shift();SIM.out.serialBlink=true;SIM.m.ser=SIM.m.ser||0;SIM.m.serUntil=performance.now()+80;}};
  AXP[SIM.ex].step(S);
  if(SIM.m.serUntil&&performance.now()>SIM.m.serUntil&&SIM.ex!=="remote")SIM.out.serialBlink=false;
  SIM.out.btn=SIM.in.btn;SIM.out.pot=SIM.in.pot;SIM.out.tilt=SIM.in.tilt;
  simSound();ardsimPaint();
}
function simStart(){SIM.run=true;SIM.t0=performance.now();simReset();clearInterval(SIM.timer);SIM.timer=setInterval(simStep,50);simStep();ardsimPanel();}
function simStop(){SIM.run=false;clearInterval(SIM.timer);simReset();SIM.out.power=false;SIM.out.lcd=["",""];SIM.out.lcdChanged=true;simSound();ardsimPaint();ardsimPanel();}
function simSound(){
  const f=SIM.run&&SIM.sound?SIM.out.buzz:0;
  try{if(f&&!SIM.audio){SIM.audio=new (window.AudioContext||window.webkitAudioContext)();}
    if(!SIM.audio)return;
    if(f&&!SIM.osc){SIM.osc=SIM.audio.createOscillator();const g=SIM.audio.createGain();g.gain.value=.04;SIM.osc.type="square";SIM.osc.connect(g).connect(SIM.audio.destination);SIM.osc.frequency.value=f;SIM.osc.start();}
    else if(!f&&SIM.osc){SIM.osc.stop();SIM.osc=null;}
    else if(f&&SIM.osc)SIM.osc.frequency.value=f;}catch(e){}
}
/* the panel next to the 3D board */
function ardsimHTML(){
  const ex=SIM.ex,use=AXP[ex].use,u=k=>use.includes(k)?" used":"";
  const slider=(k,min,max,step,unit)=>'<label class="asl'+u(k)+'"><span>'+ast(k)+' <b class="ltr" id="axv-'+k+'"></b></span><input type="range" id="ax-'+k+'" data-in="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+SIM.in[k]+'" data-unit="'+unit+'"></label>';
  return'<div class="axbar"><label class="axsel"><span>'+ast("ex")+'</span><select id="axSel">'+ASX.map(x=>'<option value="'+x[0]+'"'+(x[0]===ex?" selected":"")+">"+x[1][LI]+"</option>").join("")+"</select></label>"+
    '<button type="button" class="btn primary" id="axRun" data-ax="run">'+ast(SIM.run?"stop":"run")+'</button><span class="axstate'+(SIM.run?" on":"")+'" role="status">'+ast(SIM.run?"running":"stopped")+"</span></div>"+
   '<p class="axdesc">'+ASX.find(x=>x[0]===ex)[2][LI]+"</p>"+
   '<div class="axlcd" dir="ltr" aria-label="'+esc(ast("lcd"))+'"><div id="axL0"></div><div id="axL1"></div></div>'+
   '<div class="axouts" id="axOuts"></div>'+
   "<h4>"+ast("sensors")+'</h4><div class="axins">'+slider("pot",0,1023,1,"")+slider("temp",-10,50,.5," °C")+slider("hum",0,100,1," %")+slider("dist",2,200,1," cm")+slider("lux",0,1000,5," lx")+slider("snd",0,1023,1,"")+slider("tilt",-45,45,1,"°")+
   '<div class="axtog'+u("btn")+'"><button type="button" class="btn" id="axBtn">'+ast("btn")+'</button></div>'+
   '<label class="axtog axchk'+u("pir")+'"><input type="checkbox" id="axPir"'+(SIM.in.pir?" checked":"")+"> "+ast("pir")+"</label>"+
   '<div class="axtog axremote'+u("ir")+'"><span>'+ast("remote")+'</span><div class="keys" dir="ltr">'+IRKEYS.map(k=>'<button type="button" class="key" data-ir="'+k[1]+'">'+k[0]+"</button>").join("")+"</div></div></div>"+
   '<label class="axchk axsound"><input type="checkbox" id="axSound"'+(SIM.sound?" checked":"")+"> "+ast("sound")+"</label>"+
   "<h4>"+ast("serial")+'</h4><pre class="axserial" id="axSerial" dir="ltr"></pre>';
}
function ardsimPanel(){const p=$("axPanel");if(!p)return;p.innerHTML=ardsimHTML();const c=$("axCode");if(c)c.textContent=AXP[SIM.ex].code;ardsimPaint(true);}
function ardsimPaint(all){
  const o=SIM.out;if(!o)return;
  if($("axL0")){$("axL0").textContent=(o.lcd[0]||"").padEnd(16);$("axL1").textContent=(o.lcd[1]||"").padEnd(16);}
  const outs=$("axOuts");
  if(outs)outs.innerHTML=
    '<div class="aout"><span>'+ast("led")+'</span><i class="lbar"><i style="width:'+Math.round(o.led/2.55)+'%"></i></i><b class="ltr">'+Math.round(o.led/2.55)+" %</b></div>"+
    '<div class="aout"><span>'+ast("buzz")+'</span><b class="apill'+(o.buzz?" hot":"")+'">'+(o.buzz?o.buzz+" Hz":ast("off"))+"</b></div>"+
    '<div class="aout"><span>'+ast("relay")+'</span><b class="apill'+(o.relay?" hot":"")+'">'+ast(o.relay?"on":"off")+"</b></div>"+
    '<div class="aout"><span>'+ast("servo")+'</span><b class="ltr">'+o.servo+"°</b></div>";
  if(all||SIM.run)Object.keys(SIM.in).forEach(k=>{const e=$("axv-"+k),r=$("ax-"+k);if(e&&r)e.textContent=(+SIM.in[k]).toString()+(r.dataset.unit||"");});
  const ser=$("axSerial");if(ser)ser.textContent=SIM.serial.join("\n");
  if(typeof ard3dShow==="function")ard3dShow(o);
  o.lcdChanged=false;
}
function ardsimWire(root){
  root.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.in;if(k){SIM.in[k]=+e.target.value;ardsimPaint(true);if(!SIM.run){SIM.out.pot=SIM.in.pot;SIM.out.tilt=SIM.in.tilt;ard3dShow&&ard3dShow(SIM.out);}}});
  root.addEventListener("change",e=>{const id=e.target.id;
    if(id==="axSel"){SIM.ex=e.target.value;if(SIM.run)simStart();else{simReset();SIM.out.power=false;ardsimPanel();}}
    else if(id==="axPir")SIM.in.pir=e.target.checked;
    else if(id==="axSound"){SIM.sound=e.target.checked;simSound();}});
  root.addEventListener("click",e=>{const b=e.target.closest("[data-ax],[data-ir],[data-a3]");if(!b)return;
    if(b.dataset.ax==="run"){SIM.run?simStop():simStart();}
    else if(b.dataset.ir){SIM.in.ir=+b.dataset.ir;if(!SIM.run)simStart();}
    else if(b.dataset.a3==="top"||b.dataset.a3==="persp")ard3dView(b.dataset.a3==="top");
    else if(b.dataset.a3==="close")ard3dSelect(null);});
  const hold=v=>e=>{if(e.target.closest("#axBtn")){SIM.in.btn=v;if(v)e.target.closest("#axBtn").classList.add("down");else e.target.closest("#axBtn").classList.remove("down");if(!SIM.run){SIM.out.btn=v;ard3dShow&&ard3dShow(SIM.out);}}};
  root.addEventListener("pointerdown",hold(true));
  ["pointerup","pointerleave","pointercancel"].forEach(t=>root.addEventListener(t,e=>{if(SIM.in.btn&&(t!=="pointerleave"||e.target.closest("#axBtn")))hold(false)(e);},true));
  root.addEventListener("keydown",e=>{if(e.target.id==="axBtn"&&(e.key===" "||e.key==="Enter")&&!e.repeat){SIM.in.btn=true;e.target.classList.add("down");}});
  root.addEventListener("keyup",e=>{if(e.target.id==="axBtn"&&(e.key===" "||e.key==="Enter")){SIM.in.btn=false;e.target.classList.remove("down");}});
}
/* the section the Arduino page puts in */
function ardsimSection(){
  return'<section class="asec a3sec"><h3>'+ast("secT")+"</h3><p>"+ast("secL")+'</p>'+
   '<div class="asim"><div><div class="a3host" id="a3host"><img class="a3fallback" src="img/arduino-board.png" alt="'+esc(at("alt"))+'" width="1500" height="1099"><p class="a3load">'+ast("loading")+'</p>'+
     '<div class="a3tools"><button type="button" class="btn small" data-a3="persp">'+ast("persp")+'</button><button type="button" class="btn small" data-a3="top">'+ast("top")+'</button></div>'+
     '<div class="a3info" id="a3info" hidden></div></div>'+
     '<p class="gnote a3hint">'+ast("hint")+'</p><p class="gnote a3nogl">'+ast("nogl")+'</p><p class="gnote">'+ast("illus3d")+"</p></div>"+
   '<div class="axpanel" id="axPanel"></div></div>'+
   '<details class="axcode"><summary>'+ast("code")+" · "+ast("codeNote")+'</summary><pre dir="ltr"><code id="axCode"></code></pre></details></section>';
}
function ardsimMount(){
  const sec=document.querySelector("#arduinoBody .a3sec");if(!sec)return;
  ardsimPanel();
  if(!sec.dataset.wired){ardsimWire(sec);sec.dataset.wired="1";}
  ard3dMount($("a3host")).then(ok=>{if(!ok)sec.classList.add("nogl-on");});
}
