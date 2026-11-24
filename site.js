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
  var map=[['/packages','/packages'],['/courses','/packages'],['/freediving-course-barcelona','/packages'],['/es/curso','/packages'],
           ['/training','/training'],['/es/entrenamiento','/training'],['/expeditions','/expeditions'],['/freediving-trips','/expeditions'],
           ['/team-building','/team-building'],['/corporate-team-building','/team-building'],
           ['/about','/about'],['/barcelona','/about'],['/learn','/learn'],['/blog','/blog'],['/faq','/faq']];
  var key=null; map.forEach(function(m){if(!key&&path.indexOf(m[0])===0) key=m[1];});
  if(key) document.querySelectorAll('.bf-links a,.bf-mob a').forEach(function(a){if(a.getAttribute('href')===key) a.classList.add('active');});
})();
