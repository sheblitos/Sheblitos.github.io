/* =====================================================================
   EXTour MVP · app layer
   Store (relational tables behind an adapter) → Session → Policy →
   Services (business rules, notifications, analytics) → Screens.
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   Icons, brand mark, scene art, stylised maps (presentation assets)
   --------------------------------------------------------------------- */
const IP = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  map:'<path d="M9 4 3.5 6.3v13.5L9 17.5l6 2.5 5.5-2.3V4.2L15 6.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  users:'<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 5.2a3.3 3.3 0 0 1 0 6.6M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
  msg:'<path d="M20 15.5a2 2 0 0 1-2 2H8.5L4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
  bookmark:'<path d="M6.5 3.5h11v17l-5.5-4-5.5 4z"/>',
  bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', back:'<path d="M15 5 8 12l7 7"/>', chev:'<path d="m9 5 7 7-7 7"/>', down:'<path d="m6 9 6 6 6-6"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  star:'<path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>',
  shield:'<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>', send:'<path d="M4 12 20 4l-5 16-3.5-6.5z"/><path d="M11.5 13.5 20 4"/>',
  globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.7 3.5 5.5 3.5 8.5s-1 5.8-3.5 8.5c-2.5-2.7-3.5-5.5-3.5-8.5s1-5.8 3.5-8.5z"/>',
  share:'<path d="M12 3.5v12M7.5 8 12 3.5 16.5 8"/><path d="M5 13v6.5h14V13"/>',
  explore:'<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
  layers:'<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/>', list:'<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>', route:'<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 17.5c6 0 2-11 8-11"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  wave2:'<path d="M3 13c2.5 0 3-2 5.5-2s3 2 5.5 2 3-2 5.5-2"/>', flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', level:'<path d="M5 19v-4M10 19v-7M15 19V9M20 19V5"/>',
  logout:'<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h10"/>', swap:'<path d="M7 4 3.5 7.5 7 11M3.5 7.5H18M17 13l3.5 3.5L17 20M20.5 16.5H6"/>',
  chart:'<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>', refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>', trash:'<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  freediving:'<circle cx="8.5" cy="4.8" r="1.5"/><circle cx="12.8" cy="3.6" r=".9"/><path d="M12 8v12.5M7.5 16 12 20.5l4.5-4.5"/>',
  surfing:'<path d="M3 15.5c2.5 0 3-2 5.5-2s3 2 5.5 2 3-2 5.5-2"/><path d="M3 19.5c2.5 0 3-2 5.5-2s3 2 5.5 2 3-2 5.5-2"/><path d="M6.5 11.5C7 7 10.5 4.2 15 4.6c-2.6 1.3-3.4 3.6-2.7 6.4"/>',
  climbing:'<path d="M9.2 4.2h5.2a4.2 4.2 0 0 1 4 5.5l-2.7 8.6a2.7 2.7 0 0 1-2.6 1.9h-1.4a3.3 3.3 0 0 1-3.2-4.1L10.3 9"/><path d="M9.2 4.2 7.4 11.3"/>',
  kitesurfing:'<path d="M3.5 9.5C6 5 18 5 20.5 9.5c-2 0-3.2 1-4.2 2.4C14.5 10.4 9.5 10.4 7.7 12 6.7 10.5 5.5 9.5 3.5 9.5z"/><path d="M7.7 12 12 20.5l4.3-8.6"/>',
  hiking:'<path d="M3 19.5 9 9.5l3.6 5.2L15 11.2l6 8.3z"/><circle cx="16.5" cy="5.5" r="1.6"/>',
  spearfishing:'<path d="M2.5 12h12"/><path d="m12 9.5 2.5 2.5-2.5 2.5"/><path d="M15.5 12c1.6-2.6 4.2-2.9 6-.9-1.8 2.1-4.4 1.8-6 .9z"/><path d="M21.5 11.1v1.8"/>',
  scuba:'<rect x="3.5" y="8.5" width="14" height="8" rx="3.5"/><path d="M10.5 12.5h.01"/><path d="M20.5 4.5v8a3 3 0 0 1-3 3"/>'
};
const ico = (n, s = '') => `<svg class="ico" viewBox="0 0 24 24" ${s ? `style="width:${s}px;height:${s}px"` : ''} aria-hidden="true">${IP[n] || IP.route}</svg>`;
const MARK = (s = 26) => `<svg class="mark" viewBox="0 0 32 32" style="width:${s}px;height:${s}px" aria-hidden="true"><path d="M8 24 24 8" stroke-width="4.2"/><path d="M8 8c5 1.4 6.4 5 8 8s3 6.6 8 8" stroke-width="4.2"/></svg>`;

let artN = 0;
const fig = (x, y, s = 1, c = '#13201B') => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cy="-23" r="4.2"/><path d="M-4.5-18h9l2 12h-3l-1.2 14h-3.6L-2-6h-2l-1.3 14h-3.6L-7-6h-3z" transform="translate(1 0)"/></g>`;
const ARTS = {
  deep:{sky:['#2A6C96','#071A2A'], d:()=>`<path d="M110 0h40L90 260H30z" fill="#fff" opacity=".07"/><path d="M190 0h26l-14 260h-60z" fill="#fff" opacity=".05"/><path d="M300 0h30l40 260h-50z" fill="#fff" opacity=".05"/><rect width="400" height="22" fill="#7EC0DE" opacity=".45"/><path d="M0 22c40-4 80 4 120 0s80-4 120 0 100 4 160 0" stroke="#CFE8F3" stroke-width="1.5" fill="none" opacity=".6"/><circle cx="254" cy="18" r="10" fill="#EE7E36"/><path d="M254 28V260" stroke="#F3EFE5" stroke-width="1.3" opacity=".75"/>${fig(282,26,.8,'#0B1520')}<g transform="translate(266 150)" fill="#0A1520"><ellipse rx="4.6" ry="15"/><circle cy="18" r="5"/><path d="M-4-12-8-44h12L4-12z"/></g><g fill="#CFE8F3" opacity=".55"><circle cx="262" cy="118" r="2.4"/><circle cx="268" cy="98" r="1.8"/><circle cx="259" cy="80" r="1.4"/></g>`},
  reef:{sky:['#3C9CB8','#0D3B57'], d:()=>`<path d="M0 205c40-20 70-8 100-22s60-30 100-12 70 26 110 10 70-6 90 2V260H0z" fill="#E0B36E" opacity=".85"/><path d="M40 205c4-30 18-40 14-60M60 200c10-26 0-40 12-56M330 210c-6-28 6-40 0-60" stroke="#E86E5A" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M140 0h30l-40 260H90z" fill="#fff" opacity=".08"/><g transform="translate(200 110) rotate(-80)" fill="#0B2232"><ellipse rx="5" ry="16"/><circle cy="19" r="5"/><path d="M-4-13-9-46h13L4-13z"/></g>`},
  pool:{sky:['#8FD3E2','#3E9AB4'], d:()=>`${[0,1,2,3,4,5].map(k=>`<path d="M${-20+k*80} 0 L${-90+k*90} 260" stroke="#F3EFE5" stroke-width="5" stroke-dasharray="14 10" opacity=".75"/>`).join('')}<path d="M0 60c60-10 120 10 200 0s140-10 200 0" stroke="#fff" opacity=".25" stroke-width="18" fill="none"/><g transform="translate(220 150) rotate(-100)" fill="#123448"><ellipse rx="5" ry="18"/><circle cy="21" r="5.5"/><path d="M-6-15-14-52H8L6-15z"/></g>`},
  surf:{sky:['#F5CA97','#E38A60'], d:()=>`<circle cx="300" cy="78" r="34" fill="#FBE5BC"/><path d="M0 150h400v110H0z" fill="#1E6C76"/><path d="M0 182c70-14 130-60 210-54 44 3 56 34 36 46 44-8 92 6 154 0v86H0z" fill="#2A8A8E"/><path d="M210 128c28 2 42 24 32 40" stroke="#F3EFE5" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/><path d="M0 230h400v30H0z" fill="#E5C79D"/>${fig(70,236,1.1)}<path d="M80 236l10-46" stroke="#F3EFE5" stroke-width="6" stroke-linecap="round"/>${fig(104,238,1.05,'#1C2622')}<g transform="translate(196 132) rotate(-14)"><path d="M-22 6h44" stroke="#F3EFE5" stroke-width="4" stroke-linecap="round"/>${fig(0,3,.75,'#10201A')}</g>`},
  rock:{sky:['#EBCBA6','#D69B6C'], d:(i)=>`<defs><linearGradient id="${i}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B85A2E"/><stop offset="1" stop-color="#6A2C17"/></linearGradient></defs><path d="M120 0h280v260H70c20-60 10-120 40-170 10-30 0-60 10-90z" fill="url(#${i}w)"/><path d="M180 20l14 60-8 50 18 70M260 0l-10 70 22 60-6 80M330 30l8 90-14 50" stroke="#4E1F10" stroke-width="2.5" fill="none" opacity=".55"/><path d="M226 0c-6 50 10 70 2 110s6 90-6 150" stroke="#F3EFE5" stroke-width="1.6" fill="none" opacity=".85"/><g transform="translate(232 112) rotate(12)" fill="#13201B"><circle cy="-24" r="4.4"/><path d="M-4-19h8l1 12-3 16h-3l1-14h-2l-4 14h-3l4-17z"/><path d="M-3-17-14-30M3-17l12-10" stroke="#13201B" stroke-width="3" stroke-linecap="round"/></g>${fig(200,252,1.05)}`},
  gym:{sky:['#E7DCCB','#CDBDA3'], d:()=>`<path d="M60 0h340v260H120z" fill="#3C5A4E"/>${[[150,40,'#C7F36B'],[210,90,'#E8574A'],[180,150,'#F3EFE5'],[280,60,'#F0B33E'],[320,140,'#C7F36B'],[250,190,'#E8574A'],[340,30,'#F3EFE5']].map(([x,y,c])=>`<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="${c}"/>`).join('')}<path d="M0 230h400v30H0z" fill="#2F3B35"/>${fig(90,236,1.1)}${fig(120,236,1.05,'#1E2A25')}`},
  ridge:{sky:['#DCE6E2','#AFC5C1'], d:()=>`<circle cx="290" cy="70" r="22" fill="#F4E4C3"/><path d="M0 130l60-30 50 20 70-50 60 30 60-40 100 50v150H0z" fill="#8FAAA2"/><path d="M0 170l80-40 70 30 60-30 90 40 100-30v120H0z" fill="#6C8C7D"/><path d="M0 210l90-30 80 20 90-34 140 34v60H0z" fill="#4C6C59"/><path d="M0 240c80-20 160-20 240-10s120 0 160-10v40H0z" fill="#2E4A39"/>${fig(160,230,.9)}${fig(180,232,.85,'#1C2A22')}${fig(198,233,.8)}`},
  kite:{sky:['#C3E3F2','#7BBDE1'], d:()=>`<path d="M0 190h400v70H0z" fill="#2C84B2"/><path d="M0 205c80-6 140 4 220-2s120 6 180 0" stroke="#E4F2F8" stroke-width="2" fill="none" opacity=".6"/><path d="M150 60c40-36 130-36 170 0-14-2-24 4-32 14-30-18-76-18-106 0-8-10-18-16-32-14z" fill="#E8574A"/><path d="M150 60 220 200M320 60 220 200" stroke="#13201B" stroke-width=".8" opacity=".6"/><g transform="translate(222 204)">${fig(0,0,.8,'#0F1E18')}<path d="M-14 4h26" stroke="#F3EFE5" stroke-width="3" stroke-linecap="round"/></g><path d="M0 238h400v22H0z" fill="#E9D3A8"/>${fig(60,246,1)}${fig(84,247,.95,'#1C2622')}`},
  desert:{sky:['#F5D9B7','#E9A57B'], d:()=>`<circle cx="110" cy="70" r="26" fill="#FBEACD"/><path d="M0 150l50-50 40 30 60-70 60 50 50-40 70 50 70-30v180H0z" fill="#C9876A"/><path d="M0 180l70-40 60 30 80-50 70 40 120-20v120H0z" fill="#A6634A"/><path d="M0 200h400v60H0z" fill="#1E9DA0"/><path d="M0 214h400" stroke="#7FD3CF" stroke-width="5" opacity=".7"/><path d="M0 240h400v20H0z" fill="#E7CCA0"/>${fig(250,248,1)}${fig(272,249,.95,'#1C2622')}${fig(296,248,1.02)}`},
  sunrise:{sky:['#2E2C4E','#EE915C'], d:()=>`<circle cx="200" cy="170" r="30" fill="#FBD29A"/><path d="M0 160l70-46 50 26 80-70 80 60 50-26 70 40v116H0z" fill="#3C2B3A"/><path d="M0 200l90-40 80 30 70-30 160 30v70H0z" fill="#2A1F2A"/>${fig(190,96,.8,'#120D14')}${fig(208,97,.75,'#120D14')}`},
  volcano:{sky:['#D9E7EE','#F1D6BB'], d:()=>`<path d="M0 70c60-10 100 6 150-2s110-12 160 0 70 6 90 2v20H0z" fill="#fff" opacity=".6"/><path d="M60 190 170 70h40l110 120z" fill="#6D5748"/><path d="M170 70h40l12 16c-20-6-44-6-64 0z" fill="#E9E1D3"/><path d="M0 200c50-20 100-30 160-20s120-10 240 10v70H0z" fill="#4F5B42"/><path d="M0 222h400v38H0z" fill="#255C7C"/><path d="M0 232c60-4 120 4 200 0s140 4 200 0" stroke="#A9D2E4" stroke-width="2" fill="none" opacity=".6"/>${fig(80,214,.8)}${fig(96,215,.78,'#1C2622')}`},
  city:{sky:['#F2D2B1','#E8B08A'], d:()=>`<circle cx="320" cy="64" r="24" fill="#FBE7C7"/><path d="M0 150c40-30 90-40 130-20v40H0z" fill="#7D8B6E"/><path d="M110 170v-40h14v-20h10v20h18v-30h12v30h16v-50l5-20 5 20v50h10v-60l5-24 5 24v60h12v-30h20v34h16v-20h16v40z" fill="#9A8574"/><path d="M0 168h400v92H0z" fill="#357DA0"/><path d="M0 180c80-4 140 4 220 0s120 4 180 0" stroke="#A5D0E3" stroke-width="2" fill="none" opacity=".6"/><path d="M0 232h400v28H0z" fill="#E6C99E"/>${fig(250,240,1)}<path d="M262 240l14-36" stroke="#F3EFE5" stroke-width="5" stroke-linecap="round"/>${fig(286,241,1,'#1C2622')}${fig(306,240,.96)}`},
  cliffs:{sky:['#CFE2E6','#9DC7D0'], d:()=>`<path d="M0 30c40 10 60 40 70 90s10 100 40 140H0z" fill="#355F34"/><path d="M400 20c-50 20-60 60-80 110s-20 90-60 130h140z" fill="#2B4E2A"/><path d="M60 40c4 60-2 120 10 220" stroke="#E9F2F3" stroke-width="3" opacity=".7" fill="none"/><path d="M0 200h400v60H0z" fill="#1E5D7C"/><path d="M110 214c40-6 90 0 150-6" stroke="#E4F2F8" stroke-width="3" fill="none" opacity=".7"/><g transform="translate(180 208)">${fig(0,0,.7,'#0F1E18')}<path d="M-14 3h26" stroke="#F3EFE5" stroke-width="3" stroke-linecap="round"/></g>`},
  jungle:{sky:['#F7C69F','#E47E5D'], d:()=>`<circle cx="210" cy="120" r="34" fill="#FCE1BC"/><path d="M0 170h400v90H0z" fill="#3A6E80"/><path d="M0 184c80-6 160 4 240-2s100 4 160 0" stroke="#F8C9A0" stroke-width="2" fill="none" opacity=".7"/><g fill="#26261F"><path d="M40 260c6-60 12-120 30-180l5 2c-14 60-20 120-24 178z"/><path d="M72 82c-30-6-50 6-62 20 22-10 42-12 62-14zM72 82c20-20 46-22 64-12-24-2-44 4-64 14zM72 82c-6-26 4-44 18-54-8 18-12 36-14 54zM72 82c28 6 42 26 46 44-14-18-30-30-46-40z"/><path d="M350 260c-2-50-8-100-22-150l-5 2c12 50 16 100 18 148z"/><path d="M327 112c-26-4-40 8-50 20 18-8 34-10 50-12zM327 112c18-16 40-16 54-6-20-2-36 2-54 10zM327 112c4-24 18-36 30-42-10 14-16 28-24 44z"/></g><g transform="translate(200 196)"><path d="M-20 4h40" stroke="#F3EFE5" stroke-width="4" stroke-linecap="round"/><circle cy="-4" r="4" fill="#14201B"/></g>`},
  palms:{sky:['#FFDEB0','#F2A55B'], d:()=>`<circle cx="120" cy="96" r="28" fill="#FFEFD0"/><path d="M0 160h400v100H0z" fill="#2E8B8B"/><path d="M0 230c60-40 140-60 240-56s140 30 160 40v46H0z" fill="#EACB92"/><g fill="#2A2A20"><path d="M300 240c0-60-10-110-30-160l5-2c18 50 30 100 30 162z"/><path d="M272 80c-26-8-46 2-58 14 20-6 40-8 58-10zM272 80c16-20 40-24 58-14-22-2-40 4-58 14zM272 80c-2-24 8-40 22-48-8 16-12 32-16 48z"/></g>${fig(180,214,.9)}${fig(198,212,.88,'#1C2622')}<path d="M190 214l8-30" stroke="#F3EFE5" stroke-width="4" stroke-linecap="round"/>`}
};
/* Cover can be a scene key or an image URL. Unknown keys and broken images fall back to a neutral scene. */
const mediaSrc = ref => { if (typeof ref === 'string' && ref.startsWith('media:')) { const m = Store.get('media', ref.slice(6)); return m ? m.data : null; } return ref; };
function art(cover, cls = '', style = '') {
  if (typeof cover === 'string' && cover.startsWith('media:')) cover = mediaSrc(cover) || 'ridge';
  /* Photos are shown whole (contain) on a blurred copy of themselves, never cropped. A broken image falls back to a neutral scene. */
  if (cover && /^(https?:|data:|\/_blob\/|photos\/)/.test(cover)) { const u = esc(cover); return `<div class="art photo ${cls}" style="${style}"><span class="ph-fill" style="background-image:url('${u}')"></span><img src="${u}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('broken')"></div>`; }
  const k = ARTS[cover] ? cover : 'ridge', P = ARTS[k], i = 'a' + (++artN);
  return `<div class="art ${cls}" style="${style}"><svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${i}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset="1" stop-color="${P.sky[1]}"/></linearGradient></defs><rect width="400" height="260" fill="url(#${i}s)"/>${P.d(i)}</svg></div>`;
}
const REGIONS = {
  bcn:{name:'Barcelona', dest:'barcelona', sea:'#CCDCDA', land:'M0 0H390V170C350 200 322 238 292 268C262 298 248 332 214 362C180 392 142 430 110 470C80 508 40 542 0 580Z',
    extra:'<path d="M60 90c20-14 36-10 40 6s-14 30-32 24-20-20-8-30z" fill="none" stroke="#D4CDBC" stroke-width="1.2"/><path d="M50 84c26-22 58-12 60 12s-26 44-50 34-28-30-10-46z" fill="none" stroke="#D4CDBC" stroke-width="1.2"/><path d="M150 200c30-20 70-14 70 6s-40 30-70 20-20-18 0-26z" fill="none" stroke="#D4CDBC" stroke-width="1.2"/><path d="M58 60c40 80 80 180 100 330" stroke="#C2D3D6" stroke-width="3" fill="none"/><path d="M215 255l70 10-20 40-70-6z" fill="#E1DACB"/><path d="M0 330c80-10 150 0 230-20M120 120c60 30 120 50 230 40" stroke="#E2DCCE" stroke-width="3" fill="none"/>',
    labels:[['Montserrat',72,96],['Collserola',178,212],['Barcelona',236,330],['Garraf',40,470],['Mediterranean Sea',230,560]]},
  tfe:{name:'Tenerife', dest:'tenerife', sea:'#C9DBDE', land:'M60 330C80 260 150 222 220 202C280 182 330 150 362 168C378 184 352 214 322 240C300 300 300 380 270 450C240 520 182 566 130 548C90 530 46 420 60 330Z',
    extra:'<path d="M150 330c10-30 50-36 64-10s-14 46-40 40-30-14-24-30z" fill="none" stroke="#D1C7B5" stroke-width="1.2"/><path d="M130 330c14-50 90-56 106-14s-30 70-70 62-44-26-36-48z" fill="none" stroke="#D1C7B5" stroke-width="1.2"/><path d="M110 330c20-70 130-76 150-18s-46 96-100 84-60-36-50-66z" fill="none" stroke="#D1C7B5" stroke-width="1.2"/><path d="M90 480c60-30 120-40 190-60M200 230c40-10 80-30 140-50" stroke="#E2DCCE" stroke-width="3" fill="none"/>',
    labels:[['Teide',182,356],['Anaga',326,150],['Los Cristianos',58,540],['Atlantic Ocean',196,640]]},
  dhb:{name:'Dahab', dest:'dahab', sea:'#C6DDDC', land:'M0 0H252C240 120 262 200 236 280C214 340 252 420 230 500C214 560 240 640 226 760H0Z',
    extra:'<path d="M40 200c30-30 70-20 70 10s-50 40-70 24-14-24 0-34z" fill="none" stroke="#D3C8B4" stroke-width="1.2"/><path d="M20 300c40-40 100-26 100 10s-70 50-96 30-20-30-4-40z" fill="none" stroke="#D3C8B4" stroke-width="1.2"/><path d="M30 500c40-30 90-20 90 14s-60 40-86 26-16-30-4-40z" fill="none" stroke="#D3C8B4" stroke-width="1.2"/><path d="M200 60c10 120-10 300 0 640" stroke="#E2DCCE" stroke-width="3" fill="none"/><path d="M228 560c20 20 40 50 30 90" stroke="#A7CFCB" stroke-width="10" fill="none" opacity=".6"/>',
    labels:[['Mount Sinai',52,124],['Asala',172,318],['Dahab',176,470],['Red Sea',316,520]]}
};
/* Projection layer: entities store lat/lng; the stylised map projects them through each region's box.
   Swapping in Mapbox later means replacing project()/mapSVG(), not the data or the screens. */
const BBOX = (window.EXTOUR_SEED || {}).BBOX || {};
const project = (rk, lat, lng) => { const b = BBOX[rk]; if (!b || lat == null) return null; const x = (lng - b.lng[0]) / (b.lng[1] - b.lng[0]) * 390, y = (lat - b.lat[0]) / (b.lat[1] - b.lat[0]) * 700; return (x < 0 || x > 390 || y < 0 || y > 700) ? null : [x, y]; };

/* ---------------------------------------------------------------------
   Utilities
   --------------------------------------------------------------------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const goAttr = (s, p = {}) => `data-go="${s}" data-p="${esc(JSON.stringify(p))}"`;
const uid = (pre) => `${pre}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const nowIso = () => new Date().toISOString();
const slugify = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const LEVELS = ['Want to try', 'Beginner', 'Intermediate', 'Advanced', 'Professional'];
const MIN_LEVELS = ['All levels', 'Beginner+', 'Intermediate+', 'Advanced+'];
const TYPES = {
  buddy_request:{label:'Buddy request', pro:false}, training:{label:'Training', pro:false}, meetup:{label:'Meetup', pro:false}, community_event:{label:'Community event', pro:false},
  course:{label:'Course', pro:true}, guided_experience:{label:'Guided experience', pro:true}, trip:{label:'Trip', pro:true}, retreat:{label:'Retreat', pro:true}, camp:{label:'Camp', pro:true}, competition:{label:'Competition', pro:true}
};
const PROV_TYPES = { instructor:'Instructor', coach:'Coach', guide:'Guide', school:'School', club:'Club', retreat_organizer:'Retreat organiser', adventure_company:'Adventure company' };
const SPOT_TYPES = { dive_site:'Dive site', training_buoy:'Training buoy', pool:'Pool', surf_break:'Surf break', beach:'Beach', crag:'Crag', climbing_gym:'Climbing gym', bouldering_area:'Bouldering area', trail:'Trail', flat_water:'Flat water' };
const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } };
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };

/* Time: adventures show in the destination's own timezone. */
const tzOf = a => (Store.get('destinations', a.destination_id) || {}).timezone || undefined;
const fmtParts = (iso, tz) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map(p => [p.type, p.value]));
const dayKey = (iso, tz) => { const p = fmtParts(iso, tz); return `${p.year}-${p.month}-${p.day}`; };
const dayIndex = (iso, tz) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso)).map(x => [x.type, x.value])); return Math.round(Date.UTC(+p.year, +p.month - 1, +p.day) / 864e5); };
const hm = (iso, tz) => { const p = fmtParts(iso, tz); return `${p.hour}:${p.minute}`; };
function dateLabel(a) {
  const tz = tzOf(a), s = fmtParts(a.starts_at, tz), df = dayIndex(a.starts_at, tz) - dayIndex(nowIso(), tz);
  const multi = a.ends_at && dayIndex(a.ends_at, tz) - dayIndex(a.starts_at, tz) >= 2;
  if (multi) { const e = fmtParts(a.ends_at, tz); return s.month === e.month ? `${s.day} to ${e.day} ${s.month}` : `${s.day} ${s.month} to ${e.day} ${e.month}`; }
  return `${df === 0 ? 'Today' : df === 1 ? 'Tomorrow' : s.weekday} ${s.day} ${s.month}`;
}
const timeLabel = a => a.ends_at && dayIndex(a.ends_at, tzOf(a)) - dayIndex(a.starts_at, tzOf(a)) >= 2 ? `${dayIndex(a.ends_at, tzOf(a)) - dayIndex(a.starts_at, tzOf(a)) + 1} days` : `${hm(a.starts_at, tzOf(a))}–${hm(a.ends_at, tzOf(a))}`;
const stamp = a => { const p = fmtParts(a.starts_at, tzOf(a)); return { d: p.weekday, n: p.day, m: p.month }; };
const ago = iso => { const s = (Date.now() - new Date(iso)) / 1000; if (s < 60) return 'Now'; if (s < 3600) return `${Math.floor(s / 60)} min`; if (s < 86400) return `${Math.floor(s / 3600)} h`; if (s < 172800) return 'Yesterday'; return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso)); };
const agoText = iso => { const a = ago(iso); return a === 'Now' ? 'just now' : /min|h$/.test(a) ? a + ' ago' : a === 'Yesterday' ? 'yesterday' : 'on ' + a; };
const clock = iso => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
function weekendRange() { const d = new Date(); const dow = d.getDay(); const toFri = dow === 0 ? -2 : dow === 6 ? -1 : 5 - dow; const fri = new Date(d); fri.setDate(d.getDate() + toFri); fri.setHours(0, 0, 0, 0); const mon = new Date(fri); mon.setDate(fri.getDate() + 3); return [fri.toISOString(), mon.toISOString()]; }

/* ---------------------------------------------------------------------
   Analytics. Funnel events, kept small and local. North Star is computed
   from data (completed adventures per month), never from screen time.
   --------------------------------------------------------------------- */
const Analytics = {
  key: 'extour.v2.events',
  track(name, props = {}) {
    const ev = { name, props, profile_id: Session.id || null, at: nowIso() };
    try { const l = JSON.parse(ls(this.key) || '[]'); l.push(ev); ls(this.key, JSON.stringify(l.slice(-300))); } catch (e) {}
    if (window.console) console.debug('[analytics]', name, props);
  },
  counts() { try { return JSON.parse(ls(this.key) || '[]').reduce((m, e) => (m[e.name] = (m[e.name] || 0) + 1, m), {}); } catch (e) { return {}; } }
};
const FUNNEL = ['signup_completed', 'onboarding_completed', 'sport_selected', 'destination_viewed', 'sport_viewed', 'adventure_viewed', 'join_clicked', 'join_requested', 'join_approved', 'join_declined', 'participant_left', 'checkin_confirmed', 'adventure_completed', 'return_visit', 'adventure_saved', 'adventure_created', 'buddy_request_created', 'message_sent', 'adventure_cancelled'];

