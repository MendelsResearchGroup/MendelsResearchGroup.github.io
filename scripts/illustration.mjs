import { writeFile } from 'node:fs/promises';
const paths=[];
for(let k=0;k<17;k++){
  const r=55+k*10.2;let path='';
  for(let i=0;i<=220;i++){
    const t=i/220*Math.PI*2;
    const radius=r*(1+.17*Math.cos(2*t)+.055*Math.sin(3*t+k*.06));
    const x=302+radius*Math.cos(t)+24*Math.sin(t)*Math.sin(t),y=271+radius*.88*Math.sin(t);
    path+=(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);
  }
  paths.push(`<path d="${path}Z" fill="none" stroke="${k%3===0?'#279caa':'#3486a4'}" stroke-width="${k%4===0?'1.3':'.7'}" opacity="${.45+k*.026}"/>`);
}
for(const [cx,cy] of [[236,304],[364,233]])for(let k=0;k<5;k++){
  const r=12+k*10;paths.push(`<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*.73}" transform="rotate(-26 ${cx} ${cy})" fill="none" stroke="#087d89" opacity=".58" stroke-width=".8"/>`);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="580" viewBox="0 0 600 580"><defs><radialGradient id="wash"><stop stop-color="#cee7e0"/><stop offset="1" stop-color="#eef3ec" stop-opacity="0"/></radialGradient><pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" stroke="#cddbd5" stroke-width=".6" fill="none"/></pattern><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="m0 0 6 3.5L0 7" fill="none" stroke="#123a5b" stroke-width="1"/></marker></defs><rect width="600" height="580" fill="#edf2eb"/><rect x="40" y="40" width="520" height="478" fill="url(#grid)"/><ellipse cx="300" cy="275" rx="280" ry="255" fill="url(#wash)"/>${paths.join('')}<path d="M234 307 C253 333 292 310 306 278S345 246 364 232" fill="none" stroke="#123a5b" stroke-width="2" stroke-dasharray="4 5" marker-end="url(#arrow)"/><circle cx="236" cy="304" r="5" fill="#123a5b"/><circle cx="364" cy="233" r="5" fill="#123a5b"/><g font-family="Georgia,serif" font-size="24" fill="#123a5b"><text x="205" y="342">A</text><text x="381" y="219">B</text></g><g font-family="Arial,sans-serif" font-size="9" letter-spacing="1.3" fill="#526b70"><text x="29" y="28">STRUCTURE → DYNAMICS → FUNCTION</text><text x="31" y="551">FREE-ENERGY LANDSCAPE</text><text x="486" y="551">CME / 01</text></g><path d="M55 486H107M55 486V435" fill="none" stroke="#123a5b" stroke-width="1"/><g font-family="Georgia,serif" font-style="italic" font-size="13" fill="#123a5b"><text x="112" y="491">q₁</text><text x="45" y="427">q₂</text></g></svg>`;
await writeFile(new URL('../public/assets/landscape.svg',import.meta.url),svg);
