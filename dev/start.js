/* start the page: runs last, after app.js and bench.js */
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot)hot.snapshot(()=>({st,src:$("src").value,ex:$("example").value,dipA,dipD,prog,order,fault,faultTries}));
if(hot&&hot.ready)hot.ready(boot);else boot((hot&&hot.data)||{});