/* ---------------------------------------------------------------------
   Store: relational tables in memory, persisted through an adapter.
   CloudAdapter = the artifact's shared database (realtime, all viewers).
   LocalAdapter = this browser only (local preview, signed-out viewers).
   Supabase later: implement the same 4 methods against supabase-js.
   --------------------------------------------------------------------- */
const TABLES = ['sports', 'destinations', 'destination_sports', 'spots', 'providers', 'provider_members', 'profiles', 'user_sports', 'adventures', 'adventure_participants', 'conversations', 'conversation_members', 'messages', 'saved_items', 'notifications', 'media', 'reviews', 'reports', 'blocks', 'series', 'series_follows'];
const Store = {
  t: Object.fromEntries(TABLES.map(t => [t, new Map()])),
  adapter: null, status: 'loading', error: null, listeners: new Set(),
  all(t) { return [...this.t[t].values()]; },
  get(t, id) { return id == null ? undefined : this.t[t].get(id); },
  filter(t, fn) { const out = []; for (const r of this.t[t].values()) if (fn(r)) out.push(r); return out; },
  find(t, fn) { for (const r of this.t[t].values()) if (fn(r)) return r; },
  changed() { this.listeners.forEach(f => f()); },
  replaceTable(t, rows) { this.t[t] = new Map(rows.map(r => [r.id, r])); this.changed(); },
  async put(t, row) { const prev = this.t[t].get(row.id); this.t[t].set(row.id, row); this.changed(); try { await this.adapter.put(t, row); } catch (e) { prev ? this.t[t].set(row.id, prev) : this.t[t].delete(row.id); this.changed(); throw e; } return row; },
  async patch(t, id, patch) { const prev = this.t[t].get(id); if (!prev) throw new Error('missing'); const next = { ...prev, ...patch }; this.t[t].set(id, next); this.changed(); try { await this.adapter.patch(t, id, patch, next); } catch (e) { this.t[t].set(id, prev); this.changed(); throw e; } return next; },
  async del(t, id) { const prev = this.t[t].get(id); if (!prev) return; this.t[t].delete(id); this.changed(); try { await this.adapter.del(t, id); } catch (e) { this.t[t].set(id, prev); this.changed(); throw e; } }
};

const LocalAdapter = {
  mode: 'local', label: 'This browser only', key: 'extour.v2.db',
  async load() {
    let data = null; try { data = JSON.parse(ls(this.key) || 'null'); } catch (e) {}
    if (!data || !data.meta || !data.meta.seed || (data.meta.seed.version || 0) < 4) data = this.fresh(); /* new demo content resets old copies */
    TABLES.forEach(t => Store.t[t] = new Map(Object.entries(data[t] || {})));
    this.save();
    window.addEventListener('storage', e => { if (e.key === this.key && e.newValue) { try { const d = JSON.parse(e.newValue); TABLES.forEach(t => Store.t[t] = new Map(Object.entries(d[t] || {}))); Store.changed(); } catch (er) {} } });
  },
  fresh() { const seed = EXTOUR_SEED.build(new Date()); const d = { meta: { seed: seed.meta[0] } }; TABLES.forEach(t => d[t] = Object.fromEntries((seed[t] || []).map(r => [r.id, r]))); return d; },
  _t: null,
  save() { clearTimeout(this._t); this._t = setTimeout(() => { const d = { meta: { seed: true } }; TABLES.forEach(t => d[t] = Object.fromEntries(Store.t[t])); try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) { toast('This browser is out of storage. Remove a photo or reset the demo data.'); } }, 120); },
  async put() { this.save(); }, async patch() { this.save(); }, async del() { this.save(); },
  reset() { ls(this.key, null); location.reload(); }
};

const CloudAdapter = {
  mode: 'cloud', label: 'Shared database', db: null, chains: new Map(), unsub: [],
  async load(db) {
    this.db = db;
    let pending = new Set(TABLES);
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 15000);
      TABLES.forEach(t => {
        const un = db.collection(t).onSnapshot(snap => {
          Store.t[t] = new Map(snap.docs.map(d => { const v = d.data(); return [d.id, { ...v, id: d.id }]; }));
          /* The first delivery can be an empty cached view; only a server-definitive snapshot (or real rows) counts as loaded. */
          if (pending.has(t) && (!snap.metadata.fromCache || snap.size)) { pending.delete(t); if (!pending.size) { clearTimeout(timer); resolve(); } }
          if (Store.status === 'empty' && Store.t.sports.size) { Store.status = 'ready'; Session.restore(); }
          if (Store.status !== 'loading') scheduleRender();
        }, err => { Store.error = err; scheduleRender(); });
        this.unsub.push(un);
      });
    });
  },
  /* One write at a time per document, as the store asks. */
  run(t, id, fn) { const k = t + '/' + id; const p = (this.chains.get(k) || Promise.resolve()).then(fn, fn); this.chains.set(k, p.catch(() => {})); return p; },
  clean(row) { const o = {}; for (const [k, v] of Object.entries(row)) if (v !== undefined) o[k] = v; return o; },
  put(t, row) { return this.run(t, row.id, () => this.db.collection(t).doc(row.id).set(this.clean(row))); },
  patch(t, id, patch, next) { return this.run(t, id, () => this.db.collection(t).doc(id).set(this.clean(next))); },
  del(t, id) { return this.run(t, id, () => this.db.collection(t).doc(id).delete()); },
  async seed(onProgress) {
    /* Never overwrite live data: if rows exist on the server, just use them. */
    const probe = await this.db.collection('sports').limit(1).get(); if (!probe.empty) return 'exists';
    const seed = EXTOUR_SEED.build(new Date()); const rows = TABLES.flatMap(t => (seed[t] || []).map(r => [t, r])); let n = 0; for (const [t, r] of rows) { await this.db.collection(t).doc(r.id).set(this.clean(r)); n++; if (onProgress && n % 10 === 0) onProgress(n, rows.length); } }
};

/* ---------------------------------------------------------------------
   Session / auth. Demo accounts and self-created profiles work today.
   Email and Google sign-in plug into Auth.providers once Supabase Auth
   credentials exist; screens only ever read Session.id / Session.me.
   --------------------------------------------------------------------- */
const Session = {
  key: 'extour.v2.session', viewerId: null, user: null,
  get id() { return this._id || null; },
  get me() { return Store.get('profiles', this._id) || null; },
  restore() {
    const saved = ss(this.key) || ls(this.key);
    if (saved && Store.get('profiles', saved)) this._id = saved;
    else if (this.viewerId) { const own = Store.find('profiles', p => p.auth_id === this.viewerId); if (own) this._id = own.id; }
  },
  signInAs(id) { this._id = id; ss(this.key, id); ls(this.key, id); UI.resetNav(); Live.prime(); },
  signOut() { this._id = null; ss(this.key, null); ls(this.key, null); UI.resetNav(); }
};
const Auth = {
  providers: { email: { ready: false, label: 'Continue with email' }, google: { ready: false, label: 'Continue with Google' }, apple: { ready: false, label: 'Continue with Apple' } }
};

/* ---------------------------------------------------------------------
   Policy. Mirrors supabase/schema.sql row level security. Every write in
   Services goes through these checks, so the UI cannot do what the
   database would refuse.
   --------------------------------------------------------------------- */
const Policy = {
  memberships: pid => Store.filter('provider_members', m => m.profile_id === (pid || Session.id)),
  isProviderMember: (provId, pid) => Policy.memberships(pid).some(m => m.provider_id === provId),
  canListProfessional: () => Policy.memberships().length > 0,
  isHost: a => !!a && a.host_id === Session.id,
  canManage: a => !!a && (a.host_id === Session.id || (a.provider_id && Policy.memberships().some(m => m.provider_id === a.provider_id && m.role === 'owner'))),
  canEditProfile: pid => pid === Session.id,
  canAccessConversation(c) {
    if (!c || !Session.id) return false;
    const member = !!Store.get('conversation_members', `cm_${c.id}_${Session.id}`);
    if (c.type === 'direct') return member;
    const a = Store.get('adventures', c.adventure_id); if (!a) return false;
    return Policy.canManage(a) || ['approved', 'completed'].includes((Q.myPart(a) || {}).status);
  },
  assert(ok, msg) { if (!ok) { const e = new Error(msg || 'Not allowed'); e.policy = true; throw e; } }
};

/* ---------------------------------------------------------------------
   Queries (read model). Everything on screen is computed from rows.
   --------------------------------------------------------------------- */
const Q = {
  sport: id => Store.get('sports', id), dest: id => Store.get('destinations', id), spot: id => Store.get('spots', id), prov: id => Store.get('providers', id), prof: id => Store.get('profiles', id),
  sportsActive: () => Store.filter('sports', s => s.status === 'active').sort((a, b) => a.sort - b.sort),
  destsSorted: () => Store.all('destinations').sort((a, b) => a.sort - b.sort),
  destSports: did => Store.filter('destination_sports', r => r.destination_id === did).map(r => Q.sport(r.sport_id)).filter(Boolean).sort((a, b) => a.sort - b.sort),
  level: (pid, sid) => { const r = Store.get('user_sports', `us_${pid}_${sid}`) || Store.find('user_sports', u => u.profile_id === pid && u.sport_id === sid); return r ? r.level : undefined; },
  userSports: pid => Store.filter('user_sports', u => u.profile_id === pid).sort((a, b) => b.level - a.level),
  parts: aid => Store.filter('adventure_participants', p => p.adventure_id === aid),
  going: a => Q.parts(a.id).filter(p => p.status === 'approved' || p.status === 'completed'),
  goingIds: a => Q.going(a).sort((x, y) => (x.role === 'host' ? -1 : 0) - (y.role === 'host' ? -1 : 0)).map(p => p.profile_id),
  pending: a => Q.parts(a.id).filter(p => p.status === 'requested').sort((x, y) => x.created_at.localeCompare(y.created_at)),
  myPart: (a, pid) => Store.get('adventure_participants', `ap_${a.id}_${pid || Session.id}`),
  ended: a => new Date(a.ends_at || a.starts_at) < new Date(),
  started: a => new Date(a.starts_at) < new Date(),
  status(a) { if (['cancelled', 'draft'].includes(a.status)) return a.status; if (a.status === 'completed' || Q.ended(a)) return 'completed'; if (Q.going(a).length >= a.capacity) return 'full'; return 'published'; },
  myState(a) { if (!Session.id) return 'guest'; if (a.host_id === Session.id) return 'host'; const p = Q.myPart(a); return p ? p.status : 'none'; },
  listed: () => Store.filter('adventures', a => a.visibility === 'public' && ['published', 'full'].includes(Q.status(a))).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
  inDest: (d, sid) => Q.listed().filter(a => a.destination_id === d && (!sid || a.sport_id === sid)),
  forSport: (sid, d) => Q.listed().filter(a => a.sport_id === sid && (!d || a.destination_id === d)),
  activeCount: d => Q.inDest(d).length,
  saved: (type, id) => !!Session.id && !!Store.get('saved_items', `si_${Session.id}_${type}_${id}`),
  myAdventures() {
    const me = Session.id, mine = Store.filter('adventure_participants', p => p.profile_id === me).map(p => [p, Store.get('adventures', p.adventure_id)]).filter(([, a]) => a);
    const upcoming = mine.filter(([p, a]) => p.status === 'approved' && !['completed', 'cancelled'].includes(Q.status(a))).map(([, a]) => a).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const requests = mine.filter(([p, a]) => p.status === 'requested' && !['completed', 'cancelled'].includes(Q.status(a))).map(([, a]) => a);
    const hosting = Store.filter('adventures', a => a.host_id === me && !['completed', 'cancelled'].includes(Q.status(a))).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const past = mine.filter(([p, a]) => ['approved', 'completed'].includes(p.status) && Q.status(a) === 'completed').map(([, a]) => a).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    return { upcoming, requests, hosting, past };
  },
  conversationsForMe() { return Store.filter('conversations', c => Policy.canAccessConversation(c)).sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || '')); },
  messages: cid => Store.filter('messages', m => m.conversation_id === cid).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  unread(c) { const m = Store.get('conversation_members', `cm_${c.id}_${Session.id}`); const since = m ? m.last_read_at : ''; return Q.messages(c.id).filter(x => x.sender_id && x.kind !== 'system' && x.sender_id !== Session.id && x.created_at > (since || '')).length; },
  notifications() {
    const stored = Store.filter('notifications', n => n.profile_id === Session.id);
    /* "Adventure is tomorrow" is derived, so it never needs a scheduled job in the MVP. */
    const soon = Q.myAdventures().upcoming.concat(Q.myAdventures().hosting).filter((a, i, arr) => arr.indexOf(a) === i && dayIndex(a.starts_at, tzOf(a)) - dayIndex(nowIso(), tzOf(a)) === 1)
      .map(a => ({ id: 'derived_tomorrow_' + a.id, type: 'adventure_tomorrow', adventure_id: a.id, profile_id: Session.id, created_at: nowIso(), read_at: ls('extour.v2.read.' + a.id) || null, derived: true }));
    return stored.concat(soon).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  homeDest(p = Session.me) { if (!p) return 'barcelona'; return (p.location_sharing && p.current_destination_id) || p.home_destination_id || p.current_destination_id || 'barcelona'; },
  peopleIn: d => Store.filter('profiles', p => p.id !== Session.id && (p.home_destination_id === d || (p.location_sharing && p.current_destination_id === d))),
  completedThisMonth(offset = 0) { const n = new Date(); const m0 = new Date(n.getFullYear(), n.getMonth() - offset, 1), m1 = new Date(n.getFullYear(), n.getMonth() - offset + 1, 1); return Store.filter('adventures', a => Q.status(a) === 'completed' && a.status !== 'cancelled' && new Date(a.ends_at) >= m0 && new Date(a.ends_at) < m1 && Q.going(a).length >= 2).length; }
};

/* ---------------------------------------------------------------------
   Services: the only place that writes. Each method checks Policy,
   writes rows, raises notifications and tracks analytics.
   --------------------------------------------------------------------- */
const Notify = {
  async send(profile_id, type, extra = {}) {
    if (!profile_id || profile_id === Session.id) return;
    await Store.put('notifications', { id: uid('n'), profile_id, type, actor_id: Session.id, adventure_id: null, conversation_id: null, data: {}, read_at: null, created_at: nowIso(), ...extra });
  },
  async toGroup(a, type, extra = {}) { for (const pid of Q.goingIds(a)) if (pid !== Session.id) await Notify.send(pid, type, { adventure_id: a.id, ...extra }); },
  async markRead(n) { if (n.derived) { ls('extour.v2.read.' + n.adventure_id, nowIso()); return; } if (!n.read_at) await Store.patch('notifications', n.id, { read_at: nowIso() }); },
  async markAll() { for (const n of Q.notifications().filter(n => !n.read_at)) await Notify.markRead(n); }
};
const Chat = {
  convFor: aid => Store.get('conversations', `c_${aid}`),
  async ensureAdventureConversation(a) {
    if (!Chat.convFor(a.id)) await Store.put('conversations', { id: `c_${a.id}`, type: 'adventure', adventure_id: a.id, created_at: nowIso(), last_message_at: nowIso() });
    return Chat.convFor(a.id);
  },
  async addMember(cid, pid) { const id = `cm_${cid}_${pid}`; if (!Store.get('conversation_members', id)) await Store.put('conversation_members', { id, conversation_id: cid, profile_id: pid, last_read_at: null }); },
  async removeMember(cid, pid) { await Store.del('conversation_members', `cm_${cid}_${pid}`); },
  async system(cid, body) { await Store.put('messages', { id: uid('m'), conversation_id: cid, sender_id: Session.id, kind: 'system', body, created_at: nowIso() }); await Store.patch('conversations', cid, { last_message_at: nowIso() }); },
  async openDirect(otherId) {
    Policy.assert(Session.id && otherId && otherId !== Session.id, 'Pick someone else to message');
    const mineIds = new Set(Store.filter('conversation_members', m => m.profile_id === Session.id).map(m => m.conversation_id));
    const existing = Store.find('conversations', c => c.type === 'direct' && mineIds.has(c.id) && Store.get('conversation_members', `cm_${c.id}_${otherId}`));
    if (existing) return existing;
    const c = { id: uid('c'), type: 'direct', adventure_id: null, created_at: nowIso(), last_message_at: nowIso() };
    await Store.put('conversations', c); await Chat.addMember(c.id, Session.id); await Chat.addMember(c.id, otherId);
    return c;
  },
  async send(cid, body) {
    const c = Store.get('conversations', cid); body = String(body || '').trim().slice(0, 2000);
    Policy.assert(body, 'Write a message first'); Policy.assert(Policy.canAccessConversation(c), 'Only members can post in this chat');
    const at = nowIso();
    await Store.put('messages', { id: uid('m'), conversation_id: cid, sender_id: Session.id, kind: 'text', body, created_at: at });
    await Store.patch('conversations', cid, { last_message_at: at });
    await Chat.markRead(cid, at);
    /* One unread "new message" notification per person per chat, refreshed instead of stacked. */
    for (const m of Store.filter('conversation_members', m => m.conversation_id === cid && m.profile_id !== Session.id)) {
      const open = Store.find('notifications', n => n.profile_id === m.profile_id && n.type === 'new_message' && n.conversation_id === cid && !n.read_at);
      if (open) await Store.patch('notifications', open.id, { actor_id: Session.id, created_at: at, data: { count: ((open.data || {}).count || 1) + 1 } });
      else await Notify.send(m.profile_id, 'new_message', { conversation_id: cid, adventure_id: c.adventure_id || null, data: { count: 1 } });
    }
    Analytics.track('message_sent', { conversation_type: c.type });
  },
  async markRead(cid, at) { const id = `cm_${cid}_${Session.id}`, m = Store.get('conversation_members', id); if (m && (!m.last_read_at || m.last_read_at < (at || nowIso())) && Q.unread(Store.get('conversations', cid)) + (at ? 1 : 0) > 0) await Store.patch('conversation_members', id, { last_read_at: at || nowIso() }); }
};
const Participation = {
  async join(aid, message = '') {
    const a = Store.get('adventures', aid); Policy.assert(Session.id, 'Sign in to join');
    Policy.assert(a && Q.status(a) === 'published', Q.status(a) === 'full' ? 'This adventure is full' : 'This adventure is not open');
    Policy.assert(a.host_id !== Session.id, 'You are hosting this one');
    const id = `ap_${aid}_${Session.id}`, prev = Store.get('adventure_participants', id);
    Policy.assert(!prev || prev.status === 'cancelled', prev && prev.status === 'declined' ? 'The host declined this request' : 'You already have a request here');
    const status = a.join_mode === 'instant' ? 'approved' : 'requested';
    const row = { id, adventure_id: aid, profile_id: Session.id, role: 'participant', status, message: String(message).slice(0, 500), created_at: prev ? prev.created_at : nowIso(), updated_at: nowIso() };
    await Store.put('adventure_participants', row);
    Analytics.track('join_requested', { adventure_id: aid, mode: a.join_mode, type: a.type });
    if (status === 'approved') { await Participation.afterApproved(a, Session.id); await Notify.send(a.host_id, 'participant_joined', { adventure_id: aid }); }
    else await Notify.send(a.host_id, 'join_requested', { adventure_id: aid });
    return status;
  },
  async afterApproved(a, pid) {
    const c = await Chat.ensureAdventureConversation(a); await Chat.addMember(c.id, pid);
    await Chat.system(c.id, `${(Q.prof(pid) || {}).name || 'Someone'} joined.`);
    if (Q.going(a).length >= a.capacity && a.status === 'published') await Store.patch('adventures', a.id, { status: 'full', updated_at: nowIso() });
  },
  async cancelRequest(aid) { const p = Q.myPart(Store.get('adventures', aid)); Policy.assert(p && p.status === 'requested', 'No pending request'); await Store.patch('adventure_participants', p.id, { status: 'cancelled', updated_at: nowIso() }); },
  async leave(aid) {
    const a = Store.get('adventures', aid), p = Q.myPart(a); Policy.assert(p && p.status === 'approved' && p.role !== 'host', 'You are not on this adventure');
    await Store.patch('adventure_participants', p.id, { status: 'cancelled', updated_at: nowIso() });
    const c = Chat.convFor(aid); if (c) { await Chat.system(c.id, `${Session.me.name} left.`); await Chat.removeMember(c.id, Session.id); }
    if (a.status === 'full') await Store.patch('adventures', aid, { status: 'published', updated_at: nowIso() });
    await Notify.send(a.host_id, 'participant_left', { adventure_id: aid });
  },
  async approve(partId) {
    const p = Store.get('adventure_participants', partId), a = p && Store.get('adventures', p.adventure_id);
    Policy.assert(Policy.canManage(a), 'Only the host can approve'); Policy.assert(p.status === 'requested', 'This request was already answered');
    Policy.assert(Q.going(a).length < a.capacity, 'The adventure is full. Raise the capacity first.');
    await Store.patch('adventure_participants', partId, { status: 'approved', updated_at: nowIso() });
    await Participation.afterApproved(a, p.profile_id);
    await Notify.send(p.profile_id, 'request_approved', { adventure_id: a.id });
    Analytics.track('join_approved', { adventure_id: a.id });
  },
  async decline(partId) {
    const p = Store.get('adventure_participants', partId), a = p && Store.get('adventures', p.adventure_id);
    Policy.assert(Policy.canManage(a), 'Only the host can decline'); Policy.assert(p.status === 'requested', 'This request was already answered');
    await Store.patch('adventure_participants', partId, { status: 'declined', updated_at: nowIso() });
    await Notify.send(p.profile_id, 'request_declined', { adventure_id: a.id });
  }
};
const Adventures = {
  async create(f) {
    Policy.assert(Session.id, 'Sign in to create');
    const pro = TYPES[f.type] && TYPES[f.type].pro;
    if (pro || f.price > 0) Policy.assert(f.provider_id && Policy.isProviderMember(f.provider_id), 'Professional and paid listings need a provider you belong to');
    const sp = f.spot_id ? Q.spot(f.spot_id) : null, id = uid('a'), at = nowIso();
    const a = { id, slug: `${slugify(f.title)}-${id.slice(-5)}`, title: f.title.trim(), sport_id: f.sport_id, type: f.type, description: f.description.trim(), host_id: Session.id, provider_id: f.provider_id || null,
      destination_id: f.destination_id, spot_id: f.spot_id || null, location_name: sp ? sp.name : (Q.dest(f.destination_id) || {}).name, lat: sp ? sp.lat : null, lng: sp ? sp.lng : null,
      meeting_point: f.meeting_point || (sp ? sp.name : ''), meeting_point_exact: f.meeting_point_exact || '', starts_at: f.starts_at, ends_at: f.ends_at, min_level: f.min_level, capacity: f.capacity,
      price: f.price || 0, currency: 'EUR', is_free: !(f.price > 0), cost_note: f.cost_note || '', cover: f.cover, requirements: f.requirements, equipment: f.equipment, join_mode: f.join_mode,
      visibility: 'public', status: 'published', activity: f.activity || '', safety_plan: f.safety_plan || '', created_at: at, updated_at: at };
    await Store.put('adventures', a);
    await Store.put('adventure_participants', { id: `ap_${id}_${Session.id}`, adventure_id: id, profile_id: Session.id, role: 'host', status: 'approved', message: '', created_at: at, updated_at: at });
    const c = await Chat.ensureAdventureConversation(a); await Chat.addMember(c.id, Session.id);
    Analytics.track(a.type === 'buddy_request' ? 'buddy_request_created' : 'adventure_created', { sport: a.sport_id, destination: a.destination_id, type: a.type });
    return a;
  },
  async update(id, patch) {
    const a = Store.get('adventures', id); Policy.assert(Policy.canManage(a), 'Only the host can edit');
    const going = Q.going(a).length; if (patch.capacity != null) Policy.assert(patch.capacity >= going, `${going} people are already going. Capacity cannot be lower.`);
    const next = { ...patch, updated_at: nowIso() };
    if (patch.capacity != null && a.status !== 'cancelled') next.status = going >= patch.capacity ? 'full' : 'published';
    await Store.patch('adventures', id, next);
    await Notify.toGroup(a, 'adventure_updated');
    const c = Chat.convFor(id); if (c) await Chat.system(c.id, 'The host updated the adventure details.');
  },
  async cancel(id, reason) {
    const a = Store.get('adventures', id); Policy.assert(Policy.canManage(a), 'Only the host can cancel');
    await Store.patch('adventures', id, { status: 'cancelled', updated_at: nowIso() });
    await Notify.toGroup(a, 'adventure_cancelled', { data: { reason: reason || '' } });
    for (const p of Q.pending(a)) await Notify.send(p.profile_id, 'adventure_cancelled', { adventure_id: id });
    const c = Chat.convFor(id); if (c) await Chat.system(c.id, `Cancelled by the host.${reason ? ' ' + reason : ''}`);
  },
  async complete(id) {
    const a = Store.get('adventures', id); Policy.assert(Policy.canManage(a), 'Only the host can mark it completed'); Policy.assert(Q.started(a), 'You can mark it completed once it has started');
    for (const p of Q.going(a)) if (p.status !== 'completed') await Store.patch('adventure_participants', p.id, { status: 'completed', updated_at: nowIso() });
    for (const p of Q.pending(a)) await Store.patch('adventure_participants', p.id, { status: 'declined', updated_at: nowIso() });
    await Store.patch('adventures', id, { status: 'completed', updated_at: nowIso() });
    Analytics.track('adventure_completed', { adventure_id: id, participants: Q.going(a).length });
  }
};
const Saved = {
  async toggle(type, itemId) {
    Policy.assert(Session.id, 'Sign in to save');
    const id = `si_${Session.id}_${type}_${itemId}`;
    if (Store.get('saved_items', id)) { await Store.del('saved_items', id); return false; }
    await Store.put('saved_items', { id, profile_id: Session.id, item_type: type, item_id: itemId, created_at: nowIso() });
    if (type === 'adventure') Analytics.track('adventure_saved', { adventure_id: itemId });
    return true;
  }
};
const Profiles = {
  async create(f) {
    const id = uid('p'), at = nowIso();
    const p = { id, username: slugify(f.name).replace(/-/g, '') + id.slice(-3), name: f.name.trim(), avatar: null, bio: f.bio || '', home_destination_id: f.home_destination_id || null, home_location: f.home_location || '',
      current_destination_id: f.home_destination_id || null, location_sharing: false, languages: f.languages, roles: ['traveler'], note: '', verified: [], auth_id: Session.viewerId || null, goals: [...(f.goals || [])], created_at: at };
    await Store.put('profiles', p);
    for (const [sid, level] of Object.entries(f.sports)) await Store.put('user_sports', { id: `us_${id}_${sid}`, profile_id: id, sport_id: sid, level, note: '' });
    Session.signInAs(id);
    Analytics.track('signup_completed', { method: Session.viewerId ? 'claude_account' : 'local' });
    Analytics.track('onboarding_completed', { sports: Object.keys(f.sports).length, goals: (f.goals || []).length });
    return p;
  },
  async update(pid, patch) { Policy.assert(Policy.canEditProfile(pid), 'You can only edit your own profile'); await Store.patch('profiles', pid, patch); },
  async setSports(pid, map) {
    Policy.assert(Policy.canEditProfile(pid), 'You can only edit your own profile');
    for (const r of Q.userSports(pid)) if (!(r.sport_id in map)) await Store.del('user_sports', r.id);
    for (const [sid, level] of Object.entries(map)) { const id = `us_${pid}_${sid}`, prev = Store.get('user_sports', id); if (!prev || prev.level !== level) await Store.put('user_sports', { id, profile_id: pid, sport_id: sid, level, note: prev ? prev.note : '' }); }
  }
};

