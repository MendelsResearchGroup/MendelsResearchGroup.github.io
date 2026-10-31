// Apply the saved/system theme before styles render. Storage can be unavailable.
(() => {
  let preference;
  try { preference=localStorage.getItem('cme-theme'); } catch {}
  const dark=preference==='dark'||(preference!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
})();
