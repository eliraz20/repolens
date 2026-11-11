const cache = new Map();
const TTL = 5*60*1000;
export async function loadProfile(username, {signal, fetcher=fetch}={}) {
  const key=username.toLowerCase();
  const cached=cache.get(key);
  if (cached && Date.now()-cached.time<TTL && fetcher===fetch) return cached.data;
  async function get(path) {
    const response=await fetcher(`https://api.github.com${path}`, {signal, headers:{Accept:'application/vnd.github+json'}});
    if(!response.ok) {
      if(response.status===404) throw new Error('That profile could not be found. Check the username and try again.');
      if(response.status===403 || response.status===429) {
        const reset=Number(response.headers.get('x-ratelimit-reset'));
        const when=reset ? ` Try again after ${new Date(reset*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}.` : ' Please try again later.';
        throw new Error(`GitHub is limiting requests from this connection.${when}`);
      }
      throw new Error(`GitHub returned an error (${response.status}). Please try again.`);
    }
    return response.json();
  }
  const name=encodeURIComponent(username);
  const user=await get(`/users/${name}`);
  const repos=[];
  let repositoriesTruncated=false;
  // Cap large accounts at 1,000 repositories to respect unauthenticated quotas.
  for(let page=1;page<=10;page++) {
    const batch=await get(`/users/${name}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
    repos.push(...batch);
    if(batch.length<100) break;
    if(page===10) repositoriesTruncated=true;
  }
  let events=[], activityAvailable=true, eventsTruncated=false;
  try {
    // GitHub's public events feed is bounded; never present it as a contribution graph.
    for(let page=1;page<=3;page++) {
      const batch=await get(`/users/${name}/events/public?per_page=100&page=${page}`);
      events.push(...batch);
      if(batch.length<100) break;
      if(page===3) eventsTruncated=true;
    }
  } catch(error) {
    if(signal?.aborted) throw error;
    activityAvailable=false;
    events=[];
  }
  const data={user,repos,events,activityAvailable,repositoriesTruncated,eventsTruncated,demo:false};
  if(fetcher===fetch) cache.set(key,{time:Date.now(),data});
  return data;
}
