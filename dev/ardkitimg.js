/* Makes img/arduino-kit.png (home card picture): the flat Arduino board drawing with its components, rendered from the built page. Run: node dev/ardkitimg.js */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await p.addInitScript(()=>{localStorage.setItem("cpuTrainer.lang","en");localStorage.removeItem("ardBlocks.v1");});
await p.goto('file://'+require('path').resolve(__dirname,'..','index.html')+'#arduino');await p.waitForTimeout(800);
await p.evaluate(()=>{const s=document.getElementById('afSvg');s.style.width='1500px';s.style.position='fixed';s.style.left='0';s.style.top='0';s.style.zIndex='999';s.style.background='transparent';
 document.body.style.visibility='hidden';s.style.visibility='visible';SIM.out.lcd=["Hello, world!","Temp: 24.5 C"];SIM.out.led=255;SIM.out.servo=60;SIM.out.power=true;afShow(SIM.out);});
await p.waitForTimeout(500);
await (await p.$('#afSvg')).screenshot({path:''+require('path').resolve(__dirname,'..','img','arduino-kit.png')+'',omitBackground:true});
await b.close();})();
