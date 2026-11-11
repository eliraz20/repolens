import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile} from '../src/api.js';
const ok=value => new Response(JSON.stringify(value),{status:200});
test('loads all repository pages and public event pages',async() => {
  const paths=[];
  const fetcher=async url => {
    paths.push(url);
    if(url.includes('/repos?')) return ok(new URL(url).searchParams.get('page')==='1'?Array.from({length:100},(_,id) => ({id})):[{id:100}]);
    if(url.includes('/events/')) return ok([{created_at:'2026-01-01'}]);
    return ok({login:'test'});
  };
  const data=await loadProfile('test',{fetcher});
  assert.equal(data.repos.length,101);assert.equal(data.activityAvailable,true);assert.equal(data.repositoriesTruncated,false);assert.equal(paths.length,4);
});
test('keeps repositories when the optional activity endpoint fails',async() => {
  const data=await loadProfile('test',{fetcher:async url => url.includes('/events/')?new Response('',{status:503}):ok(url.includes('/repos?')?[]:{login:'test'})});
  assert.equal(data.activityAvailable,false);assert.deepEqual(data.events,[]);
});
test('explains a missing profile and rate limits',async() => {
  await assert.rejects(loadProfile('nope',{fetcher:async() => new Response('',{status:404})}),/could not be found/);
  await assert.rejects(loadProfile('test',{fetcher:async() => new Response('',{status:403})}),/limiting requests/);
});
test('caps large feeds and explicitly marks incomplete collections',async() => {
  const data=await loadProfile('test',{fetcher:async url => ok(url.includes('/repos?')||url.includes('/events/')?Array.from({length:100},(_,id) => ({id})):{login:'test'})});
  assert.equal(data.repos.length,1000);assert.equal(data.repositoriesTruncated,true);assert.equal(data.events.length,300);assert.equal(data.eventsTruncated,true);
});
test('does not swallow cancellation during activity loading',async() => {
  const controller=new AbortController();
  await assert.rejects(loadProfile('test',{signal:controller.signal,fetcher:async url => {
    if(url.includes('/events/')) {controller.abort();throw new DOMException('Aborted','AbortError');}
    return ok(url.includes('/repos?')?[]:{login:'test'});
  }}),{name:'AbortError'});
});
