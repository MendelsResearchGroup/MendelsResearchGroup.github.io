// Apply URL-selected design and saved/system theme before styles render.
(() => {
  const designs={studio:'studio',editorial:'editorial',atlas:'atlas',1:'studio',2:'editorial',3:'atlas'};
  const requested=new URLSearchParams(location.search).get('design');
  const selected=Object.hasOwn(designs,requested)?designs[requested]:null;
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
