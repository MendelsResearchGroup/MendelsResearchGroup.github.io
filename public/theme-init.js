// Apply URL-selected design and saved/system theme before styles render.
(() => {
  const prefixes={fieldnotes:'/fieldnotes',academic:'/classic/academic',institute:'/classic/institute',review:'/classic/review',handbook:'/classic/handbook',contemporary:'/contemporary'};
  const designs={studio:'studio',editorial:'editorial',atlas:'atlas',fieldnotes:'fieldnotes',academic:'academic',institute:'institute',review:'review',handbook:'handbook',contemporary:'contemporary',1:'studio',2:'editorial',3:'atlas',4:'fieldnotes'};
  const requested=new URLSearchParams(location.search).get('design');
  const chosen=Object.hasOwn(designs,requested)?designs[requested]:null;
  const modern=location.pathname.startsWith('/modern/');
  const modernDesigns=['studio','editorial','atlas'];
  const current=Object.keys(prefixes).find(id=>location.pathname.startsWith(prefixes[id]+'/'))||(modern?'modern':null);
  const canonical=current?location.pathname.slice(current==='modern'?7:prefixes[current].length):location.pathname;
  const chosenPrefix=modernDesigns.includes(chosen)?'modern':chosen;
  if(chosen&&current!==chosenPrefix){
    const target=new URL(location.href);target.pathname=(modernDesigns.includes(chosen)?'/modern':prefixes[chosen])+canonical;target.searchParams.delete('design');if(modernDesigns.includes(chosen))target.searchParams.set('design',chosen);
    location.replace(target.href);return;
  }
  const selected=modern?(modernDesigns.includes(chosen)?chosen:'studio'):current;
  document.documentElement.dataset.design=selected||'contemporary';
  if(current){
    document.documentElement.dataset.designPreview='true';
    const robots=document.querySelector('meta[name="robots"]')||document.head.appendChild(document.createElement('meta'));
    robots.name='robots';robots.content='noindex, follow';
  }
  let preference;
  try { preference=localStorage.getItem('cme-theme'); } catch {}
  const dark=preference==='dark'||(preference!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
})();
