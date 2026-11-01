import { readFile, writeFile, mkdir, cp, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { parseDocument } from 'yaml';
import { pageMetadata } from './metadata.mjs';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'dist');
const assetVersions=new Map(await Promise.all(['theme-init.js','app.js','layout.css','themes.css','designs.css'].map(async name=>[name,createHash('sha256').update(await readFile(resolve(root,'public',name))).digest('hex').slice(0,12)])));
const assetPath=name=>'/'+name+'?v='+assetVersions.get(name);
const document = parseDocument(await readFile(resolve(root, 'content/lab.yml'), 'utf8'), { uniqueKeys: true });
if (document.errors.length) throw new Error('content/lab.yml: ' + document.errors.map(e => e.message).join('\n'));
const d = document.toJS();
const fail = (path, message) => { throw new Error(`content/lab.yml → ${path}: ${message}`); };
const text = (v, path) => { if (typeof v !== 'string' || !v.trim()) fail(path, 'provide nonempty text'); };
const url = (v, path) => { text(v, path); try { if (!['https:', 'http:'].includes(new URL(v).protocol)) fail(path, 'use an https:// URL'); } catch { fail(path, 'use a complete https:// URL'); } };
const list = (v, path) => { if (!Array.isArray(v) || !v.length) fail(path, 'provide a list with at least one entry'); };
const object = (v, path) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(path, 'provide a section with indented fields'); };
for (const k of ['lab', 'home', 'research', 'software', 'positions']) object(d[k], k);
for (const [section, fields] of Object.entries({ lab: ['name','full_name','group','institution','department','location','email','logo','group_photo','group_photo_caption','description'], home: ['eyebrow','title','title_secondary','introduction','about_title','about'], research: ['title','introduction','context'], software: ['title','introduction'], positions: ['title','subtitle','introduction','details','contact_label'] })) for (const f of fields) text(d[section][f], `${section}.${f}`);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.lab.email)) fail('lab.email', 'provide an email address');
for (const k of ['site_url','github','original_site']) url(d.lab[k], `lab.${k}`);
if (d.lab.google_site_verification && (typeof d.lab.google_site_verification!=='string'||!(/^[A-Za-z0-9_-]+$/).test(d.lab.google_site_verification))) fail('lab.google_site_verification','use only the token from Google, without the surrounding HTML tag');
for (const path of ['people','publications','research.areas','software.projects','positions.backgrounds']) list(path.split('.').reduce((v,k) => v?.[k], d), path);
for (const [collection, fields] of [[d.people,['id','name','role','image','bio']], [d.publications,['id','title','authors','venue','type','url']], [d.research.areas,['id','number','title','summary','question','description','example']], [d.software.projects,['name','category','description','url']]]) {
  const seen = new Set();
  for (const [i, item] of collection.entries()) {
    object(item, `entry ${i+1}`);
    for (const field of fields) text(item[field], `${item.id || item.name || i+1}.${field}`);
    const id = item.id || item.name;
    if (seen.has(id)) fail(id, 'duplicate ID/name');
    seen.add(id);
    if (item.id && !/^[a-z0-9-]+$/.test(item.id)) fail(id, 'IDs may contain lowercase letters, numbers, and hyphens');
    for (const f of ['url','code','website','preprint','orcid']) if (item[f]) url(item[f], `${id}.${f}`);
  }
}
for (const p of d.publications) if (!Number.isInteger(p.year) || p.year < 1900 || p.year > 2200) fail(`${p.id}.year`, 'use a four-digit number');
for (const p of d.publications) {
  if (p.doi && (typeof p.doi!=='string'||!/^10\.\d{4,9}\/\S+$/.test(p.doi))) fail(`${p.id}.doi`, 'provide the DOI, such as 10.1021/acs.jctc.6c01145');
  if (p.published && (!/^\d{4}-\d{2}-\d{2}$/.test(p.published) || Number.isNaN(Date.parse(p.published)) || Number(p.published.slice(0,4))!==p.year)) fail(`${p.id}.published`, 'use YYYY-MM-DD in the publication year');
  if (!p.overview) continue;
  object(p.overview, `${p.id}.overview`);
  for (const k of ['abstract','abstract_source','abstract_version']) text(p.overview[k], `${p.id}.overview.${k}`);
  url(p.overview.abstract_source, `${p.id}.overview.abstract_source`);
  const figure=p.overview.figure;
  object(figure, `${p.id}.overview.figure`);
  for (const k of ['image','alt','number','caption','source','credit','license','license_url']) text(figure[k],`${p.id}.overview.figure.${k}`);
  for (const k of ['source','license_url']) url(figure[k],`${p.id}.overview.figure.${k}`);
  if (!Number.isInteger(figure.width)||!Number.isInteger(figure.height)||figure.width<1||figure.height<1) fail(`${p.id}.overview.figure`, 'provide positive width and height values');
}
for (const area of d.research.areas) {
  list(area.methods, `${area.id}.methods`);
  for (const [i,method] of area.methods.entries()) text(method, `${area.id}.methods.${i}`);
  if (!Array.isArray(area.person_ids)) fail(`${area.id}.person_ids`, 'provide a list, or [] for no related people');
  for (const id of area.person_ids) if (!d.people.some(p=>p.id===id)) fail(`${area.id}.person_ids`, `unknown person "${id}"`);
  if (!Array.isArray(area.publication_ids)) fail(`${area.id}.publication_ids`, 'provide a list, or [] for no related papers');
  for (const id of area.publication_ids) if (!d.publications.some(p => p.id === id)) fail(`${area.id}.publication_ids`, `unknown publication "${id}"`);
}
const images = [d.lab.logo, ...(d.lab.logo_dark?[d.lab.logo_dark]:[]), ...(d.home.hero_visual?[d.home.hero_visual]:[]), d.lab.group_photo, ...d.people.map(p => p.image), ...d.publications.filter(p=>p.overview).map(p=>p.overview.figure.image)];
for (const image of images) {
  if (typeof image !== 'string' || !/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:jpg|jpeg|png|webp|svg)$/.test(image)) fail('image', 'use a file within /assets/');
  try { await access(resolve(root, 'public', image.slice(1))); } catch { fail(image, 'image file is missing from public/assets/'); }
}
// Remove only this project's generated dist directory, after validating the content.
if (dirname(out) !== root.replace(/[\\/]$/, '')) throw new Error('Unexpected build output directory');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'public'), out, { recursive: true });
const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = v => JSON.stringify(v).replace(/</g,'\\u003c');
const base = d.lab.site_url.replace(/\/$/,'');
const arrow = '<span aria-hidden="true">↗</span>';
const link = (href, label, cls='text-link') => `<a class="${cls}" href="${e(href)}">${e(label)} ${arrow}</a>`;
const chips = arr => arr.map(t => `<span class="tag">${e(t)}</span>`).join('');
const publications = [...d.publications].sort((a,b)=> b.year-a.year || (b.published||'').localeCompare(a.published||''));
const years = [...new Set(publications.map(p=>p.year))];
const pages = [ ['/', 'Home'], ['/research/','Research'], ['/people/','People'], ['/publications/','Publications'], ['/software/','Software'], ['/join/','Join us'] ];
const footer = `<footer class="footer"><div class="wrap footer-grid"><div><p class="footer-name">${e(d.lab.name)}<span> / ${e(d.lab.group)}</span></p><p>${e(d.lab.full_name)}<br>${e(d.lab.department)}<br>${e(d.lab.institution)} · ${e(d.lab.location)}</p></div><div><p class="label">Contact</p>${link('mailto:'+d.lab.email,d.lab.email)}<div class="footer-links">${link(d.lab.github,'GitHub')}${link(d.lab.original_site,'Technion lab page')}</div></div></div><div class="wrap footer-bottom"><span>© ${new Date().getUTCFullYear()} ${e(d.lab.group)}</span><span>${e(d.lab.institution)}</span><a href="/search/">Search the site</a></div></footer>`;
const searchIndex = [];
const organization = {'@context':'https://schema.org','@type':'ResearchOrganization',name:d.lab.full_name,alternateName:[d.lab.name,d.lab.group],url:base,logo:base+d.lab.logo,email:d.lab.email,parentOrganization:{'@type':'CollegeOrUniversity',name:d.lab.institution},sameAs:[d.lab.github,d.lab.original_site]};
async function page(path, title, description, body, structured, indexText='') {
  const metadata=pageMetadata({data:d,base,path,title,description,entity:structured});
  const nav = pages.filter(p=>p[0]!=='/').map(([href,label])=>`<a href="${href}"${path.startsWith(href)?' aria-current="page"':''}>${label}</a>`).join('');
  const html = `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    ${metadata.head}
    <script src="${assetPath('theme-init.js')}"></script>
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${assetPath('layout.css')}"><link rel="stylesheet" href="${assetPath('themes.css')}"><link rel="stylesheet" href="${assetPath('designs.css')}">
    <script type="application/ld+json">${json(metadata.structured)}</script><script src="${assetPath('app.js')}" defer></script>
    <noscript><style>.menu-toggle{display:none}.header nav{display:flex;position:static;flex-wrap:wrap;box-shadow:none;width:100%}.header-inner{flex-wrap:wrap;padding-block:12px}</style></noscript>
  </head><body>
    <a class="skip" href="#main">Skip to content</a>
    <nav class="design-preview" aria-label="Compare website designs"><div class="wrap design-preview-inner"><span class="design-preview-label">Compare designs</span><div class="design-options"><a href="?design=studio" data-design-option="studio">01 Studio</a><a href="?design=editorial" data-design-option="editorial">02 Editorial</a><a href="?design=atlas" data-design-option="atlas">03 Atlas</a></div><a class="design-exit" href="${e(path)}" aria-label="Exit design preview">Exit</a></div></nav>
    <header class="header"><div class="wrap header-inner">
      <a class="brand${d.lab.logo_dark?' has-dark-logo':''}" href="/" aria-label="${e(d.lab.name)} home"><img class="brand-light" src="${e(d.lab.logo)}" width="2170" height="725" alt="${e(d.lab.name)} — Computational Molecular Engineering">${d.lab.logo_dark?`<img class="brand-dark" src="${e(d.lab.logo_dark)}" width="2170" height="725" alt="${e(d.lab.name)} — Computational Molecular Engineering">`:''}</a>
      <nav id="primary-nav" aria-label="Main navigation">${nav}<a class="search-nav" href="/search/" aria-label="Search the website"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="1.6"/></svg></a></nav>
      <div class="header-actions"><button class="theme-toggle" type="button" aria-label="Dark mode" aria-pressed="false" hidden><svg class="theme-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.9 13.1A8.8 8.8 0 0 1 10.9 3a9 9 0 1 0 10 10.1Z"/></svg><svg class="theme-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button><button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="primary-nav">Menu <span aria-hidden="true">☰</span></button></div>
    </div></header>
    <main id="main">${body}</main>${footer}
  </body></html>`;
  const dir = resolve(out, '.'+path);
  await mkdir(dir,{recursive:true});
  await writeFile(resolve(dir,'index.html'),html);
  if (path !== '/search/' && path !== '/404/') searchIndex.push({title, url:path, category: path==='/'?'The lab':path.split('/')[1], text:description+' '+indexText});
}
function intro(kicker,title,description) {return `<section class="page-intro wrap"><p class="eyebrow">${e(kicker)}</p><h1>${e(title)}</h1>${description?`<p class="intro-copy">${e(description)}</p>`:''}</section>`;}
function paper(p, compact=false) {return `<article class="paper${compact?' compact':''}" id="${e(p.id)}" data-year="${p.year}"><div class="paper-year">${p.year}<span>${e(p.type)}</span></div><div class="paper-main"><p class="label">${e(p.venue)}</p><h${compact?'3':'2'}><a href="${e(p.overview?'/publications/'+p.id+'/':p.url)}">${e(p.title)}</a></h${compact?'3':'2'}><p class="authors">${e(p.authors)}</p><div class="paper-links">${p.overview?link('/publications/'+p.id+'/','Overview'):''}${link(p.url,p.type==='Preprint'?'Read preprint':'Read paper')}${p.code?link(p.code,'Code & data'):''}</div></div></article>`;}
function joinBand() {return `<section class="join-band"><div class="wrap join-inner"><div><p class="eyebrow">Join the group</p><h2>${e(d.positions.title)}</h2><p>${e(d.positions.introduction)}</p></div>${link('/join/','Explore opportunities','button button-light')}</div></section>`;}
function researchSummary(area) {
  return `<article class="home-research-card"><span class="area-number">${e(area.number)}</span><h3>${e(area.title)}</h3><p>${e(area.summary)}</p><a class="text-link" href="/research/#${e(area.id)}" aria-label="Explore ${e(area.title)}">Explore this direction ${arrow}</a></article>`;
}
function researchArea(area) {
  const people=area.person_ids.map(id=>d.people.find(p=>p.id===id));
  const studies=area.publication_ids.map(id=>d.publications.find(p=>p.id===id));
  return `<section class="research-area" id="${e(area.id)}" aria-labelledby="heading-${e(area.id)}">
    <span class="area-number">${e(area.number)}</span>
    <div class="research-area-content"><h2 id="heading-${e(area.id)}">${e(area.title)}</h2>
      <p class="research-question">${e(area.question)}</p><p class="research-description">${e(area.description)}</p>
      <div class="research-example"><p class="label">Example from recent work</p><p>${e(area.example)}</p></div>
      <div class="tags research-methods" role="group" aria-label="Methods">${chips(area.methods)}</div>
      ${people.length?`<div class="research-people"><p class="label">Related people</p><div>${people.map(p=>link('/people/'+p.id+'/',p.name)).join('')}</div></div>`:''}
    </div>
    ${studies.length?`<aside aria-label="Publications for ${e(area.title)}"><h3>Related publications</h3>${studies.map(p=>`<div class="related-study"><a class="related-paper" href="${p.overview?'/publications/'+e(p.id)+'/':'/publications/#'+e(p.id)}"><span>${p.year} / ${e(p.type)}</span>${e(p.title)} ${arrow}</a>${p.code?link(p.code,'Code & data'):''}</div>`).join('')}</aside>`:''}
  </section>`;
}
await page('/',d.lab.group,d.lab.description,`
<section class="hero hero-current wrap">${d.home.hero_visual?`<div class="hero-visual" style="--hero-art:url('${e(d.home.hero_visual)}')" aria-hidden="true"></div>`:''}<p class="eyebrow">${e(d.lab.group)} <span>/ ${e(d.lab.institution)}</span></p><p class="hero-lab-name">${e(d.home.eyebrow)}</p><h1><span class="hero-title-line">${e(d.home.title)}</span><span class="hero-title-line">${e(d.home.title_secondary)}</span></h1><div class="hero-intro"><p>${e(d.home.introduction)}</p><div class="hero-actions">${link('/research/','Explore the research','button')}${link('/join/','Join the lab')}</div></div></section>
<section class="about-background home-research"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">Research</p><h2>${e(d.home.about_title)}</h2></div>${link('/research/','All research')}</div><p class="home-research-intro">${e(d.home.about)}</p><div class="home-research-grid">${d.research.areas.map(researchSummary).join('')}</div></div></section>
<section class="recent wrap"><div class="section-heading"><div><p class="eyebrow">Publications</p><h2>Recent publications</h2></div>${link('/publications/','All publications')}</div>${publications.slice(0,3).map(p=>paper(p,true)).join('')}</section>${joinBand()}`);
await page('/research/','Research',d.research.introduction,`${intro('Research',d.research.title,d.research.introduction)}<section class="wrap research-context"><p class="large-copy">${e(d.research.context)}</p><nav class="research-index" aria-label="Research directions">${d.research.areas.map(a=>link('/research/#'+a.id,a.number+' / '+a.title)).join('')}</nav></section><div class="wrap research-details">${d.research.areas.map(researchArea).join('')}</div>${joinBand()}`,organization,d.research.areas.map(a=>[a.title,a.question,a.description,a.example,...a.methods].join(' ')).join(' '));
const pi = d.people.find(p=>p.role==='Principal Investigator') || d.people[0];
const personLinks = p => `${p.email?link('mailto:'+p.email,'Email'):''}${p.website?link(p.website,'Personal website'):''}${p.orcid?link(p.orcid,'ORCID'):''}`;
const personCard = p => `<article class="person-card" id="${e(p.id)}"><a class="portrait-link" href="/people/${e(p.id)}/"><img src="${e(p.image)}" width="600" height="750" loading="lazy" alt="${e(p.name)}"></a><p class="label">${e(p.role)}</p><h2><a href="/people/${e(p.id)}/">${e(p.name)}</a></h2><p>${e(p.bio)}</p><div class="person-links">${personLinks(p)}</div></article>`;
await page('/people/','People','Meet the researchers in the Mendels Research Group at the Technion, led by Dr. Dan Mendels.',`${intro('People','Meet the team','')}<section class="wrap pi-feature"><img src="${e(pi.image)}" width="1084" height="1437" alt="${e(pi.name)}"><div><p class="eyebrow">${e(pi.role)}</p><h2>${e(pi.name)}</h2><p class="large-copy">${e(pi.bio)}</p><div class="person-links">${personLinks(pi)}${link('/people/'+pi.id+'/','Researcher profile')}</div></div></section><section class="wrap"><div class="section-heading"><h2>People</h2><span class="label">${d.people.length-1} researchers</span></div><div class="people-grid">${d.people.filter(p=>p!==pi).map(personCard).join('')}</div></section><figure class="wrap group-photo"><img src="${e(d.lab.group_photo)}" width="2040" height="1530" loading="lazy" alt="The Computational Molecular Engineering group at the Technion"><figcaption>${e(d.lab.group_photo_caption)}</figcaption></figure>${joinBand()}`,organization,d.people.map(p=>p.name+' '+p.role+' '+p.bio).join(' '));
for (const p of d.people) {
  // Match publication author variants without changing the names shown in citations.
  const aliases = p.id==='alex-zhilkin'?['zhilkin']:p.id==='sergey-shteingoltz'?['shteingolts','shteingoltz']: [p.name.split(' ').at(-1).toLowerCase()];
  const pubs = publications.filter(pub=>aliases.some(alias=>pub.authors.toLowerCase().includes(alias)));
  await page('/people/'+p.id+'/',p.name,p.role+' at '+d.lab.full_name+'. '+p.bio,`<div class="wrap breadcrumb"><a href="/people/">People</a><span aria-hidden="true"> / </span>${e(p.name)}</div><section class="wrap pi-feature profile"><img src="${e(p.image)}" width="600" height="750" alt="${e(p.name)}"><div><p class="eyebrow">${e(p.role)}</p><h1>${e(p.name)}</h1><p class="large-copy">${e(p.bio)}</p><div class="person-links">${personLinks(p)}</div></div></section>${pubs.length?`<section class="wrap recent"><div class="section-heading"><h2>Selected publications</h2>${link('/publications/','All publications')}</div>${pubs.map(x=>paper(x,true)).join('')}</section>`:''}`,{'@context':'https://schema.org','@type':'Person',name:p.name,jobTitle:p.role,description:p.bio,image:base+p.image,url:base+'/people/'+p.id+'/',affiliation:{'@type':'ResearchOrganization',name:d.lab.full_name},...(p.website?{sameAs:[p.website]}:{})});
}
await page('/publications/','Publications','Explore publications and preprints from the Mendels Research Group, with links to papers, code, and research data.',`${intro('Publications','Publications','')}<section class="wrap publication-library" aria-label="Publication library"><form class="filters" role="search" id="paper-filter"><div class="search-field"><label for="paper-search">Search publications</label><input id="paper-search" name="q" type="search" placeholder="Title, author, or topic…" autocomplete="off"></div><div class="year-field"><label for="paper-year">Publication year</label><select id="paper-year" name="year"><option value="all">All years</option>${years.map(y=>`<option value="${y}">${y}</option>`).join('')}</select></div></form><p class="result-count" id="paper-count" role="status">${publications.length} publications</p><div id="paper-list">${publications.map(p=>paper(p)).join('')}</div><p id="paper-empty" class="empty" hidden>No publications match your search. Try another keyword or year.</p></section>`,{'@context':'https://schema.org','@type':'CollectionPage',name:'Publications — '+d.lab.name,url:base+'/publications/',mainEntity:{'@type':'ItemList',itemListElement:publications.map((p,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'ScholarlyArticle',name:p.title,datePublished:String(p.year),url:p.url,author:p.authors.split(',').map(name=>({'@type':'Person',name:name.trim()}))}}))}},publications.map(p=>p.title+' '+p.authors+' '+p.year).join(' '));
await page('/software/','Software',d.software.introduction,`${intro('Open research',d.software.title,d.software.introduction)}<section class="wrap software-list">${d.software.projects.map((p,i)=>`<article class="software-row"><span class="area-number">${String(i+1).padStart(2,'0')}</span><div><p class="eyebrow">${e(p.category)}</p><h2>${e(p.name)}</h2><p>${e(p.description)}</p></div>${link(p.url,'View repository')}</article>`).join('')}<div class="software-end">${link(d.lab.github,'Explore the GitHub organization','button')}</div></section>`,organization,d.software.projects.map(p=>p.name+' '+p.description).join(' '));
await page('/join/','Join us',d.positions.introduction,`${intro('Opportunities',d.positions.title,d.positions.introduction)}<section class="wrap join-content"><div><p class="eyebrow">${e(d.positions.subtitle)}</p><p class="large-copy">${e(d.positions.details)}</p><div class="tags">${chips(d.positions.backgrounds)}</div>${link('mailto:'+d.lab.email+'?subject=Research%20opportunities%20at%20CME%20Lab',d.positions.contact_label,'button')}</div><aside class="contact-panel"><p class="eyebrow">Get in touch</p><h3>Dr. Dan Mendels</h3><p>${e(d.lab.department)}<br>${e(d.lab.institution)}<br>${e(d.lab.location)}</p>${link('mailto:'+d.lab.email,d.lab.email)}</aside></section><figure class="wrap join-photo"><img src="${e(d.lab.group_photo)}" width="2040" height="1530" alt="The CME group at the Technion" loading="lazy"><figcaption>${e(d.lab.group_photo_caption)}</figcaption></figure>`);
await page('/search/','Search','Search people, publications, research, and software from the Computational Molecular Engineering Lab.',`${intro('Find your way','Search the lab.','Find a researcher, a paper, a method, or a research direction.')}<section class="wrap site-search"><form role="search" id="site-search-form"><label for="site-query">Search the website</label><div class="site-search-input"><input type="search" id="site-query" name="q" placeholder="Try “peptide”, “Dan”, or “free energy”" autocomplete="off"><button class="button" type="submit">Search</button></div></form><p id="site-count" class="result-count" role="status">Enter a keyword to explore the site.</p><div id="site-results"></div><noscript><p>Site search needs JavaScript. You can browse <a href="/people/">people</a>, <a href="/research/">research</a>, and the full <a href="/publications/">publication list</a> directly.</p></noscript></section>`);
// An overview block supplies the original abstract and a source figure.
for (const p of publications.filter(p=>p.overview)) {
  const o=p.overview,f=o.figure;
  const date=p.published?new Date(p.published+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):p.year;
  const caption=f.caption.replace(/^Figure\s+\d+:\s*/, '');
  await page('/publications/'+p.id+'/',p.title,`${p.title}. ${p.venue}, ${p.year}.`,`
    <div class="wrap breadcrumb"><a href="/publications/">Publications</a><span aria-hidden="true"> / </span>${p.year}</div>
    <header class="wrap paper-page-intro">
      <p class="eyebrow">${e(p.venue)} / ${e(p.type)}</p>
      <h1>${e(p.title)}</h1>
      <p class="paper-authors">${e(p.authors)}</p>
      <p class="publication-date">${p.type==='Preprint'?'Posted':'Published'} ${p.published?`<time datetime="${p.published}">${e(date)}</time>`:e(date)}</p>
      <div class="paper-links">${link(p.url,p.type==='Preprint'?'Read preprint':'Read paper')}${p.preprint?link(p.preprint,'arXiv preprint'):''}${p.code?link(p.code,'Code & data'):''}</div>
    </header>
    <article class="wrap paper-overview">
      <figure class="paper-figure">
        <a href="${e(f.image)}" target="_blank" rel="noopener" aria-label="Open ${e(f.number)} at full size"><img src="${e(f.image)}" width="${f.width}" height="${f.height}" style="max-width:${f.width}px" alt="${e(f.alt)}"></a>
        <figcaption><p><strong>${e(f.number)}.</strong> ${e(caption)}</p><p class="figure-credit">${e(f.credit)} <a href="${e(f.source)}">Source</a> · <a href="${e(f.license_url)}">${e(f.license)}</a></p></figcaption>
      </figure>
      <section class="paper-abstract" aria-labelledby="abstract-heading"><h2 id="abstract-heading">Abstract</h2><p class="abstract-source">${e(o.abstract_version)} · <a href="${e(o.abstract_source)}">Original source</a></p><p class="abstract-text">${e(o.abstract)}</p></section>
      <div class="story-nav">${link('/publications/','Back to publications')}</div>
    </article>`,{'@context':'https://schema.org','@type':'WebPage',name:p.title,description:`${p.venue}, ${p.year}.`,url:base+'/publications/'+p.id+'/',about:{'@type':'ScholarlyArticle',name:p.title,url:p.url,datePublished:p.published||String(p.year),author:p.authors.split(',').map(name=>({'@type':'Person',name:name.trim()}))}},p.authors+' '+o.abstract);
}
// Add older bibliography entries to search independently.
for (const p of publications.filter(p=>!p.overview)) searchIndex.push({title:p.title,url:'/publications/#'+p.id,category:'Publication · '+p.year,text:p.authors+' '+p.venue+' '+p.title});
for (const area of d.research.areas) searchIndex.push({title:area.title,url:'/research/#'+area.id,category:'Research',text:[area.summary,area.question,area.description,area.example,...area.methods,...area.person_ids.map(id=>d.people.find(p=>p.id===id).name)].join(' ')});
await writeFile(resolve(out,'search-index.json'),json(searchIndex));
const urls = pages.map(p=>p[0]).concat(d.people.map(p=>'/people/'+p.id+'/'),publications.filter(p=>p.overview).map(p=>'/publications/'+p.id+'/'),'/search/');
await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.filter(p=>p!=='/search/').map(p=>`<url><loc>${e(base+p)}</loc></url>`).join('')}</urlset>`);
await writeFile(resolve(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
await writeFile(resolve(out,'.nojekyll'),'');
await page('/404/','Page not found','Find your way back to the CME Lab website.',`${intro('404','Page not found','The page you are looking for may have moved.')}<div class="wrap error-actions">${link('/','Return home','button')}${link('/search/','Search the site')}</div>`);
await cp(resolve(out,'404/index.html'),resolve(out,'404.html'));
console.log(`Built ${urls.length+1} pages, ${d.people.length} people, and ${publications.length} publications from content/lab.yml.`);