/* Media: photos are resized on the device and stored as rows, so the prototype keeps working
   with public links. In Supabase these rows point at Storage objects instead (see ARCHITECTURE.md). */
const Media = {
  async encode(file, max) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('decode')); i.src = url; });
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let q = .82, out = c.toDataURL('image/jpeg', q);
      while (out.length > 220000 && q > .4) { q -= .08; out = c.toDataURL('image/jpeg', q); }
      return { data: out, w: c.width, h: c.height };
    } finally { URL.revokeObjectURL(url); }
  },
  async upload(file, kind) {
    Policy.assert(Session.id, 'Sign in to add photos');
    Policy.assert(file && /^image\//.test(file.type || 'image/'), 'Pick a photo, for example a JPEG or PNG');
    let enc; try { enc = await Media.encode(file, kind === 'avatar' ? 360 : 1000); } catch (e) { Policy.assert(false, 'This photo format did not open. Try a JPEG or PNG.'); }
    const id = uid('md');
    await Store.put('media', { id, owner_id: Session.id, kind, data: enc.data, w: enc.w, h: enc.h, created_at: nowIso() });
    return 'media:' + id;
  }
};
/* Inside Claude the app lives at its artifact link; on the web it is wherever the page is served. */
const ON_CLAUDE = !!window.claude || /claude/i.test(location.hostname);
const APP_URL = ON_CLAUDE ? 'https://claude.ai/artifact/Kh34vMv4sJUiimye9rxAiY' : location.origin + location.pathname;
const LINK_KIND = { a: 'adv', d: 'dest', s: 'spot', o: 'provider', u: 'person' };
const LINK_TABLE = { a: 'adventures', d: 'destinations', s: 'spots', o: 'providers', u: 'profiles' };
const shareUrl = (k, id) => `${APP_URL}#${k}.${id}`;
const gcalDate = iso => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function calendarLinks(a) {
  const inside = ['host', 'approved', 'completed'].includes(Q.myState(a));
  const where = inside && a.meeting_point_exact ? `${a.meeting_point || ''}, ${a.meeting_point_exact}` : (a.meeting_point || placeName(a));
  const body = `${a.description}\n\nOn EXTour: ${shareUrl('a', a.id)}`;
  const e = encodeURIComponent;
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${e(a.title)}&dates=${gcalDate(a.starts_at)}/${gcalDate(a.ends_at)}&details=${e(body)}&location=${e(where)}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${e(a.title)}&startdt=${e(a.starts_at)}&enddt=${e(a.ends_at)}&location=${e(where)}&body=${e(body)}`,
    where
  };
}
async function copyText(txt, el) {
  try { await navigator.clipboard.writeText(txt); toast('Link copied'); return true; }
  catch (e) { if (el) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } toast('Link selected. Use copy on your keyboard.'); return false; }
}
/* Live alerts: a pop-up when a new notification lands while the app is open. */
const Live = {
  seen: new Map(), armed: false,
  prime() { this.seen = new Map(Store.filter('notifications', n => n.profile_id === Session.id).map(n => [n.id, n.created_at])); this.armed = !!Session.id; },
  check() {
    if (!this.armed || !Session.id || Store.status !== 'ready') return;
    const fresh = Store.filter('notifications', n => n.profile_id === Session.id && !n.read_at && this.seen.get(n.id) !== n.created_at);
    fresh.forEach(n => this.seen.set(n.id, n.created_at)); if (!fresh.length) return;
    const n = fresh.sort((x, y) => y.created_at.localeCompare(x.created_at))[0], [s, p] = noteTarget(n), top = cur();
    if (top.s === s && (top.p || {}).id === p.id) return;
    UI.live = n; toast((NOTE_TEXT[n.type] || (() => 'Something changed on one of your adventures.'))(n), { label: 'View', act: 'liveGo' });
  }
};
Store.listeners.add(() => Live.check());

/* ---------------------------------------------------------------------
   Components
   --------------------------------------------------------------------- */
const sportStyle = s => s ? `--c:${s.color};--cs:${s.soft}` : '';
const stag = sid => { const s = Q.sport(sid); return s ? `<span class="stag" style="${sportStyle(s)}">${ico(s.icon)}${esc(s.name)}</span>` : ''; };
const lvl = (n, c) => `<span class="lvl lvl5" style="${c ? `--c:${c}` : ''}" title="${LEVELS[n] || ''}" aria-label="${LEVELS[n] || ''}">${[0, 1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const AVC = ['#D9C9AE', '#C3D3BD', '#BCCEDD', '#E3C3B2', '#CEC5DD', '#D7DAB2', '#E6D3A3', '#BFD9D2'];
function avatar(ref, size = 40, opts = {}) {
  let name = 'Guest', img = null, verified = false;
  if (typeof ref === 'string' && ref.startsWith('prov:')) { const p = Q.prov(ref.slice(5)); if (p) { name = p.name; img = p.logo; verified = true; } }
  else { const p = Q.prof(ref); if (p) { name = p.name; img = mediaSrc(p.avatar); verified = Policy.memberships(p.id).length > 0; /* only verified providers' team, not self-declared */ } }
  const ini = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const inner = img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : '';
  return `<span class="av ${opts.sq ? 'sq' : ''}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;--bgc:${AVC[h % AVC.length]}" aria-hidden="true">${esc(ini)}${inner}${verified && opts.badge !== false && size >= 40 ? `<span class="vf">${ico('check')}</span>` : ''}</span>`;
}
const avStack = (ids, n = 4, size = 28) => `<span class="avs">${ids.slice(0, n).map(i => avatar(i, size, { badge: false })).join('')}${ids.length > n ? `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .34)}px;--bgc:#E7E1D3">+${ids.length - n}</span>` : ''}</span>`;
function capMeter(a) { const g = Q.going(a).length; if (a.capacity <= 8) return `<span class="cap" aria-hidden="true">${Array.from({ length: a.capacity }, (_, i) => `<i class="${i < g ? 'on' : ''}"></i>`).join('')}</span>`; return `<span class="cap-bar" aria-hidden="true"><i style="width:${Math.min(100, g / a.capacity * 100)}%"></i></span>`; }
const capText = a => { const g = Q.going(a).length; return g >= a.capacity ? 'Full' : `${g} / ${a.capacity} going`; };
const priceLabel = a => a.price > 0 ? `€${a.price}` : 'Free';
const placeName = a => a.spot_id && Q.spot(a.spot_id) ? Q.spot(a.spot_id).name : (a.location_name || (Q.dest(a.destination_id) || {}).name || '');
const hostName = a => a.provider_id && Q.prov(a.provider_id) ? Q.prov(a.provider_id).name : a.host_id === Session.id ? 'You' : (Q.prof(a.host_id) || {}).name || 'Someone';
const saveBtn = (type, id, cls = 'glass') => { const on = Q.saved(type, id); return `<button class="icon-btn ${cls}" data-act="save" data-arg="${type}:${id}" aria-label="${on ? 'Remove from saved' : 'Save'}" aria-pressed="${on}">${on ? `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor">${IP.bookmark}</svg>` : ico('bookmark')}</button>`; };
const secH = (title, sub = '', see = '') => `<div class="sec-h"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${see}</div>`;
const seeAll = (s, p, label = 'See all') => `<button class="see" ${goAttr(s, p)}>${label}</button>`;
const backBtn = (cls = 'line') => `<button class="icon-btn ${cls}" data-back aria-label="Back">${ico('back')}</button>`;
function statePill(a) {
  const st = Q.status(a), me = Q.myState(a);
  if (st === 'cancelled') return '<span class="pill bad">Cancelled</span>';
  if (st === 'completed') return '<span class="pill">Completed</span>';
  if (me === 'host') { const n = Q.pending(a).length; return `<span class="pill dark">Hosting${n ? ` · ${n} request${n > 1 ? 's' : ''}` : ''}</span>`; }
  if (me === 'approved') return `<span class="pill ok">${ico('check')}Going</span>`;
  if (me === 'requested') return '<span class="pill warn">Pending</span>';
  if (me === 'declined') return '<span class="pill bad">Declined</span>';
  if (st === 'full') return '<span class="pill bad">Full</span>';
  return '';
}
const typeLabel = a => (TYPES[a.type] || { label: a.type }).label;
function advHero(a) {
  const s = stamp(a), ids = Q.goingIds(a);
  return `<a class="adv-hero" role="button" tabindex="0" ${goAttr('adv', { id: a.id })}>
    ${art(a.cover, '', 'height:200px').replace(/<\/div>$/, `<div class="ov on-art">${stag(a.sport_id)}${saveBtn('adventure', a.id)}</div></div>`)}
    <div class="body">
      <div class="row"><span class="stamp"><span class="d">${s.d}</span><span class="n">${s.n}</span></span><div style="min-width:0"><h3>${esc(a.title)}</h3><div class="meta-line" style="margin-top:4px"><span>${ico('pin')}${esc(placeName(a))}</span><span>${ico('clock')}${timeLabel(a)}</span></div></div></div>
      <div class="row between"><span class="cap-wrap">${avStack(ids, 4, 26)}${capMeter(a)}${capText(a)}</span><span class="price">${priceLabel(a)}</span></div>
      <div class="row between"><span class="pill">${ico('level')}${MIN_LEVELS[a.min_level] || 'All levels'}</span><span class="muted" style="font-size:12.5px;font-weight:600">Hosted by ${esc(hostName(a))}</span></div>
    </div></a>`;
}
function advMini(a) {
  return `<a class="adv-mini" role="button" tabindex="0" ${goAttr('adv', { id: a.id })}>
    ${art(a.cover, '', 'height:128px').replace(/<\/div>$/, `<div class="ov on-art">${stag(a.sport_id)}</div></div>`)}
    <div class="body"><span class="mono muted">${dateLabel(a)} · ${hm(a.starts_at, tzOf(a))}</span><h3>${esc(a.title)}</h3>
    <div class="row between"><span class="cap-wrap">${capMeter(a)}${Q.going(a).length >= a.capacity ? 'Full' : `${Q.going(a).length}/${a.capacity}`}</span><span class="price">${priceLabel(a)}</span></div></div></a>`;
}
function advRow(a, extra = '') {
  return `<button class="adv-row" ${goAttr('adv', { id: a.id })}>${art(a.cover)}<span class="tx"><span class="row" style="gap:6px;flex-wrap:wrap">${stag(a.sport_id)}${statePill(a)}</span><h3>${esc(a.title)}</h3><span class="sub">${dateLabel(a)} · ${timeLabel(a)} · ${esc((Q.dest(a.destination_id) || {}).name || '')}${a.series_id ? ' · Weekly' : ''}</span>${extra}</span><span class="end"><span class="price">${priceLabel(a)}</span><span class="cap-wrap" style="font-size:11.5px">${Q.going(a).length >= a.capacity ? 'Full' : `${Q.going(a).length}/${a.capacity}`}</span></span></button>`;
}
function buddyCard(a) {
  const h = Q.prof(a.host_id) || {}, mine = a.host_id === Session.id, sp = Q.sport(a.sport_id) || {}, lv = Q.level(a.host_id, a.sport_id);
  return `<button class="buddy-card ${mine ? 'mine' : ''}" ${goAttr('adv', { id: a.id })}>
    <span class="who">${avatar(a.host_id, 38)}<span><b>${mine ? 'Your request' : esc(h.name)}</b><small>${mine ? `Live · ${Q.pending(a).length} request${Q.pending(a).length === 1 ? '' : 's'}` : `${lv != null ? LEVELS[lv] : ''} ${esc((sp.name || '').toLowerCase())}${h.note ? ` · ${esc(h.note)}` : ''}`}</small></span></span>
    <span class="ask">Looking for a ${esc((sp.name || '').toLowerCase())} buddy${a.activity ? ` · ${esc(a.activity)}` : ''}</span>
    <span class="facts"><span>${ico('pin')}${esc(placeName(a))}</span><span>${ico('cal')}${dateLabel(a)}</span><span>${ico('clock')}${hm(a.starts_at, tzOf(a))}</span><span>${ico('level')}${MIN_LEVELS[a.min_level]}</span></span>
  </button>`;
}
function destCard(d, w = 200, h = 250) {
  const n = Q.activeCount(d.id), ns = Q.destSports(d.id).length;
  return `<a class="dest-card" role="button" tabindex="0" style="width:${typeof w === 'number' ? w + 'px' : w};height:${h}px" ${goAttr('dest', { id: d.id })}>${art(d.hero_image)}<span class="shade"></span>${d.featured ? '<span class="top"><span class="pill lime">Founding hub</span></span>' : ''}<span class="tx"><b>${esc(d.name)}</b><small>${esc(d.country)} · ${ns} sports · ${n} active</small></span></a>`;
}
function sportTile(s, d) { const my = Session.id ? Q.level(Session.id, s.id) : undefined, n = Q.forSport(s.id, d).length; return `<button class="sport-tile" style="${sportStyle(s)}" ${goAttr('sport', { id: s.id })}><span class="ic">${ico(s.icon, 24)}</span>${my !== undefined ? `<span class="lv">${lvl(my, s.color)}</span>` : ''}<span><b>${esc(s.name)}</b><small>${n} near ${esc((Q.dest(d) || {}).name || '')}</small></span></button>`; }
function provRow(p) { return `<button class="lrow" ${goAttr('provider', { id: p.id })}>${avatar('prov:' + p.id, 46, { sq: true })}<span class="tx"><b>${esc(p.name)}</b><small>${PROV_TYPES[p.type] || p.type} · ${esc(p.location)}</small><small>${p.sports.map(x => esc((Q.sport(x) || {}).name || '')).join(', ')} · ${esc(p.languages.slice(0, 2).join(', '))}</small></span>${ico('chev')}</button>`; }
function spotRow(s) { return `<button class="lrow" ${goAttr('spot', { id: s.id })}>${art(s.cover, '', 'width:52px;height:52px;border-radius:14px;flex:none')}<span class="tx"><b>${esc(s.name)}</b><small>${SPOT_TYPES[s.type] || s.type} · ${['All levels', 'Beginner', 'Intermediate', 'Advanced'][s.difficulty]}</small><small style="margin-top:4px">${stag(s.sport_id)}</small></span>${ico('chev')}</button>`; }
function personRow(pid, right = '') { const p = Q.prof(pid); if (!p) return ''; const best = Q.userSports(pid)[0]; return `<div class="lrow"><button ${goAttr('person', { id: pid })} style="display:flex;gap:12px;align-items:center;flex:1;min-width:0">${avatar(pid, 44)}<span class="tx"><b>${esc(p.name)}</b><small>${p.home_destination_id && Q.dest(p.home_destination_id) ? 'Local' : 'Visiting'}${best && Q.sport(best.sport_id) ? ` · ${LEVELS[best.level]} ${esc(Q.sport(best.sport_id).name.toLowerCase())}` : ''}</small></span></button>${right}</div>`; }
const emptyState = (glyph, title, text, cta = '') => `<div class="empty"><span class="glyph">${ico(glyph, 28)}</span><b>${title}</b><p>${text}</p>${cta}</div>`;

/* ---------------------------------------------------------------------
   Maps
   --------------------------------------------------------------------- */
function mapItems(rk) {
  const M = UI.map, out = [], [w0, w1] = weekendRange(), weekEnd = new Date(Date.now() + 7 * 864e5).toISOString();
  const okSport = sid => !M.sport || M.sport === sid;
  if (M.layers.spot) Store.all('spots').forEach(s => { const xy = project(rk, s.lat, s.lng); if (xy && okSport(s.sport_id) && (M.level === 'any' || (M.level === 'beginner' ? s.difficulty <= 1 : s.difficulty >= 2))) out.push({ kind: 'spot', id: s.id, sport: s.sport_id, xy }); });
  if (M.layers.prov) Store.all('providers').forEach(p => { const xy = project(rk, p.lat, p.lng); if (xy && (!M.sport || p.sports.includes(M.sport))) out.push({ kind: 'prov', id: p.id, sport: p.sports[0], xy }); });
  if (M.layers.adv) {
    const per = {};
    Q.listed().forEach(a => {
      if (!okSport(a.sport_id)) return;
      if (M.date === 'week' && a.starts_at > weekEnd) return;
      if (M.date === 'weekend' && !(a.starts_at >= w0 && a.starts_at < w1)) return;
      if (M.level === 'beginner' && a.min_level > 1) return; if (M.level === 'intermediate' && a.min_level < 2) return;
      const xy = project(rk, a.lat, a.lng); if (!xy) return;
      const key = a.spot_id || a.id; const k = per[key] = (per[key] || 0) + 1;
      out.push({ kind: 'adv', id: a.id, sport: a.sport_id, xy: [xy[0] + 18 + (k - 1) * 22, xy[1] - 22 - (k - 1) * 6] });
    });
  }
  return out;
}
function pinSVG(it, interactive = true) {
  const s = Q.sport(it.sport) || { color: '#15251F', icon: 'route' }, c = s.color, sel = UI.map.sel && UI.map.sel.kind === it.kind && UI.map.sel.id === it.id;
  const ring = sel ? `<circle r="25" fill="none" stroke="#C7F36B" stroke-width="5"/>` : '';
  const lab = it.kind === 'adv' ? (Store.get('adventures', it.id) || {}).title : it.kind === 'spot' ? (Q.spot(it.id) || {}).name : (Q.prov(it.id) || {}).name;
  const a = interactive ? `class="pin" data-act="pin" data-arg="${it.kind}:${it.id}" role="button" tabindex="0" aria-label="${esc(lab)}"` : '';
  const [x, y] = it.xy;
  if (it.kind === 'spot') return `<g ${a} transform="translate(${x} ${y})">${ring}<rect x="-10" y="-10" width="20" height="20" rx="4.5" transform="rotate(45)" fill="#FAFAF7" stroke="${c}" stroke-width="2.6"/><circle r="3.6" fill="${c}"/></g>`;
  if (it.kind === 'prov') return `<g ${a} transform="translate(${x} ${y})">${ring}<rect x="-14" y="-14" width="28" height="28" rx="8" fill="#15251F" stroke="#FAFAF7" stroke-width="2.5"/><path d="M-6 6 6-6M-6-6c3 1 3.6 3 6 6s3 5 6 6" stroke="#C7F36B" stroke-width="2.6" stroke-linecap="round" fill="none"/></g>`;
  return `<g ${a} transform="translate(${x} ${y})">${ring}<circle r="17" fill="${c}" stroke="#FAFAF7" stroke-width="3"/><svg x="-9.5" y="-9.5" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${IP[s.icon]}</svg></g>`;
}
function mapSVG(rk, opts = {}) {
  const R = REGIONS[rk]; let vb = '0 0 390 700';
  if (opts.focus) { const [x, y] = opts.focus; vb = `${Math.max(0, Math.min(390 - 260, x - 130))} ${Math.max(0, Math.min(700 - 130, y - 65))} 260 130`; }
  const pins = opts.mini ? (opts.pins || Store.all('spots').map(s => ({ kind: 'spot', id: s.id, sport: s.sport_id, xy: project(rk, s.lat, s.lng) })).filter(p => p.xy)) : mapItems(rk);
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;background:${R.sea}" ${opts.mini ? 'aria-hidden="true"' : 'role="img" aria-label="Map of ' + R.name + '"'}>
    <path d="${R.land}" fill="#EEEADF" stroke="#D2CAB8" stroke-width="1.5"/>${R.extra}
    ${R.labels.map(([t, x, y]) => `<text x="${x}" y="${y}" font-family="Martian Mono, monospace" font-size="${opts.mini ? 7 : 9}" letter-spacing="1" fill="#7C8279" text-anchor="middle">${t.toUpperCase()}</text>`).join('')}
    ${pins.map(p => pinSVG(p, !opts.mini)).join('')}</svg>`;
}

/* ---------------------------------------------------------------------
   UI state (not persisted data): navigation stacks, form drafts, filters
   --------------------------------------------------------------------- */
const UI = {
  tab: 'explore', stacks: null, loc: null, q: '', bf: null, cf: null, ob: null,
  map: { region: 'bcn', layers: { adv: true, spot: true, prov: true }, sport: null, date: 'any', level: 'any', sel: null, list: false },
  resetNav() { this.tab = 'explore'; this.stacks = { explore: [{ s: 'explore' }], adventures: [{ s: 'my' }], messages: [{ s: 'inbox' }], profile: [{ s: 'profile' }] }; this.loc = null; this.bf = null; this.cf = null; }
};
UI.resetNav();
const curLoc = () => UI.loc || Q.homeDest();

/* =====================================================================
   Screens
   ===================================================================== */
const SCREENS = {};

/* ---- Welcome / sign in ---- */
SCREENS.welcome = () => {
  const demo = ['p_shebl', 'p_marta', 'p_luca', 'p_freya', 'p_leila'].map(Q.prof).filter(Boolean);
  return { nav: false, body: `<div class="welcome">
    <div class="w-hero">${art('photos/boat-crew.jpg')}<span class="shade"></span><div class="w-tx"><span class="brand" style="color:#FAFAF7">${MARK(30)}<span class="wm"><b>EX</b>Tour</span></span><h1>Find your next adventure, and the people to share it with.</h1></div></div>
    <div class="pad" style="display:grid;gap:10px;margin-top:20px">
      <button class="btn btn-primary" data-act="startSignup">Create your profile</button>
      ${Object.values(Auth.providers).map(p => `<button class="btn btn-secondary" disabled aria-disabled="true">${p.label}<small class="soon">Production build</small></button>`).join('')}
    </div>
    <section class="sec">${secH('Try a demo account', 'Real accounts from the seed data. Switch any time from Profile.')}
      <div class="group">${demo.map(p => `<button class="lrow" data-act="signInAs" data-arg="${p.id}">${avatar(p.id, 44)}<span class="tx"><b>${esc(p.name)}</b><small>${esc(p.home_location || '')} · ${Q.userSports(p.id).slice(0, 2).map(u => `${LEVELS[u.level]} ${esc((Q.sport(u.sport_id) || {}).name || '').toLowerCase()}`).join(', ')}</small></span>${ico('chev')}</button>`).join('')}</div></section>
    <p class="muted pad" style="font-size:12.5px;margin-top:16px">Data: ${esc(Store.adapter.label)}.${Store.adapter.mode === 'cloud' ? ' Changes are shared with everyone who has this link.' : ' Changes stay in this browser.'}</p></div>` };
};

/* ---- Explore ---- */
SCREENS.explore = () => {
  const L = curLoc(), D = Q.dest(L) || Q.destsSorted()[0], me = Session.me;
  const [w0, w1] = weekendRange();
  const listed = Q.inDest(D.id).filter(a => a.host_id !== Session.id);
  const wk = listed.filter(a => a.type !== 'buddy_request' && a.starts_at >= w0 && a.starts_at < w1);
  const soon = listed.filter(a => a.type !== 'buddy_request');
  const heroList = wk.length ? wk : soon; const hero = heroList[0], rest = heroList.slice(1, 7);
  const tries = Q.userSports(Session.id).filter(u => u.level === 0).map(u => u.sport_id);
  const tryAdv = tries.flatMap(sid => Q.forSport(sid, D.id).filter(a => a.min_level === 0 && a.host_id !== Session.id)).slice(0, 2);
  const buds = Q.listed().filter(a => a.type === 'buddy_request').sort((a, b) => (a.destination_id === D.id ? 0 : 1) - (b.destination_id === D.id ? 0 : 1) || (a.host_id === Session.id ? -1 : 0));
  const unread = Q.notifications().filter(n => !n.read_at).length;
  const mySports = Q.destSports(D.id).sort((a, b) => (Q.level(Session.id, b.id) ?? -1) - (Q.level(Session.id, a.id) ?? -1));
  const ws = new Date(w0), we = new Date(new Date(w1) - 864e5), fmt = d => `${d.getDate()}`;
  return { body: `
    <header class="x-top"><span class="brand">${MARK(26)}<span class="wm"><b>EX</b>Tour</span></span>
      <button class="loc-pill" data-act="locSheet" aria-label="Change location, now ${esc(D.name)}">${ico('pin')}${esc(D.name)}${ico('down', '14')}</button>
      <button class="icon-btn" ${goAttr('notifs')} aria-label="Notifications, ${unread} new">${ico('bell')}${unread ? '<i class="dot"></i>' : ''}</button></header>
    <div class="hello"><div class="mono">${new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())} · ${D.lat.toFixed(2)}° ${D.lat >= 0 ? 'N' : 'S'} · ${Math.abs(D.lng).toFixed(2)}° ${D.lng >= 0 ? 'E' : 'W'}</div><h1 class="display">What are you doing this weekend, ${esc(me.name.split(' ')[0])}?</h1></div>
    ${nextUpCard()}
    <button class="search-big" ${goAttr('search')}>${ico('search')}<span>Where or what do you want to explore?</span></button>
    <div class="quick3"><button ${goAttr('sports')}>${ico('layers')}Sports</button><button ${goAttr('dests')}>${ico('globe')}Destinations</button><button data-act="openMap" data-arg="${D.map_region || 'none:' + D.id}">${ico('map')}Map</button></div>
    <section class="sec">${hero ? `${secH(wk.length ? 'Do something this weekend' : 'Do something soon', wk.length ? `${wk.length} adventure${wk.length === 1 ? '' : 's'} near ${esc(D.name)} · ${fmt(ws)} to ${fmt(we)} ${new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(we)}` : `${soon.length} coming up near ${esc(D.name)}`, seeAll('list', { dest: D.id, when: wk.length ? 'weekend' : '' }))}
      ${advHero(hero)}${rest.length ? `<div class="rail-x" style="margin-top:12px">${rest.map(advMini).join('')}</div>` : ''}`
      : `${secH('Do something this weekend')}${emptyState('cal', 'Nothing happening here yet', `Be the first in ${esc(D.name)}. People nearby see new adventures first.`, `<button class="btn btn-primary btn-sm" data-act="startCreate">Create the first adventure</button>`)}`}</section>
    <section class="sec">${secH('Popular near you', 'Your sports first', seeAll('sports', {}))}<div class="rail-x">${mySports.map(s => sportTile(s, D.id)).join('')}</div></section>
    ${tryAdv.length ? `<section class="sec">${secH('Try something new', `You said you want to try ${tries.map(t => esc(Q.sport(t).name.toLowerCase())).join(' and ')}. Start here.`)}<div class="stack">${tryAdv.map(a => advRow(a)).join('')}</div></section>` : ''}
    <section class="sec">${secH('Find your crew', 'People looking for a buddy', `<button class="see" data-act="openBuddy">Post yours</button>`)}${buds.length ? `<div class="rail-x">${buds.map(buddyCard).join('')}</div>` : emptyState('users', 'No buddy requests yet', 'Post one and we match you on sport, place and time.')}</section>
    <section class="sec">${secH('Where next?', 'Adventure hubs with people already there', seeAll('dests', {}))}<div class="rail-x">${Q.destsSorted().filter(d => d.id !== D.id).map(d => destCard(d)).join('')}</div></section>
    <div class="end-note">${MARK(30)}<span><b>That is everything near ${esc(D.name)} right now.</b>Pick one and go. We will be here when you get back.</span></div>` };
};

function nextUpCard() {
  const M = Q.myAdventures(), list = [...new Set([...M.upcoming, ...M.hosting])].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const pending = M.hosting.reduce((n, a) => n + Q.pending(a).length, 0), a = list[0];
  if (!a && !pending) return '';
  const pendBtn = pending ? `<button class="pill lime" data-act="openHosting">${ico('users')}${pending} request${pending > 1 ? 's' : ''} waiting</button>` : '';
  if (!a) return `<div class="next-up"><span class="mono">Needs you</span><b>People asked to join your adventures</b>${pendBtn}</div>`;
  const d = dayIndex(a.starts_at, tzOf(a)) - dayIndex(nowIso(), tzOf(a)), when = d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;
  return `<div class="next-up"><span class="mono">Your next adventure · ${when}</span>
    <button class="nu-main" ${goAttr('adv', { id: a.id })}><b>${esc(a.title)}</b><span class="meta-line"><span>${ico('cal')}${dateLabel(a)} · ${hm(a.starts_at, tzOf(a))}</span><span>${ico('pin')}${esc(placeName(a))}</span></span></button>
    <div class="row between" style="flex-wrap:wrap;gap:8px"><span class="cap-wrap">${avStack(Q.goingIds(a), 5, 26)}<span>${Q.going(a).length} / ${a.capacity} going</span></span><span class="row" style="gap:8px">${pendBtn}<button class="btn btn-done btn-sm" ${goAttr('chat', { id: `c_${a.id}` })}>${ico('msg')}Chat</button></span></div>
    ${list.length > 1 ? `<button class="nu-more" data-act="tab" data-arg="adventures">+${list.length - 1} more coming up</button>` : ''}</div>`;
}

/* ---- Search ---- */
SCREENS.search = () => ({ nav: false, body: `
  <div class="topbar">${backBtn()}<input class="inp" id="q" type="search" autocomplete="off" placeholder="Try Dahab or Barcelona climbing" value="${esc(UI.q)}" aria-label="Search EXTour" style="height:44px"></div>
  <div id="sr">${searchResults(UI.q)}</div>`,
  after: v => { const q = $('#q', v); if (!q) return; q.focus(); q.setSelectionRange(q.value.length, q.value.length); q.oninput = () => { UI.q = q.value; $('#sr', v).innerHTML = searchResults(UI.q); }; } });
function searchResults(q) {
  const t = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!t.length) return `<div class="sr-group"><span class="mono">Try</span><div class="chips pad">${['Dahab', 'Barcelona climbing', 'Tenerife freediving', 'Beginner surfing', 'Blue Hole'].map(s => `<button class="chip" data-act="setQ" data-arg="${s}">${s}</button>`).join('')}</div></div>`;
  const has = (...f) => { const h = f.join(' ').toLowerCase(); return t.every(w => h.includes(w)); };
  const any = s => t.some(w => s.toLowerCase().includes(w));
  const dests = Q.destsSorted().filter(d => any(`${d.name} ${d.country} ${d.region}`));
  const sports = Q.sportsActive().filter(s => any(s.name));
  const advs = Q.listed().filter(a => { const s = Q.sport(a.sport_id) || {}, d = Q.dest(a.destination_id) || {}; return has(a.title, s.name, d.name, d.country, placeName(a), MIN_LEVELS[a.min_level], a.min_level <= 1 ? 'beginner try' : '', typeLabel(a), a.type === 'buddy_request' ? 'buddy' : '', a.activity); });
  const spots = Store.all('spots').filter(s => has(s.name, (Q.sport(s.sport_id) || {}).name, (Q.dest(s.destination_id) || {}).name, SPOT_TYPES[s.type]));
  const provs = Store.all('providers').filter(p => has(p.name, PROV_TYPES[p.type], (Q.dest(p.destination_id) || {}).name, p.location, p.sports.map(x => (Q.sport(x) || {}).name).join(' ')));
  const ppl = Store.filter('profiles', p => p.id !== Session.id && has(p.name, p.home_location || '', (Q.dest(p.home_destination_id) || {}).name || '', (Q.dest(p.current_destination_id) || {}).name || '', Q.userSports(p.id).map(u => (Q.sport(u.sport_id) || {}).name).join(' ')));
  const total = dests.length + sports.length + advs.length + spots.length + provs.length + ppl.length;
  if (!total) return emptyState('search', `Nothing for “${esc(q)}” yet`, 'We are seeding Barcelona and Dahab first, then Tenerife, Madeira, Bali and Sri Lanka. Try a place or a sport.', `<div class="chips" style="justify-content:center">${['Barcelona', 'Dahab', 'Freediving'].map(s => `<button class="chip" data-act="setQ" data-arg="${s}">${s}</button>`).join('')}</div>`);
  const g = (label, html) => html ? `<div class="sr-group"><span class="mono">${label}</span>${html}</div>` : '';
  return g('Destinations', dests.length ? `<div class="rail-x">${dests.map(d => destCard(d, 170, 130)).join('')}</div>` : '')
    + g('Sports', sports.length ? `<div class="chips pad">${sports.map(s => `<button class="chip" ${goAttr('sport', { id: s.id })}>${ico(s.icon)}${esc(s.name)}</button>`).join('')}</div>` : '')
    + g(`Adventures · ${advs.length}`, advs.length ? `<div class="stack">${advs.slice(0, 8).map(a => advRow(a)).join('')}</div>` : '')
    + g('Schools and guides', provs.length ? `<div class="group">${provs.slice(0, 5).map(provRow).join('')}</div>` : '')
    + g('Spots', spots.length ? `<div class="group">${spots.slice(0, 5).map(spotRow).join('')}</div>` : '')
    + g('People', ppl.length ? `<div class="group">${ppl.slice(0, 6).map(p => personRow(p.id)).join('')}</div>` : '');
}

/* ---- Sports ---- */
SCREENS.sports = () => ({ body: `
  <div class="topbar">${backBtn()}<h1>Sports</h1></div>
  <div class="page-h"><h1>Pick a sport. We will show you where and who.</h1></div>
  <div class="stack" style="margin-top:20px">${Q.sportsActive().map(s => { const my = Q.level(Session.id, s.id); return `<button class="adv-row" ${goAttr('sport', { id: s.id })} style="${sportStyle(s)}"><span class="sport-lv" style="padding:0;border:0;flex:1"><span class="ic" style="width:52px;height:52px;border-radius:16px">${ico(s.icon, 26)}</span><span class="tx"><b style="font-size:17px">${esc(s.name)}</b><small>${Q.forSport(s.id).length} upcoming · ${Store.filter('destination_sports', r => r.sport_id === s.id).length} destinations · ${s.category}</small></span></span>${my !== undefined ? `<span style="display:grid;justify-items:end;gap:3px">${lvl(my, s.color)}<small class="muted" style="font-size:11.5px;font-weight:700">${LEVELS[my]}</small></span>` : ico('chev')}</button>`; }).join('')}</div>
  <div class="pad" style="margin-top:16px"><div class="coming">${ico('flag')}<span><b>More sports later:</b> SUP, kayaking, paragliding, via ferrata and skiing slot into the same hubs when their communities are ready.</span></div></div>` });

SCREENS.sport = (p) => {
  const s = Q.sport(p.id); if (!s) return notFound('This sport is not available');
  const tab = p.tab || 'adventures', scope = p.scope || 'near', my = Q.level(Session.id, s.id), L = curLoc(), d = scope === 'near' ? L : null, Ld = Q.dest(L);
  const tabs = [['adventures', 'Adventures'], ['buddies', 'Buddies'], ['dests', 'Destinations'], ['spots', 'Spots'], ['providers', 'Providers']];
  let c = '';
  if (tab === 'adventures') { const l = Q.forSport(s.id, d).filter(a => a.type !== 'buddy_request'); c = l.length ? `<div class="stack">${l.map(a => advRow(a)).join('')}</div>` : emptyState(s.icon, `No ${esc(s.name.toLowerCase())} adventures ${d ? 'near ' + esc(Ld.name) : ''} yet`, 'Create the first one and people nearby get notified.', `<button class="btn btn-primary btn-sm" data-act="startCreate" data-arg="${s.id}">Create an adventure</button>`); }
  if (tab === 'buddies') { const l = Q.forSport(s.id, d).filter(a => a.type === 'buddy_request'); c = (l.length ? `<div class="rail-x">${l.map(buddyCard).join('')}</div>` : emptyState('users', 'No open buddy requests', 'Post one in 20 seconds. We match on sport, place and time.')) + `<div class="pad" style="margin-top:14px"><button class="btn btn-primary btn-block" data-act="openBuddy" data-arg="${s.id}">Find a ${esc(s.name.toLowerCase())} buddy</button></div>`; }
  if (tab === 'dests') c = `<div class="stack">${Store.filter('destination_sports', r => r.sport_id === s.id).map(r => Q.dest(r.destination_id)).filter(Boolean).sort((a, b) => a.sort - b.sort).map(x => `<button class="adv-row" ${goAttr('dest', { id: x.id, sport: s.id })}>${art(x.hero_image)}<span class="tx"><h3>${esc(x.name)}</h3><span class="sub">${esc(x.country)} · ${Q.forSport(s.id, x.id).length} upcoming</span><span class="sub" style="font-weight:500">${esc(x.description)}</span></span>${ico('chev')}</button>`).join('')}</div>`;
  if (tab === 'spots') { const l = Store.filter('spots', x => x.sport_id === s.id && (!d || x.destination_id === d)); c = l.length ? `<div class="group">${l.map(spotRow).join('')}</div>` : emptyState('pin', 'No spots mapped here yet', 'Switch to Everywhere to see spots in other hubs.'); }
  if (tab === 'providers') { const l = Store.filter('providers', x => x.sports.includes(s.id) && (!d || x.destination_id === d)); c = l.length ? `<div class="group">${l.map(provRow).join('')}</div>` : emptyState('user', 'No schools listed here yet', 'Switch to Everywhere, or tell a school you know about EXTour.'); }
  return { body: `
    <div class="topbar" style="background:${s.soft}">${backBtn()}<h1></h1></div>
    <div class="sh-head" style="${sportStyle(s)}"><span class="ic">${ico(s.icon)}</span><h1>${esc(s.name)}</h1>
      <div class="row" style="flex-wrap:wrap;gap:8px">${my !== undefined ? `<span class="pill dark">${lvl(my, '#C7F36B')} You: ${LEVELS[my]}</span>` : `<button class="pill" data-act="addSport" data-arg="${s.id}">${ico('plus')}Add to my sports</button>`}<span class="pill">${Q.forSport(s.id).length} upcoming worldwide</span></div>
      <p class="muted" style="font-size:14px">Where can you do it, and who with?</p></div>
    <div class="tabs-line" role="tablist" style="background:var(--sand)">${tabs.map(([t, l]) => `<button role="tab" aria-selected="${tab === t}" data-act="setP" data-arg="tab:${t}">${l}</button>`).join('')}</div>
    ${tab !== 'dests' ? `<div class="chips pad" style="padding-top:14px">${[['near', 'Near ' + esc(Ld.name)], ['all', 'Everywhere']].map(([v, l]) => `<button class="chip" aria-pressed="${scope === v}" data-act="setP" data-arg="scope:${v}">${l}</button>`).join('')}</div>` : ''}
    <div style="padding-top:14px">${c}</div>`,
    track: ['sport_viewed', { sport: s.id }] };
};

/* ---- Destinations ---- */
SCREENS.dests = () => ({ body: `
  <div class="topbar">${backBtn()}<h1>Destinations</h1></div>
  <div class="page-h"><h1>Where next?</h1><p>We start where the community already is. Founding hubs have the most people and adventures.</p></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:18px 20px 0">${Q.destsSorted().map(d => destCard(d, '100%', 220)).join('')}</div>` });

SCREENS.dest = (p) => {
  const D = Q.dest(p.id); if (!D) return notFound('This destination is not available');
  const f = p.sport || null, sports = Q.destSports(D.id);
  const all = Q.inDest(D.id, f), list = all.filter(a => a.type !== 'buddy_request'), buds = all.filter(a => a.type === 'buddy_request');
  const people = Q.peopleIn(D.id).filter(x => !f || Q.level(x.id, f) !== undefined);
  const spots = Store.filter('spots', x => x.destination_id === D.id && (!f || x.sport_id === f));
  const provs = Store.filter('providers', x => x.destination_id === D.id && (!f || x.sports.includes(f)));
  return { body: `
    <div class="hero">${art(D.hero_image)}<span class="shade"></span>
      <div class="bar">${backBtn('glass')}<span class="r"><button class="icon-btn glass" data-act="share" data-arg="d.${D.id}" aria-label="Share link">${ico('share')}</button>${saveBtn('destination', D.id)}</span></div>
      <div class="cap-tx"><span class="mono">${Math.abs(D.lat).toFixed(2)}° ${D.lat >= 0 ? 'N' : 'S'} · ${Math.abs(D.lng).toFixed(2)}° ${D.lng >= 0 ? 'E' : 'W'}</span><h1>${esc(D.name)}${f ? `<span style="font-weight:500;opacity:.85"> × ${esc(Q.sport(f).name)}</span>` : ''}</h1><span class="sub">${esc(D.country)} · ${sports.length} sports · ${Q.activeCount(D.id)} active adventures</span></div></div>
    <div class="pad" style="display:flex;gap:10px;margin-top:14px"><button class="btn btn-secondary btn-sm btn-block" data-act="save" data-arg="destination:${D.id}">${ico('bookmark')}${Q.saved('destination', D.id) ? 'Saved' : 'Save'}</button><button class="btn btn-secondary btn-sm btn-block" data-act="openMap" data-arg="${D.map_region || 'none:' + D.id}">${ico('map')}View map</button></div>
    <section class="sec">${secH('What do you want to do here?')}<div class="chips scroll" style="padding:0 20px;margin:0">${sports.map(s => `<button class="chip" aria-pressed="${f === s.id}" data-act="setP" data-arg="sport:${f === s.id ? '' : s.id}" style="${f === s.id ? '' : `color:${s.color}`}">${ico(s.icon)}${esc(s.name)} <small class="muted" style="font-weight:600">${Q.inDest(D.id, s.id).length}</small></button>`).join('')}</div></section>
    <section class="sec">${secH('Happening soon', f ? `${esc(Q.sport(f).name)} in ${esc(D.name)}` : '', list.length > 4 ? seeAll('list', { dest: D.id, sport: f || '' }) : '')}${list.length ? `<div class="stack">${list.slice(0, 4).map(a => advRow(a)).join('')}</div>` : emptyState('cal', 'Nothing happening here yet', `No ${f ? esc(Q.sport(f).name.toLowerCase()) + ' ' : ''}adventures in ${esc(D.name)} right now.`, `<button class="btn btn-primary btn-sm" data-act="startCreate" data-arg="${f || ''}|${D.id}">Create the first adventure</button>`)}</section>
    <section class="sec">${secH('Buddy requests', buds.length ? `${buds.length} open` : '')}${buds.length ? `<div class="rail-x">${buds.map(buddyCard).join('')}</div>` : `<div class="pad"><button class="btn btn-secondary btn-block" data-act="openBuddy" data-arg="${f || ''}|${D.id}">${ico('users')}Post a buddy request in ${esc(D.name)}</button></div>`}</section>
    <section class="sec">${secH('Adventure community', `${people.length} people here or based here`)}${people.length ? `<div class="rail-x people-rail">${people.map(pp => { const b = Q.userSports(pp.id).find(u => !f || u.sport_id === f) || Q.userSports(pp.id)[0]; const local = pp.home_destination_id === D.id; return `<button class="p" ${goAttr('person', { id: pp.id })}>${avatar(pp.id, 52)}<b>${esc(pp.name.split(' ')[0])}</b><small>${b ? `${LEVELS[b.level]} ${esc(Q.sport(b.sport_id).name.toLowerCase())}` : ''}</small><span class="pill ${local ? '' : 'warn'}" style="font-size:11px;height:22px">${local ? 'Local' : 'Visiting'}</span></button>`; }).join('')}</div>` : emptyState('users', 'Be the first here', `Nobody has marked themselves in ${esc(D.name)} yet.`)}</section>
    <section class="sec">${secH('Explore spots')}${D.map_region ? `<button class="pad" data-act="openMap" data-arg="${D.map_region}" style="display:block;width:100%"><span class="art" style="display:block;height:170px;border-radius:18px;border:1px solid var(--line);background:${REGIONS[D.map_region].sea}">${mapSVG(D.map_region, { mini: true })}</span></button>` : `<div class="pad"><div class="coming">${ico('map')}<span><b>Map coming soon for ${esc(D.name)}.</b> Spots and pins are stored with coordinates and appear once the hub map is drawn.</span></div></div>`}
      ${spots.length ? `<div class="group" style="margin-top:12px">${spots.map(spotRow).join('')}</div>` : ''}</section>
    <section class="sec">${secH('Local experts', 'Schools, guides and instructors')}${provs.length ? `<div class="group">${provs.map(provRow).join('')}</div>` : emptyState('user', 'No experts listed yet', 'We are onboarding schools here now.')}</section>
    <section class="sec">${secH('Know before you go')}<div class="fact-list">${(D.facts || []).map(({ label: a, value: b }) => `<div><span class="mono">${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div></section>`,
    track: ['destination_viewed', { destination: D.id, sport: f }] };
};

/* ---- Map ---- */
SCREENS.map = () => {
  const M = UI.map, rk = M.region;
  if (rk.startsWith('none:')) { const D = Q.dest(rk.slice(5)); return { flush: true, body: `<div class="topbar">${backBtn()}<h1>${esc(D.name)} map</h1></div>${emptyState('map', `No map for ${esc(D.name)} yet`, 'Everything here already has coordinates. The hub map is drawn once enough local spots are in.', `<button class="btn btn-primary btn-sm" ${goAttr('dest', { id: D.id })}>See ${esc(D.name)}</button>`)}` }; }
  const items = mapItems(rk);
  let card = '';
  if (M.sel) {
    const { kind, id } = M.sel;
    if (kind === 'adv') { const a = Store.get('adventures', id); if (a) card = `<div class="pin-card">${art(a.cover)}<div class="tx">${stag(a.sport_id)}<h3>${esc(a.title)}</h3><div class="meta-line"><span>${dateLabel(a)}</span><span>${MIN_LEVELS[a.min_level]}</span></div><div class="row between"><span class="price">${priceLabel(a)}</span><button class="btn btn-primary btn-sm" ${goAttr('adv', { id })}>View</button></div></div></div>`; }
    if (kind === 'spot') { const s = Q.spot(id); const n = Q.listed().filter(a => a.spot_id === id).length; if (s) card = `<div class="pin-card">${art(s.cover)}<div class="tx">${stag(s.sport_id)}<h3>${esc(s.name)}</h3><div class="meta-line"><span>${SPOT_TYPES[s.type]}</span></div><div class="row between"><span class="muted" style="font-size:12.5px;font-weight:700">${n} adventure${n === 1 ? '' : 's'} here</span><button class="btn btn-primary btn-sm" ${goAttr('spot', { id })}>View spot</button></div></div></div>`; }
    if (kind === 'prov') { const pr = Q.prov(id); if (pr) card = `<div class="pin-card"><span style="display:grid;place-items:center;width:96px;border-radius:13px;background:var(--forest)">${avatar('prov:' + id, 56, { sq: true })}</span><div class="tx">${stag(pr.sports[0])}<h3>${esc(pr.name)}</h3><div class="meta-line"><span>${PROV_TYPES[pr.type]}</span><span>${pr.offers.length ? `From €${Math.min(...pr.offers.map(o => o.price))}` : ''}</span></div><div class="row between"><span></span><button class="btn btn-primary btn-sm" ${goAttr('provider', { id })}>View</button></div></div></div>`; }
  }
  const sportsHere = [...new Set(Store.all('spots').filter(s => project(rk, s.lat, s.lng)).map(s => s.sport_id))].map(Q.sport).filter(Boolean);
  const listHtml = `<div style="position:absolute;inset:0;overflow:auto;padding:14px 0 120px;background:var(--sand)">${items.length ? '' : emptyState('filter', 'Nothing matches these filters', 'Clear a filter to see more.')}<div class="stack">${items.filter(i => i.kind === 'adv').map(i => advRow(Store.get('adventures', i.id))).join('')}</div><div class="group" style="margin-top:12px">${items.filter(i => i.kind === 'spot').map(i => spotRow(Q.spot(i.id))).join('')}${items.filter(i => i.kind === 'prov').map(i => provRow(Q.prov(i.id))).join('')}</div></div>`;
  const chip = (act, arg, on, label) => `<button class="chip" aria-pressed="${on}" data-act="${act}" data-arg="${arg}">${label}</button>`;
  const nf = (M.date !== 'any' ? 1 : 0) + (M.level !== 'any' ? 1 : 0);
  return { flush: true, body: `<div class="map-wrap">
    <div class="map-top"><div class="row1">${backBtn('glass')}<div class="seg" role="tablist">${Object.entries(REGIONS).map(([r, R]) => `<button role="tab" aria-selected="${rk === r}" data-act="mapRegion" data-arg="${r}">${R.name}</button>`).join('')}</div></div>
      <div class="chips scroll"><button class="chip" aria-pressed="${nf > 0}" data-act="mapFilters">${ico('filter')}Filters${nf ? ` · ${nf}` : ''}</button>${[['adv', 'Adventures'], ['spot', 'Spots'], ['prov', 'Schools']].map(([l, t]) => chip('mapLayer', l, M.layers[l], t)).join('')}<span class="vsep"></span>${sportsHere.map(s => chip('mapSport', s.id, M.sport === s.id, ico(s.icon) + esc(s.name))).join('')}</div>
    </div>
    <div class="map-canvas">${M.list ? listHtml : mapSVG(rk)}</div>
    ${!M.list && !items.length ? `<div class="map-empty"><div class="empty" style="background:var(--paper)"><b>Nothing matches these filters</b><p>Turn a layer back on or clear a filter.</p><button class="btn btn-secondary btn-sm" data-act="mapReset">Clear filters</button></div></div>` : ''}
    ${M.list ? '' : card}
    ${M.sel && !M.list ? '' : `<button class="map-list-btn" data-act="mapList">${ico(M.list ? 'map' : 'list')}${M.list ? 'Show map' : `List · ${items.length}`}</button>`}
  </div>` };
};

/* ---- Adventure list ---- */
SCREENS.list = (p) => {
  let l = Q.listed().filter(a => (!p.dest || a.destination_id === p.dest) && (!p.sport || a.sport_id === p.sport));
  if (p.when === 'weekend') { const [w0, w1] = weekendRange(); l = l.filter(a => a.starts_at >= w0 && a.starts_at < w1); }
  if (p.free) l = l.filter(a => !(a.price > 0));
  if (p.buddy) l = l.filter(a => a.type === 'buddy_request');
  const title = `${p.sport ? esc(Q.sport(p.sport).name) + ' · ' : ''}${p.dest ? esc(Q.dest(p.dest).name) : 'All adventures'}`;
  return { body: `<div class="topbar">${backBtn()}<h1>${title}</h1></div>
    <div class="chips scroll" style="padding:4px 20px 0;margin:0">${[['when', 'weekend', 'This weekend'], ['free', '1', 'Free only'], ['buddy', '1', 'Buddy requests']].map(([k, v, t]) => `<button class="chip" aria-pressed="${!!p[k]}" data-act="setP" data-arg="${k}:${p[k] ? '' : v}">${t}</button>`).join('')}</div>
    ${l.length ? `<div class="stack" style="margin-top:14px">${l.map(a => advRow(a)).join('')}</div>` : emptyState('filter', 'No adventures match', 'Clear a filter to see more.')}` };
};

/* ---- Adventure detail ---- */
const notFound = (title, text = 'It may have been removed by the host. Similar adventures are on Explore.') => ({ body: `<div class="topbar">${backBtn()}<h1></h1></div>${emptyState('info', title, text, `<button class="btn btn-primary btn-sm" data-act="tab" data-arg="explore">Back to Explore</button>`)}` });
SCREENS.adv = (p) => {
  const a = Store.get('adventures', p.id); if (!a || (a.visibility !== 'public' && !Policy.canManage(a) && !Q.myPart(a))) return notFound('This adventure is not available');
  const st = Q.status(a), me = Q.myState(a), host = Q.prof(a.host_id) || {}, provider = a.provider_id ? Q.prov(a.provider_id) : null;
  const ids = Q.goingIds(a), spots = a.capacity - ids.length, tz = tzOf(a), inside = me === 'host' || me === 'approved' || me === 'completed' || Policy.canManage(a);
  const info = `<span class="cta-info"><b>${priceLabel(a)}</b><small>${st === 'full' ? 'Full' : st === 'completed' || st === 'cancelled' ? dateLabel(a) : `${spots} spot${spots === 1 ? '' : 's'} left`} · ${hm(a.starts_at, tz)}</small></span>`;
  const chatBtn = cls => `<button class="btn ${cls} btn-block" ${goAttr('chat', { id: `c_${a.id}` })}>${ico('msg')}Adventure chat</button>`;
  let cta;
  if (st === 'cancelled') cta = `${info}<button class="btn btn-secondary btn-block" disabled>Cancelled by host</button>`;
  else if (Policy.canManage(a)) cta = `<button class="btn btn-secondary" ${goAttr('chat', { id: `c_${a.id}` })} aria-label="Adventure chat">${ico('msg')}</button><button class="btn btn-primary btn-block" ${goAttr('manage', { id: a.id })}>${ico('gear')}Manage${Q.pending(a).length ? ` · ${Q.pending(a).length} request${Q.pending(a).length > 1 ? 's' : ''}` : ''}</button>`;
  else if (st === 'completed') cta = `${info}${inside ? chatBtn('btn-secondary') : '<button class="btn btn-secondary btn-block" disabled>Completed</button>'}`;
  else if (me === 'guest') cta = `${info}<button class="btn btn-primary btn-block" data-act="tab" data-arg="profile">Sign in to join</button>`;
  else if (me === 'approved') cta = `<button class="btn btn-secondary" data-act="leaveSheet" data-arg="${a.id}">Leave</button><button class="btn btn-done btn-block" ${goAttr('chat', { id: `c_${a.id}` })}>${ico('check')}You're going · Chat</button>`;
  else if (me === 'requested') cta = `${info}<button class="btn btn-secondary btn-block" data-act="cancelReq" data-arg="${a.id}">Request pending · Cancel</button>`;
  else if (me === 'declined') cta = `${info}<button class="btn btn-secondary btn-block" disabled>Request declined</button>`;
  else if (st === 'full') cta = `${info}<button class="btn btn-secondary btn-block" disabled>Adventure full</button>`;
  else cta = `${info}<button class="btn btn-primary btn-block" data-act="join" data-arg="${a.id}">${a.join_mode === 'instant' ? 'Join adventure' : a.price > 0 ? `Request to join · €${a.price}` : 'Request to join'}</button>`;
  const hostBlock = `<button class="host-card" ${goAttr('person', { id: a.host_id })}>${avatar(a.host_id, 48)}<span class="tx"><b>Hosted by ${a.host_id === Session.id ? 'you' : esc(host.name)}</b><small>${hostRatingInline(a.host_id) ? hostRatingInline(a.host_id) + '<br>' : ''}${host.note ? esc(host.note) + ' · ' : ''}${Q.level(a.host_id, a.sport_id) != null ? LEVELS[Q.level(a.host_id, a.sport_id)] + ' ' + esc(Q.sport(a.sport_id).name.toLowerCase()) : ''}</small></span>${ico('chev')}</button>`
    + (provider ? `<button class="host-card" style="margin-top:8px" ${goAttr('provider', { id: provider.id })}>${avatar('prov:' + provider.id, 48, { sq: true })}<span class="tx"><b>${esc(provider.name)}</b><small>${PROV_TYPES[provider.type]} · ${esc(provider.location)}</small></span>${ico('chev')}</button>` : '');
  const rk = a.lat != null ? Object.keys(REGIONS).find(r => project(r, a.lat, a.lng)) : null;
  return { cta, nav: false, body: `
    <div class="hero" style="height:290px">${art(a.cover)}<span class="shade"></span>
      <div class="bar">${backBtn('glass')}<span class="r"><button class="icon-btn glass" data-act="calSheet" data-arg="${a.id}" aria-label="Add to calendar">${ico('cal')}</button><button class="icon-btn glass" data-act="share" data-arg="a.${a.id}" aria-label="Share link">${ico('share')}</button>${saveBtn('adventure', a.id)}</span></div>
      <div class="cap-tx on-art" style="gap:8px"><span class="row" style="gap:6px">${stag(a.sport_id)}<span class="pill" style="background:rgba(250,250,247,.18);color:#fff">${typeLabel(a)}</span></span></div></div>
    <div class="detail-head"><h1>${esc(a.title)}</h1>${statePill(a) ? `<span>${statePill(a)}</span>` : ''}</div>
    <div class="facts-grid">
      <div><span class="mono">Date</span><b>${dateLabel(a)}</b></div><div><span class="mono">Time</span><b class="tnum">${timeLabel(a)}</b><span class="muted" style="font-size:11.5px">${esc((Q.dest(a.destination_id) || {}).name || '')} time</span></div>
      <div><span class="mono">Where</span><b>${esc(placeName(a))}</b></div><div><span class="mono">Level</span><b>${MIN_LEVELS[a.min_level]}</b></div>
      <div><span class="mono">Price</span><b>${priceLabel(a)}</b>${a.cost_note ? `<span class="muted" style="font-size:12px">${esc(a.cost_note)}</span>` : ''}${a.price > 0 ? '<span class="muted" style="font-size:12px">Paid to the provider directly</span>' : ''}</div>
      <div><span class="mono">Going</span><b class="tnum">${capText(a)}</b><span class="cap-wrap" style="margin-top:3px">${capMeter(a)}</span></div></div>
    ${hostBlock}
    <div class="blk"><h2>Overview</h2><p>${esc(a.description)}</p></div>
    ${a.requirements.length ? `<div class="blk"><h2>Requirements</h2><ul class="checks">${a.requirements.map(r => `<li>${ico('check')}<span>${esc(r)}</span></li>`).join('')}</ul></div>` : ''}
    ${a.equipment.length ? `<div class="blk"><h2>Bring</h2><ul class="checks dots">${a.equipment.map(r => `<li>${ico('chev')}<span>${esc(r)}</span></li>`).join('')}</ul></div>` : ''}
    <div class="blk"><h2>Who's going</h2><div class="group people-list" style="margin:0">${ids.map(x => { const pp = Q.prof(x); if (!pp) return ''; const l = Q.level(x, a.sport_id); return `<div class="lrow"><button ${goAttr('person', { id: x })} style="display:flex;gap:12px;align-items:center;flex:1;min-width:0">${avatar(x, 40)}<span class="tx"><b>${x === Session.id ? 'You' : esc(pp.name)}${x === a.host_id ? ' <span class="pill" style="height:20px;font-size:11px">Host</span>' : ''}</b><small>${l != null ? LEVELS[l] : 'Level not set'}${pp.note ? ` · ${esc(pp.note)}` : ''}</small></span></button>${l != null ? lvl(l, Q.sport(a.sport_id).color) : ''}</div>`; }).join('')}</div>
      ${Q.pending(a).length && !Policy.canManage(a) ? `<p class="muted" style="font-size:13px;margin-top:8px">${Q.pending(a).length} more waiting for the host to reply.</p>` : ''}</div>
    <div class="blk"><h2>Meeting point</h2><div class="meet">${rk ? `<button class="art mapbox" data-act="openMapAt" data-arg="adv:${a.id}" style="background:${REGIONS[rk].sea}">${mapSVG(rk, { mini: true, focus: project(rk, a.lat, a.lng), pins: [{ kind: 'adv', id: a.id, sport: a.sport_id, xy: project(rk, a.lat, a.lng) }] })}</button>` : ''}
      <div class="addr">${ico('pin')}<span>${esc(a.meeting_point || placeName(a))}${inside && a.meeting_point_exact ? `<br><b>${esc(a.meeting_point_exact)}</b>` : `<br><span class="muted" style="font-size:12.5px">The exact meeting spot is shared once you are approved.</span>`}</span></div></div></div>
    ${safetyBlock(a)}<div style="height:14px"></div>`,
    track: ['adventure_viewed', { adventure_id: a.id, sport: a.sport_id, type: a.type }] };
};

/* ---- Host management ---- */
SCREENS.manage = (p) => {
  const a = Store.get('adventures', p.id); if (!a) return notFound('This adventure is not available');
  if (!Policy.canManage(a)) return notFound('Only the host can manage this adventure', 'Open it from Explore to join instead.');
  const st = Q.status(a), pend = Q.pending(a), going = Q.going(a), closed = ['cancelled', 'completed'].includes(st);
  return { nav: false, body: `
    <div class="topbar">${backBtn()}<h1>Manage</h1>${statePill(a)}</div>
    <div class="pad"><button class="adv-row" ${goAttr('adv', { id: a.id })}>${art(a.cover)}<span class="tx">${stag(a.sport_id)}<h3>${esc(a.title)}</h3><span class="sub">${dateLabel(a)} · ${timeLabel(a)}</span><span class="cap-wrap">${capMeter(a)}${capText(a)}</span></span></button></div>
    <section class="sec">${secH('Requests', pend.length ? `${pend.length} waiting · ${a.capacity - going.length} spot${a.capacity - going.length === 1 ? '' : 's'} left` : '')}${pend.length ? `<div class="stack">${pend.map(r => { const w = Q.prof(r.profile_id) || {}; const l = Q.level(r.profile_id, a.sport_id); const ok = l == null || l >= a.min_level; return `<div class="match"><div class="row">${avatar(r.profile_id, 46)}<button ${goAttr('person', { id: r.profile_id })} style="flex:1;min-width:0"><b style="font-weight:800;display:block">${esc(w.name)}</b><small class="muted" style="font-size:12.5px;font-weight:600">Asked ${agoText(r.created_at)} · ${esc((w.languages || []).join(', '))}</small></button>${l != null ? lvl(l, Q.sport(a.sport_id).color) : ''}</div>${r.message ? `<p style="font-size:14px;line-height:1.45">“${esc(r.message)}”</p>` : ''}<div class="why">${trustPills(r.profile_id)}<span class="pill ${ok ? 'ok' : 'warn'}">${l != null ? LEVELS[l] : 'Level not set'}${ok ? '' : ` · below ${MIN_LEVELS[a.min_level]}`}</span>${w.note ? `<span class="pill">${esc(w.note)}</span>` : ''}</div><div class="row"><button class="btn btn-primary btn-sm btn-block" data-act="approve" data-arg="${r.id}" ${going.length >= a.capacity || closed ? 'disabled' : ''}>Approve</button><button class="btn btn-secondary btn-sm btn-block" data-act="decline" data-arg="${r.id}" ${closed ? 'disabled' : ''}>Decline</button></div></div>`; }).join('')}</div>${going.length >= a.capacity ? '<p class="muted pad" style="font-size:13px;margin-top:8px">Full. Raise the capacity in Edit to approve more people.</p>' : ''}` : emptyState('users', 'No requests right now', a.join_mode === 'instant' ? 'Anyone at the level joins straight away.' : 'New requests show up here and in your notifications.')}</section>
    <section class="sec">${secH('Confirmed', `${going.length} of ${a.capacity}`)}<div class="group">${going.map(r => personRow(r.profile_id, r.role === 'host' ? '<span class="pill">Host</span>' : '')).join('')}</div></section>
    <section class="sec">${secH('Actions')}<div class="group">
      <button class="lrow" ${goAttr('chat', { id: `c_${a.id}` })}><span class="icon-btn line">${ico('msg')}</span><span class="tx"><b>Adventure chat</b><small>Host and ${going.length - 1} confirmed</small></span>${ico('chev')}</button>
      ${closed ? '' : `<button class="lrow" data-act="editAdventure" data-arg="${a.id}"><span class="icon-btn line">${ico('edit')}</span><span class="tx"><b>Edit details</b><small>Everyone going gets a notification</small></span>${ico('chev')}</button>
      <button class="lrow" data-act="completeSheet" data-arg="${a.id}" ${Q.started(a) ? '' : 'aria-disabled="true"'}><span class="icon-btn line">${ico('check')}</span><span class="tx"><b>Mark as completed</b><small>${Q.started(a) ? 'Counts towards everyone’s history' : 'Available once it starts'}</small></span>${ico('chev')}</button>
      <button class="lrow" data-act="cancelSheet" data-arg="${a.id}"><span class="icon-btn line" style="color:var(--bad)">${ico('x')}</span><span class="tx"><b style="color:var(--bad)">Cancel adventure</b><small>Notifies everyone going and waiting</small></span>${ico('chev')}</button>`}
    </div></section>` };
};

/* ---- Find a buddy ---- */
function buddyDefaults(sid, did) {
  const me = Session.id, L = did || curLoc(), sun = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); return d; })();
  const s = sid && Q.sport(sid) ? sid : (Q.userSports(me)[0] || {}).sport_id || 'freediving';
  return { sport: s, dest: Q.destSports(L).some(x => x.id === s) ? L : (Store.find('destination_sports', r => r.sport_id === s) || {}).destination_id, date: `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`,
    start: '09:00', activity: (Q.sport(s).activity_types || [])[0], my: Q.level(me, s) ?? 1, want: 2, cap: 2, note: '', err: false };
}
SCREENS.buddy = () => {
  const B = UI.bf || (UI.bf = buddyDefaults()); const s = Q.sport(B.sport);
  const days = Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; });
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const done = { sport: !!B.sport, dest: !!B.dest, date: !!B.date, act: !!B.activity };
  return { nav: false, cta: `<button class="btn btn-primary btn-block" data-act="buddySubmit" ${done.sport && done.dest && done.date && done.act ? '' : 'disabled'}>${ico('users')}Find a buddy</button>`, body: `
    <div class="topbar">${backBtn()}<h1>Find a buddy</h1></div>
    <div class="page-h"><h1>Who can do this with you?</h1><p>Say what, where and when. We match you with people who want the same thing.</p></div>
    <div class="field"><span class="lab">Sport</span><div class="chips">${Q.sportsActive().map(x => `<button class="chip" aria-pressed="${B.sport === x.id}" data-act="bf" data-arg="sport:${x.id}">${ico(x.icon)}${esc(x.name)}</button>`).join('')}</div></div>
    <div class="field ${done.sport ? '' : 'dim'}"><span class="lab">Where?</span><div class="chips">${Q.destsSorted().filter(d => Q.destSports(d.id).some(x => x.id === B.sport)).map(d => `<button class="chip" aria-pressed="${B.dest === d.id}" data-act="bf" data-arg="dest:${d.id}">${ico('pin')}${esc(d.name)}</button>`).join('')}</div></div>
    <div class="field ${done.dest ? '' : 'dim'}"><span class="lab">When?</span><div class="chips scroll" style="padding:0 20px;margin:0 -20px">${days.map((d, i) => `<button class="chip" aria-pressed="${B.date === key(d)}" data-act="bf" data-arg="date:${key(d)}">${i === 0 ? 'Tomorrow' : new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d)} ${d.getDate()}</button>`).join('')}</div>
      <div class="row" style="gap:10px;margin-top:4px"><label for="bftime" class="muted" style="font-size:13px;font-weight:700">Start</label><input class="inp" id="bftime" type="time" value="${esc(B.start)}" style="width:140px;height:44px"></div></div>
    <div class="field ${done.date ? '' : 'dim'}"><span class="lab">What are you doing?</span><div class="chips">${(s.activity_types || []).map(x => `<button class="chip" aria-pressed="${B.activity === x}" data-act="bf" data-arg="activity:${x}">${esc(x)}</button>`).join('')}</div></div>
    <div class="field ${done.act ? '' : 'dim'}"><span class="lab">Your level <span style="font-weight:600">${Q.level(Session.id, B.sport) != null ? 'From your profile' : 'Not on your profile yet'}</span></span><div class="chips">${LEVELS.map((l, i) => `<button class="chip" aria-pressed="${B.my === i}" data-act="bf" data-arg="my:${i}">${l}</button>`).join('')}</div></div>
    <div class="field ${done.act ? '' : 'dim'}"><span class="lab">Preferred buddy level</span><div class="chips">${MIN_LEVELS.map((l, i) => `<button class="chip" aria-pressed="${B.want === i}" data-act="bf" data-arg="want:${i}">${i === 0 ? 'Any level' : l}</button>`).join('')}</div>${B.sport === 'freediving' && B.my >= 3 && B.want < 2 ? `<span class="hint">${ico('info', '14')} For depth over 20 m, a buddy who can do safety at a third of your depth is a good rule.</span>` : ''}</div>
    <div class="field ${done.act ? '' : 'dim'}"><span class="lab">How many people, including you</span><div class="stepper"><button data-act="bfCap" data-arg="-1" aria-label="Fewer">−</button><b class="tnum">${B.cap}</b><button data-act="bfCap" data-arg="1" aria-label="More">+</button></div></div>
    <div class="field ${done.act ? '' : 'dim'}"><label for="bfnote">Note <span style="font-weight:600">Optional</span></label><textarea class="inp" id="bfnote" maxlength="200" placeholder="Target depth, pace, what you want from the session">${esc(B.note)}</textarea></div>
    <div class="pad" style="margin-top:16px"><div class="lock-note">${ico('shield')}<span>Your request shows your first name, level and languages. The exact meeting point is only shared with people you approve.</span></div></div>`,
    after: v => { const n = $('#bfnote', v); if (n) n.oninput = () => UI.bf.note = n.value; const t = $('#bftime', v); if (t) t.oninput = () => UI.bf.start = t.value; } };
};
function buddyMatches(a) {
  const me = Session.id, sid = a.sport_id, did = a.destination_id;
  const ppl = Store.filter('profiles', p => p.id !== me && (p.home_destination_id === did || (p.location_sharing && p.current_destination_id === did)))
    .map(p => ({ p, l: Q.level(p.id, sid) })).filter(x => x.l !== undefined && Math.min(x.l, 3) >= a.min_level);
  const myLangs = (Session.me.languages || []);
  const day = dayIndex(a.starts_at, tzOf(a));
  return ppl.map(({ p, l }) => {
    const theirs = Q.listed().find(x => x.sport_id === sid && x.id !== a.id && Math.abs(dayIndex(x.starts_at, tzOf(x)) - day) <= 1 && Q.goingIds(x).includes(p.id));
    const why = [LEVELS[l]]; if (theirs) why.push(`Already going: ${theirs.title}`); if (p.note) why.push(p.note);
    const lang = (p.languages || []).find(x => myLangs.includes(x)); if (lang) why.push('Speaks ' + lang);
    return { p, l, why, theirs, score: (theirs ? 2 : 0) + (lang ? 1 : 0) + (p.home_destination_id === did ? 1 : 0) + (3 - Math.abs(l - (Q.level(me, sid) ?? 1))) / 3 };
  }).sort((x, y) => y.score - x.score).slice(0, 6);
}
SCREENS.buddyLive = (p) => {
  const a = Store.get('adventures', p.id); if (!a) return notFound('This buddy request is not available');
  const m = buddyMatches(a), day = dayIndex(a.starts_at, tzOf(a));
  const related = Q.listed().filter(x => x.id !== a.id && x.sport_id === a.sport_id && x.destination_id === a.destination_id && Math.abs(dayIndex(x.starts_at, tzOf(x)) - day) <= 1 && x.host_id !== Session.id && Math.max(x.min_level, 0) <= (Q.level(Session.id, a.sport_id) ?? 1));
  return { nav: false, body: `
    <div class="topbar">${backBtn()}<h1>Buddy request</h1><button class="btn-link" ${goAttr('adv', { id: a.id })} style="font-size:13px">Open listing</button></div>
    <div class="live-card"><span class="mono"><i></i>Your buddy request is live</span><h2>${esc(a.title)}</h2>
      <div class="meta-line"><span>${ico('pin')}${esc(placeName(a))}</span><span>${ico('cal')}${dateLabel(a)} · ${hm(a.starts_at, tzOf(a))}</span><span>${ico('level')}Looking for ${MIN_LEVELS[a.min_level]}</span></div>
      <p>Visible on Explore, the ${esc(Q.sport(a.sport_id).name)} hub, ${esc(Q.dest(a.destination_id).name)} and search. Requests to join land in Adventures › Hosting.</p></div>
    ${related.length ? `<section class="sec">${secH('Already happening', 'Join one of these instead, or as well')}<div class="stack">${related.map(x => advRow(x)).join('')}</div></section>` : ''}
    <section class="sec">${secH('Suggested buddies', 'Same sport, same place, compatible level')}<div class="stack">${m.length ? m.map(({ p, l, why, theirs }) => `<div class="match"><div class="row">${avatar(p.id, 46)}<button ${goAttr('person', { id: p.id })} style="flex:1;min-width:0"><b style="font-weight:800;display:block">${esc(p.name)}</b><small class="muted" style="font-size:12.5px;font-weight:600">${p.home_destination_id === a.destination_id ? 'Local' : 'Visiting'} · ${esc((p.languages || []).join(', '))}</small></button>${lvl(l, Q.sport(a.sport_id).color)}</div>
      <div class="why">${why.map((w, i) => `<span class="pill ${i === 1 && theirs ? 'ok' : ''}">${esc(w)}</span>`).join('')}</div>
      <div class="row"><button class="btn btn-primary btn-sm btn-block" data-act="dm" data-arg="${p.id}">${ico('msg')}Message ${esc(p.name.split(' ')[0])}</button>${theirs ? `<button class="btn btn-secondary btn-sm" ${goAttr('adv', { id: theirs.id })}>See theirs</button>` : ''}</div></div>`).join('') : emptyState('users', 'No perfect match yet', 'Keep your request live. People who fit see it on Explore and in their sport hub.')}</div></section>` };
};

