// Barcelona Freedivers static build. No dependencies: node build.mjs [--preview]
// One layout (header + footer), one stylesheet, one script, one course table (src/data/courses.csv).
import fs from 'node:fs';
import path from 'node:path';

const PREVIEW = process.argv.includes('--preview');
const SRC = 'src';
const OUT = PREVIEW ? 'dist-preview' : 'dist';
const site = JSON.parse(fs.readFileSync(`${SRC}/data/site.json`, 'utf8'));
const dims = JSON.parse(fs.readFileSync(`${SRC}/img/dims.json`, 'utf8'));
const layout = fs.readFileSync(`${SRC}/layout.html`, 'utf8');

// ---------- CSV: the single source for every course fact and price ----------
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (ch === '"') q = false; else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.length > 1);
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}
const courses = parseCSV(fs.readFileSync(`${SRC}/data/courses.csv`, 'utf8'));
const byId = Object.fromEntries(courses.map(c => [c.id, c]));
const euro = n => '€' + Number(n).toLocaleString('en-US');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- URL helpers ----------
function makeUrls(pagePath) {
  const depth = pagePath.split('/').filter(Boolean).length;
  const root = PREVIEW ? '../'.repeat(depth) : '/';
  return {
    u: p => {
      const [base, hash] = p.split('#');
      const h = hash ? '#' + hash : '';
      return PREVIEW ? root + base + 'index.html' + h : '/' + base + h;
    },
    a: p => root + p,
  };
}

// ---------- Blocks generated from the CSV ----------
function gauge(c) {
  if (c.depth_max_m === '') return '<p class="gauge-none">Teaching course, no depth target</p>';
  const m = Number(c.depth_max_m);
  if (m === 0) return '<div class="gauge" aria-hidden="true"><div class="gauge-track"></div><div class="gauge-scale"><span>Pool only</span><span>40 m</span></div></div>';
  return `<div class="gauge" aria-hidden="true"><div class="gauge-track"><div class="gauge-fill" style="width:${(m / 40 * 100).toFixed(1)}%"></div></div><div class="gauge-scale"><span>0</span><span>${esc(c.depth)}</span><span>40 m</span></div></div>`;
}
const blocks = {
  course_cards: U => courses.map(c => `
    <a class="course-card" href="${U.u('courses/#' + c.id)}" data-course="${c.id}" data-course-view>
      <span class="level">${esc(c.level)}</span>
      <span class="cname">${esc(c.name)}</span>
      <span class="meta">${esc(c.where)} · ${esc(c.duration)}</span>
      ${gauge(c)}
      <span class="price">${euro(c.price_eur)}</span>
      <span class="more">Details</span>
    </a>`).join(''),
  course_table: U => `
    <div class="table-wrap"><table class="course-table">
      <caption class="eyebrow" style="caption-side:top;text-align:left;padding-bottom:.75rem">All courses at a glance</caption>
      <thead><tr><th scope="col">Course</th><th scope="col">Where</th><th scope="col">Duration</th><th scope="col">Depth</th><th scope="col">Prerequisite</th><th scope="col">Price</th><th scope="col"><span class="visually-hidden">Details</span></th></tr></thead>
      <tbody>${courses.map(c => `
        <tr><th scope="row">${esc(c.level)}<small>${esc(c.name)}</small></th>
        <td data-label="Where">${esc(c.where)}</td><td data-label="Duration">${esc(c.duration)}</td>
        <td data-label="Depth">${esc(c.depth || 'Not applicable')}</td><td data-label="Prerequisite">${esc(c.prerequisite)}</td>
        <td data-label="Price" class="price">${euro(c.price_eur)}</td>
        <td class="act"><a href="#${c.id}" data-course="${c.id}" data-course-view>Details</a></td></tr>`).join('')}
      </tbody></table></div>`,
  course_details: U => courses.map(c => `
    <article class="course-detail" id="${c.id}" aria-labelledby="${c.id}-h">
      <div><p class="level" id="${c.id}-h">${esc(c.level)}</p><p class="muted">${esc(c.name)}</p></div>
      <div>
        <p>${esc(c.summary)}</p>
        <dl><div><dt>Where</dt><dd>${esc(c.where)}</dd></div><div><dt>Duration</dt><dd>${esc(c.duration)}</dd></div>
        <div><dt>Depth</dt><dd>${esc(c.depth || 'Not applicable')}</dd></div><div><dt>Prerequisite</dt><dd>${esc(c.prerequisite)}</dd></div></dl>
      </div>
      <div class="side"><a class="btn" href="${U.u('contact/#' + c.id)}">Request a place</a></div>
    </article>`).join(''),
  course_options: () => courses.map(c => `<option value="${c.id}">${esc(c.level)}, ${esc(c.name)}</option>`).join(''),
  course_json: U => JSON.stringify(Object.fromEntries(courses.map(c => [c.id, { level: c.level, name: c.name, where: c.where, duration: c.duration, depth: c.depth, prerequisite: c.prerequisite, request: U.u('contact/#' + c.id) }]))),
  faq_prereq: () => '<ul>' + courses.map(c => `<li><strong>${esc(c.level)}:</strong> ${esc(c.prerequisite)}</li>`).join('') + '</ul>',
  faq_duration: () => '<ul>' + courses.map(c => `<li><strong>${esc(c.level)}:</strong> ${esc(c.duration)}</li>`).join('') + '</ul>',
  faq_depth: () => '<ul>' + courses.filter(c => c.depth).map(c => `<li><strong>${esc(c.level)}:</strong> ${esc(c.depth === 'None' ? 'no depth, pool only' : c.depth)}</li>`).join('') + '</ul>',
};

