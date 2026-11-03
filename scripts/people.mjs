const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const currentPeople=people=>people.filter(p=>p.status!=='alumni');
export function alumniSection(people,route=path=>path){
  const alumni=people.filter(p=>p.status==='alumni');
  if(!alumni.length)return '';
  const row=p=>{
    const links=(p.website?`<a href="${e(p.website)}">${e(p.website_label||'Personal website')}</a>`:'')+(p.orcid?`<a href="${e(p.orcid)}">ORCID</a>`:'');
    return `<li class="alumni-entry" role="listitem" id="${e(p.id)}"><div><h3><a href="${e(route('/people/'+p.id+'/'))}">${e(p.name)}</a></h3><p class="alumni-role">${e(p.role)}</p></div>${links?`<div class="alumni-links">${links}</div>`:''}</li>`;
  };
  return `<section class="alumni-section" id="alumni" aria-labelledby="alumni-heading"><h2 id="alumni-heading">Alumni</h2><ul class="alumni-list" role="list">${alumni.map(row).join('')}</ul></section>`;
}