/* ---- Create / edit adventure ---- */
function createDefaults(sid, did) {
  const me = Session.id, mem = Policy.memberships();
  const s = sid && Q.sport(sid) ? sid : (Q.userSports(me)[0] || {}).sport_id || 'freediving';
  const d0 = did || (Q.destSports(curLoc()).some(x => x.id === s) ? curLoc() : (Store.find('destination_sports', r => r.sport_id === s) || {}).destination_id);
  const dt = new Date(); dt.setDate(dt.getDate() + ((6 - dt.getDay() + 7) % 7 || 7));
  return { step: 1, editId: null, sport_id: s, type: 'training', provider_id: mem.length ? null : null, destination_id: d0, spot_id: (Store.find('spots', x => x.destination_id === d0 && x.sport_id === s) || {}).id || null,
    date: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`, t1: '09:00', t2: '12:00', capacity: 4, min_level: 2, paid: false, price: '', cost_note: '',
    title: '', description: '', requirements: '', equipment: '', meeting_point: '', meeting_point_exact: '', cover: ((Q.sport(s) || {}).photos || [])[0] || (Q.sport(s) || {}).image || 'ridge', join_mode: 'approval', errors: {}, done: null, pro: false };
}
function fromAdventure(a) {
  const tz = tzOf(a), p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(a.starts_at)).map(x => [x.type, x.value]));
  return { ...createDefaults(a.sport_id, a.destination_id), step: 1, editId: a.id, sport_id: a.sport_id, type: a.type, provider_id: a.provider_id, destination_id: a.destination_id, spot_id: a.spot_id, date: `${p.year}-${p.month}-${p.day}`,
    t1: hm(a.starts_at, tz), t2: hm(a.ends_at, tz), capacity: a.capacity, min_level: a.min_level, paid: a.price > 0, price: a.price ? String(a.price) : '', cost_note: a.cost_note || '', title: a.title, description: a.description,
    requirements: (a.requirements || []).join('\n'), equipment: (a.equipment || []).join('\n'), meeting_point: a.meeting_point || '', meeting_point_exact: a.meeting_point_exact || '', cover: a.cover, join_mode: a.join_mode, pro: !!a.provider_id, safety_plan: a.safety_plan || '' };
}
/* Wall-clock date + time in the destination's zone → ISO instant. */
function zonedIso(ymd, hhmm, tz) {
  const [y, m, d] = ymd.split('-').map(Number), [h, mi] = hhmm.split(':').map(Number); let t = Date.UTC(y, m - 1, d, h, mi);
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  for (let i = 0; i < 2; i++) { const p = Object.fromEntries(f.formatToParts(new Date(t)).map(x => [x.type, x.value])); t += Date.UTC(y, m - 1, d, h, mi) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute); }
  return new Date(t).toISOString();
}
function validateCreate(C, step) {
  const e = {};
  if (step === 1) { if (!C.sport_id) e.sport = 'Pick a sport.'; if (!C.type) e.type = 'Pick a type.'; if (C.pro && !C.provider_id) e.provider = 'Choose which provider is listing this.'; }
  if (step === 2) {
    if (!C.destination_id) e.dest = 'Pick a destination.';
    if (!C.date) e.date = 'Pick a date.';
    if (!C.t1 || !C.t2) e.time = 'Add a start and end time.';
    else if (C.date) { const tz = (Q.dest(C.destination_id) || {}).timezone, s = zonedIso(C.date, C.t1, tz), en = zonedIso(C.date, C.t2, tz); if (en <= s) e.time = 'End time must be after the start.'; else if (!C.editId && new Date(s) < new Date()) e.time = 'That time has already passed.'; }
    if (C.paid && !(+C.price > 0)) e.price = 'Add a price, or switch back to free.';
    if (C.editId) { const a = Store.get('adventures', C.editId); if (a && C.capacity < Q.going(a).length) e.capacity = `${Q.going(a).length} people are already going.`; }
  }
  if (step === 3) { if (!C.title.trim()) e.title = 'Add a title so people know what they are joining.'; if (C.description.trim().length < 20) e.description = 'Describe the plan in a sentence or two.'; }
  return e;
}
SCREENS.create = () => {
  const C = UI.cf; if (!C) return notFound('Nothing to create');
  const s = Q.sport(C.sport_id), mem = Policy.memberships(), E = C.errors || {};
  const err = k => E[k] ? `<span class="err">${ico('info')}${E[k]}</span>` : '';
  if (C.done) { const a = Store.get('adventures', C.done); if (!a) return notFound('Saved, but it is not visible yet'); const audience = Store.filter('profiles', p => p.id !== Session.id && Q.level(p.id, a.sport_id) !== undefined && (p.home_destination_id === a.destination_id || p.current_destination_id === a.destination_id)).length;
    return { nav: false, body: `<div class="success"><span class="big-x">${MARK(56)}</span><h1>${C.editId ? 'Changes saved' : 'Your adventure is live'}</h1><p>${C.editId ? 'Everyone going has been notified.' : `${audience} ${esc(Q.sport(a.sport_id).name.toLowerCase())} people in ${esc(Q.dest(a.destination_id).name)} can see it on Explore, the sport hub and the destination page.`}</p></div><div style="margin-top:22px">${advHero(a)}</div><div class="pad" style="display:grid;gap:10px;margin-top:16px"><button class="btn btn-primary" data-act="viewCreated">View adventure</button><button class="btn btn-secondary" data-act="tab" data-arg="adventures">Go to Hosting</button></div>` }; }
  const head = `<div class="topbar">${C.step > 1 ? `<button class="icon-btn line" data-act="cStep" data-arg="-1" aria-label="Previous step">${ico('back')}</button>` : backBtn()}<h1>${C.editId ? 'Edit adventure' : C.pro ? 'List a professional experience' : 'Create an adventure'}</h1><span class="mono muted">${C.step} of 3</span></div><div class="progress"><i style="width:${C.step / 3 * 100}%"></i></div>`;
  let body = '', cta = '';
  if (C.step === 1) {
    const types = Object.entries(TYPES).filter(([k, t]) => C.pro ? t.pro || k === 'community_event' : !t.pro);
    body = `<div class="page-h" style="padding-top:20px"><h1>What are you doing?</h1></div>
      ${C.pro ? `<div class="field"><span class="lab">Listing for</span><div style="display:grid;gap:8px">${mem.map(m => { const pr = Q.prov(m.provider_id); return `<button class="choice" aria-pressed="${C.provider_id === pr.id}" data-act="cf" data-arg="provider_id:${pr.id}">${avatar('prov:' + pr.id, 38, { sq: true })}<span class="tx"><b>${esc(pr.name)}</b><small>${PROV_TYPES[pr.type]} · ${m.role}</small></span><span class="tick">${ico('check')}</span></button>`; }).join('')}</div>${err('provider')}</div>` : ''}
      <div class="field"><span class="lab">Sport</span><div class="sport-grid">${Q.sportsActive().filter(x => !C.pro || !C.provider_id || Q.prov(C.provider_id).sports.includes(x.id)).map(x => `<button class="sport-pick" style="${sportStyle(x)}" aria-pressed="${C.sport_id === x.id}" data-act="cf" data-arg="sport_id:${x.id}"><span class="ic">${ico(x.icon, 24)}</span>${esc(x.name)}</button>`).join('')}</div>${err('sport')}</div>
      <div class="field"><span class="lab">Type</span><div style="display:grid;gap:8px">${types.map(([k, t]) => `<button class="choice" aria-pressed="${C.type === k}" data-act="cf" data-arg="type:${k}"><span class="tx"><b>${t.label}</b><small>${({ buddy_request: 'You and one or two others', training: 'A session open to the right level', meetup: 'Social, low commitment', community_event: 'Bigger free gathering', course: 'Teaching with a clear outcome', guided_experience: 'A guided day out', trip: 'Travel together, several days', retreat: 'Stay, train and rest', camp: 'Intensive training block', competition: 'Judged event' })[k]}</small></span><span class="tick">${ico('check')}</span></button>`).join('')}</div>${err('type')}</div>
      ${!C.pro && !C.editId ? `<p class="muted pad" style="font-size:13px;margin-top:14px">${mem.length ? `You can also <button class="btn-link" data-act="startPro">list a professional experience</button> for your provider.` : 'Courses, guided days and trips are listed by verified providers.'}</p>` : ''}`;
    cta = `<button class="btn btn-primary btn-block" data-act="cStep" data-arg="1">Continue</button>`;
  }
  if (C.step === 2) {
    const spots = Store.filter('spots', x => x.destination_id === C.destination_id && x.sport_id === C.sport_id);
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; });
    const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const canPaid = C.pro && C.provider_id;
    body = `<div class="page-h" style="padding-top:20px"><h1>Where and when?</h1></div>
      <div class="field"><span class="lab">Destination</span><div class="chips">${Q.destsSorted().filter(d => Q.destSports(d.id).some(x => x.id === C.sport_id)).map(d => `<button class="chip" aria-pressed="${C.destination_id === d.id}" data-act="cf" data-arg="destination_id:${d.id}">${esc(d.name)}</button>`).join('')}</div>${err('dest')}</div>
      <div class="field"><span class="lab">Spot <span style="font-weight:600">Optional</span></span>${spots.length ? `<div class="chips">${spots.map(x => `<button class="chip" aria-pressed="${C.spot_id === x.id}" data-act="cf" data-arg="spot_id:${C.spot_id === x.id ? '' : x.id}">${ico('pin')}${esc(x.name)}</button>`).join('')}</div>` : `<span class="hint">No mapped ${esc(s.name.toLowerCase())} spots here yet. Describe the meeting point in the next step.</span>`}</div>
      <div class="field"><span class="lab">Date${C.date && !days.some(d => key(d) === C.date) ? ` <span style="font-weight:600">${C.date}</span>` : ''}</span><div class="chips scroll" style="padding:0 20px;margin:0 -20px">${days.map(d => `<button class="chip" aria-pressed="${C.date === key(d)}" data-act="cf" data-arg="date:${key(d)}">${new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)}</button>`).join('')}</div>${err('date')}</div>
      <div class="field" style="grid-template-columns:1fr 1fr;column-gap:10px"><label for="ct1">Start</label><label for="ct2">End</label><input class="inp ${E.time ? 'bad' : ''}" id="ct1" type="time" value="${esc(C.t1)}"><input class="inp ${E.time ? 'bad' : ''}" id="ct2" type="time" value="${esc(C.t2)}"><span class="hint" style="grid-column:1/-1">${esc((Q.dest(C.destination_id) || {}).name || '')} local time</span>${E.time ? `<span class="err" style="grid-column:1/-1">${ico('info')}${E.time}</span>` : ''}</div>
      <div class="field"><span class="lab">How many people, including you</span><div class="stepper"><button data-act="cap" data-arg="-1" aria-label="Fewer">−</button><b class="tnum">${C.capacity}</b><button data-act="cap" data-arg="1" aria-label="More">+</button><span class="muted" style="font-size:13px">${C.sport_id === 'freediving' ? 'Even numbers keep buddy pairs simple' : ''}</span></div>${err('capacity')}</div>
      <div class="field"><span class="lab">Required level</span><div class="chips">${MIN_LEVELS.map((l, i) => `<button class="chip" aria-pressed="${C.min_level === i}" data-act="cf" data-arg="min_level:${i}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="lab">Price</span><div class="chips"><button class="chip" aria-pressed="${!C.paid}" data-act="cf" data-arg="paid:">Free</button><button class="chip ${canPaid ? '' : 'locked'}" aria-pressed="${C.paid}" data-act="${canPaid ? 'cf' : 'paidLocked'}" data-arg="paid:1">${canPaid ? '' : ico('lock')}Paid</button></div>
        ${C.paid ? `<div class="row" style="gap:10px"><span style="font-weight:800">€</span><input class="inp ${E.price ? 'bad' : ''}" id="cprice" inputmode="decimal" placeholder="75" value="${esc(C.price)}" style="width:140px"><span class="hint">Per person. Paid to the provider directly for now.</span></div>${err('price')}` : `<input class="inp" id="ccost" placeholder="Shared costs, e.g. boat fuel about €8" value="${esc(C.cost_note)}"><span class="hint">Community adventures are free to join. Only note real shared costs.</span>`}</div>`;
    cta = `<button class="btn btn-primary btn-block" data-act="cStep" data-arg="1">Continue</button>`;
  }
  if (C.step === 3) {
    const SPORT_PHOTOS = { freediving: ['line-pair', 'beginner-buoy', 'pool-lane', 'descent-surface'], climbing: ['wadi-qnai', 'rocks-summit'], hiking: ['sinai-summit', 'teide', 'anaga'], surfing: ['srilanka-mirissa'], scuba: ['reef-diver', 'turtle'] };
    const covers = [...new Set([C.cover, ...((Q.sport(C.sport_id) || {}).photos || []), ...(SPORT_PHOTOS[C.sport_id] || []).map(k => `photos/${k}.jpg`), s.image, 'deep', 'reef', 'surf', 'rock', 'ridge', 'kite', 'sunrise', 'gym'])].filter(Boolean).slice(0, 7);
    body = `<div class="page-h" style="padding-top:20px"><h1>Tell people about it</h1></div>
      <div class="field"><label for="ctitle">Title</label><input class="inp ${E.title ? 'bad' : ''}" id="ctitle" maxlength="60" placeholder="Sunday line session at Garraf" value="${esc(C.title)}">${err('title')}</div>
      <div class="field"><label for="cdesc">What's the plan?</label><textarea class="inp ${E.description ? 'bad' : ''}" id="cdesc" maxlength="1200" placeholder="Pace, goals, what happens after">${esc(C.description)}</textarea>${err('description')}</div>
      <div class="field"><label for="creq">Requirements <span style="font-weight:600">One per line</span></label><textarea class="inp" id="creq" style="min-height:70px" placeholder="AIDA 2 or equivalent">${esc(C.requirements)}</textarea></div>
      <div class="field"><label for="ceq">Bring <span style="font-weight:600">One per line</span></label><textarea class="inp" id="ceq" style="min-height:70px" placeholder="5 mm wetsuit">${esc(C.equipment)}</textarea></div>
      <div class="field"><label for="csafety">Safety plan <span style="font-weight:600">Shown to everyone before they join</span></label><textarea class="inp" id="csafety" maxlength="600" placeholder="${esc(SAFETY_HINT[C.sport_id] || 'How the group keeps each other safe')}">${esc(C.safety_plan || '')}</textarea><span class="hint">Who does safety, max depth or grade, turn-around time, what happens if conditions change.</span></div>
      <div class="field"><label for="cmeet">Meeting area <span style="font-weight:600">Public</span></label><input class="inp" id="cmeet" placeholder="Port Ginesta, Garraf" value="${esc(C.meeting_point)}"></div>
      <div class="field"><label for="cmeetx">Exact meeting spot <span style="font-weight:600">Only for approved people</span></label><input class="inp" id="cmeetx" placeholder="North pontoon by the fuel dock, 08:45" value="${esc(C.meeting_point_exact)}"></div>
      <div class="field"><span class="lab">Cover image</span><div class="art-pick"><label class="up-tile" for="ccover">${ico('plus')}<span>Your photo</span></label><input type="file" id="ccover" accept="image/*" hidden>${String(C.cover || '').startsWith('media:') ? `<button aria-pressed="true" data-act="cf" data-arg="cover:${C.cover}" aria-label="Your uploaded photo">${art(C.cover)}</button>` : ''}${covers.filter(k => !String(k).startsWith('media:')).map(k => `<button aria-pressed="${C.cover === k}" data-act="cf" data-arg="cover:${k}" aria-label="Cover ${k}">${art(k)}</button>`).join('')}</div><span class="hint">Your own photo works best: the place, the gear, the crew. It is resized on your phone before upload.</span></div>
      <div class="field"><span class="lab">Who can join</span><div style="display:grid;gap:8px">${[['instant', 'Anyone at the level', 'They join straight away'], ['approval', 'I approve each person', 'Best for depth, multi-pitch and small groups']].map(([v, t, d]) => `<button class="choice" aria-pressed="${C.join_mode === v}" data-act="cf" data-arg="join_mode:${v}"><span class="tx"><b>${t}</b><small>${d}</small></span><span class="tick">${ico('check')}</span></button>`).join('')}</div></div>`;
    cta = `<button class="btn btn-primary btn-block" data-act="publish">${C.editId ? 'Save changes' : 'Publish adventure'}</button>`;
  }
  return { nav: false, cta, body: head + body, after: v => {
    const bind = (id, key) => { const el = $('#' + id, v); if (el) el.oninput = () => { UI.cf[key] = el.value; }; };
    bind('ct1', 't1'); bind('ct2', 't2'); bind('ccost', 'cost_note'); bind('cprice', 'price'); bind('ctitle', 'title'); bind('cdesc', 'description'); bind('creq', 'requirements'); bind('ceq', 'equipment'); bind('cmeet', 'meeting_point'); bind('csafety', 'safety_plan'); bind('cmeetx', 'meeting_point_exact');
  } };
};

/* ---- My adventures ---- */
SCREENS.my = (p) => {
  const tab = p.tab || 'upcoming', M = Q.myAdventures();
  const savedRows = Store.filter('saved_items', s => s.profile_id === Session.id);
  const pendingForMe = M.hosting.reduce((n, a) => n + Q.pending(a).length, 0);
  const counts = { upcoming: M.upcoming.length + M.hosting.length, requests: M.requests.length, hosting: M.hosting.length, past: M.past.length, saved: savedRows.length };
  let c = '';
  if (tab === 'upcoming') {
    const list = [...new Set([...M.upcoming, ...M.hosting])].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    if (!list.length) c = emptyState('cal', 'Nothing planned yet', 'Adventures you join or host show up here like a calendar.', `<button class="btn btn-primary btn-sm" data-act="tab" data-arg="explore">Find an adventure</button>`);
    else { const by = {}; list.forEach(a => (by[dayKey(a.starts_at, tzOf(a))] = by[dayKey(a.starts_at, tzOf(a))] || []).push(a));
      c = Object.values(by).map(l => { const s = stamp(l[0]), near = dayIndex(l[0].starts_at, tzOf(l[0])) - dayIndex(nowIso(), tzOf(l[0])) <= 2; return `<div class="cal-group"><span class="stamp ${near ? 'dark' : ''}"><span class="d">${s.d}</span><span class="n">${s.n}</span></span><div class="items">${l.map(a => advRow(a, `<span class="role" style="color:${a.host_id === Session.id ? 'var(--forest)' : 'var(--ok)'}">${a.host_id === Session.id ? (a.type === 'buddy_request' ? 'Your buddy request' : 'Hosting') : 'Going'}</span>`)).join('')}</div></div>`; }).join(''); }
  }
  if (tab === 'requests') c = M.requests.length ? `<div class="stack" style="margin-top:16px">${M.requests.map(a => `<div class="host-item">${advRow(a, requestLabel(a))}${claimCta(a)}</div>`).join('')}</div>` : emptyState('clock', 'No pending requests', 'When you ask to join an adventure, it waits here until the host answers.');
  if (tab === 'hosting') c = M.hosting.length ? `<div class="stack" style="margin-top:16px">${M.hosting.map(a => { const n = Q.pending(a).length; return `<div class="host-item">${advRow(a)}<button class="btn ${n ? 'btn-primary' : 'btn-secondary'} btn-sm btn-block" ${goAttr('manage', { id: a.id })}>${n ? `Review ${n} request${n > 1 ? 's' : ''}` : 'Manage'}</button></div>`; }).join('')}</div>` : emptyState('route', 'You are not hosting anything', 'Create an adventure or post a buddy request. You approve who joins.', `<button class="btn btn-primary btn-sm" data-act="openCreate">Start something</button>`);
  if (tab === 'past') c = M.past.length ? `<div class="stack" style="margin-top:16px">${M.past.map(a => `<div class="host-item">${advRow(a)}${reviewCta(a)}</div>`).join('')}</div>` : emptyState('flag', 'No completed adventures yet', 'Once a host marks an adventure completed, it counts here and on your profile.');
  if (tab === 'saved') {
    const grp = (type, label, render) => { const rows = savedRows.filter(s => s.item_type === type).map(s => s.item_id); return rows.length ? `<section class="sec" style="padding-top:18px">${secH(label)}${render(rows)}</section>` : ''; };
    c = savedRows.length ? grp('adventure', 'Adventures', ids => `<div class="stack">${ids.map(id => Store.get('adventures', id)).filter(Boolean).map(a => advRow(a)).join('') || '<p class="muted pad">These adventures were removed.</p>'}</div>`)
      + grp('destination', 'Destinations', ids => `<div class="rail-x">${ids.map(Q.dest).filter(Boolean).map(d => destCard(d, 170, 140)).join('')}</div>`)
      + grp('provider', 'Schools and guides', ids => `<div class="group">${ids.map(Q.prov).filter(Boolean).map(provRow).join('')}</div>`)
      + grp('spot', 'Spots', ids => `<div class="group">${ids.map(Q.spot).filter(Boolean).map(spotRow).join('')}</div>`)
      : emptyState('bookmark', 'Your next adventure could be here', 'Tap the bookmark on any adventure, place, spot or school to keep it.', `<button class="btn btn-primary btn-sm" data-act="tab" data-arg="explore">Explore adventures</button>`);
  }
  return { body: `<div class="page-h" style="padding-top:12px"><h1>Your adventures</h1>${pendingForMe ? `<p><button class="btn-link" data-act="setP" data-arg="tab:hosting">${pendingForMe} request${pendingForMe > 1 ? 's' : ''} waiting for you</button></p>` : ''}</div>
    <div class="tabs-line" role="tablist" style="margin-top:12px">${[['upcoming', 'Upcoming'], ['requests', 'Requests'], ['hosting', 'Hosting'], ['past', 'Past'], ['saved', 'Saved']].map(([t, l]) => `<button role="tab" aria-selected="${tab === t}" data-act="setP" data-arg="tab:${t}">${l}${t === 'hosting' && pendingForMe ? '<span class="tdot" aria-label="requests waiting"></span>' : ''}</button>`).join('')}</div>${c}`, after: v => { const s = v.querySelector('.tabs-line [aria-selected="true"]'); if (s) s.scrollIntoView({ block: 'nearest', inline: 'center' }); } };
};

/* ---- Messages ---- */
SCREENS.inbox = (p) => {
  const tab = p.tab || 'adv', all = Q.conversationsForMe(), list = all.filter(c => tab === 'adv' ? c.type === 'adventure' : c.type === 'direct');
  const title = c => { if (c.type === 'adventure') return (Store.get('adventures', c.adventure_id) || {}).title || 'Adventure'; const o = Store.find('conversation_members', m => m.conversation_id === c.id && m.profile_id !== Session.id); return (Q.prof(o && o.profile_id) || {}).name || 'Conversation'; };
  return { body: `<div class="page-h" style="padding-top:12px"><h1>Messages</h1><p>For planning real sessions. Everything else can wait.</p></div>
    <div class="seg" role="tablist" style="margin-top:16px">${[['adv', 'Adventure chats'], ['dm', 'Direct']].map(([t, l]) => { const u = all.filter(c => (t === 'adv' ? c.type === 'adventure' : c.type === 'direct') && Q.unread(c)).length; return `<button role="tab" aria-selected="${tab === t}" data-act="setP" data-arg="tab:${t}">${l}${u ? `<span class="n">${u}</span>` : ''}</button>`; }).join('')}</div>
    <div style="margin-top:10px">${list.length ? list.map(c => { const ms = Q.messages(c.id), l = ms[ms.length - 1], u = Q.unread(c), a = c.adventure_id ? Store.get('adventures', c.adventure_id) : null;
      const other = c.type === 'direct' ? (Store.find('conversation_members', m => m.conversation_id === c.id && m.profile_id !== Session.id) || {}).profile_id : null;
      const who = l && l.sender_id && l.kind !== 'system' ? (l.sender_id === Session.id ? 'You' : ((Q.prof(l.sender_id) || {}).name || '').split(' ')[0]) + ': ' : '';
      return `<button class="msg-row ${u ? 'unread' : ''}" ${goAttr('chat', { id: c.id })}>${a ? art(a.cover, 'thumb') : avatar(other, 52)}<span class="tx"><b><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title(c))}</span><time>${l ? ago(l.created_at) : ''}</time></b><p>${l ? esc(who + l.body) : 'No messages yet'}</p>${a ? `<span style="display:block;margin-top:6px">${avStack(Q.goingIds(a), 5, 20)}</span>` : ''}</span>${u ? `<span class="pill dark" style="height:20px;min-width:20px;justify-content:center;padding:0 6px">${u}</span>` : ''}</button>`; }).join('')
      : emptyState('msg', tab === 'adv' ? 'No adventure chats yet' : 'No direct messages yet', tab === 'adv' ? 'Meet someone through an adventure and your conversations will appear here.' : 'Message a host or buddy from their profile.')}</div>` };
};
SCREENS.chat = (p) => {
  const c = Store.get('conversations', p.id);
  if (!c || !Policy.canAccessConversation(c)) { const a = c && Store.get('adventures', c.adventure_id); return { nav: false, body: `<div class="topbar">${backBtn()}<h1>Adventure chat</h1></div>${emptyState('lock', 'Only people going can read this chat', a ? 'Ask to join and it opens once the host approves you.' : 'This conversation is not available.', a ? `<button class="btn btn-primary btn-sm" ${goAttr('adv', { id: a.id })}>View adventure</button>` : '')}` }; }
  const a = c.adventure_id ? Store.get('adventures', c.adventure_id) : null;
  const other = c.type === 'direct' ? (Store.find('conversation_members', m => m.conversation_id === c.id && m.profile_id !== Session.id) || {}).profile_id : null;
  const ms = Q.messages(c.id); let lastDay = '';
  const bubbles = ms.map(m => { const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(m.created_at)); const sep = day !== lastDay ? (lastDay = day, `<div class="bub sys">${day}</div>`) : '';
    if (m.kind === 'announcement') return sep + `<div class="bub ann"><span class="mono">Announcement · ${esc(m.sender_id === Session.id ? 'You' : ((Q.prof(m.sender_id) || {}).name || 'Host').split(' ')[0])}</span>${esc(m.body)}<time>${clock(m.created_at)}</time></div>`;
    if (m.kind === 'system' || !m.sender_id) return sep + `<div class="bub sys">${esc(m.body)}</div>`;
    if (m.sender_id === Session.id) return sep + `<div class="bub me">${esc(m.body)}<time>${clock(m.created_at)}</time></div>`;
    return sep + `<div class="bub-row">${avatar(m.sender_id, 28, { badge: false })}<div class="bub">${a ? `<span class="who">${esc(((Q.prof(m.sender_id) || {}).name || 'Someone').split(' ')[0])}</span>` : ''}${esc(m.body)}<time>${clock(m.created_at)}</time></div></div>`; }).join('');
  return { nav: false, cta: `<form class="composer" data-form="send" data-arg="${c.id}"><input id="msgin" autocomplete="off" maxlength="2000" placeholder="Message" aria-label="Message"><button type="submit" aria-label="Send">${ico('send')}</button></form>`, body: `
    <div class="topbar">${backBtn()}${a ? art(a.cover, '', 'width:38px;height:38px;border-radius:11px;flex:none') : avatar(other, 38)}<h1 style="display:grid;line-height:1.2">${esc(a ? a.title : (Q.prof(other) || {}).name || 'Conversation')}<small class="muted" style="font-size:12px;font-weight:600">${a ? `${Q.going(a).length} going` : 'Direct message'}</small></h1>${a ? '' : `<button class="icon-btn line" ${goAttr('person', { id: other })} aria-label="Profile">${ico('user')}</button>`}</div>
    ${a ? `<div class="pinned"><span class="mono">Pinned · Adventure plan</span><b>${esc(a.title)}</b><div class="meta-line"><span>${ico('cal')}${dateLabel(a)}</span><span>${ico('clock')}${timeLabel(a)}</span></div><div class="meta-line"><span>${ico('pin')}${esc(a.meeting_point_exact || a.meeting_point || placeName(a))}</span></div><div class="row between"><span class="cap-wrap" style="color:#CBD5CE">${avStack(Q.goingIds(a), 5, 24)} ${Q.going(a).length} / ${a.capacity}</span><button class="btn btn-done btn-sm" ${goAttr('adv', { id: a.id })}>View adventure</button></div></div>` : ''}
    <div class="bubbles" id="bubbles">${bubbles || '<div class="bub sys">No messages yet. Say hi and agree on the plan.</div>'}</div>`,
    after: v => { v.scrollTop = v.scrollHeight; Chat.markRead(c.id).catch(() => {}); }, keepBottom: true };
};

