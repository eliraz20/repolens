import {loadProfile} from './api.js';
import {demoProfile} from './demo.js';
import {summarize,filterRepos,activityDays,colorFor,validUsername} from './model.js';
const $=id => document.getElementById(id);
const number=new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1});
const escape=value => String(value??'').replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl=value => {try { const url=new URL(value); return url.protocol==='https:' ? url.href : '#'; } catch {return '#';}};
const external='target="_blank" rel="noopener noreferrer"';
let current,controller,request=0;
function announce(message='') { $('status').textContent=message; $('status').classList.toggle('visible',!!message); }
function render(data) {
  current=data;
  const {user,repos,demo}=data;
  const summary=summarize(repos);
  $('data-label').textContent=demo?'SAMPLE PROFILE · FICTIONAL DATA':`PUBLIC PROFILE · @${user.login}`;
  $('demo-button').hidden=demo;
  const initials=(user.name || user.login).split(/\s+/).slice(0,2).map(word => word[0]).join('');
  $('profile').innerHTML=`${demo?`<div class="avatar" aria-hidden="true">${escape(initials)}</div>`:`<img class="avatar" src="${escape(safeUrl(user.avatar_url))}" alt="" width="63" height="63" referrerpolicy="no-referrer">`}<h2>${escape(user.name || user.login)}</h2><p class="handle">@${escape(user.login)}</p><p class="bio">${escape(user.bio || 'A work in progress. Explore the repositories below.')}</p><div class="profile-meta">${user.location?`<span>⌖ ${escape(user.location)}</span>`:''}<span>◌ ${number.format(user.followers)} followers · ${number.format(user.following)} following</span><span>↳ Joined ${new Date(user.created_at).getUTCFullYear()}</span></div><a class="profile-link" href="${escape(safeUrl(user.html_url))}" ${external}>${demo?'Explore GitHub':'View on GitHub'} <span aria-hidden="true">↗</span></a>`;
  const values=[['Original repos',summary.originals,'In the loaded collection','↗'],['Stars earned',summary.stars,'Across original repositories','☆'],['Languages',summary.languages.length,'Primary repository languages','⌘']];
  $('stats').innerHTML=values.map(([label,value,note,icon]) => `<div class="stat"><div class="stat-label">${label}<span aria-hidden="true">${icon}</span></div><div class="stat-value">${number.format(value)}</div><div class="stat-note">${note}</div></div>`).join('');
  $('languages').innerHTML=summary.languages.length?`<div class="language-bar" aria-hidden="true">${summary.languages.map(([lang,count]) => `<span style="width:${count/summary.classified*100}%;background:${colorFor(lang)}"></span>`).join('')}</div><div class="language-list">${summary.languages.map(([lang,count]) => `<div class="language-item"><span class="dot" style="background:${colorFor(lang)}"></span><b>${escape(lang)}</b><span>${Math.round(count/summary.classified*100)}%</span></div>`).join('')}</div>`:'<p class="bio">No primary languages reported for original repositories.</p>';
  const days=activityDays(data.events), max=Math.max(1,...days.map(day => day.count)), total=days.reduce((sum,day) => sum+day.count,0);
  $('activity').innerHTML=data.activityAvailable?`<div class="activity-summary"><strong>${total}</strong> events in the fetched public feed</div><div class="bar-chart" role="img" aria-label="${total} public events over the last 30 days. ${data.eventsTruncated?'Feed capped at 300 events.':''}">${days.map(day => `<div class="day-bar ${day.count?'':'zero'}" style="--height:${Math.max(5,day.count/max*100)}%" title="${day.date}: ${day.count} events"></div>`).join('')}</div><div class="chart-dates"><span>${days[0].date.slice(5)}</span><span>${data.eventsTruncated?'Latest 300 events · ':''}Today</span></div>`:'<p class="bio">Activity is unavailable right now. Repository data is ready to explore.</p>';
  const langs=[...new Set(repos.map(repo => repo.language).filter(Boolean))].sort();
  $('language-filter').innerHTML='<option value="">All languages</option>'+langs.map(lang => `<option>${escape(lang)}</option>`).join('');
  $('repo-search').value=''; $('show-forks').checked=false;
  $('scope-note').textContent=demo?'You’re exploring a fictional sample. Enter a GitHub username above to see real projects.':`${repos.length} public repositories loaded${data.repositoriesTruncated?' (limited to the 1,000 most recently pushed; summary totals cover this subset)':''}. Language shares count original repos with a reported primary language, not lines of code. Activity shows public events, not contributions.`;
  renderRepos();
}
function renderRepos() {
  const list=filterRepos(current.repos,{query:$('repo-search').value,language:$('language-filter').value,forks:$('show-forks').checked,sort:$('sort').value});
  $('repo-count').textContent=list.length;
  $('repos').innerHTML=list.length ? list.map(repo => `<article class="repo-card"><div class="repo-top"><h3><a href="${escape(safeUrl(repo.html_url))}" ${external}>${escape(repo.name)}</a></h3><span aria-hidden="true">↗</span></div><p>${escape(repo.description || 'No description yet. Sometimes the code speaks for itself.')}</p><div class="repo-tags">${repo.fork?'<span class="tag">fork</span>':''}${repo.archived?'<span class="tag">archived</span>':''}${(repo.topics || []).slice(0,3).map(topic => `<span class="tag">${escape(topic)}</span>`).join('')}</div><div class="repo-bottom"><span class="repo-lang"><span class="dot" style="background:${colorFor(repo.language)}"></span>${escape(repo.language || 'Unspecified')}</span><span aria-label="${repo.stargazers_count} stars">☆ ${number.format(repo.stargazers_count)}</span><span aria-label="${repo.forks_count} forks">⑂ ${number.format(repo.forks_count)}</span></div><div class="repo-updated">Pushed ${repo.pushed_at?new Date(repo.pushed_at).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'date unavailable'}</div></article>`).join(''):'<div class="empty">No repositories match these filters. Try another language or include forks.</div>';
}
async function explore(name,{updateUrl=true}={}) {
  name=name.trim();
  if(!validUsername(name)) {announce('Enter a GitHub username using letters, numbers, and single hyphens (up to 39 characters).'); return;}
  controller?.abort(); controller=new AbortController();
  const id=++request, activeController=controller;
  const timer=setTimeout(() => activeController.abort('timeout'),30000);
  $('explore').disabled=true; $('explore').textContent='Looking…'; $('dashboard').setAttribute('aria-busy','true'); announce(`Looking through @${name}’s public work…`);
  try {
    const data=await loadProfile(name,{signal:activeController.signal});
    if(id!==request) return;
    render(data); $('username').value=data.user.login;
    if(updateUrl) {const url=new URL(location.href);url.searchParams.set('user',data.user.login);history.pushState({},'',url);}
    announce(`Profile loaded: @${data.user.login}. ${data.repos.length} repositories ready to explore.${data.activityAvailable?'':' Activity could not be loaded.'}`);
  } catch(error) {
    if(id!==request) return;
    announce(activeController.signal.aborted?'The request took too long. Please try again.':error instanceof TypeError?'Could not reach GitHub. Check your connection and try again.':error.message);
  } finally {
    clearTimeout(timer);
    if(id===request) {$('explore').disabled=false; $('explore').innerHTML='Explore <span aria-hidden="true">↗</span>'; $('dashboard').removeAttribute('aria-busy');}
  }
}
function showDemo({updateUrl=true}={}) {
  request++;controller?.abort();render(demoProfile());$('username').value='';$('explore').disabled=false;$('explore').innerHTML='Explore <span aria-hidden="true">↗</span>';$('dashboard').removeAttribute('aria-busy');announce();
  if(updateUrl) {const url=new URL(location.href);url.searchParams.delete('user');history.pushState({},'',url);}
}
$('lookup-form').addEventListener('submit',event => {event.preventDefault();explore($('username').value);});
for(const id of ['repo-search','language-filter','sort','show-forks']) $(id).addEventListener(id==='repo-search'?'input':'change',renderRepos);
$('demo-button').addEventListener('click',() => showDemo());
$('share-button').addEventListener('click',async () => {
  const url=new URL(location.href); if(current.demo) url.searchParams.delete('user');else url.searchParams.set('user',current.user.login);
  try {await navigator.clipboard.writeText(url.href);announce('Profile link copied. Share a little perspective.');} catch {announce(`Copy this profile link: ${url.href}`);}
});
$('export-button').addEventListener('click',() => {
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),...current},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`repolens-${current.demo?'demo':current.user.login}.json`;document.body.append(link);link.click();link.remove();setTimeout(() => URL.revokeObjectURL(url),1000);announce('Profile data exported as JSON.');
});
window.addEventListener('popstate',() => {const name=new URLSearchParams(location.search).get('user');if(name) explore(name,{updateUrl:false});else showDemo({updateUrl:false});});
render(demoProfile());
const initial=new URLSearchParams(location.search).get('user');if(initial){$('username').value=initial;explore(initial,{updateUrl:false});}
