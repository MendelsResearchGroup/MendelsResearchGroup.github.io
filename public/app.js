const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#primary-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu?.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');menu.focus();}});
const normalize=value=>value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const params=new URLSearchParams(location.search);
const filterForm=document.querySelector('#paper-filter');
if(filterForm){
  const query=document.querySelector('#paper-search'),year=document.querySelector('#paper-year'),papers=[...document.querySelectorAll('#paper-list .paper')];
  query.value=params.get('q')||'';
  if([...year.options].some(o=>o.value===params.get('year')))year.value=params.get('year');
  function filter(){
    const terms=normalize(query.value).split(' ').filter(Boolean);let visible=0;
    for(const paper of papers){const match=(year.value==='all'||paper.dataset.year===year.value)&&terms.every(t=>normalize(paper.textContent).includes(t));paper.hidden=!match;if(match)visible++;}
    document.querySelector('#paper-count').textContent=`${visible} publication${visible===1?'':'s'}`;
    document.querySelector('#paper-empty').hidden=visible>0;
    const url=new URL(location.href);url.searchParams.delete('q');url.searchParams.delete('year');if(query.value)url.searchParams.set('q',query.value);if(year.value!=='all')url.searchParams.set('year',year.value);history.replaceState(null,'',url);
  }
  query.addEventListener('input',filter);year.addEventListener('change',filter);filterForm.addEventListener('submit',event=>{event.preventDefault();filter();});filter();
}
const siteForm=document.querySelector('#site-search-form');
if(siteForm){
  const input=document.querySelector('#site-query'),results=document.querySelector('#site-results'),count=document.querySelector('#site-count');let indexPromise;
  input.value=params.get('q')||'';
  async function search(){
    const raw=input.value.trim(),terms=normalize(raw).split(' ').filter(Boolean);
    const url=new URL(location.href);url.searchParams.delete('q');if(raw)url.searchParams.set('q',raw);history.replaceState(null,'',url);
    results.replaceChildren();if(!terms.length){count.textContent='Enter a keyword to explore the site.';return;}
    try {
      indexPromise ||= fetch('/search-index.json').then(r=>{if(!r.ok)throw new Error('search unavailable');return r.json();});
      const data=await indexPromise;
      if(input.value.trim()!==raw)return;
      const matches=data.filter(x=>terms.every(term=>normalize(x.title+' '+x.text).includes(term))).sort((a,b)=>Number(terms.every(t=>normalize(b.title).includes(t)))-Number(terms.every(t=>normalize(a.title).includes(t))));
      count.textContent=`${matches.length} result${matches.length===1?'':'s'} for “${raw}”`;
      for(const match of matches){const article=document.createElement('article'),label=document.createElement('p'),heading=document.createElement('h2'),a=document.createElement('a'),description=document.createElement('p');article.className='search-result';label.className='label';label.textContent=match.category;a.href=match.url;a.textContent=match.title;heading.append(a);description.textContent=match.text.length>210?match.text.slice(0,210)+'…':match.text;article.append(label,heading,description);results.append(article);}
      if(!matches.length){const p=document.createElement('p');p.textContent='No results. Try a researcher’s name, a shorter phrase, or a related method.';results.append(p);}
    } catch {indexPromise=undefined;count.textContent='Search is temporarily unavailable. Please use the navigation links to explore the site.';}
  }
  siteForm.addEventListener('submit',event=>{event.preventDefault();search();});if(input.value)search();
}