/* ---- Profiles ---- */
SCREENS.profile = () => profileScreen(Session.id);
SCREENS.person = (p) => profileScreen(p.id);
function profileScreen(id) {
  const P = Q.prof(id); if (!P) return notFound('This profile is not available', 'The person may have left EXTour.');
  const own = id === Session.id, us = Q.userSports(id);
  const parts = Store.filter('adventure_participants', x => x.profile_id === id).map(x => [x, Store.get('adventures', x.adventure_id)]).filter(([, a]) => a);
  const completed = parts.filter(([x, a]) => Q.status(a) === 'completed' && ['approved', 'completed'].includes(x.status)).map(([, a]) => a).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const upcoming = parts.filter(([x, a]) => x.status === 'approved' && ['published', 'full'].includes(Q.status(a))).map(([, a]) => a).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const created = Store.filter('adventures', a => a.host_id === id);
  const countries = [...new Set(completed.map(a => (Q.dest(a.destination_id) || {}).country).filter(Boolean))];
  const homeC = (P.home_location || '').split(',').pop().trim(); const passport = [...new Set([...(homeC ? [homeC] : []), ...countries])];
  const rot = ['-8deg', '5deg', '-3deg', '7deg'], cols = ['#2458A8', '#9C4420', '#0F6E65', '#426B2D'];
  const mem = Policy.memberships(id);
  return { body: `
    <div class="topbar">${own ? '<h1>Profile</h1>' : backBtn() + '<h1></h1>'}${own ? `<button class="icon-btn line" data-act="accountSheet" aria-label="Account">${ico('gear')}</button>` : `<button class="icon-btn line" data-act="personMenu" data-arg="${id}" aria-label="More options">${ico('more')}</button>`}</div>
    <div class="prof-head"><div class="top">${avatar(id, 88)}<div style="min-width:0"><h1>${esc(P.name)}</h1>${P.username ? `<div class="loc" style="font-family:var(--f-mono);font-size:12px">@${esc(P.username)}</div>` : ''}<div class="loc">${ico('pin')}${esc(P.home_location || (Q.dest(P.home_destination_id) || {}).name || 'Somewhere')}${P.location_sharing && P.current_destination_id && P.current_destination_id !== P.home_destination_id ? ` · now in ${esc(Q.dest(P.current_destination_id).name)}` : ''}</div><div class="loc">${ico('globe')}${esc((P.languages || []).join(', ') || 'No languages yet')}</div></div></div>
      ${(P.verified || []).length || P.note ? `<div class="row" style="flex-wrap:wrap;gap:6px">${P.note ? `<span class="pill dark">${esc(P.note)}</span>` : ''}${(P.verified || []).filter(v => v === 'email').map(() => `<span class="pill ok">${ico('check')}Email verified</span>`).join('')}${Policy.memberships(P.id).length ? `<span class="pill ok">${ico('shield')}Teaches with a verified provider</span>` : ''}</div>` : ''}
      ${P.bio ? `<p class="bio">${esc(P.bio)}</p>` : own ? `<p class="bio muted">Add a short bio so hosts know who is asking to join.</p>` : ''}
      ${own ? `<div class="row"><button class="btn btn-secondary btn-sm btn-block" data-act="editProfile">${ico('edit')}Edit profile</button><button class="btn btn-secondary btn-sm btn-block" data-act="editSports">Update my sports</button></div>`
        : `<div class="row"><button class="btn btn-primary btn-block" data-act="dm" data-arg="${id}">${ico('msg')}Message</button></div>`}</div>
    ${own ? completenessCard(P) : ''}${trustSummary(id)}<div class="stats3"><div><b class="tnum">${completed.length}</b><span>completed</span></div><div><b class="tnum">${passport.length}</b><span>countr${passport.length === 1 ? 'y' : 'ies'}</span></div><div><b class="tnum">${us.length}</b><span>sport${us.length === 1 ? '' : 's'}</span></div></div>
    <section class="sec">${secH('Sports')}${us.length ? `<div class="group">${us.map(u => { const s = Q.sport(u.sport_id); return s ? `<button class="sport-lv" style="${sportStyle(s)};width:100%" ${goAttr('sport', { id: s.id })}><span class="ic">${ico(s.icon)}</span><span class="tx"><b>${esc(s.name)}</b><small>${LEVELS[u.level]}${u.note ? ` · ${esc(u.note)}` : ''}</small></span>${lvl(u.level, s.color)}</button>` : ''; }).join('')}</div>` : emptyState('layers', 'No sports yet', own ? 'Add the sports you do or want to try.' : 'Nothing added yet.')}</section>
    ${reviewsSection(id)}
    ${mem.length ? `<section class="sec">${secH('Teaches with')}<div class="group">${mem.map(m => Q.prov(m.provider_id)).filter(Boolean).map(provRow).join('')}</div></section>` : ''}
    <section class="sec">${secH('Adventure passport', `${passport.length} countr${passport.length === 1 ? 'y' : 'ies'} so far`)}<div class="passport">${passport.map((c, i) => `<span class="stampc" style="--rot:${rot[i % 4]};--c:${cols[i % 4]}"><span><b>${esc(c)}</b><small>${i === 0 && homeC ? 'Home' : 'Visited'}</small></span></span>`).join('')}<span class="stampc empty" style="--rot:4deg"><span><b>Next?</b><small>Where to</small></span></span></div></section>
    <section class="sec">${secH('Upcoming')}${!canSeeAdventures(P) ? emptyState('lock', 'Upcoming adventures are private', 'They are shared only with people who have done adventures together.') : upcoming.length ? `<div class="stack">${upcoming.slice(0, 5).map(a => advRow(a, a.host_id === id ? '<span class="role" style="color:var(--forest)">Hosting</span>' : '')).join('')}</div>` : emptyState('cal', 'Nothing on the calendar', own ? 'Find something for this weekend on Explore.' : `${esc(P.name.split(' ')[0])} has nothing public coming up.`)}</section>
    ${completed.length ? `<section class="sec">${secH('Completed')}<div class="stack">${completed.slice(0, 5).map(a => advRow(a)).join('')}</div></section>` : ''}
    <p class="muted pad" style="font-size:12.5px;margin-top:16px">${created.length} adventure${created.length === 1 ? '' : 's'} created · member since ${new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(P.created_at))}</p>` };
}

