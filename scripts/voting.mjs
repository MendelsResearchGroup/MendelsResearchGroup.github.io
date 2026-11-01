const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const designs=[
  {id:'studio',name:'Studio',number:'01',description:'A contemporary research lab with clear typography and generous space.'},
  {id:'editorial',name:'Editorial',number:'02',description:'A warm, journal-inspired layout with serif headings and research stories.'},
  {id:'atlas',name:'Atlas',number:'03',description:'A technical, blue-led layout with a structured grid and framed modules.'},
  {id:'fieldnotes',name:'Fieldnotes',number:'04',description:'A question-led structure with side navigation and connected people, papers, and code.'},
];
export function votingBody(data){
  const v=data.voting;
  if(!v?.enabled)return '<section class="wrap page-intro"><p class="eyebrow">Design vote</p><h1>Voting is closed.</h1><p>Thank you for helping us choose the lab’s website.</p><a href="/">Return to the lab website</a></section>';
  const preview=id=>data.lab.site_url.replace(/\/$/,'')+(id==='fieldnotes'?'/fieldnotes/':'/?design='+id);
  return `<section class="wrap ballot" data-vote-endpoint="${e(v.endpoint)}" data-poll-id="${e(v.poll_id)}">
    <header class="ballot-heading"><p class="eyebrow">CME Lab / Design vote</p><h1>${e(v.title)}</h1><p>${e(v.introduction)}</p><p class="ballot-note">No sign-in. One vote per browser. Your choice is saved on this device.</p></header>
    <p id="vote-status" class="ballot-status" role="status">Connecting to the ballot…</p>
    <button id="vote-retry" class="button" type="button" hidden>Try again</button>
    <form id="design-vote-form" hidden><fieldset><legend>Which design would you choose for the lab?</legend><div class="ballot-options">${designs.map(d=>`<div class="ballot-option"><label for="vote-${d.id}"><input type="radio" name="design" id="vote-${d.id}" value="${d.id}" required><span><span class="ballot-number">${d.number}</span> ${d.name}</span></label><p>${d.description}</p><a href="${e(preview(d.id))}" data-design-choice-link target="_blank" rel="noopener" aria-label="Preview ${d.name} (opens in a new tab)">Preview ${d.name} <span aria-hidden="true">↗</span></a></div>`).join('')}</div></fieldset><button type="submit" class="button" id="vote-submit">Submit vote</button></form>
    <div class="ballot-result-actions"><button type="button" id="vote-show-results" hidden>See current results</button><button type="button" id="vote-refresh-results" hidden>Refresh results</button></div>
    <section id="vote-results" class="ballot-results" aria-labelledby="vote-results-title" hidden><h2 id="vote-results-title">Current results</h2><p id="vote-total"></p><ol>${designs.map(d=>`<li data-vote-choice="${d.id}"><div><strong>${d.number} / ${d.name}</strong><span class="ballot-count">0 votes</span></div><div class="ballot-bar" aria-hidden="true"><span></span></div></li>`).join('')}</ol></section>
    <p class="ballot-fineprint">This is a casual lab poll. Clearing browser storage or using another browser allows another vote. We don’t ask for a name or email address.</p>
    <noscript><p>Voting needs JavaScript to save your choice and send it to the shared counter. You can still open all four previews above.</p><style>.ballot-options{display:grid}#design-vote-form{display:block!important}#design-vote-form input,#vote-submit,#vote-status{display:none}</style></noscript>
  </section>`;
}
