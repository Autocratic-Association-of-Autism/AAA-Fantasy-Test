const D = window.LEAGUE_DATA;
const CAREER_MIN_SEASONS = 3;
const fmt = n => Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = n => (Number(n)*100).toFixed(1)+'%';

function table(el, rows, cols){
  const root=document.querySelector(el);
  if(!root) return;
  if(!rows.length){
    root.innerHTML='<div class="empty-table">No matching records.</div>';
    return;
  }
  root.innerHTML='<table><thead><tr>'+cols.map(c=>`<th>${c.label}</th>`).join('')+'</tr></thead><tbody>'+ 
    rows.map(r=>'<tr>'+cols.map(c=>`<td>${c.render?c.render(r[c.key],r):(r[c.key]??'')}</td>`).join('')+'</tr>').join('')+
    '</tbody></table>';
}

const gameCount=document.getElementById('games'); if(gameCount && gameCount.tagName!=='SECTION') gameCount.textContent=D.meta.games;
const scoreCount=document.getElementById('scores'); if(scoreCount) scoreCount.textContent=D.meta.weeklyScores;
const mwc=document.getElementById('multiWeekCount'); if(mwc) mwc.textContent=D.meta.multiWeekMatchups;
const managerCount=document.getElementById('managers'); if(managerCount) managerCount.textContent=D.career.length;
const yearsCount=document.getElementById('years'); if(yearsCount) yearsCount.textContent=D.meta.years;
const ct=document.getElementById('currentThrough'); if(ct) ct.textContent=D.meta.currentThrough||D.meta.years;

const careerCols=[
 {key:'Manager',label:'Manager'},{key:'Seasons',label:'Completed Seasons'},{key:'Wins',label:'W'},{key:'Losses',label:'L'},
 {key:'Win %',label:'Win %',render:v=>pct(v)},{key:'Avg Score',label:'Avg 1-Wk Score',render:v=>fmt(v)},
 {key:'Championships',label:'Titles'},{key:'Top-3 Finishes',label:'Top 3'},
 {key:'Avg Finish',label:'Avg Finish',render:v=>fmt(v)},{key:'High Score',label:'1-Wk High',render:v=>fmt(v)},{key:'Low Score',label:'1-Wk Low',render:v=>fmt(v)}
];

function renderCareer(q=''){
  const query=q.toLowerCase().trim();
  const filtered=D.career.filter(r=>!query || String(r.Manager).toLowerCase().includes(query) || String(r['Team Names']).toLowerCase().includes(query));
  const eligible=filtered.filter(r=>Number(r.Seasons)>=CAREER_MIN_SEASONS);
  const limited=filtered.filter(r=>Number(r.Seasons)<CAREER_MIN_SEASONS);
  table('#careerEligible',eligible,careerCols);
  table('#careerLimited',limited,careerCols);
  const wrap=document.getElementById('limitedCareerWrap');
  if(wrap) wrap.style.display=limited.length?'block':'none';
}
renderCareer();

const weeklyCols=[
 {key:'Manager',label:'Manager'},{key:'Team',label:'Team'},{key:'Season',label:'Season'},{key:'Week',label:'Week'},
 {key:'Score',label:'Score',render:v=>`<span class="highlight">${fmt(v)}</span>`},{key:'Opponent',label:'Opponent'},
 {key:'Opponent Score',label:'Opp Score',render:v=>fmt(v)},{key:'Stage',label:'Stage',render:v=>`<span class="badge">${v}</span>`}
];
table('#highest',D.highest,weeklyCols); table('#lowest',D.lowest,weeklyCols);

table('#blowoutLosses',(window.BLOWOUT_LOSSES||[]),[
 {key:'Rank',label:'Rank'},
 {key:'Manager',label:'Manager'},
 {key:'Losses',label:'35+ Point Losses',render:v=>`<span class="highlight">${v}</span>`}
]);

function normalizeGame(r){
  const winnerIsHome = r.Winner === r['Home Manager'];
  const loserIsHome = r.Loser === r['Home Manager'];
  return {
    ...r,
    'Winner Score': winnerIsHome ? r['Home Score'] : r['Away Score'],
    'Loser Score': loserIsHome ? r['Home Score'] : r['Away Score'],
    'Winner Projected': winnerIsHome ? r['Home Projected'] : r['Away Projected'],
    'Loser Projected': loserIsHome ? r['Home Projected'] : r['Away Projected']
  };
}

const gameCols=[
 {key:'Season',label:'Season'},{key:'Week',label:'Week'},{key:'Winner',label:'Winner'},{key:'Winner Score',label:'Winner Score',render:v=>fmt(v)},
 {key:'Loser',label:'Loser'},{key:'Loser Score',label:'Loser Score',render:v=>fmt(v)},{key:'Margin',label:'Margin',render:v=>fmt(v)},
 {key:'Combined',label:'Combined',render:v=>fmt(v)},{key:'Stage',label:'Stage',render:v=>`<span class="badge">${v}</span>`}
];
table('#margins',D.largestMargins.map(normalizeGame),gameCols);
table('#closest',D.closest.map(normalizeGame),gameCols);
table('#combined',D.highestCombined.map(normalizeGame),gameCols);

table('#upsets',D.projectedUpsets.map(normalizeGame),[
 {key:'Season',label:'Season'},{key:'Week',label:'Week'},{key:'Winner',label:'Winner'},{key:'Winner Projected',label:'Winner Proj.',render:v=>fmt(v)},
 {key:'Loser',label:'Loser'},{key:'Loser Projected',label:'Loser Proj.',render:v=>fmt(v)},
 {key:'Winner Projected Deficit',label:'Projected Deficit',render:v=>fmt(v)},{key:'Stage',label:'Stage'}
]);

