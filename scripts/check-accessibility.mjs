import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../public/layout.css',import.meta.url),'utf8');
const themes=await readFile(new URL('../public/themes.css',import.meta.url),'utf8');
const variables=block=>Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)].map(m=>[m[1],m[2]]));
const palette={...variables(css.match(/:root\s*\{([^}]+)/)[1]),...variables(themes.match(/:root\s*\{([^}]+)/)[1])};
const dark={...palette,...variables(themes.match(/html\[data-theme='dark'\]\s*\{([^}]+)/)[1])};
function luminance(hex){
  let value=hex.slice(1);if(value.length===3)value=[...value].map(c=>c+c).join('');
  const rgb=[0,2,4].map(i=>parseInt(value.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const failures=[];
for(const [name,p]of [['light',palette],['dark',dark]]){
  const pairs=[];
  for(const foreground of ['ink','muted','teal','blue'])for(const background of ['paper','wash'])pairs.push([foreground+'/'+background,p[foreground],p[background],4.5]);
  pairs.push(['button',p['button-text'],p['button-bg'],4.5],['button hover',p.paper,p.teal,4.5],['focus',p.focus,p.paper,3],['field border',p['field-border'],p.paper,3]);
  for(const [label,foreground,background,minimum]of pairs){const ratio=contrast(foreground,background);if(ratio<minimum)failures.push(`${name} ${label}: ${ratio.toFixed(2)}:1 is below ${minimum}:1`);}
  console.log(`${name}: minimum palette text contrast ${Math.min(...pairs.filter(x=>x[3]===4.5).map(x=>contrast(x[1],x[2]))).toFixed(2)}:1`);
}
for(const color of ['#ffffff','#e0ebf2','#9de5e0'])if(contrast(color,'#123a5b')<4.5)failures.push('Join banner contrast');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Palette text, control borders, and focus indicators meet the checked WCAG AA contrast thresholds. Browser and assistive-technology checks are still separate.');
