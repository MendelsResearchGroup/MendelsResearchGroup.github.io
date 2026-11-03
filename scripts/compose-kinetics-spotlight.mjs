// Present two original paper panels together without changing their scientific
// content. Cropping and positioning are expressed in SVG; source JPEGs stay intact.
import {readFile,writeFile} from 'node:fs/promises';
const assets=new URL('../public/assets/papers/',import.meta.url);
const molecule=(await readFile(new URL('peptide-kinetics-2026.jpg',assets))).toString('base64');
const scatter=(await readFile(new URL('peptide-kinetics-2026-scatter-source.jpg',assets))).toString('base64');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" role="img" aria-labelledby="title desc">
  <title id="title">Chignolin structure and mutation-dependent unfolding kinetics</title>
  <desc id="desc">Panels from Figures 1a and 2a of Guiding Peptide Kinetics via Collective-Variable Tuning of Free-Energy Barriers. Left: the chignolin structure with backbone-distance descriptors. Right: wild-type residue importance versus mutation-dependent changes in unfolding time. The panels are excerpted and arranged side by side; the original scientific data and axes are unchanged.</desc>
  <rect width="1200" height="600" fill="white"/>
  <defs>
    <clipPath id="chignolin-panel"><rect width="260" height="318"/></clipPath>
    <clipPath id="scatter-panel"><rect width="347" height="229"/></clipPath>
  </defs>
  <g fill="#233642" font-family="Arial, sans-serif" font-size="28">
    <text x="178" y="32" text-anchor="middle">Chignolin</text>
    <text x="365" y="32">Mutation-dependent unfolding</text>
  </g>
  <g transform="translate(12 105) scale(1.28)">
    <g clip-path="url(#chignolin-panel)"><image width="666" height="346" href="data:image/jpeg;base64,${molecule}"/></g>
  </g>
  <g transform="translate(365 44) scale(2.35)">
    <g clip-path="url(#scatter-panel)"><image width="700" height="243" href="data:image/jpeg;base64,${scatter}"/></g>
  </g>
</svg>`;
await writeFile(new URL('peptide-kinetics-2026-spotlight.svg',assets),svg);
