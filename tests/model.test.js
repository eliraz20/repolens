import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize,filterRepos,activityDays,validUsername} from '../src/model.js';
const repos=[
  {name:'alpha',language:'JavaScript',stargazers_count:3,fork:false,description:'A planner',topics:['tools'],pushed_at:'2026-01-01'},
  {name:'beta',language:'Python',stargazers_count:12,fork:false,description:null,pushed_at:'2026-02-01'},
  {name:'fork',language:'Rust',stargazers_count:99,fork:true,topics:[],pushed_at:'2026-03-01'},
  {name:'notes',language:null,stargazers_count:0,fork:false,pushed_at:'2026-04-01'}
];
test('summary excludes fork stars and unclassified language shares',() => {
  const result=summarize(repos);
  assert.equal(result.stars,15);assert.equal(result.originals,3);assert.equal(result.classified,2);assert.deepEqual(result.languages,[['JavaScript',1],['Python',1]]);
});
test('searches topics, filters language, and includes forks only on request',() => {
  assert.deepEqual(filterRepos(repos,{query:'TOOLS'}).map(r => r.name),['alpha']);
  assert.deepEqual(filterRepos(repos,{language:'Rust'}),[]);
  assert.equal(filterRepos(repos,{language:'Rust',forks:true})[0].name,'fork');
  assert.deepEqual(filterRepos(repos).map(r => r.name),['beta','alpha','notes']);
  assert.deepEqual(filterRepos(repos,{sort:'updated'}).map(r => r.name),['notes','beta','alpha']);
  assert.equal(repos[0].name,'alpha');
});
test('activity uses UTC days and excludes events outside the 30-day window',() => {
  const days=activityDays([{created_at:'2026-03-01T23:00:00Z'},{created_at:'2026-02-28T01:00:00Z'},{created_at:'2026-01-01T01:00:00Z'},{created_at:'2026-03-02T00:00:00Z'}],new Date('2026-03-01T23:00:00Z'));
  assert.equal(days.length,30);assert.equal(days.at(-1).date,'2026-03-01');assert.equal(days.at(-1).count,1);assert.equal(days.at(-2).count,1);assert.equal(days.reduce((n,d) => n+d.count,0),2);
});
test('validates usernames before making a request',() => {
  for(const name of ['octocat','morgan-dev','a']) assert.equal(validUsername(name),true);
  for(const name of ['', '-abc','abc-','a--b','a/b','a_b','a'.repeat(40)]) assert.equal(validUsername(name),false);
});
