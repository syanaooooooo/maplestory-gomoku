/* 朝暮朝夕五子棋大赛 — 赛程 / 晋级 / 导出 */
'use strict';

const KEY = 'ms_gomoku_v1';
const EVENT = '朝暮朝夕五子棋大赛';

const MATCHES = [
  { id:'m1', slot:'qf1', round:'八强赛', no:'第 1 场', when:'9/16 — 9/18',
    a:{p:'伽椰菜菜子'}, b:{p:'淬雪'} },
  { id:'m2', slot:'qf2', round:'八强赛', no:'第 2 场', when:'9/16 — 9/18',
    a:{p:'Tora丶'}, b:{p:'2005的晚风'} },
  { id:'m3', slot:'qf3', round:'八强赛', no:'第 3 场', when:'9/16 — 9/18',
    a:{p:'牛包'}, b:{p:'摘旧枳'} },
  { id:'m4', slot:'qf4', round:'八强赛', no:'第 4 场', when:'9/16 — 9/18',
    a:{p:'欧欧'}, b:{p:'山猫'} },
  { id:'m5', slot:'sf1', round:'半决赛', no:'第 5 场', when:'9/19 周六', stub:true,
    a:{w:'m1'}, b:{w:'m2'} },
  { id:'m6', slot:'sf2', round:'半决赛', no:'第 6 场', when:'9/19 周六', stub:true,
    a:{w:'m3'}, b:{w:'m4'} },
  { id:'m7', slot:'fin', round:'决赛', no:'决赛 · 争冠军', when:'9/20 周日', cls:'final', stub:true,
    a:{w:'m5'}, b:{w:'m6'} },
  { id:'m8', slot:'thd', round:'季军赛', no:'季军赛 · 争第三', when:'9/20 周日', cls:'third',
    a:{l:'m5'}, b:{l:'m6'} },
];

const M = Object.fromEntries(MATCHES.map(m => [m.id, m]));
let S = load();

/* ── 数据 ──────────────────────────────── */
function load(){
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch(e){ return {}; }
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){}
}

// 解析一个位置：已知返回真名，未知返回占位文字
function resolve(ref){
  if (ref.p) return { name: ref.p, known: true };
  const src = ref.w || ref.l;
  const r = S[src];
  const kind = ref.w ? '胜者' : '负者';
  if (!r) return { name: M[src].no + kind, known: false };
  const side = ref.w ? r.w : (r.w === 'a' ? 'b' : 'a');
  return { name: resolve(M[src][side]).name, known: true };
}

// 上游改了，下游作废
function normalize(){
  for (const m of MATCHES){
    const r = S[m.id];
    if (!r) continue;
    const a = resolve(m.a), b = resolve(m.b);
    if (!a.known || !b.known || !r.pair || r.pair[0] !== a.name || r.pair[1] !== b.name){
      delete S[m.id];
    }
  }
}

function pick(id, side){
  const m = M[id];
  const a = resolve(m.a), b = resolve(m.b);
  if (!a.known || !b.known) return;
  const cur = S[id];
  if (cur && cur.w === side) delete S[id];                 // 再点一次取消
  else S[id] = { w: side, ls: (cur && cur.ls) || 0, pair: [a.name, b.name] };
  normalize(); save(); render();
}

function bumpLoserScore(id){
  const r = S[id];
  if (!r) return;
  r.ls = r.ls === 0 ? 1 : 0;
  save(); render();
}

/* ── 渲染 ──────────────────────────────── */
function matchCard(m){
  const a = resolve(m.a), b = resolve(m.b);
  const r = S[m.id];
  const el = document.createElement('div');
  el.className = 'card ' + m.slot + (m.cls ? ' ' + m.cls : '') + (m.stub ? ' stub' : '') + (r ? ' done' : '');
  el.innerHTML = `<div class="no"><span>${m.no}</span><em>${m.when}</em></div>`;

  for (const side of ['a','b']){
    const who = side === 'a' ? a : b;
    const won = r && r.w === side;
    const lost = r && r.w !== side;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'p' + (won ? ' win' : '') + (lost ? ' lose' : '') + (who.known ? '' : ' tbd');
    btn.disabled = !(a.known && b.known);
    btn.title = won ? '再点一次取消' : (btn.disabled ? '等上一轮打完' : '点一下 = 这个人赢');
    const score = r ? (won ? '2' : String(r.ls)) : '—';
    btn.innerHTML = `<span class="mark">${won ? '✓' : ''}</span><span class="nm">${who.name}</span>` +
                    `<span class="score" title="${lost ? '点比分切换 0 / 1' : ''}">${score}</span>`;
    btn.addEventListener('click', ev => {
      if (lost && ev.target.closest('.score')) bumpLoserScore(m.id);
      else pick(m.id, side);
    });
    el.appendChild(btn);
  }
  return el;
}

