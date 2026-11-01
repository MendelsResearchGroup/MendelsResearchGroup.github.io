const root=document.querySelector('[data-vote-endpoint]');
if(root){
  const endpoint=root.dataset.voteEndpoint,pollId=root.dataset.pollId,key='cme-design-vote:'+pollId;
  const form=document.querySelector('#design-vote-form'),fieldset=form.querySelector('fieldset'),submit=document.querySelector('#vote-submit'),status=document.querySelector('#vote-status'),retry=document.querySelector('#vote-retry'),results=document.querySelector('#vote-results'),show=document.querySelector('#vote-show-results'),refresh=document.querySelector('#vote-refresh-results');
  const names={studio:'Studio',editorial:'Editorial',atlas:'Atlas',fieldnotes:'Fieldnotes'};
  let record,storageAvailable=true,pending=false,revision=0;
  function readRecord(){try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&typeof saved.voterId==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(saved.voterId))return {voterId:saved.voterId,...(Object.hasOwn(names,saved.choice)?{choice:saved.choice}:{})};}catch{}return null;}
  function save(){try{localStorage.setItem(key,JSON.stringify(record));}catch{storageAvailable=false;}}
  record=readRecord()||{voterId:crypto.randomUUID()};save();
  function validSummary(data){return data?.pollId===pollId&&Number.isSafeInteger(data.total)&&data.total>=0&&Object.keys(names).every(id=>Number.isSafeInteger(data.counts?.[id])&&data.counts[id]>=0)&&Object.values(data.counts).reduce((a,b)=>a+b,0)===data.total;}
  async function call(options){let response;try{response=await fetch(endpoint,{...options,mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});}catch(error){throw new Error(error.name==='TimeoutError'?'The vote counter took too long to respond. Please try again; a retry will not count twice.':'Could not reach the vote counter. Please try again; a retry will not count twice.');}let data;try{data=await response.json();}catch{throw new Error('Voting is temporarily unavailable. Please try again.');}if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'Voting is temporarily unavailable. Please try again.');if(!validSummary(data))throw new Error('The vote counter could not be verified. Please try again.');return data;}
  function renderResults(data){
    document.querySelector('#vote-total').textContent=`${data.total} vote${data.total===1?'':'s'} submitted`;
    for(const [id] of Object.entries(names)){const count=data.counts[id],percent=data.total?Math.round(count/data.total*100):0,row=root.querySelector(`[data-vote-choice="${id}"]`);row.querySelector('.ballot-count').textContent=`${count} vote${count===1?'':'s'} · ${percent}%`;row.querySelector('.ballot-bar span').style.width=percent+'%';}
    results.hidden=false;show.hidden=true;refresh.hidden=false;
  }
  function rememberChoice(choice){revision++;record.choice=choice;save();form.hidden=true;retry.hidden=true;status.textContent=`You voted for ${names[choice]}. Thank you!`+(storageAvailable?' Your vote is saved in this browser.':' Your vote was counted, but this browser cannot save the reminder.');}
  async function initialize(){
    retry.hidden=true;form.hidden=true;show.hidden=true;
    if(record.choice)rememberChoice(record.choice);else status.textContent='Connecting to the ballot…';
    const requestedRevision=revision;
    try{const data=await call();if(requestedRevision!==revision)return;if(record.choice){rememberChoice(record.choice);renderResults(data);}else if(!data.open){status.textContent='Voting has closed. Thank you for helping us choose.';renderResults(data);}else{status.textContent=storageAvailable?'':'This browser cannot save a voting reminder. Your vote can still be counted.';form.hidden=false;show.hidden=false;}}
    catch(error){if(requestedRevision!==revision)return;status.textContent=record.choice?`Your vote for ${names[record.choice]} is saved in this browser. Results are temporarily unavailable.`:error.message;retry.hidden=false;}
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;
    const saved=readRecord();if(saved)record=saved;if(saved?.choice){rememberChoice(saved.choice);initialize();return;}
    const choice=new FormData(form).get('design');if(!Object.hasOwn(names,choice))return;
    pending=true;fieldset.disabled=true;submit.disabled=true;submit.textContent='Submitting…';status.textContent='Submitting your vote…';
    try{const data=await call({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId,voterId:record.voterId,choice})});if(!Object.hasOwn(names,data.choice))throw new Error('Your vote could not be confirmed. Please try again.');rememberChoice(data.choice);renderResults(data);}
    catch(error){status.textContent=error.name==='TimeoutError'?'The counter took too long to respond. Please try again; a retry will not count twice.':error.message;}
    finally{pending=false;fieldset.disabled=false;submit.disabled=false;submit.textContent='Submit vote';}
  });
  retry.addEventListener('click',initialize);
  async function reveal(){if(pending)return;const requestedRevision=revision;show.disabled=true;refresh.disabled=true;try{const data=await call();if(requestedRevision!==revision)return;renderResults(data);if(!record.choice)status.textContent='Current results loaded. You can still choose a design below.';}catch{if(requestedRevision===revision)status.textContent='Results are temporarily unavailable. Please try again.';}finally{show.disabled=false;refresh.disabled=false;}}
  show.addEventListener('click',reveal);refresh.addEventListener('click',reveal);
  window.addEventListener('storage',event=>{if(event.key===key){const saved=readRecord();if(saved?.choice){record=saved;rememberChoice(saved.choice);initialize();}}});
  initialize();
}