/* ---- Provider ---- */
SCREENS.provider = (p) => {
  const P = Q.prov(p.id); if (!P) return notFound('This provider is not available');
  const advs = Q.listed().filter(a => a.provider_id === P.id), team = Store.filter('provider_members', m => m.provider_id === P.id);
  const owner = team.find(m => m.role === 'owner') || team[0];
  return { nav: false, cta: owner ? `<span class="cta-info"><b>${P.offers.length ? `From €${Math.min(...P.offers.map(o => o.price))}` : 'Message'}</b><small>Book by message for now</small></span><button class="btn btn-primary btn-block" data-act="dm" data-arg="${owner.profile_id}" ${owner.profile_id === Session.id ? 'disabled' : ''}>${ico('msg')}Message ${esc((Q.prof(owner.profile_id) || {}).name.split(' ')[0])}</button>` : '', body: `
    <div class="topbar" style="background:var(--forest);color:var(--paper)"><button class="icon-btn" data-back aria-label="Back" style="color:var(--paper)">${ico('back')}</button><h1></h1><button class="icon-btn" data-act="share" data-arg="o.${P.id}" aria-label="Share link" style="color:var(--paper)">${ico('share')}</button>${saveBtn('provider', P.id)}</div>
    <div class="prov-head"><div class="row" style="gap:16px"><span class="logo">${esc(P.name.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span><div style="min-width:0"><h1>${esc(P.name)}</h1><div class="meta-line" style="margin-top:4px"><span>${PROV_TYPES[P.type]}</span><span>${ico('pin')}${esc(P.location)}</span></div></div></div>
      <div class="row" style="flex-wrap:wrap;gap:6px"><span class="pill lime">${ico('shield')}Listed provider</span>${P.sports.map(x => `<span class="pill">${esc((Q.sport(x) || {}).name || '')}</span>`).join('')}</div></div>
    <div class="blk"><h2>About</h2><p>${esc(P.description)}</p><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:12px"><span class="pill">${ico('globe')}${esc(P.languages.join(', '))}</span></div></div>
    ${P.offers.length ? `<div class="blk"><h2>Experiences</h2><div class="group" style="margin:0">${P.offers.map(({ title: t, detail: d, price: pr }) => `<div class="offer"><span class="tx"><b>${esc(t)}</b><small>${esc(d)}</small></span><span class="price">€${pr}</span></div>`).join('')}</div></div>` : ''}
    <div class="blk"><h2>Upcoming dates</h2>${advs.length ? `<div style="display:grid;gap:10px">${advs.map(a => advRow(a)).join('')}</div>` : '<p class="muted">No dates published right now. Message them to ask.</p>'}</div>
    <div class="blk"><h2>Qualifications</h2><ul class="checks">${P.qualifications.map(q => `<li>${ico('shield')}<span>${esc(q)}</span></li>`).join('')}</ul><p class="muted" style="font-size:12.5px;margin-top:8px">Certificate checks arrive in a later release. Listed as stated by the provider.</p></div>
    ${team.length ? `<div class="blk"><h2>Team</h2><div class="group" style="margin:0">${team.map(m => personRow(m.profile_id, `<span class="pill">${m.role}</span>`)).join('')}</div></div>` : ''}` };
};