function roundTag(title, when){
  const d = document.createElement('div');
  d.className = 'm-round';
  d.innerHTML = `<b>${title}</b><span>${when}</span>`;
  return d;
}
function conn(cls){
  const d = document.createElement('div');
  d.className = 'conn ' + cls;
  return d;
}

function podium(){
  const f = S.m7, t = S.m8;
  const champ = f ? resolve(M.m7[f.w]).name : null;
  const second = f ? resolve(M.m7[f.w === 'a' ? 'b' : 'a']).name : null;
  const third = t ? resolve(M.m8[t.w]).name : null;
  return [
    { rank:'冠军', name:champ, gold:true, prize:'2 张皇家理发 · 1 个向日葵武器 · 20 个猪头' },
    { rank:'亚军', name:second, prize:'1 张皇家理发 · 1 个粑粑棍子' },
    { rank:'季军', name:third, prize:'1 个八戒帽 · 1 份盲盒礼物' },
  ];
}

function render(){
  const wrap = document.getElementById('bracket');
  wrap.textContent = '';
  wrap.appendChild(roundTag('八强赛', '9/16 周三 — 9/18 周五 前打完'));
  ['m1','m2','m3','m4'].forEach(id => wrap.appendChild(matchCard(M[id])));
  wrap.appendChild(conn('c1'));
  wrap.appendChild(conn('c2'));
  wrap.appendChild(roundTag('半决赛', '9/19 周六 当天打完'));
  ['m5','m6'].forEach(id => wrap.appendChild(matchCard(M[id])));
  wrap.appendChild(conn('c3'));
  wrap.appendChild(roundTag('决赛 · 季军赛', '9/20 周日 当天打完'));
  ['m7','m8'].forEach(id => wrap.appendChild(matchCard(M[id])));

  const pod = document.getElementById('podium');
  pod.textContent = '';
  for (const p of podium()){
    const d = document.createElement('div');
    if (p.gold && p.name) d.className = 'gold';
    d.innerHTML = `<div class="rank">${p.rank}</div>` +
                  `<div class="name${p.name ? '' : ' pending'}">${p.name || '待定'}</div>` +
                  `<div class="prize">${p.prize}</div>`;
    pod.appendChild(d);
  }

  const done = MATCHES.filter(m => S[m.id]).length;
  document.getElementById('progress').textContent = `已打 ${done} / ${MATCHES.length} 场`;
}

/* ── 导出 ──────────────────────────────── */
function reportText(){
  const lines = [`${EVENT} · 战报`, `更新于 ${new Date().toLocaleString('zh-CN')}`, ''];
  let round = '';
  for (const m of MATCHES){
    if (m.round !== round){ round = m.round; lines.push(`【${round}】`); }
    const a = resolve(m.a), b = resolve(m.b), r = S[m.id];
    if (r){
      const sa = r.w === 'a' ? 2 : r.ls, sb = r.w === 'b' ? 2 : r.ls;
      const win = r.w === 'a' ? a.name : b.name;
      lines.push(`${m.no}  ${a.name} ${sa} : ${sb} ${b.name}   → ${win} 胜`);
    } else {
      lines.push(`${m.no}  ${a.name} vs ${b.name}   （${m.when} 待打）`);
    }
  }
  const p = podium();
  lines.push('', '【最终名次 · 奖品】');
  p.forEach(x => lines.push(`${x.rank}：${x.name || '待定'}   —— ${x.prize}`));
  return lines.join('\n');
}

function reportJSON(){
  return JSON.stringify({
    event: EVENT,
    exported_at: new Date().toISOString(),
    matches: MATCHES.map(m => {
      const a = resolve(m.a), b = resolve(m.b), r = S[m.id];
      return {
        no: m.no, round: m.round, when: m.when,
        a: a.name, b: b.name,
        score: r ? [r.w === 'a' ? 2 : r.ls, r.w === 'b' ? 2 : r.ls] : null,
        winner: r ? (r.w === 'a' ? a.name : b.name) : null,
      };
    }),
    podium: Object.fromEntries(podium().map(x => [x.rank, { name: x.name, prize: x.prize }])),
  }, null, 2);
}

function download(name, text, type){
  const url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(){
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

async function copyReport(){
  const text = reportText();
  try {
    await navigator.clipboard.writeText(text);
    toast('战报已复制，去群里粘贴');
  } catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    toast(ok ? '战报已复制，去群里粘贴' : '复制失败，用「导出战报」吧');
  }
}

/* ── 启动 ──────────────────────────────── */
document.getElementById('copy-report').addEventListener('click', copyReport);
document.getElementById('export-txt').addEventListener('click', () => {
  download(`五子棋战报-${stamp()}.txt`, reportText(), 'text/plain');
  toast('已导出 .txt');
});
document.getElementById('export-json').addEventListener('click', () => {
  download(`五子棋战报-${stamp()}.json`, reportJSON(), 'application/json');
  toast('已导出 .json');
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('清空所有比分，重新开始？')) return;
  S = {}; save(); render();
  toast('已重置');
});

normalize();
save();
render();
