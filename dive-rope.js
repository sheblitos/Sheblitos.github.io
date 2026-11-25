/* Barcelona Freedivers · dive-depth scroll indicator (rope + descending diver), carried over from the original homepage */
(function(){
  var panel=document.getElementById('diveRope'); if(!panel) return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var diver=document.getElementById('drDiver'), rig=document.getElementById('drRig'),
      legsG=document.getElementById('drLegs'), legImg=document.getElementById('drLegImg'),
      bubbles=document.getElementById('drBubbles');
  var ticks=[].slice.call(panel.querySelectorAll('.dr-tick'));
  var XL='http://www.w3.org/1999/xlink';
  var TOP=112, halfH=40, travelH=300, KICK=[0,1,2,1];
  var LEGS=[{h:'/diver-legs-1-teal.png',x:-1.8,y:-42.0,w:175,ht:63},
            {h:'/diver-legs-2-teal.png',x:-1.8,y:-17.7,w:167,ht:34},
            {h:'/diver-legs-3-teal.png',x:-1.8,y:-42.3,w:163,ht:82}];
  function layout(){ travelH=Math.max(160,(window.innerHeight-150)-TOP);
    halfH=(diver.getBoundingClientRect().height/2)||40;
    ticks.forEach(function(t){ t.style.top=(TOP+(+t.dataset.depth/60)*travelH-1)+'px'; }); }
  var curLeg=-1;
  function setLeg(i){ if(i===curLeg)return; curLeg=i; var L=LEGS[i];
    try{legImg.setAttributeNS(XL,'href',L.h);}catch(e){} legImg.setAttribute('href',L.h);
    legImg.setAttribute('x',L.x); legImg.setAttribute('y',L.y);
    legImg.setAttribute('width',L.w); legImg.setAttribute('height',L.ht); }
  function maxScroll(){ return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
  function put(prog){ var hy=TOP+prog*travelH; diver.style.top=(hy-halfH)+'px';
    var d=prog*60;
    ticks.forEach(function(t){ t.classList.toggle('on', d>=(+t.dataset.depth-1)); }); return hy; }
  layout(); window.addEventListener('resize',layout);
  if(reduce){ var su=function(){ var p=Math.max(0,Math.min(1,window.scrollY/maxScroll()));
      rig.setAttribute('transform','rotate('+(p<=0.02?0:-90)+')'); setLeg(1); put(p); };
    su(); window.addEventListener('scroll',su,{passive:true}); return; }
  var prog=0, Ru=0, Rl=0, dirDown=true, kickE=0, phase=0, lastTs=0;
  function step(ts){
    var dt=lastTs?Math.min(50,ts-lastTs):16; lastTs=ts;
    var target=Math.max(0,Math.min(1, window.scrollY/maxScroll()));
    var prev=prog; prog += (target-prog)*0.06; if(Math.abs(target-prog)<0.0003) prog=target;
    var vel=prog-prev, speed=Math.abs(vel), depth=prog*60;
    if(speed>0.00018) dirDown = vel>0;
    var oriT = (prog<=0.02) ? 0 : (dirDown ? -90 : 90);
    Ru += (oriT-Ru)*0.09;
    rig.setAttribute('transform','rotate('+Ru.toFixed(2)+')');
    var duckZ=Math.max(0,Math.min(1, prog/0.07));
    var RlT = dirDown ? 40*Math.sin(Math.PI*duckZ) : 0;
    Rl += (RlT-Rl)*0.15;
    legsG.setAttribute('transform','rotate('+Rl.toFixed(2)+')');
    var kt = (speed>0.0004 && depth>5) ? 1 : 0;
    kickE += (kt-kickE)*0.05;
    if(kickE>0.06){ phase += dt*0.010*(0.25+kickE); setLeg(KICK[Math.floor(phase)%4]); }
    else setLeg(1);
    var hy=put(prog);
    if(kickE>0.3 && depth>6 && Math.random()<0.05) spawn(hy);
    requestAnimationFrame(step);
  }
  function spawn(y){ if(!bubbles)return; var b=document.createElement('div'); b.className='dr-bubble';
    var sz=2+Math.random()*4, drift=(Math.random()-0.5)*16;
    b.style.cssText='width:'+sz+'px;height:'+sz+'px;right:'+(14+Math.random()*24)+'px;top:'+(y+10)+'px';
    bubbles.appendChild(b); var dur=1800+Math.random()*1400, t0=performance.now();
    (function tick(now){ var p=(now-t0)/dur; if(p>=1){b.remove();return;} b.style.transform='translate('+(Math.sin(p*Math.PI*3)*drift)+'px,'+(-p*92)+'px)'; b.style.opacity=Math.max(0,.5*(1-p)); requestAnimationFrame(tick); })(t0);
  }
  requestAnimationFrame(step);
})();