/* ---- Spot ---- */
SCREENS.spot = (p) => {
  const s = Q.spot(p.id); if (!s) return notFound('This spot is not available');
  const advs = Q.listed().filter(a => a.spot_id === s.id), sp = Q.sport(s.sport_id), D = Q.dest(s.destination_id);
  const provs = Store.filter('providers', x => x.destination_id === s.destination_id && x.sports.includes(s.sport_id));
  const ppl = [...new Set(Store.filter('adventures', a => a.spot_id === s.id).flatMap(a => Q.goingIds(a)))].filter(x => x !== Session.id);
  const rk = Object.keys(REGIONS).find(r => project(r, s.lat, s.lng));
  return { body: `
    <div class="hero" style="height:260px">${art((s.images || [])[0] || s.cover)}<span class="shade"></span><div class="bar">${backBtn('glass')}<span class="r"><button class="icon-btn glass" data-act="share" data-arg="s.${s.id}" aria-label="Share link">${ico('share')}</button>${saveBtn('spot', s.id)}</span></div>
      <div class="cap-tx on-art"><span class="mono">${Math.abs(s.lat).toFixed(4)}° ${s.lat >= 0 ? 'N' : 'S'} · ${Math.abs(s.lng).toFixed(4)}° ${s.lng >= 0 ? 'E' : 'W'}</span><h1 style="font-size:32px">${esc(s.name)}</h1><span class="row" style="gap:6px">${stag(s.sport_id)}<span class="pill" style="background:rgba(250,250,247,.18);color:#fff">${SPOT_TYPES[s.type]}</span></span></div></div>
    <div class="facts-grid">${(s.facts || []).map(({ label: k, value: v }) => `<div><span class="mono">${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
    <div class="blk"><div class="row between" style="margin-bottom:10px"><h2 style="margin:0">About this spot</h2><span class="pill">${['All levels', 'Beginner', 'Intermediate', 'Advanced'][s.difficulty]}</span></div><p>${esc(s.description)}</p></div>
    <div class="blk">${rk ? `<button class="art" data-act="openMapAt" data-arg="spot:${s.id}" style="display:block;width:100%;height:150px;border-radius:18px;border:1px solid var(--line);background:${REGIONS[rk].sea}">${mapSVG(rk, { mini: true, focus: project(rk, s.lat, s.lng), pins: [{ kind: 'spot', id: s.id, sport: s.sport_id, xy: project(rk, s.lat, s.lng) }] })}</button>` : `<div class="coming">${ico('map')}<span><b>Outside the ${esc(D.name)} hub map.</b> Coordinates are stored, so it shows up when the map grows.</span></div>`}<p class="muted" style="font-size:13px;margin-top:8px">${esc(D.name)}, ${esc(D.country)}</p></div>
    <section class="sec">${secH('Adventures here')}${advs.length ? `<div class="stack">${advs.map(a => advRow(a)).join('')}</div>` : emptyState('cal', 'Nothing planned here', `Start the first ${esc(sp.name.toLowerCase())} session at ${esc(s.name)}.`, `<button class="btn btn-primary btn-sm" data-act="startCreateAt" data-arg="${s.id}">Create an adventure</button>`)}</section>
    ${ppl.length ? `<section class="sec">${secH('People who go here')}<div class="group">${ppl.slice(0, 5).map(x => personRow(x)).join('')}</div></section>` : ''}
    ${provs.length ? `<section class="sec">${secH('Providers nearby')}<div class="group">${provs.map(provRow).join('')}</div></section>` : ''}
    <section class="sec"><div class="pad"><div class="coming">${ico('wave2')}<span><b>Live conditions come later.</b> Swell, wind and visibility for ${esc(s.name)} are planned once the core loop is proven.</span></div></div></section>` };
};

/* ---- Notifications ---- */
const NOTE_TEXT = {
  join_requested: n => `<b>${esc(Q.prof(n.actor_id)?.name || 'Someone')}</b> asked to join <b>${esc(Store.get('adventures', n.adventure_id)?.title || 'your adventure')}</b>.`,
  participant_joined: n => `<b>${esc(Q.prof(n.actor_id)?.name || 'Someone')}</b> joined <b>${esc(Store.get('adventures', n.adventure_id)?.title || 'your adventure')}</b>.`,
  participant_left: n => `<b>${esc(Q.prof(n.actor_id)?.name || 'Someone')}</b> left <b>${esc(Store.get('adventures', n.adventure_id)?.title || 'your adventure')}</b>. A spot is open again.`,
  request_approved: n => `<b>${esc(Q.prof(n.actor_id)?.name || 'The host')}</b> approved your request for <b>${esc(Store.get('adventures', n.adventure_id)?.title || 'an adventure')}</b>. You're going.`,
  request_declined: n => `Your request for <b>${esc(Store.get('adventures', n.adventure_id)?.title || 'an adventure')}</b> was declined. Similar adventures are on Explore.`,
  adventure_updated: n => `<b>${esc(Store.get('adventures', n.adventure_id)?.title || 'An adventure')}</b> was updated. Check the time and meeting point.`,
  adventure_cancelled: n => `<b>${esc(Store.get('adventures', n.adventure_id)?.title || 'An adventure')}</b> was cancelled by the host.${n.data && n.data.reason ? ' ' + esc(n.data.reason) : ''}`,
  new_message: n => { const c = Store.get('conversations', n.conversation_id), a = c && c.adventure_id && Store.get('adventures', c.adventure_id); const k = (n.data || {}).count || 1; return `${k > 1 ? `${k} new messages` : 'New message'} from <b>${esc(Q.prof(n.actor_id)?.name || 'someone')}</b>${a ? ` in <b>${esc(a.title)}</b>` : ''}.`; },
  adventure_tomorrow: n => { const a = Store.get('adventures', n.adventure_id); return a ? `<b>${esc(a.title)}</b> is tomorrow at ${hm(a.starts_at, tzOf(a))}. ${esc(a.meeting_point_exact || a.meeting_point || '')}` : 'An adventure is tomorrow.'; }
};
const noteTarget = n => n.type === 'provider_applied' ? ['proReviewOne', { id: (n.data || {}).provider_id }] : ['provider_reviewed', 'provider_staff_added'].includes(n.type) ? ['proHome', { id: (n.data || {}).provider_id }] : n.type === 'review_request' ? ['review', { id: n.adventure_id }] : ['new_message', 'announcement'].includes(n.type) && n.conversation_id ? ['chat', { id: n.conversation_id }] : n.type === 'join_requested' ? ['manage', { id: n.adventure_id }] : ['adv', { id: n.adventure_id }];
SCREENS.notifs = () => { const list = Q.notifications(); return { body: `<div class="topbar">${backBtn()}<h1>Notifications</h1>${list.some(n => !n.read_at) ? '<button class="btn-link" data-act="readAll" style="font-size:13px">Mark all read</button>' : ''}</div>
  <p class="muted pad" style="font-size:13px;margin-bottom:8px">Only things that change your plans. No likes, no streaks.</p>
  ${list.length ? list.map(n => `<button class="notif ${n.read_at ? '' : 'unread'}" data-act="notif" data-arg="${n.id}">${n.actor_id && Q.prof(n.actor_id) ? avatar(n.actor_id, 40) : `<span class="icon-btn line" style="border-radius:50%">${ico(n.type === 'adventure_tomorrow' ? 'cal' : 'bell')}</span>`}<span class="tx">${(NOTE_TEXT[n.type] || (() => esc(n.type)))(n)}<small>${n.derived ? 'Reminder' : ago(n.created_at)}</small></span></button>`).join('') : emptyState('bell', 'All quiet', 'Requests, approvals, plan changes and messages show up here.')}` }; };

/* ---- Onboarding (new profile) and sports editor ---- */
SCREENS.onboarding = () => {
  const O = UI.ob; const step = O.step, picked = Object.keys(O.sports), E = O.errors || {};
  const head = `<div class="ob-top">${step > 0 ? `<button class="icon-btn line" data-act="obStep" data-arg="-1" aria-label="Back">${ico('back')}</button>` : backBtn()}<div class="progress"><i style="width:${(step + 1) / 4 * 100}%"></i></div></div>`;
  let body = '', cta = '';
  if (step === 0) {
    body = `<div class="ob-q"><span class="mono muted">Step 1 of 4</span><h1 style="margin-top:8px">Who are you?</h1><p>Hosts see this when you ask to join.</p></div>
      <div class="field"><label for="obname">Your name</label><input class="inp ${E.name ? 'bad' : ''}" id="obname" autocomplete="name" maxlength="40" value="${esc(O.name)}" placeholder="First name or full name">${E.name ? `<span class="err">${ico('info')}${E.name}</span>` : ''}</div>
      <div class="field"><span class="lab">Where are you based?</span><div class="chips">${Q.destsSorted().map(d => `<button class="chip" aria-pressed="${O.home === d.id}" data-act="ob" data-arg="home:${d.id}">${esc(d.name)}</button>`).join('')}<button class="chip" aria-pressed="${O.home === ''}" data-act="ob" data-arg="home:">Somewhere else</button></div></div>
      <div class="field"><label for="oblang">Languages <span style="font-weight:600">Comma separated</span></label><input class="inp" id="oblang" value="${esc(O.languages)}" placeholder="English, Spanish"></div>`;
    cta = `<button class="btn btn-primary btn-block" data-act="obStep" data-arg="1">Continue</button>`;
  }
  if (step === 1) { body = `<div class="ob-q"><span class="mono muted">Step 2 of 4</span><h1 style="margin-top:8px">What are you into?</h1><p>Pick everything you do or want to try.</p></div><div class="field"><div class="sport-grid">${Q.sportsActive().map(s => `<button class="sport-pick" style="${sportStyle(s)}" aria-pressed="${s.id in O.sports}" data-act="obSport" data-arg="${s.id}"><span class="ic">${ico(s.icon, 24)}</span>${esc(s.name)}</button>`).join('')}</div></div>`; cta = `<button class="btn btn-primary btn-block" data-act="obStep" data-arg="1" ${picked.length ? '' : 'disabled'}>Continue${picked.length ? ` with ${picked.length}` : ''}</button>`; }
  if (step === 2) { body = `<div class="ob-q"><span class="mono muted">Step 3 of 4</span><h1 style="margin-top:8px">How far along are you?</h1><p>We use this to show the right adventures and buddies.</p></div><div class="pad" style="margin-top:8px">${picked.map(k => `<div class="ob-lv"><span class="row">${stag(k)}</span><div class="chips">${LEVELS.map((l, i) => `<button class="chip" aria-pressed="${O.sports[k] === i}" data-act="obLevel" data-arg="${k}:${i}">${l}</button>`).join('')}</div></div>`).join('')}</div>`; cta = `<button class="btn btn-primary btn-block" data-act="obStep" data-arg="1">Continue</button>`; }
  if (step === 3) { const goals = [['Find buddies', 'users'], ['Discover destinations', 'globe'], ['Join adventures', 'cal'], ['Learn a sport', 'level'], ['Find instructors', 'shield'], ['Travel for adventure', 'route']]; body = `<div class="ob-q"><span class="mono muted">Step 4 of 4</span><h1 style="margin-top:8px">What are you looking for?</h1><p>Pick as many as you like.</p></div><div class="field"><div style="display:grid;gap:8px">${goals.map(([g, i]) => `<button class="choice" aria-pressed="${O.goals.has(g)}" data-act="obGoal" data-arg="${g}"><span class="icon-btn line" style="width:38px;height:38px">${ico(i)}</span><span class="tx"><b>${g}</b></span><span class="tick">${ico('check')}</span></button>`).join('')}</div></div>`; cta = `<button class="btn btn-primary btn-block" data-act="obDone">Start exploring</button>`; }
  return { nav: false, cta, body: head + body, after: v => { const n = $('#obname', v); if (n) n.oninput = () => O.name = n.value; const l = $('#oblang', v); if (l) l.oninput = () => O.languages = l.value; } };
};
SCREENS.sportsEdit = () => { const O = UI.ob; return { nav: false, cta: `<button class="btn btn-primary btn-block" data-act="saveSports">Save sports</button>`, body: `<div class="topbar">${backBtn()}<h1>Your sports</h1></div>
  <div class="field"><span class="lab">Sports</span><div class="sport-grid">${Q.sportsActive().map(s => `<button class="sport-pick" style="${sportStyle(s)}" aria-pressed="${s.id in O.sports}" data-act="obSport" data-arg="${s.id}"><span class="ic">${ico(s.icon, 24)}</span>${esc(s.name)}</button>`).join('')}</div></div>
  <div class="pad" style="margin-top:8px">${Object.keys(O.sports).map(k => `<div class="ob-lv"><span class="row">${stag(k)}</span><div class="chips">${LEVELS.map((l, i) => `<button class="chip" aria-pressed="${O.sports[k] === i}" data-act="obLevel" data-arg="${k}:${i}">${l}</button>`).join('')}</div></div>`).join('')}</div>` }; };
SCREENS.proInfo = () => ({ nav: false, body: `<div class="topbar">${backBtn()}<h1>For instructors and schools</h1></div>
  <div class="page-h"><h1>Teach, guide or run trips?</h1><p>Provider accounts are set up with the EXTour team during launch in Barcelona and Dahab. Once you are linked to a provider, "List professional experience" appears under the + button.</p></div>
  <div class="pad" style="margin-top:16px"><div class="coming">${ico('info')}<span><b>Self-serve applications are not open yet.</b> This screen explains the flow so nothing looks like it works when it does not.</span></div></div>` });

/* =====================================================================
   Router, render, realtime
   ===================================================================== */
const cur = () => { const st = UI.stacks[UI.tab]; return st[st.length - 1]; };
let lastTracked = '';
function render(dir = 'none') {
  const vp = $('#viewport'); if (!vp) return;
  let out;
  if (Store.status === 'loading') out = { nav: false, body: `<div class="boot">${MARK(48)}<p>Loading adventures</p><div class="skel"></div><div class="skel"></div><div class="skel short"></div></div>` };
  else if (Store.status === 'error') out = { nav: false, body: emptyState('refresh', 'We could not load EXTour', 'Check your connection, then try again.', '<button class="btn btn-primary btn-sm" data-act="retryBoot">Try again</button>') };
  else if (Store.status === 'empty') out = { nav: false, body: setupScreen() };
  else if (!Session.me) { const t = cur(); out = ['onboarding', 'auth'].includes(t.s) ? SCREENS[t.s](t.p || {}) : SCREENS.welcome(); }
  else { const top = cur(); out = (SCREENS[top.s] || SCREENS.explore)(top.p || {}); if (out.track) { const k = top.s + JSON.stringify(top.p || {}); if (k !== lastTracked && dir !== 'none') { lastTracked = k; Analytics.track(...out.track); } } }
  /* keep typed text and focus across re-renders (realtime updates) */
  const act = document.activeElement, keepId = act && act.id && (act.tagName === 'INPUT' || act.tagName === 'TEXTAREA') ? act.id : null;
  const keepVal = keepId ? act.value : null, keepSel = keepId && act.setSelectionRange ? [act.selectionStart, act.selectionEnd] : null;
  const old = [...vp.querySelectorAll('.view')].find(v => !v.classList.contains('leaving'));
  const atBottom = old && old.scrollHeight - old.scrollTop - old.clientHeight < 40, keep = dir === 'none' && old ? old.scrollTop : null;
  const v = document.createElement('section');
  v.className = 'view' + (out.nav === false ? ' no-nav' : '') + (out.cta ? ' has-cta' : '') + (out.flush ? ' flush' : '');
  v.innerHTML = out.body;
  if (old) {
    if (dir === 'push' || dir === 'pop') { old.classList.add('leaving', dir === 'push' ? 'out-left' : 'out-right'); v.classList.add(dir === 'push' ? 'in-right' : 'in-left'); if (dir === 'pop') vp.insertBefore(v, old); setTimeout(() => old.remove(), 330); }
    else old.remove();
  }
  if (!v.parentNode) vp.appendChild(v);
  if (dir === 'tab') v.classList.add('in-fade');
  const cb = $('#ctabar'), msgDraft = $('#msgin') ? $('#msgin').value : '';
  cb.innerHTML = out.cta || ''; cb.hidden = !out.cta;
  if (msgDraft && $('#msgin') && dir === 'none') $('#msgin').value = msgDraft;
  $('#tabbar').hidden = out.nav === false || !!out.cta; renderTabs();
  if (out.after) out.after(v);
  if (keep !== null) v.scrollTop = out.keepBottom && atBottom ? v.scrollHeight : keep; else if (dir === 'pop' && cur().scroll) v.scrollTop = cur().scroll;
  if (keepId && dir === 'none') { const el = document.getElementById(keepId); if (el) { el.value = keepVal; el.focus(); if (keepSel) try { el.setSelectionRange(...keepSel); } catch (e) {} } }
  renderRail();
}
let rq = false; function scheduleRender() { if (rq) return; rq = true; const go = () => { if (!rq) return; rq = false; render('none'); }; requestAnimationFrame(go); setTimeout(go, 50); }
Store.listeners.add(scheduleRender);
function push(s, p = {}) { const v = $('#viewport .view:not(.leaving)'); if (v) cur().scroll = v.scrollTop; UI.stacks[UI.tab].push({ s, p }); closeSheet(); render('push'); }
function back() { const st = UI.stacks[UI.tab]; if (st.length > 1) { st.pop(); render('pop'); } }
function setTab(t) { closeSheet(); if (UI.tab === t) UI.stacks[t] = UI.stacks[t].slice(0, 1); UI.tab = t; render('tab'); }
function renderTabs() {
  if (!Session.me) { $('#tabbar').innerHTML = ''; return; }
  const unreadChats = Q.conversationsForMe().filter(c => Q.unread(c)).length, req = Q.myAdventures().hosting.reduce((n, a) => n + Q.pending(a).length, 0);
  const T = (t, icon, label, badge = 0) => `<button class="tab" data-act="tab" data-arg="${t}" ${UI.tab === t ? 'aria-current="page"' : ''}>${ico(icon, 24)}${badge ? `<span class="badge">${badge}</span>` : ''}<span>${label}</span></button>`;
  $('#tabbar').innerHTML = T('explore', 'explore', 'Explore') + T('adventures', 'cal', 'Adventures', req) + `<button class="tab-plus" data-act="openCreate" aria-label="Create">${ico('plus')}</button>` + T('messages', 'msg', 'Messages', unreadChats) + T('profile', 'user', 'Profile');
}
function setupScreen() { return `<div class="success" style="padding-top:60px"><span class="big-x">${MARK(56)}</span><h1>No adventures loaded yet</h1><p>If this stays empty, load the demo data: six destinations, twenty people and the Barcelona, Tenerife and Dahab adventures. Existing data is never overwritten.</p></div><div class="pad" style="margin-top:20px"><button class="btn btn-primary btn-block" data-act="seedCloud" id="seedBtn">Load demo data</button></div>`; }

/* ---------- Sheets & toast ---------- */
function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; }
let toastT;
function toast(msg, opt) {
  clearTimeout(toastT);
  const action = opt === true ? { label: 'Retry', act: 'retryLast', bad: true } : opt;
  $('#toastHost').innerHTML = `<div class="toast ${action && action.bad ? 'bad' : ''}" role="status">${ico(action && action.bad ? 'info' : action ? 'bell' : 'check')}<span>${msg}</span>${action ? `<button class="btn-link" data-act="${action.act}" style="color:var(--lime);margin-left:auto;white-space:nowrap">${action.label}</button>` : ''}</div>`;
  toastT = setTimeout(() => $('#toastHost').innerHTML = '', action ? 6500 : 2800);
}
let lastFailed = null;
/* Runs a service call; policy messages become toasts, transient failures offer a retry. */
async function run(fn, ok) {
  try { const r = await fn(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); return r; }
  catch (e) { if (e && e.policy) toast(e.message); else { lastFailed = () => run(fn, ok); toast('That did not save. Check your connection and try again.', true); console.error(e); } }
}

/* ---------- Actions ---------- */
const A = {
  tab: t => setTab(t), closeSheet, toast: m => toast(m),
  retryLast: () => { const f = lastFailed; lastFailed = null; if (f) f(); },
  retryBoot: () => location.reload(),
  setP: arg => { const [k, ...r] = arg.split(':'); const v = r.join(':'); const t = cur(); t.p = { ...(t.p || {}), [k]: v || undefined }; render('none'); },
  save: arg => { const [type, ...r] = arg.split(':'); if (type === 'person') return; run(() => Saved.toggle(type, r.join(':')), on => on ? 'Saved to Your next adventures' : 'Removed from saved'); },
  locSheet: () => openSheet(`<div class="sbody"><div><h3>Where are you exploring?</h3><p class="sub">Explore shows what is happening around this place.</p></div><div class="group" style="margin:0">${Q.destsSorted().map(d => `<button class="lrow" data-act="setLoc" data-arg="${d.id}">${art(d.hero_image, '', 'width:44px;height:44px;border-radius:12px;flex:none')}<span class="tx"><b>${esc(d.name)}</b><small>${d.id === Q.homeDest() ? 'Home · ' : ''}${Q.activeCount(d.id)} active adventures</small></span>${curLoc() === d.id ? ico('check') : ''}</button>`).join('')}</div></div>`),
  setLoc: k => { UI.loc = k; closeSheet(); UI.stacks.explore = [{ s: 'explore' }]; UI.tab = 'explore'; render('tab'); toast(`Exploring ${Q.dest(k).name}`); },
  openMap: rk => { UI.map.region = rk || 'bcn'; UI.map.sel = null; UI.map.list = false; push('map'); },
  openMapAt: arg => { const [kind, id] = arg.split(':'); const ent = kind === 'spot' ? Q.spot(id) : Store.get('adventures', id); const rk = Object.keys(REGIONS).find(r => project(r, ent.lat, ent.lng)); if (!rk) return; UI.map.region = rk; UI.map.sport = null; UI.map.list = false; UI.map.sel = { kind, id }; push('map'); },
  mapRegion: r => { UI.map.region = r; UI.map.sel = null; render('none'); },
  mapLayer: l => { UI.map.layers[l] = !UI.map.layers[l]; UI.map.sel = null; render('none'); },
  mapSport: s => { UI.map.sport = UI.map.sport === s ? null : s; UI.map.sel = null; render('none'); },
  mapDate: d => { UI.map.date = d; UI.map.sel = null; render('none'); if (!$('#sheet').hidden) A.mapFilters(); },
  mapLevel: l => { UI.map.level = l; UI.map.sel = null; render('none'); if (!$('#sheet').hidden) A.mapFilters(); },
  mapFilters: () => { const M = UI.map, chip = (act, v, on, t) => `<button class="chip" aria-pressed="${on}" data-act="${act}" data-arg="${v}">${t}</button>`;
    openSheet(`<div class="sbody"><div><h3>Filter the map</h3><p class="sub">${mapItems(M.region).length} places and adventures match.</p></div>
      <div class="field" style="padding:0"><span class="lab">When</span><div class="chips">${[['any', 'Any date'], ['week', 'Next 7 days'], ['weekend', 'This weekend']].map(([v, t]) => chip('mapDate', v, M.date === v, t)).join('')}</div></div>
      <div class="field" style="padding:0"><span class="lab">Level</span><div class="chips">${[['any', 'Any level'], ['beginner', 'Beginner friendly'], ['intermediate', 'Intermediate+']].map(([v, t]) => chip('mapLevel', v, M.level === v, t)).join('')}</div></div>
      <button class="btn btn-primary" data-act="closeSheet">Show results</button></div>`); },
  mapReset: () => { Object.assign(UI.map, { layers: { adv: true, spot: true, prov: true }, sport: null, date: 'any', level: 'any' }); render('none'); },
  mapList: () => { UI.map.list = !UI.map.list; UI.map.sel = null; render('none'); },
  pin: arg => { const [kind, id] = arg.split(':'); UI.map.sel = (UI.map.sel && UI.map.sel.id === id) ? null : { kind, id }; render('none'); },
  setQ: q => { UI.q = q; const i = $('#q'); if (i) { i.value = q; $('#sr').innerHTML = searchResults(q); } },
  openCreate: () => { const pro = Policy.canListProfessional(); openSheet(`<div class="sbody"><div><h3>Start something</h3><p class="sub">Most good adventures start with one person posting.</p></div>
    <button class="create-opt" data-act="openBuddy"><span class="ic">${ico('users', 26)}</span><span><b>Find a buddy</b><small>Need one or two people for a session. Takes 20 seconds.</small></span></button>
    <button class="create-opt" data-act="startCreate"><span class="ic">${ico('route', 26)}</span><span><b>Create an adventure</b><small>Training, meetup or community event. Free to join.</small></span></button>
    ${pro ? `<button class="create-opt" data-act="startPro"><span class="ic">${ico('shield', 26)}</span><span><b>List professional experience</b><small>Courses, guided days, retreats and trips for ${esc(Policy.memberships().map(m => Q.prov(m.provider_id).name).join(', '))}.</small></span></button>` : `<button class="btn-link" style="justify-self:center" ${goAttr('proInfo')}>Instructor or school? How listings work</button>`}</div>`); },
  openBuddy: arg => { const [sid, did] = String(arg || '').split('|'); UI.bf = buddyDefaults(sid || undefined, did || undefined); closeSheet(); push('buddy'); },
  bf: arg => { const [k, ...r] = arg.split(':'); const v = r.join(':'); const B = UI.bf; B[k] = ['my', 'want'].includes(k) ? +v : v;
    if (k === 'sport') { B.activity = (Q.sport(v).activity_types || [])[0]; B.my = Q.level(Session.id, v) ?? 1; if (!Q.destSports(B.dest).some(x => x.id === v)) B.dest = (Store.find('destination_sports', r => r.sport_id === v) || {}).destination_id; }
    render('none'); },
  bfCap: d => { UI.bf.cap = Math.max(2, Math.min(4, UI.bf.cap + +d)); render('none'); },
  buddySubmit: () => {
    const B = UI.bf, D = Q.dest(B.dest), sp = Store.find('spots', x => x.destination_id === B.dest && x.sport_id === B.sport);
    const [hh, mm] = (B.start || '09:00').split(':').map(Number), endH = String(Math.min(23, hh + 2)).padStart(2, '0');
    const starts = zonedIso(B.date, B.start || '09:00', D.timezone), ends = zonedIso(B.date, `${endH}:${String(mm).padStart(2, '0')}`, D.timezone);
    if (new Date(starts) < new Date()) return toast('Pick a time that has not passed yet');
    run(async () => {
      if (Q.level(Session.id, B.sport) !== B.my) await Profiles.setSports(Session.id, { ...Object.fromEntries(Q.userSports(Session.id).map(u => [u.sport_id, u.level])), [B.sport]: B.my });
      const a = await Adventures.create({ title: `${D.name} ${(B.activity || '').toLowerCase()} buddy`, sport_id: B.sport, type: 'buddy_request', destination_id: B.dest, spot_id: sp ? sp.id : null, starts_at: starts, ends_at: ends,
        min_level: B.want, capacity: B.cap, price: 0, description: B.note.trim() || `Looking for a ${MIN_LEVELS[B.want].toLowerCase()} ${Q.sport(B.sport).name.toLowerCase()} buddy for ${(B.activity || '').toLowerCase()}.`, requirements: [`${MIN_LEVELS[B.want]} ${Q.sport(B.sport).name.toLowerCase()}`],
        equipment: ['Your own kit'], cover: (Q.sport(B.sport).photos || [])[0] || Q.sport(B.sport).image, join_mode: 'approval', activity: B.activity, meeting_point: sp ? sp.name : D.name, meeting_point_exact: '' });
      UI.stacks[UI.tab].pop(); push('buddyLive', { id: a.id });
      return a;
    }, 'Your buddy request is live');
  },
  dm: pid => run(async () => { Policy.assert(Session.id, 'Sign in to send messages'); const c = await Chat.openDirect(pid); closeSheet(); push('chat', { id: c.id }); }),
  join: id => {
    const a = Store.get('adventures', id), lv = Q.level(Session.id, a.sport_id), low = lv == null || Math.min(lv, 3) < a.min_level;
    const reqs = a.requirements.map(r => `<label class="ck"><input type="checkbox" data-req>${esc(r)}</label>`).join('');
    const warn = low ? `<div class="lock-note" style="background:#F4E8CC;color:var(--warn)">${ico('info')}<span>This is for ${MIN_LEVELS[a.min_level].toLowerCase()} ${esc(Q.sport(a.sport_id).name.toLowerCase())}. Your profile says ${lv == null ? 'nothing yet' : LEVELS[lv].toLowerCase()}. ${a.join_mode === 'approval' ? 'The host decides.' : ''}</span></div>` : '';
    if (a.join_mode === 'instant') openSheet(`<div class="sbody"><div><h3>Join ${esc(a.title)}</h3><p class="sub">${dateLabel(a)} · ${timeLabel(a)} · ${esc(placeName(a))}</p></div>${warn}${reqs ? `<div style="display:grid;gap:8px">${reqs}</div><p class="muted" style="font-size:13px">Confirm you meet these. The host and your buddies are trusting you.</p>` : ''}<button class="btn btn-primary" id="confirmJoin" data-act="confirmJoin" data-arg="${id}" ${reqs ? 'disabled' : ''}>Join adventure</button></div>`);
    else openSheet(`<div class="sbody"><div><h3>Ask ${esc((Q.prof(a.host_id) || {}).name.split(' ')[0])} to join</h3><p class="sub">${dateLabel(a)} · ${timeLabel(a)} · ${MIN_LEVELS[a.min_level]}${a.price > 0 ? ` · €${a.price}, paid to ${esc(Q.prov(a.provider_id).name)} directly` : ''}</p></div>${warn}${reqs ? `<div style="display:grid;gap:8px">${reqs}</div>` : ''}
      <div class="field" style="padding:0"><label for="reqmsg">Message to the host</label><textarea class="inp" id="reqmsg" maxlength="500" placeholder="Your experience and what you want from the day">${lv != null ? `Hi! ${LEVELS[lv]} ${esc(Q.sport(a.sport_id).name.toLowerCase())}${Session.me.note ? ', ' + esc(Session.me.note) : ''}. Would love to join.` : ''}</textarea></div>
      <button class="btn btn-primary" id="confirmJoin" data-act="sendRequest" data-arg="${id}" ${reqs ? 'disabled' : ''}>Send request</button></div>`);
  },
  confirmJoin: id => run(async () => { await Participation.join(id); closeSheet(); }, 'You’re going. The adventure chat is open.'),
  sendRequest: id => { const msg = ($('#reqmsg') || {}).value || ''; run(async () => { await Participation.join(id, msg); closeSheet(); }, 'Request sent. You’ll get a notification when the host replies.'); },
  cancelReq: id => run(() => Participation.cancelRequest(id), 'Request cancelled'),
  leaveSheet: id => openSheet(`<div class="sbody"><div><h3>Leave ${esc(Store.get('adventures', id).title)}?</h3><p class="sub">The host gets a notification and your spot opens for someone else. You lose access to the adventure chat.</p></div><button class="btn btn-primary" data-act="leave" data-arg="${id}">Leave adventure</button><button class="btn btn-secondary" data-act="closeSheet">Stay</button></div>`),
  leave: id => run(async () => { await Participation.leave(id); closeSheet(); }, 'You left the adventure'),
  approve: pid => run(() => Participation.approve(pid), () => 'Approved. They are in the adventure chat now.'),
  decline: pid => run(() => Participation.decline(pid), 'Declined. They get a short note.'),
  editAdventure: id => { UI.cf = fromAdventure(Store.get('adventures', id)); push('create'); },
  cancelSheet: id => openSheet(`<div class="sbody"><div><h3>Cancel this adventure?</h3><p class="sub">Everyone going and waiting gets a notification. This cannot be undone.</p></div><div class="field" style="padding:0"><label for="cancelwhy">Reason <span style="font-weight:600">Optional</span></label><input class="inp" id="cancelwhy" maxlength="140" placeholder="Swell too big, moving to next week"></div><button class="btn btn-primary" style="background:var(--bad);color:#fff" data-act="cancelAdv" data-arg="${id}">Cancel adventure</button><button class="btn btn-secondary" data-act="closeSheet">Keep it</button></div>`),
  cancelAdv: id => { const why = ($('#cancelwhy') || {}).value || ''; run(async () => { await Adventures.cancel(id, why.trim()); closeSheet(); }, 'Adventure cancelled. Everyone has been told.'); },
  completeSheet: id => { const a = Store.get('adventures', id); if (!Q.started(a)) return toast('You can mark it completed once it has started'); openSheet(`<div class="sbody"><div><h3>Mark as completed?</h3><p class="sub">${Q.going(a).length} people get it added to their history. Pending requests are closed.</p></div><button class="btn btn-primary" data-act="completeAdv" data-arg="${id}">Mark completed</button><button class="btn btn-secondary" data-act="closeSheet">Not yet</button></div>`); },
  completeAdv: id => run(async () => { await Adventures.complete(id); closeSheet(); }, 'Completed. Nice one.'),
  startCreate: arg => { const [sid, did] = String(arg || '').split('|'); closeSheet(); UI.cf = createDefaults(sid || undefined, did || undefined); push('create'); },
  startPro: () => { closeSheet(); const mem = Policy.memberships(); if (!mem.length) return; const pr = Q.prov(mem[0].provider_id); UI.cf = { ...createDefaults(pr.sports[0], pr.destination_id), pro: true, provider_id: pr.id, type: 'course', paid: true }; const t = cur(); if (t.s === 'create') { t.p = {}; render('none'); } else push('create'); },
  startCreateAt: sid => { const s = Q.spot(sid); closeSheet(); UI.cf = { ...createDefaults(s.sport_id, s.destination_id), spot_id: s.id, cover: s.cover }; push('create'); },
  cf: arg => { const [k, ...r] = arg.split(':'); const v = r.join(':'); const C = UI.cf;
    if (k === 'min_level') C[k] = +v; else if (k === 'paid') C.paid = !!v; else C[k] = v || null;
    if (k === 'sport_id') { C.cover = (Q.sport(v).photos || [])[0] || Q.sport(v).image; if (!Q.destSports(C.destination_id).some(x => x.id === v)) C.destination_id = (Store.find('destination_sports', r => r.sport_id === v) || {}).destination_id; C.spot_id = (Store.find('spots', x => x.destination_id === C.destination_id && x.sport_id === v) || {}).id || null; }
    if (k === 'destination_id') C.spot_id = (Store.find('spots', x => x.destination_id === v && x.sport_id === C.sport_id) || {}).id || null;
    if (k === 'type' && v === 'buddy_request') { C.capacity = 2; }
    if (k === 'provider_id') { const pr = Q.prov(v); if (!pr.sports.includes(C.sport_id)) { C.sport_id = pr.sports[0]; C.cover = Q.sport(C.sport_id).image; } C.destination_id = pr.destination_id; }
    C.errors = {}; render('none'); },
  paidLocked: () => toast('Paid listings are for verified providers. Community adventures stay free.'),
  cap: d => { UI.cf.capacity = Math.max(2, Math.min(40, UI.cf.capacity + +d)); render('none'); },
  cStep: d => { const C = UI.cf; if (+d > 0) { const e = validateCreate(C, C.step); if (Object.keys(e).length) { C.errors = e; render('none'); return; } } C.errors = {}; C.step = Math.max(1, Math.min(3, C.step + +d)); render('none'); const nv = $('#viewport .view:not(.leaving)'); if (nv) nv.scrollTop = 0; },
  publish: () => {
    const C = UI.cf, e = { ...validateCreate(C, 2), ...validateCreate(C, 3) }; if (Object.keys(e).length) { C.errors = e; if (e.dest || e.date || e.time || e.price || e.capacity) C.step = 2; render('none'); toast('A few details need fixing'); return; }
    const tz = Q.dest(C.destination_id).timezone, lines = s => s.split('\n').map(x => x.trim()).filter(Boolean);
    const f = { title: C.title, description: C.description, sport_id: C.sport_id, type: C.type, provider_id: C.pro ? C.provider_id : null, destination_id: C.destination_id, spot_id: C.spot_id, starts_at: zonedIso(C.date, C.t1, tz), ends_at: zonedIso(C.date, C.t2, tz),
      min_level: C.min_level, capacity: C.capacity, price: C.paid ? Math.round(+C.price) : 0, cost_note: C.paid ? '' : C.cost_note, cover: C.cover, requirements: lines(C.requirements), equipment: lines(C.equipment), join_mode: C.join_mode,
      meeting_point: C.meeting_point.trim(), meeting_point_exact: C.meeting_point_exact.trim(), activity: '', safety_plan: (C.safety_plan || '').trim().slice(0, 600) };
    run(async () => {
      if (C.editId) { const sp = f.spot_id ? Q.spot(f.spot_id) : null; await Adventures.update(C.editId, { ...f, location_name: sp ? sp.name : Q.dest(f.destination_id).name, lat: sp ? sp.lat : null, lng: sp ? sp.lng : null, is_free: !(f.price > 0) }); C.done = C.editId; }
      else { const a = await Adventures.create(f); C.done = a.id; }
      render('none');
    });
  },
  viewCreated: () => { const id = UI.cf.done; UI.stacks[UI.tab].pop(); push('adv', { id }); },
  readAll: () => run(() => Notify.markAll()),
  notif: id => { const n = Q.notifications().find(x => x.id === id); if (!n) return; Notify.markRead(n).catch(() => {}); const [s, p] = noteTarget(n); if (s === 'manage') { const a = Store.get('adventures', p.id); if (!a || !Policy.canManage(a)) return push('adv', p); } push(s, p); },
  addSport: sid => run(() => Profiles.setSports(Session.id, { ...Object.fromEntries(Q.userSports(Session.id).map(u => [u.sport_id, u.level])), [sid]: 0 }).then(() => Analytics.track('sport_selected', { sport: sid })), `Added ${Q.sport(sid).name} as want to try`),
  /* account */
  signInAs: id => { Session.signInAs(id); if (!(UI.pendingLink && openDeepLink(UI.pendingLink))) render('tab'); toast(`Signed in as ${Q.prof(id).name}`); },
  startSignup: () => { UI.ob = { step: 0, name: '', home: curLoc(), languages: 'English', sports: {}, goals: new Set(['Find buddies', 'Join adventures']), errors: {} }; UI.stacks[UI.tab] = [cur(), { s: 'onboarding' }]; render('push'); },
  ob: arg => { const [k, v] = arg.split(':'); UI.ob[k] = v; render('none'); },
  obStep: d => { const O = UI.ob; if (+d > 0 && O.step === 0 && !O.name.trim()) { O.errors = { name: 'Add your name so hosts know who is asking.' }; render('none'); return; } O.errors = {}; O.step = Math.max(0, Math.min(3, O.step + +d)); render('none'); },
  obSport: k => { const O = UI.ob; if (k in O.sports) delete O.sports[k]; else { O.sports[k] = 1; Analytics.track('sport_selected', { sport: k }); } render('none'); },
  obLevel: arg => { const [k, i] = arg.split(':'); UI.ob.sports[k] = +i; render('none'); },
  obGoal: g => { const G = UI.ob.goals; G.has(g) ? G.delete(g) : G.add(g); render('none'); },
  obDone: () => { const O = UI.ob, d = Q.dest(O.home); run(async () => { await Profiles.create({ name: O.name, home_destination_id: O.home || null, home_location: d ? `${d.name}, ${d.country}` : '', languages: O.languages.split(',').map(s => s.trim()).filter(Boolean), sports: O.sports, goals: O.goals }); if (!(UI.pendingLink && openDeepLink(UI.pendingLink))) render('tab'); }, 'Welcome to EXTour. Here is what is near you.'); },
  editSports: () => { UI.ob = { sports: Object.fromEntries(Q.userSports(Session.id).map(u => [u.sport_id, u.level])) }; push('sportsEdit'); },
  saveSports: () => run(async () => { await Profiles.setSports(Session.id, UI.ob.sports); back(); }, 'Sports updated'),
  editProfile: () => { const P = Session.me; openSheet(`<form class="sbody" data-form="profile"><div><h3>Edit profile</h3></div>
    <div class="row" style="gap:14px"><span id="pav">${avatar(P.id, 72)}</span><span style="display:grid;gap:6px;justify-items:start"><label class="btn btn-secondary btn-sm" for="pphoto">${ico('plus')}${P.avatar ? 'Change photo' : 'Add a photo'}</label><input type="file" id="pphoto" accept="image/*" hidden>${P.avatar ? '<button type="button" class="btn-link" data-act="removeAvatar">Remove photo</button>' : ''}</span></div>
    <div class="field" style="padding:0"><label for="pname">Name</label><input class="inp" id="pname" maxlength="40" required value="${esc(P.name)}"></div>
    <div class="field" style="padding:0"><label for="pbio">Bio</label><textarea class="inp" id="pbio" maxlength="280">${esc(P.bio || '')}</textarea></div>
    <div class="field" style="padding:0"><label for="plang">Languages</label><input class="inp" id="plang" value="${esc((P.languages || []).join(', '))}"></div>
    <div class="field" style="padding:0"><label for="pnote">Highlight <span style="font-weight:600">e.g. PB 28 m, leads 7a</span></label><input class="inp" id="pnote" maxlength="40" value="${esc(P.note || '')}"></div>
    <label class="ck"><input type="checkbox" id="pshare" ${P.location_sharing ? 'checked' : ''}>Show me in the community of the place I am visiting</label>
    <div class="field" style="padding:0"><span class="lab">Currently in</span><div class="chips">${Q.destsSorted().map(d => `<button type="button" class="chip" aria-pressed="${P.current_destination_id === d.id}" data-act="setCurrent" data-arg="${d.id}">${esc(d.name)}</button>`).join('')}</div></div>
    <button class="btn btn-primary" type="submit">Save</button></form>`); },
  setCurrent: d => { document.querySelectorAll('#sheet [data-act="setCurrent"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.arg === d)); $('#sheet form').dataset.current = d; },
  accountSheet: () => openSheet(`<div class="sbody"><div><h3>Account</h3><p class="sub">Signed in as ${esc(Session.me.name)} · data: ${esc(Store.adapter.label.toLowerCase())}</p></div><div class="group" style="margin:0">
    <button class="lrow" data-act="switchSheet"><span class="icon-btn line">${ico('swap')}</span><span class="tx"><b>Switch account</b><small>Try the app as another person</small></span>${ico('chev')}</button>
    <button class="lrow" data-act="devSheet"><span class="icon-btn line">${ico('chart')}</span><span class="tx"><b>Funnel and data</b><small>Analytics events, North Star, store status</small></span>${ico('chev')}</button>
    <button class="lrow" data-act="signOut"><span class="icon-btn line">${ico('logout')}</span><span class="tx"><b>Sign out</b><small>Your data stays saved</small></span>${ico('chev')}</button></div></div>`),
  switchSheet: () => openSheet(`<div class="sbody"><div><h3>Switch account</h3><p class="sub">Demo accounts share the same data, so you can play both sides of a request.</p></div><div class="group" style="margin:0;max-height:420px;overflow:auto">${Store.all('profiles').sort((a, b) => a.name.localeCompare(b.name)).map(p => `<button class="lrow" data-act="signInAs" data-arg="${p.id}">${avatar(p.id, 40)}<span class="tx"><b>${esc(p.name)}</b><small>${esc(p.home_location || '')}</small></span>${p.id === Session.id ? ico('check') : ''}</button>`).join('')}</div><button class="btn btn-secondary" data-act="signOut">Sign out</button></div>`),
  signOut: () => { closeSheet(); Session.signOut(); render('tab'); },
  devSheet: () => { const c = Analytics.counts(); openSheet(`<div class="sbody"><div><h3>Funnel and data</h3><p class="sub">North Star: completed adventures with 2+ people per month.</p></div>
    <div class="stats3" style="margin:0"><div><b class="tnum">${Q.completedThisMonth(0)}</b><span>this month</span></div><div><b class="tnum">${Q.completedThisMonth(1)}</b><span>last month</span></div><div><b class="tnum">${Q.listed().length}</b><span>live listings</span></div></div>
    <div class="sumbox">${FUNNEL.map(k => `<div class="r"><span class="mono" style="text-transform:none">${k}</span><b class="tnum">${c[k] || 0}</b></div>`).join('')}</div>
    <div class="sumbox"><div class="r"><span>Store</span><b>${esc(Store.adapter.label)}</b></div>${TABLES.map(t => `<div class="r"><span class="mono" style="text-transform:none">${t}</span><b class="tnum">${Store.t[t].size}</b></div>`).join('')}</div>
    ${Store.adapter.mode === 'local' ? '<button class="btn btn-secondary" data-act="resetLocal">Reset demo data in this browser</button>' : ''}</div>`); },
  resetLocal: () => LocalAdapter.reset(),
  seedCloud: async () => { const b = $('#seedBtn'); if (b) { b.disabled = true; b.textContent = 'Loading demo data…'; } try { await CloudAdapter.seed((n, t) => { if (b) b.textContent = `Loading ${n} of ${t}`; }); await new Promise(r => setTimeout(r, 400)); Store.status = 'ready'; Session.restore(); render('tab'); } catch (e) { if (b) { b.disabled = false; b.textContent = 'Try again'; } toast('Could not load the demo data. You may only have view access.'); } },
  jump: code => jump(code),
  openHosting: () => { UI.tab = 'adventures'; UI.stacks.adventures = [{ s: 'my', p: { tab: 'hosting' } }]; render('tab'); },
  liveGo: () => { const n = UI.live; if (!n) return; $('#toastHost').innerHTML = ''; Notify.markRead(n).catch(() => {}); const [s, p] = noteTarget(n); if (s === 'manage') { const a = Store.get('adventures', p.id); if (!a || !Policy.canManage(a)) return push('adv', p); } push(s, p); },
  share: arg => { const [k, ...r] = arg.split('.'); const id = r.join('.'), url = shareUrl(k, id); const ent = Store.get(LINK_TABLE[k], id) || {};
    openSheet(`<div class="sbody"><div><h3>Share ${esc(ent.title || ent.name || 'this')}</h3><p class="sub">The link opens straight on this page in EXTour.</p></div>
      <div class="share-box" id="shareUrl">${esc(url)}</div><button class="btn btn-primary" data-act="copyShare">${ico('share')}Copy link</button>
      <p class="muted" style="font-size:12.5px">${ON_CLAUDE ? 'People need access to the EXTour prototype to open it. Give it to them from the page\'s Share menu first.' : 'Anyone with the link can open it in EXTour.'}</p></div>`); },
  copyShare: () => { const el = $('#shareUrl'); if (el) copyText(el.textContent, el); },
  calSheet: id => { const a = Store.get('adventures', id); if (!a) return; const L = calendarLinks(a);
    openSheet(`<div class="sbody"><div><h3>Add to your calendar</h3><p class="sub">${esc(a.title)} · ${dateLabel(a)} · ${timeLabel(a)}</p></div>
      <a class="btn btn-primary" href="${esc(L.google)}" target="_blank" rel="noopener">${ico('cal')}Google Calendar</a>
      <a class="btn btn-secondary" href="${esc(L.outlook)}" target="_blank" rel="noopener">${ico('cal')}Outlook</a>
      <div class="sumbox"><div class="r"><span>Where</span><b style="text-align:right">${esc(L.where)}</b></div><div class="r"><span>Time</span><b>${timeLabel(a)}, ${esc((Q.dest(a.destination_id) || {}).name || '')} time</b></div></div>
      <p class="muted" style="font-size:12.5px">Both open in a new tab with the event filled in.</p></div>`); },
  removeAvatar: () => run(async () => { await Profiles.update(Session.id, { avatar: null }); closeSheet(); }, 'Photo removed')
};

/* ---------- Event wiring ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-back],[data-go],[data-act]'); if (!t || t.disabled) return;
  if (t.hasAttribute('data-back')) { e.preventDefault(); closeSheet(); back(); return; }
  if (t.dataset.act) { e.preventDefault(); e.stopPropagation(); const f = A[t.dataset.act]; if (f) f(t.dataset.arg); return; }
  if (t.dataset.go) { e.preventDefault(); push(t.dataset.go, JSON.parse(t.dataset.p || '{}')); }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][tabindex]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
});
document.addEventListener('change', e => {
  if (e.target.id === 'pphoto' && e.target.files[0]) { const f = e.target.files[0]; toast('Uploading photo…'); run(async () => { const ref = await Media.upload(f, 'avatar'); await Profiles.update(Session.id, { avatar: ref }); const av = $('#pav'); if (av) av.innerHTML = avatar(Session.id, 72); }, 'Photo updated'); return; }
  if (e.target.id === 'ccover' && e.target.files[0]) { const f = e.target.files[0]; toast('Uploading photo…'); run(async () => { const ref = await Media.upload(f, 'cover'); UI.cf.cover = ref; render('none'); }, 'Cover photo added'); return; }
  if (e.target.matches('[data-req]')) { const all = [...document.querySelectorAll('#sheet [data-req]')].every(c => c.checked); const b = $('#confirmJoin'); if (b) b.disabled = !all; }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  if (f.dataset.form === 'send') { const inp = $('#msgin'), txt = inp.value.trim(); if (!txt) return; inp.value = ''; run(() => Chat.send(f.dataset.arg, txt)).then(() => { const v = $('#viewport .view:not(.leaving)'); if (v) v.scrollTop = v.scrollHeight; }); }
  if (f.dataset.form === 'profile') { const name = $('#pname').value.trim(); if (!name) return toast('Add a name'); run(async () => { await Profiles.update(Session.id, { name, bio: $('#pbio').value.trim(), languages: $('#plang').value.split(',').map(s => s.trim()).filter(Boolean), note: $('#pnote').value.trim(), location_sharing: $('#pshare').checked, ...(f.dataset.current ? { current_destination_id: f.dataset.current } : {}) }); closeSheet(); }, 'Profile saved'); }
});

/* ---------------------------------------------------------------------
   Prototype rail (desktop): who you are, scenario guides, data status
   --------------------------------------------------------------------- */
const SCENARIOS = [
  ['1 · Request, approve, chat', [['Act as Marta', 'as:p_marta'], ['Open Barcelona Depth Training', 'go:explore|adv|id=a_bcn_depth'], ['Act as Shebl', 'as:p_shebl'], ['Shebl: Hosting', 'go:adventures|my|tab=hosting'], ['Act as Marta', 'as:p_marta'], ['Marta: Upcoming', 'go:adventures|my|tab=upcoming'], ['Marta: chats', 'go:messages|inbox|tab=adv']]],
  ['2 · Buddy request', [['Act as Marta', 'as:p_marta'], ['Find a buddy', 'buddy:freediving|barcelona'], ['Act as Shebl', 'as:p_shebl'], ['Shebl: buddy requests', 'go:explore|list|dest=barcelona&buddy=1'], ['Act as Marta', 'as:p_marta'], ['Marta: Hosting', 'go:adventures|my|tab=hosting']]],
  ['3 · Destination to sport', [['Act as Luca', 'as:p_luca'], ['Tenerife × Freediving', 'go:explore|dest|id=tenerife&sport=freediving']]]
];
function jump(code) {
  closeSheet();
  if (code.startsWith('as:')) { Session.signInAs(code.slice(3)); render('tab'); toast(`Signed in as ${Q.prof(code.slice(3)).name}`); return; }
  if (!Session.me) return toast('Pick an account first');
  if (code.startsWith('buddy:')) { const [sid, did] = code.slice(6).split('|'); UI.tab = 'explore'; UI.stacks.explore = [{ s: 'explore' }]; UI.bf = buddyDefaults(sid, did); UI.bf.activity = 'Depth training'; UI.bf.want = 2; UI.bf.start = '09:00'; UI.stacks.explore.push({ s: 'buddy' }); render('tab'); return; }
  const [tab, s, q = ''] = code.slice(3).split('|'); const p = {}; q.split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); p[k] = v; });
  UI.tab = tab; const root = { explore: { s: 'explore' }, adventures: { s: 'my' }, messages: { s: 'inbox' }, profile: { s: 'profile' } }[tab];
  UI.stacks[tab] = root.s === s ? [{ s, p }] : [root, { s, p }]; render('tab');
}
function renderRail() {
  const r = $('#rail'); if (!r || getComputedStyle(r).display === 'none') return;
  const me = Session.me;
  const quick = ['p_shebl', 'p_marta', 'p_luca', 'p_freya'].filter(id => Q.prof(id));
  const html = `<div class="r-brand"><span class="mark-box">${MARK(28)}</span><div><h1>EXTour</h1></div></div>
    <p class="lede">Find your next adventure, and the people to share it with.</p>
    <p class="meta">MVP build · data: ${esc(Store.adapter ? Store.adapter.label.toLowerCase() : 'loading')}${Store.adapter && Store.adapter.mode === 'cloud' ? ', live for everyone with the link' : ''}</p>
    <div class="who-box">${me ? `${avatar(me.id, 36)}<span><b>${esc(me.name)}</b><small>Signed in</small></span>` : '<span><b>Not signed in</b><small>Pick an account</small></span>'}</div>
    <div class="chips" style="margin-top:10px">${quick.map(id => `<button class="chip" aria-pressed="${Session.id === id}" data-act="jump" data-arg="as:${id}">${esc(Q.prof(id).name.split(' ')[0])}</button>`).join('')}</div>
    ${SCENARIOS.map(([h, l]) => `<h4 class="mono muted">${h}</h4><ul>${l.map(([t, c]) => `<li><button data-act="jump" data-arg="${c}">${t}${ico('chev', '16')}</button></li>`).join('')}</ul>`).join('')}
    ${ON_CLAUDE ? '<p class="note" style="border-style:solid">Strategy, flows and the design system: <a href="https://claude.ai/artifact/TRi1RUxN4mb9gSobHzCFK5" target="_blank" rel="noopener">EXTour Product Book</a></p>' : `<div class="note" style="border-style:solid;display:grid;gap:8px"><b style="color:var(--ink);font-size:14px">Join the pilot</b><span>EXTour is starting in Barcelona and Dahab with freediving, then more sports and places. Create a profile to try it and tell us what you think.</span>${me ? '' : '<button class="btn btn-primary btn-sm" data-act="authStart" data-arg="signup">Create a profile</button>'}</div>`}
    ${me ? '<button class="reset" data-act="devSheet">Funnel and data</button>' : ''}`;
  if (r.dataset.html !== html) { r.innerHTML = html; r.dataset.html = html; }
}