const multiWeekCols=[
 {key:'Season',label:'Season'},{key:'Weeks',label:'Weeks'},{key:'Winner',label:'Winner'},{key:'Winner Score',label:'Winner Total',render:v=>fmt(v)},
 {key:'Loser',label:'Loser'},{key:'Loser Score',label:'Loser Total',render:v=>fmt(v)},{key:'Margin',label:'Margin',render:v=>fmt(v)},
 {key:'Combined',label:'Combined',render:v=>fmt(v)},{key:'Matchup Type',label:'Bracket',render:v=>`<span class="badge">${String(v||'').replaceAll('_',' ')}</span>`}
];
table('#multiWeek',(D.multiWeekPlayoffs||[]).map(normalizeGame),multiWeekCols);

table('#seasonsTable',D.seasons,[
 {key:'Season',label:'Season'},{key:'Manager',label:'Manager'},{key:'Team',label:'Team'},
 {key:'Regular W',label:'W'},{key:'Regular L',label:'L'},{key:'Regular PF',label:'PF',render:v=>fmt(v)},
 {key:'Final Finish',label:'Finish'},{key:'Acquisitions',label:'Adds'},{key:'Trades',label:'Trades'}
]);

const managerSearch=document.getElementById('managerSearch'); if(managerSearch) managerSearch.addEventListener('input', e=>renderCareer(e.target.value));

const championshipRoot=document.querySelector('#championshipHistory');
if(championshipRoot){
 const completed=D.seasons.filter(r=>Number.isFinite(Number(r['Final Finish'])) && Number(r.Season)<2026);
 const rows=[...new Set(completed.map(r=>r.Season))].sort((a,b)=>b-a).map(year=>{
  const season=completed.filter(r=>r.Season===year);
  const winner=season.find(r=>Number(r['Final Finish'])===1);
  const runner=season.find(r=>Number(r['Final Finish'])===2);
  return {Season:year,Champion:winner?.Manager||'Not verified','Champion Team':winner?.Team||'—','Runner-up':runner?.Manager||'Not verified','Runner-up Team':runner?.Team||'—'};
 });
 table('#championshipHistory',rows,[{key:'Season',label:'Season'},{key:'Champion',label:'Champion'},{key:'Champion Team',label:'Championship Team'},{key:'Runner-up',label:'Runner-up'},{key:'Runner-up Team',label:'Runner-up Team'}]);
 const honors=[...D.career].sort((a,b)=>Number(b.Championships||0)-Number(a.Championships||0)||Number(b['Runner-up']||0)-Number(a['Runner-up']||0)||Number(b['Top-3 Finishes']||0)-Number(a['Top-3 Finishes']||0)||String(a.Manager).localeCompare(String(b.Manager)));
 table('#postseasonHonors',honors,[{key:'Manager',label:'Manager'},{key:'Championships',label:'Titles'},{key:'Runner-up',label:'Runner-up Finishes'},{key:'Top-3 Finishes',label:'Top 3 Finishes'},{key:'Manager',label:'Distinction',render:(_,r)=>{const titles=Number(r.Championships||0),seconds=Number(r['Runner-up']||0),thirds=Math.max(0,Number(r['Top-3 Finishes']||0)-titles-seconds);let tag;if(!titles&&!seconds&&!thirds)tag='THE PODIUM IS A MYTH TO ME';else if(!titles&&!seconds&&thirds>=2)tag='BRONZE MEDAL SUBSCRIPTION';else if(titles>=2)tag='HIT IT AND QUIT IT';else if(titles&&seconds)tag='CHAMPAGNE TASTE, SILVER FINISH';else if(titles)tag='HAS ACTUALLY WON SOMETHING';else if(seconds>=1&&thirds>=1)tag='SILVER AND BRONZE, GOLD IS A RUMOR';else if(seconds)tag='PROFESSIONAL BRIDESMAID';else tag='THIRD PLACE ENTHUSIAST';return '<span class="'+(titles||seconds||thirds?'honors-earned':'honors-shame')+'">'+tag+'</span>';}}]);
 document.querySelectorAll('#postseasonHonors tbody tr').forEach((tr,i)=>{if(Number(honors[i]?.['Top-3 Finishes']||0)===0)tr.classList.add('honors-no-podium');});
}

if(document.querySelector('#sackoHistory')){
 const complete=D.seasons.filter(r=>Number(r.Season)<2026&&Number.isFinite(Number(r['Final Finish'])));
 const years=[...new Set(complete.map(r=>r.Season))].sort((a,b)=>b-a);
 const rows=years.map(year=>{const season=complete.filter(r=>r.Season===year);const last=Math.max(...season.map(r=>Number(r['Final Finish'])));const candidate=season.find(r=>Number(r['Final Finish'])===last);return {Season:year,Manager:candidate?.Manager||'Not verified',Team:candidate?.Team||'—',Finish:last,Status:'Sacko not verified'};});
 table('#sackoHistory',rows,[{key:'Season',label:'Season'},{key:'Manager',label:'Last-place manager'},{key:'Team',label:'Team'},{key:'Finish',label:'Finish'},{key:'Status',label:'Sacko status'}]);
 const all=(D.multiWeekPlayoffs||[]).map(normalizeGame);
 const sacko=all.filter(r=>/LOSERS|CONSOLATION|SACKO/i.test(String(r['Matchup Type']||'')));
 const championship=all.filter(r=>/WINNERS|CHAMPIONSHIP/i.test(String(r['Matchup Type']||'')));
 table('#sackoMultiWeek',sacko,multiWeekCols);
 table('#championshipMultiWeek',championship,multiWeekCols);
}
