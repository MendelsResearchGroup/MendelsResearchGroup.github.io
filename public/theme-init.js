// Apply URL-selected design and saved/system theme before styles render.
(() => {
  const prefixes={fieldnotes:'/fieldnotes',academic:'/classic/academic',institute:'/classic/institute',review:'/classic/review',handbook:'/classic/handbook',contemporary:'/contemporary'};
  const designs={studio:'studio',editorial:'editorial',atlas:'atlas',fieldnotes:'fieldnotes',academic:'academic',institute:'institute',review:'review',handbook:'handbook',contemporary:'contemporary',1:'studio',2:'editorial',3:'atlas',4:'fieldnotes'};
  const requested=new URLSearchParams(location.search).get('design');
  const chosen=Object.hasOwn(designs,requested)?designs[requested]:null;
  const current=Object.keys(prefixes).find(id=>location.pathname.startsWith(prefixes[id]+'/'))||null;
  const canonical=current?location.pathname.slice(prefixes[current].length):location.pathname;
  if(chosen&&current!==(Object.hasOwn(prefixes,chosen)?chosen:null)){
    const target=new URL(location.href);target.pathname=(prefixes[chosen]||'')+canonical;target.searchParams.delete('design');if(!Object.hasOwn(prefixes,chosen))target.searchParams.set('design',chosen);
    location.replace(target.href);return;
  }
  const selected=current||chosen;
  document.documentElement.dataset.design=selected||'studio';
  if(selected){
    document.documentElement.dataset.designPreview='true';
    const robots=document.querySelector('meta[name="robots"]')||document.head.appendChild(document.createElement('meta'));
    robots.name='robots';robots.content='noindex, follow';
  }
  let preference;
  try { preference=localStorage.getItem('cme-theme'); } catch {}
  const dark=preference==='dark'||(preference!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
})();