/* ---------------------------------------------------------------------
   Boot: pick the adapter, load tables, restore the session
   --------------------------------------------------------------------- */
(function grain() { try { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), d = x.createImageData(128, 128); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 70; } x.putImageData(d, 0, 0); document.documentElement.style.setProperty('--grain', `url(${c.toDataURL()})`); } catch (e) {} })();
function openDeepLink(hash) {
  const m = /^#?([adsou])\.(.+)$/.exec(hash || ''); if (!m) return false;
  if (!Session.me || Store.status !== 'ready') { UI.pendingLink = hash; return true; }
  UI.pendingLink = null;
  const [, k, id] = m; if (!Store.get(LINK_TABLE[k], id)) { toast('That link points to something that is no longer here'); return true; }
  closeSheet(); UI.tab = 'explore'; UI.stacks.explore = [{ s: 'explore' }, { s: LINK_KIND[k], p: { id } }]; render('tab'); return true;
}
window.addEventListener('hashchange', () => openDeepLink(location.hash));
Store.listeners.add(() => { if (UI.pendingLink && Session.me && Store.status === 'ready') openDeepLink(UI.pendingLink); });

async function boot() {
  render('tab');
  if (typeof SupabaseBoot !== 'undefined' && SupabaseBoot.enabled()) {
    try { await SupabaseBoot.start(); } catch (e) { console.error(e); Store.status = 'error'; }
    Live.prime(); openDeepLink(location.hash); render('tab'); return;
  }
  let db = null, user = null, canWrite = null;
  if (window.claude && typeof window.claude.use === 'function') {
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) {}
    if (user) { try { Session.viewerId = await user.id(); canWrite = await user.can('data.write'); } catch (e) {} }
  }
  try {
    if (db && canWrite !== false) {
      Store.adapter = CloudAdapter; await CloudAdapter.load(db);
      Store.status = Store.t.sports.size ? 'ready' : (canWrite ? 'empty' : 'ready');
      if (!Store.t.sports.size && !canWrite) { Store.adapter = LocalAdapter; await LocalAdapter.load(); }
    } else { Store.adapter = LocalAdapter; await LocalAdapter.load(); Store.status = 'ready'; }
    Session.restore();
  } catch (e) { console.error(e); Store.status = 'error'; }
  Live.prime();
  openDeepLink(location.hash);
  render('tab');
}
window.addEventListener('DOMContentLoaded', boot);
