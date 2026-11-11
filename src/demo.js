export function demoProfile(now=new Date()) {
  const daysAgo = days => new Date(now.getTime()-days*86400000).toISOString();
  const projects = [
    ['orbit-ui','A tiny component library for interfaces that feel a little more human.','TypeScript',248,19,['design-system','components'],1],
    ['seedling','A calm, local-first habit tracker. Small steps, a little every day.','TypeScript',132,8,['local-first','productivity'],3],
    ['pocket-weather','The forecast, without the noise. A minimal weather app for your next adventure.','JavaScript',86,12,['weather','api'],2],
    ['field-notes','A home for ideas before they become something. Markdown meets a quiet workspace.','Python',64,5,['markdown','tools'],6],
    ['color-study','An interactive playground for palettes, contrast, and happy accidents.','CSS',47,3,['creative-coding','a11y'],8],
    ['little-scripts','Small automations that give a few minutes of your day back.','Python',31,4,['automation','cli'],12],
    ['paper-plane','An experiment in lightweight, keyboard-friendly web navigation.','HTML',18,2,['accessibility'],17],
    ['garden-api','A tiny API for tracking a growing collection of houseplants.','JavaScript',12,1,['rest-api'],21],
    ['starter-fork','A forked starter used for learning and experiments.','JavaScript',0,0,['learning'],25]
  ];
  return {
    demo:true, activityAvailable:true, repositoriesTruncated:false, eventsTruncated:false,
    user:{login:'morgan-dev',name:'Morgan Chen',bio:'Making useful things for the web. A little design, a lot of curiosity, and probably too many side projects.',location:'Somewhere with good coffee',followers:128,following:64,public_repos:9,created_at:'2020-04-01T00:00:00Z',html_url:'https://github.com'},
    repos:projects.map(([name,description,language,stargazers_count,forks_count,topics,days],i) => ({id:i,name,description,language,stargazers_count,forks_count,topics,fork:i===8,archived:false,html_url:`https://github.com/search?q=${encodeURIComponent(name)}&type=repositories`,pushed_at:daysAgo(days)})),
    events:Array.from({length:30},(_,i) => Array.from({length:[2,0,5,3,1,0,4,6,2,1,0,4,7,3,2,5,1,0,3,6,8,2,4,1,0,5,3,6,4,2][i]},(_,j) => ({id:`${i}-${j}`,type:'PushEvent',created_at:daysAgo(29-i)}))).flat()
  };
}