function img(U, spec) {
  // {{img:name|alt|sizes|eager}}
  const [name, alt, sizes = '100vw', eager] = spec.split('|');
  const files = Object.keys(dims).filter(f => f.startsWith(name + '-')).sort((x, y) => dims[y].w - dims[x].w);
  if (!files.length) throw new Error('missing image ' + name);
  const big = files[0];
  const srcset = files.map(f => `${U.a('img/' + f)} ${dims[f].w}w`).join(', ');
  const small = files[files.length - 1];
  return `<img src="${U.a('img/' + small)}" srcset="${srcset}" sizes="${sizes}" width="${dims[big].w}" height="${dims[big].h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
}

function render(tpl, ctx, U) {
  return tpl.replace(/\{\{([a-z_]+)(?::([^}]*))?\}\}/g, (m, key, arg) => {
    if (key === 'u') return U.u(arg);
    if (key === 'a') return U.a(arg);
    if (key === 'img') return img(U, arg);
    if (key === 'cur') return ctx.nav === arg ? 'aria-current="page"' : '';
    if (key === 'block') { if (!blocks[arg]) throw new Error('no block ' + arg); return blocks[arg](U); }
    if (key === 'c') { const [id, f] = arg.split('.'); return esc(byId[id][f]); }
    if (key in ctx) return ctx[key];
    throw new Error('unknown token ' + m);
  }).replace(/\{\{site\.([a-z_0-9]+)\}\}/g, (m, k) => { if (!(k in site)) throw new Error(m); return site[k]; });
}

// ---------- Pages ----------
fs.rmSync(OUT, { recursive: true, force: true });
const pages = fs.readdirSync(`${SRC}/pages`).filter(f => f.endsWith('.html'));
const built = [];
for (const file of pages) {
  const raw = fs.readFileSync(`${SRC}/pages/${file}`, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\n?/);
  if (!m) throw new Error('no meta in ' + file);
  const meta = JSON.parse(m[1]);
  const U = makeUrls(meta.path);
  const ctx = {
    title: esc(meta.title), description: esc(meta.description), page: meta.nav || meta.id, nav: meta.nav || '',
    preview: PREVIEW ? '1' : '0', year: String(new Date().getFullYear()),
    canonical: site.site_url && !meta.noindex ? `<link rel="canonical" href="${site.site_url}/${meta.path}">` : (meta.noindex ? '<meta name="robots" content="noindex">' : ''),
    ga_script: PREVIEW ? '' : `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4_id}"></script>`,
    jsonld: meta.jsonld ? JSON.stringify(meta.id === 'courses' ? { ...meta.jsonld, itemListElement: courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Course', name: `${c.level}, ${c.name}`, description: c.summary, provider: { '@type': 'Organization', name: site.name }, offers: { '@type': 'Offer', price: c.price_eur, priceCurrency: 'EUR', category: 'Paid' } } })) } : meta.jsonld) : '',
  };
  ctx.content = render(raw.slice(m[0].length), ctx, U);
  let html = render(layout, ctx, U);
  if (!meta.jsonld) html = html.replace(/<script type="application\/ld\+json"><\/script>\n?/, '');
  if (PREVIEW && meta.path === '') {
    // The artifact host wraps the start page in its own document skeleton.
    html = html.replace(/<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport"[^>]*>\n/, '')
      .replace('</head>\n', '').replace(/<body ([^>]*)>/, '<div class="body-shim" $1>').replace('</body>\n</html>', '</div>');
  }
  const dest = path.join(OUT, meta.path, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  built.push(meta);
}

// ---------- Assets ----------
fs.cpSync(`${SRC}/assets`, `${OUT}/assets`, { recursive: true });
fs.cpSync(`${SRC}/img`, `${OUT}/img`, { recursive: true, filter: s => !s.endsWith('dims.json') });

// ---------- SEO files ----------
if (!PREVIEW) {
  if (site.site_url) {
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(`${OUT}/sitemap.xml`, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      built.filter(p => !p.noindex).map(p => `  <url><loc>${site.site_url}/${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
    fs.writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${site.site_url}/sitemap.xml\n`);
  } else console.warn('site_url not set: sitemap.xml and robots.txt skipped');
}
console.log(`built ${built.length} pages into ${OUT}`);
