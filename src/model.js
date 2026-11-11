export const COLORS = { JavaScript:'#d7b84a', TypeScript:'#658ba1', Python:'#7c9563', HTML:'#d47b5e', CSS:'#9b83ad', Rust:'#b58c6d', Go:'#69a2a0', Shell:'#8b9b70', Vue:'#6c9b86', Ruby:'#c46e68', Java:'#b1916d', 'C++':'#a6819d' };
export const colorFor = language => COLORS[language] || '#8b9484';
export const validUsername = name => /^(?!-)[a-z\d-]{1,39}(?<!-)$/i.test(name) && !name.includes('--');
export function summarize(repos) {
  const originals = repos.filter(repo => !repo.fork);
  const counts = new Map();
  originals.forEach(repo => { if (repo.language) counts.set(repo.language, (counts.get(repo.language) || 0) + 1); });
  const languages = [...counts].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
  const classified = languages.reduce((sum,[,count]) => sum+count,0);
  return { originals: originals.length, stars: originals.reduce((sum,r) => sum+r.stargazers_count,0), languages, classified };
}
export function filterRepos(repos, { query='', language='', forks=false, sort='stars' }={}) {
  const needle = query.trim().toLowerCase();
  return repos.filter(repo => (forks || !repo.fork) && (!language || repo.language===language) && `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase().includes(needle))
    .sort((a,b) => sort==='name' ? a.name.localeCompare(b.name) : sort==='updated' ? Date.parse(b.pushed_at)-Date.parse(a.pushed_at) : b.stargazers_count-a.stargazers_count || a.name.localeCompare(b.name));
}
export function activityDays(events, now=new Date()) {
  const today = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const days = Array.from({length:30},(_,i) => ({date:new Date(today-(29-i)*86400000).toISOString().slice(0,10),count:0}));
  const byDate = new Map(days.map(day => [day.date,day]));
  events.forEach(event => { const day=byDate.get(String(event.created_at).slice(0,10)); if(day) day.count++; });
  return days;
}
