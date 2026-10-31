import { readFile, writeFile, mkdir, cp, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { parseDocument } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'dist');
const document = parseDocument(await readFile(resolve(root, 'content/lab.yml'), 'utf8'), { uniqueKeys: true });
if (document.errors.length) throw new Error('content/lab.yml: ' + document.errors.map(e => e.message).join('\n'));
const d = document.toJS();
const fail = (path, message) => { throw new Error(`content/lab.yml → ${path}: ${message}`); };
const text = (v, path) => { if (typeof v !== 'string' || !v.trim()) fail(path, 'provide nonempty text'); };
const url = (v, path) => { text(v, path); try { if (!['https:', 'http:'].includes(new URL(v).protocol)) fail(path, 'use an https:// URL'); } catch { fail(path, 'use a complete https:// URL'); } };
const list = (v, path) => { if (!Array.isArray(v) || !v.length) fail(path, 'provide a list with at least one entry'); };
const object = (v, path) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(path, 'provide a section with indented fields'); };
for (const k of ['lab', 'home', 'research', 'software', 'positions']) object(d[k], k);
for (const [section, fields] of Object.entries({ lab: ['name','full_name','group','institution','department','location','email','logo','group_photo','group_photo_caption','description'], home: ['eyebrow','title','introduction','about_title','about'], research: ['title','introduction'], software: ['title','introduction'], positions: ['title','subtitle','introduction','details','contact_label'] })) for (const f of fields) text(d[section][f], `${section}.${f}`);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.lab.email)) fail('lab.email', 'provide an email address');
for (const k of ['site_url','github','original_site']) url(d.lab[k], `lab.${k}`);
for (const path of ['people','publications','research.areas','research.methods','software.projects','positions.backgrounds']) list(path.split('.').reduce((v,k) => v?.[k], d), path);
for (const [collection, fields] of [[d.people,['id','name','role','image','bio']], [d.publications,['id','title','authors','venue','type','url']], [d.research.areas,['id','number','title','subtitle','description']], [d.software.projects,['name','category','description','url']]]) {
  const seen = new Set();
  for (const [i, item] of collection.entries()) {
    object(item, `entry ${i+1}`);
    for (const field of fields) text(item[field], `${item.id || item.name || i+1}.${field}`);
    const id = item.id || item.name;
    if (seen.has(id)) fail(id, 'duplicate ID/name');
    seen.add(id);
    if (item.id && !/^[a-z0-9-]+$/.test(item.id)) fail(id, 'IDs may contain lowercase letters, numbers, and hyphens');
    for (const f of ['url','code','website']) if (item[f]) url(item[f], `${id}.${f}`);
  }
}
for (const p of d.publications) if (!Number.isInteger(p.year) || p.year < 1900 || p.year > 2200) fail(`${p.id}.year`, 'use a four-digit number');
for (const p of d.publications) if (p.summary) {
  object(p.summary, `${p.id}.summary`);
  for (const k of ['headline','question','approach','finding','significance','source']) text(p.summary[k], `${p.id}.summary.${k}`);
  url(p.summary.source, `${p.id}.summary.source`);
}
for (const area of d.research.areas) {
  list(area.topics, `${area.id}.topics`);
  list(area.publication_ids, `${area.id}.publication_ids`);
  for (const id of area.publication_ids) if (!d.publications.some(p => p.id === id)) fail(`${area.id}.publication_ids`, `unknown publication "${id}"`);
}
const images = [d.lab.logo, d.lab.group_photo, ...d.people.map(p => p.image)];
for (const image of images) {
  if (typeof image !== 'string' || !/^\/assets\/[a-zA-Z0-9_.-]+$/.test(image)) fail('image', 'use /assets/filename.ext');
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
const publications = [...d.publications].sort((a,b)=> b.year-a.year);
const years = [...new Set(publications.map(p=>p.year))];
const pages = [ ['/', 'Home'], ['/research/','Research'], ['/people/','People'], ['/publications/','Publications'], ['/software/','Software'], ['/join/','Join us'] ];
const footer = `<footer class="footer"><div class="wrap footer-grid"><div><p class="footer-name">${e(d.lab.name)}<span> / ${e(d.lab.group)}</span></p><p>${e(d.lab.full_name)}<br>${e(d.lab.department)}<br>${e(d.lab.institution)} · ${e(d.lab.location)}</p></div><div><p class="label">Start a conversation</p>${link('mailto:'+d.lab.email,d.lab.email)}<div class="footer-links">${link(d.lab.github,'GitHub')}${link(d.lab.original_site,'Technion website')}</div></div></div><div class="wrap footer-bottom"><span>© ${new Date().getUTCFullYear()} ${e(d.lab.group)}</span><span>Molecular understanding. New possibilities.</span><a href="/search/">Search the site</a></div></footer>`;
const searchIndex = [];
const organization = {'@context':'https://schema.org','@type':'ResearchOrganization',name:d.lab.full_name,alternateName:[d.lab.name,d.lab.group],url:base,logo:base+d.lab.logo,email:d.lab.email,parentOrganization:{'@type':'CollegeOrUniversity',name:d.lab.institution},sameAs:[d.lab.github,d.lab.original_site]};
async function page(path, title, description, body, structured, indexText='') {
  const name = path === '/' ? d.lab.group : title + ' · ' + d.lab.name;
  const canonical = base + path;
  const nav = pages.filter(p=>p[0]!=='/').map(([href,label])=>`<a href="${href}"${path.startsWith(href)?' aria-current="page"':''}>${label}</a>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${canonical}"><meta name="theme-color" content="#123a5b"><meta property="og:type" content="website"><meta property="og:title" content="${e(name)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${base}/assets/logo.png"><meta property="og:image:alt" content="CME Lab — Computational Molecular Engineering"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${json(structured||organization)}</script><script src="/app.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a><header class="header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="${e(d.lab.name)} home"><img src="${e(d.lab.logo)}" width="983" height="320" alt="${e(d.lab.name)} — Computational Molecular Engineering"></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu <span aria-hidden="true">☰</span></button><nav id="primary-nav" aria-label="Main navigation">${nav}<a class="search-nav" href="/search/" aria-label="Search the website"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="1.6"/></svg></a></nav></div></header><main id="main">${body}</main>${footer}</body></html>`;
  const dir = resolve(out, '.'+path);
  await mkdir(dir,{recursive:true});
  await writeFile(resolve(dir,'index.html'),html);
  if (path !== '/search/' && path !== '/404/') searchIndex.push({title, url:path, category: path==='/'?'The lab':path.split('/')[1], text:description+' '+indexText});
}
function intro(kicker,title,description) {return `<section class="page-intro wrap"><p class="eyebrow">${e(kicker)}</p><h1>${e(title)}</h1><p class="intro-copy">${e(description)}</p></section>`;}
function paper(p, compact=false) {return `<article class="paper${compact?' compact':''}" id="${e(p.id)}" data-year="${p.year}"><div class="paper-year">${p.year}<span>${e(p.type)}</span></div><div class="paper-main"><p class="label">${e(p.venue)}</p><h${compact?'3':'2'}><a href="${e(p.summary?'/publications/'+p.id+'/':p.url)}">${e(p.title)}</a></h${compact?'3':'2'}><p class="authors">${e(p.authors)}</p><div class="paper-links">${p.summary?link('/publications/'+p.id+'/','Research summary'):''}${link(p.url,p.type==='Preprint'?'Read preprint':'Read paper')}${p.code?link(p.code,'Code & data'):''}</div></div></article>`;}
function joinBand() {return `<section class="join-band"><div class="wrap join-inner"><div><p class="eyebrow">Join the group</p><h2>${e(d.positions.title)}</h2><p>${e(d.positions.introduction)}</p></div>${link('/join/','Explore opportunities','button button-light')}</div></section>`;}
const split = d.home.title.indexOf('.')+1;
await page('/',d.lab.group,d.lab.description,`
<section class="hero wrap"><div class="hero-copy"><p class="eyebrow">${e(d.lab.group)} <span> / Technion</span></p><h1>${e(d.home.title.slice(0,split))}<em>${e(d.home.title.slice(split).trim())}</em></h1><p class="hero-lede">${e(d.home.introduction)}</p><div class="hero-actions">${link('/research/','Explore our research','button')}${link('/publications/','Read our publications')}</div></div><figure class="hero-figure"><img src="/assets/landscape.svg" width="600" height="580" alt="Illustration of two free-energy basins connected by a molecular transition pathway"><figcaption><span>01 / The molecular landscape</span><span>Conceptual illustration</span></figcaption></figure></section>
<div class="discipline-line"><div class="wrap"><span>${e(d.home.eyebrow)}</span><span>${e(d.lab.department)}</span></div></div>
<section class="wrap about-section"><div><p class="eyebrow">A computational perspective</p><h2>${e(d.home.about_title)}</h2></div><div><p class="large-copy">${e(d.home.about)}</p>${link('/people/','Meet the people behind the work')}</div></section>
<section class="research-preview wrap"><div class="section-heading"><div><p class="eyebrow">Research directions</p><h2>Questions across scales.</h2></div>${link('/research/','Our approach')}</div><div class="research-grid">${d.research.areas.map(a=>`<a class="research-card" href="/research/#${e(a.id)}"><span class="card-number">${e(a.number)}</span><h3>${e(a.title)}</h3><p>${e(a.subtitle)}</p><span class="card-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>
<section class="recent wrap"><div class="section-heading"><div><p class="eyebrow">From the group</p><h2>Recent publications.</h2></div>${link('/publications/','View all publications')}</div>${publications.slice(0,4).map(p=>paper(p,true)).join('')}</section>
<section class="group-feature wrap"><figure><img src="${e(d.lab.group_photo)}" width="2040" height="1530" loading="lazy" alt="Members of the Computational Molecular Engineering group at the Technion"><figcaption>${e(d.lab.group_photo_caption)}</figcaption></figure><div><p class="eyebrow">People make the science</p><h2>Different backgrounds.<br>Shared curiosity.</h2><p>Meet our group of researchers working at the intersection of molecular simulation, physical science, and computation.</p>${link('/people/','Meet the lab','button')}</div></section>${joinBand()}`);
await page('/research/','Research',d.research.introduction,`${intro('Research',d.research.title,d.research.introduction)}<section class="method-strip wrap"><p class="label">Our toolkit</p><div>${chips(d.research.methods)}</div></section><div class="wrap research-details">${d.research.areas.map(a=>`<section class="research-area" id="${e(a.id)}"><span class="area-number">${e(a.number)}</span><div><p class="eyebrow">${e(a.subtitle)}</p><h2>${e(a.title)}</h2><p class="large-copy">${e(a.description)}</p><div class="tags">${chips(a.topics)}</div></div><aside><h3>Related reading</h3>${a.publication_ids.map(id=>{const p=d.publications.find(p=>p.id===id);return `<a class="related-paper" href="/publications/#${e(id)}"><span>${p.year} / ${e(p.type)}</span>${e(p.title)} ${arrow}</a>`;}).join('')}</aside></section>`).join('')}</div>${joinBand()}`,organization,d.research.areas.map(a=>a.title+' '+a.description).join(' '));
const pi = d.people.find(p=>p.role==='Principal Investigator') || d.people[0];
const personLinks = p => `${p.email?link('mailto:'+p.email,'Email'):''}${p.website?link(p.website,'Personal website'):''}`;
const personCard = p => `<article class="person-card" id="${e(p.id)}"><a class="portrait-link" href="/people/${e(p.id)}/"><img src="${e(p.image)}" width="600" height="750" loading="lazy" alt="${e(p.name)}"></a><p class="label">${e(p.role)}</p><h2><a href="/people/${e(p.id)}/">${e(p.name)}</a></h2><p>${e(p.bio)}</p><div class="person-links">${personLinks(p)}</div></article>`;
await page('/people/','People','Meet the researchers in the Mendels Research Group at the Technion, led by Dr. Dan Mendels.',`${intro('People','A meeting of minds.','Our group brings together perspectives from physics, chemistry, mathematics, and computer science to understand and engineer molecular systems.')}<section class="wrap pi-feature"><img src="${e(pi.image)}" width="1084" height="1437" alt="${e(pi.name)}"><div><p class="eyebrow">${e(pi.role)}</p><h2>${e(pi.name)}</h2><p class="large-copy">${e(pi.bio)}</p><div class="person-links">${personLinks(pi)}${link('/people/'+pi.id+'/','Researcher profile')}</div></div></section><section class="wrap"><div class="section-heading"><h2>The group.</h2><span class="label">${d.people.length-1} researchers</span></div><div class="people-grid">${d.people.filter(p=>p!==pi).map(personCard).join('')}</div></section>${joinBand()}`,organization,d.people.map(p=>p.name+' '+p.role+' '+p.bio).join(' '));
for (const p of d.people) {
  // Match publication author variants without changing the names shown in citations.
  const aliases = p.id==='alex-zhilkin'?['zhilkin']:p.id==='sergey-shteingoltz'?['shteingolts','shteingoltz']: [p.name.split(' ').at(-1).toLowerCase()];
  const pubs = publications.filter(pub=>aliases.some(alias=>pub.authors.toLowerCase().includes(alias)));
  await page('/people/'+p.id+'/',p.name,p.role+' at '+d.lab.full_name+'. '+p.bio,`<div class="wrap breadcrumb"><a href="/people/">People</a><span aria-hidden="true"> / </span>${e(p.name)}</div><section class="wrap pi-feature profile"><img src="${e(p.image)}" width="600" height="750" alt="${e(p.name)}"><div><p class="eyebrow">${e(p.role)}</p><h1>${e(p.name)}</h1><p class="large-copy">${e(p.bio)}</p><div class="person-links">${personLinks(p)}</div></div></section>${pubs.length?`<section class="wrap recent"><div class="section-heading"><h2>Selected publications.</h2>${link('/publications/','All publications')}</div>${pubs.map(x=>paper(x,true)).join('')}</section>`:''}`,{'@context':'https://schema.org','@type':'Person',name:p.name,jobTitle:p.role,description:p.bio,image:base+p.image,url:base+'/people/'+p.id+'/',affiliation:{'@type':'ResearchOrganization',name:d.lab.full_name},...(p.website?{sameAs:[p.website]}:{})});
}
await page('/publications/','Publications','Explore publications and preprints from the Mendels Research Group, with links to papers, code, and research data.',`${intro('Publications','Ideas, in print.','Selected work from the group on molecular dynamics, free-energy engineering, machine learning, and materials.')}<section class="wrap publication-library" aria-label="Publication library"><form class="filters" role="search" id="paper-filter"><div class="search-field"><label for="paper-search">Search publications</label><input id="paper-search" name="q" type="search" placeholder="Title, author, or topic…" autocomplete="off"></div><div class="year-field"><label for="paper-year">Publication year</label><select id="paper-year" name="year"><option value="all">All years</option>${years.map(y=>`<option value="${y}">${y}</option>`).join('')}</select></div></form><p class="result-count" id="paper-count" role="status">${publications.length} publications</p><div id="paper-list">${publications.map(p=>paper(p)).join('')}</div><p id="paper-empty" class="empty" hidden>No publications match your search. Try another keyword or year.</p></section>`,{'@context':'https://schema.org','@type':'CollectionPage',name:'Publications — '+d.lab.name,url:base+'/publications/',mainEntity:{'@type':'ItemList',itemListElement:publications.map((p,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'ScholarlyArticle',name:p.title,datePublished:String(p.year),url:p.url,author:p.authors.split(',').map(name=>({'@type':'Person',name:name.trim()}))}}))}},publications.map(p=>p.title+' '+p.authors+' '+p.year).join(' '));
await page('/software/','Software',d.software.introduction,`${intro('Open research',d.software.title,d.software.introduction)}<section class="wrap software-list">${d.software.projects.map((p,i)=>`<article class="software-row"><span class="area-number">${String(i+1).padStart(2,'0')}</span><div><p class="eyebrow">${e(p.category)}</p><h2>${e(p.name)}</h2><p>${e(p.description)}</p></div>${link(p.url,'View repository')}</article>`).join('')}<div class="software-end">${link(d.lab.github,'Explore the GitHub organization','button')}</div></section>`,organization,d.software.projects.map(p=>p.name+' '+p.description).join(' '));
await page('/join/','Join us',d.positions.introduction,`${intro('Opportunities',d.positions.title,d.positions.introduction)}<section class="wrap join-content"><div><p class="eyebrow">${e(d.positions.subtitle)}</p><h2>Science thrives on different perspectives.</h2><p class="large-copy">${e(d.positions.details)}</p><div class="tags">${chips(d.positions.backgrounds)}</div>${link('mailto:'+d.lab.email+'?subject=Research%20opportunities%20at%20CME%20Lab',d.positions.contact_label,'button')}</div><aside class="contact-panel"><p class="eyebrow">Get in touch</p><h3>Dr. Dan Mendels</h3><p>${e(d.lab.department)}<br>${e(d.lab.institution)}<br>${e(d.lab.location)}</p>${link('mailto:'+d.lab.email,d.lab.email)}</aside></section><figure class="wrap join-photo"><img src="${e(d.lab.group_photo)}" width="2040" height="1530" alt="The CME group at the Technion" loading="lazy"><figcaption>${e(d.lab.group_photo_caption)}</figcaption></figure>`);
await page('/search/','Search','Search people, publications, research, and software from the Computational Molecular Engineering Lab.',`${intro('Find your way','Search the lab.','Find a researcher, a paper, a method, or a research direction.')}<section class="wrap site-search"><form role="search" id="site-search-form"><label for="site-query">Search the website</label><div class="site-search-input"><input type="search" id="site-query" name="q" placeholder="Try “peptide”, “Dan”, or “free energy”" autocomplete="off"><button class="button" type="submit">Search</button></div></form><p id="site-count" class="result-count" role="status">Enter a keyword to explore the site.</p><div id="site-results"></div><noscript><p>Site search needs JavaScript. You can browse <a href="/people/">people</a>, <a href="/research/">research</a>, and the full <a href="/publications/">publication list</a> directly.</p></noscript></section>`);
// A summary block in YAML automatically creates a paper's own page.
for (const p of publications.filter(p=>p.summary)) {
  const s=p.summary;
  await page('/publications/'+p.id+'/',p.title,s.question,`<div class="wrap breadcrumb"><a href="/publications/">Publications</a><span aria-hidden="true"> / </span>${p.year}</div>${intro('Research summary / '+p.year,s.headline,s.question)}<article class="wrap paper-story"><p class="label">${e(p.venue)} · ${e(p.type)}</p><h2 class="story-paper-title">${e(p.title)}</h2><p class="story-meta">${e(p.authors)}</p><div class="paper-links">${link(p.url,p.type==='Preprint'?'Read the preprint':'Read the paper')}${p.code?link(p.code,'Code & data'):''}</div><h2>The approach</h2><p>${e(s.approach)}</p><h2>What we found</h2><p>${e(s.finding)}</p><h2>Why it matters</h2><p>${e(s.significance)}</p><p class="story-note">A short overview of the research. For methods, evidence, and limitations, see the <a href="${e(s.source)}">source paper</a>.</p><div class="story-nav">${link('/publications/','Back to publications')}</div></article>`,{'@context':'https://schema.org','@type':'WebPage',name:s.headline,description:s.question,url:base+'/publications/'+p.id+'/',about:{'@type':'ScholarlyArticle',name:p.title,url:p.url,datePublished:String(p.year),author:p.authors.split(',').map(name=>({'@type':'Person',name:name.trim()}))}},p.authors+' '+s.approach+' '+s.finding);
}
// Add older bibliography entries to search independently.
for (const p of publications.filter(p=>!p.summary)) searchIndex.push({title:p.title,url:'/publications/#'+p.id,category:'Publication · '+p.year,text:p.authors+' '+p.venue+' '+p.title});
for (const area of d.research.areas) searchIndex.push({title:area.title,url:'/research/#'+area.id,category:'Research',text:area.description+' '+area.topics.join(' ')});
await writeFile(resolve(out,'search-index.json'),json(searchIndex));
const urls = pages.map(p=>p[0]).concat(d.people.map(p=>'/people/'+p.id+'/'),publications.filter(p=>p.summary).map(p=>'/publications/'+p.id+'/'),'/search/');
await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(p=>`<url><loc>${e(base+p)}</loc></url>`).join('')}</urlset>`);
await writeFile(resolve(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
await writeFile(resolve(out,'.nojekyll'),'');
await page('/404/','Page not found','Find your way back to the CME Lab website.',`${intro('404 / Page not found','A different direction.','The page you are looking for may have moved. Explore the lab or search for what you need.')}<div class="wrap error-actions">${link('/','Return home','button')}${link('/search/','Search the site')}</div>`);
await cp(resolve(out,'404/index.html'),resolve(out,'404.html'));
console.log(`Built ${urls.length+1} pages, ${d.people.length} people, and ${publications.length} publications from content/lab.yml.`);


