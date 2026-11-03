const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tag = (name,value) => `<meta name="${name}" content="${escape(value)}">`;
const doiFor = paper => paper.doi || paper.url.match(/10\.\d{4,9}\/[^?#\s]+/)?.[0];
const plain = entity => { const {'@context':context,...rest}=entity; return rest; };

export function pageMetadata({data:d,base,path,title,description,entity}) {
  const canonical=base+path;
  const homeTitle=`${d.lab.name} | ${d.lab.group} | ${d.lab.institution.split('—')[0].trim()}`;
  const documentTitle=path==='/'?homeTitle:`${title} · ${d.lab.name}`;
  const indexable=!['/search/','/404/','/vote/'].includes(path);
  const labId=base+'/#lab', siteId=base+'/#website', pageId=canonical+'#webpage';
  const lab={'@type':'ResearchOrganization','@id':labId,name:d.lab.full_name,alternateName:[d.lab.name,d.lab.group],url:base+'/',logo:base+d.lab.logo,description:d.lab.description,email:d.lab.email,location:{'@type':'Place',name:d.lab.location},parentOrganization:{'@type':'CollegeOrUniversity',name:d.lab.institution},sameAs:[d.lab.original_site,d.lab.github]};
  const site={'@type':'WebSite','@id':siteId,url:base+'/',name:d.lab.name,alternateName:d.lab.group,publisher:{'@id':labId},inLanguage:'en'};
  let webPage={'@type':'WebPage','@id':pageId,url:canonical,name:documentTitle,description,isPartOf:{'@id':siteId},about:{'@id':labId},inLanguage:'en'};
  const graph=[lab,site];
  const paper=d.publications.find(p=>path===`/publications/${p.id}/`);
  const person=d.people.find(p=>path===`/people/${p.id}/`);
  let citation='';
  if(paper) {
    const articleId=canonical+'#paper',doi=doiFor(paper),o=paper.overview;
    const authors=paper.authors.split(',').map(value=>{
      const name=value.trim(),key=name.toLowerCase();
      const match=d.people.find(p=>key.includes(p.id==='sergey-shteingoltz'?'shteingolts':p.name.split(' ').at(-1).toLowerCase()));
      return {'@type':'Person',name,...(match?{url:base+`/people/${match.id}/`,...(match.orcid?{sameAs:[match.orcid]}:{})}:{})};
    });
    const article={'@type':'ScholarlyArticle','@id':articleId,name:paper.title,headline:paper.title,url:paper.url,mainEntityOfPage:{'@id':pageId},datePublished:paper.published||String(paper.year),author:authors,isPartOf:{'@type':paper.type==='Article'?'Periodical':'CreativeWorkSeries',name:paper.venue},...(doi?{identifier:{'@type':'PropertyValue',propertyID:'DOI',value:doi}}:{}),...(paper.preprint?{sameAs:[paper.preprint]}:{}),...(paper.code?{subjectOf:{'@type':'SoftwareSourceCode',codeRepository:paper.code}}:{})};
    if(o) {
      article.image={'@type':'ImageObject',contentUrl:base+o.figure.image,caption:o.figure.caption,creditText:o.figure.credit,license:o.figure.license_url,isBasedOn:o.figure.source};
      // A preprint abstract must not be represented as the final journal abstract.
      if(o.abstract_version==='Published article') article.abstract=o.abstract;
      webPage.isBasedOn=o.abstract_source;
    }
    graph.push(article);
    webPage.mainEntity={'@id':articleId};
    citation=tag('citation_title',paper.title)+paper.authors.split(',').map(name=>tag('citation_author',name.trim())).join('')+tag('citation_publication_date',paper.published?.replaceAll('-','/')||paper.year);
    if(paper.type==='Article')citation+=tag('citation_journal_title',paper.venue);
    if(doi)citation+=tag('citation_doi',doi);
    for(const [key,meta] of [['volume','citation_volume'],['issue','citation_issue'],['first_page','citation_firstpage'],['last_page','citation_lastpage']])if(paper[key])citation+=tag(meta,paper[key]);
    citation+=tag('citation_abstract_html_url',canonical);
  } else if(person) {
    const personId=canonical+'#person';
    const sameAs=[person.website,person.orcid].filter(Boolean);
    graph.push({'@type':'Person','@id':personId,name:person.name,description:person.bio,url:canonical,...(person.status==='alumni'?{alumniOf:{'@id':labId}}:{jobTitle:person.role,image:base+person.image,affiliation:{'@id':labId}}),...(sameAs.length?{sameAs}:{})});
    webPage['@type']='ProfilePage';
    webPage.mainEntity={'@id':personId};
  } else if(entity && entity['@type']!=='ResearchOrganization') {
    webPage={...webPage,...plain(entity),'@id':pageId,isPartOf:{'@id':siteId}};
  }
  graph.push(webPage);
  const socialImage=paper?.overview?base+paper.overview.figure.image:base+d.lab.logo;
  const verification=path==='/'&&d.lab.google_site_verification?tag('google-site-verification',d.lab.google_site_verification):'';
  const head=`<title>${escape(documentTitle)}</title>${tag('description',description)}<link rel="canonical" href="${escape(canonical)}">${indexable?'':tag('robots','noindex, follow')}${tag('theme-color','#123a5b')}<meta property="og:type" content="${paper?'article':'website'}"><meta property="og:site_name" content="${escape(d.lab.name)}"><meta property="og:title" content="${escape(documentTitle)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${escape(socialImage)}"><meta property="og:image:alt" content="${escape(paper?.overview?.figure.alt||d.lab.full_name)}">${tag('twitter:card','summary_large_image')}${citation}`;
  return {head:head+verification,structured:{'@context':'https://schema.org','@graph':graph},indexable};
}
