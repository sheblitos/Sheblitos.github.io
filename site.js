/* Barcelona Freedivers · shared header behaviour (menu, active link, shadow on scroll) */
(function(){
  var nav=document.getElementById('navbar'), ham=document.getElementById('navHam'), menu=document.getElementById('navMobile');
  function setOpen(open){
    if(!ham||!menu) return;
    ham.classList.toggle('open',open); menu.classList.toggle('open',open);
    ham.setAttribute('aria-expanded',String(open));
    document.body.style.overflow=open?'hidden':'';
  }
  window.toggleMobileNav=function(){setOpen(!(menu&&menu.classList.contains('open')));};
  window.closeMobileNav=function(){setOpen(false);};
  if(ham) ham.addEventListener('click',window.toggleMobileNav);
  if(menu) menu.addEventListener('click',function(e){if(e.target.closest('a')) setOpen(false);});
  window.addEventListener('resize',function(){if(window.innerWidth>1080) setOpen(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape') setOpen(false);});
  if(nav){var onScroll=function(){nav.classList.toggle('scrolled',window.scrollY>10);};window.addEventListener('scroll',onScroll,{passive:true});onScroll();}
  /* highlight the current section */
  var path=location.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'').replace(/\/$/,'')||'/';
  var map=[['/courses','/courses'],['/training','/training'],
           ['/trips','/trips'],['/freediving-trips','/trips'],['/team-building','/team-building'],['/about','/about']];
  var key=null; map.forEach(function(m){if(!key&&path.indexOf(m[0])===0) key=m[1];});
  if(key) document.querySelectorAll('.bf-links a,.bf-mob a').forEach(function(a){if(a.getAttribute('href')===key) a.classList.add('active');});
})();

/* Swipe rows on phones: dot indicators */
(function(){
  if(!window.matchMedia('(max-width:640px)').matches) return;
  document.querySelectorAll('.bf-swipe,.why.cols-3,.pkgs').forEach(function(row){
    var items=[].slice.call(row.children); if(items.length<2) return;
    var dots=document.createElement('div'); dots.className='bf-dots'; dots.setAttribute('aria-hidden','true');
    items.forEach(function(_,i){var d=document.createElement('i'); if(!i) d.className='on'; dots.appendChild(d);});
    row.parentNode.insertBefore(dots,row.nextSibling);
    var t; row.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){
      var best=0,bd=1e9; items.forEach(function(el,i){var d=Math.abs(el.offsetLeft-row.offsetLeft-row.scrollLeft); if(d<bd){bd=d;best=i;}});
      if(row.scrollLeft+row.clientWidth>=row.scrollWidth-4) best=items.length-1;
      [].forEach.call(dots.children,function(d,i){d.className=i===best?'on':'';});
    },60);},{passive:true});
  });
})();
