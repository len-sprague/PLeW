// Anchor record: every shipped dataset, every example page, the A2 files and edge cases. Usage: node tools/checks/anchors.js [port] > out.txt ; run on old and new build and diff.
const { chromium } = require('playwright'); const fs=require('fs'); const os=require('os'); const path=require('path'); const ROOT=path.resolve(__dirname,'../..')+'/'; const PORT=process.argv[2]||'8765'; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'plew-check-'));
const U='http://localhost:'+PORT+'/PLeW/', D=ROOT+'docs/', DATA=ROOT+'static/data/', T=__dirname+'/anchor-edge-cases/';
const out = (...a)=>console.log(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('dialog', d=>d.accept());
  const load = async (file) => { await p.goto(U); await p.setInputFiles('#fileInput', file); await p.waitForFunction(()=>currentData!==null); };
  const sum = () => p.evaluate(()=>({records: currentData.length, anchors: dummyRows.length, dots: document.querySelectorAll('.data-point[data-row-index]').length, dims: allDimensions.map(d=>d.name+':'+d.cardinality).join(' ')}));
  const ids = () => p.evaluate(()=>({first: currentData.slice(0,2).map(r=>r[csvHeaders[0]]), last: currentData.slice(-2).map(r=>r[csvHeaders[0]]), anchorIds: dummyRows.map(r=>r[csvHeaders[0]])}));
  const trip = async (label, file) => {   // load -> export -> load -> export -> load ; counts must be stable
    await load(file); const s0 = await sum(); const csv1 = await p.evaluate(()=>generateCSV()); const f1=TMP+'/_t1.csv'; fs.writeFileSync(f1,csv1);
    await load(f1); const s1 = await sum(); const csv2 = await p.evaluate(()=>generateCSV()); const f2=TMP+'/_t2.csv'; fs.writeFileSync(f2,csv2);
    await load(f2); const s2 = await sum();
    out(label, '| load', [s0.records,s0.anchors], '| after 1 round trip', [s1.records,s1.anchors], '| after 2', [s2.records,s2.anchors], '| export identical 1st vs 2nd', csv1===csv2, '| exported anchor ids', csv1.trim().split('\n').slice(1+s0.records).map(l=>l.split(',')[0]).join(' '));
  };
  // 1. every dataset shipped with the site, in the editor
  for (const f of fs.readdirSync(DATA).filter(f=>f.endsWith('.csv')).sort()) { await load(DATA+f); out('DATA', f, await sum()); }
  for (const f of fs.readdirSync(DATA).filter(f=>f.endsWith('.csv')).sort()) await trip('TRIP '+f, DATA+f);
  // 2. every example page
  await p.goto(U+'examples/'); const pages = await p.locator('a.card').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
  for (const h of pages) { await p.goto(h); await p.waitForTimeout(700); const loaded = await p.evaluate(()=>typeof currentData!=='undefined' && currentData!==null); out('EXAMPLE', new URL(h).pathname, loaded ? await sum() : 'no data loaded'); }
  // 3. the finding files and the edge cases
  for (const f of ['A2a-lowercase-first-column.csv','A2b-lowercase-trailing-ids.csv','A2c-old-style-anchors.csv','A2d-more-than-26-anchors.csv']) { await load(D+f); out('FILE', f, await sum(), await ids()); }
  for (const f of ['A2a-lowercase-first-column.csv','A2b-lowercase-trailing-ids.csv','A2c-old-style-anchors.csv','A2d-more-than-26-anchors.csv']) await trip('TRIP '+f, D+f);
  for (const f of fs.readdirSync(T).filter(f=>!f.startsWith('_')).sort()) { await load(T+f); out('EDGE', f, await sum(), await ids()); }
  for (const f of fs.readdirSync(T).filter(f=>!f.startsWith('_')).sort()) await trip('TRIP '+f, T+f);
  // 4. anchors still do their job: empty a category by dragging, value survives in export and on reload
  await load(D+'A2c-old-style-anchors.csv');
  await p.evaluate(()=>{ currentData.forEach((r,i)=>{ if(r.Class==='verb'){ const old=r.Class; r.Class='noun'; modifiedRows.add(i);} }); updateVisualization(); });
  const csv = await p.evaluate(()=>generateCSV()); fs.writeFileSync(TMP+'/_emptied.csv', csv); await load(TMP+'/_emptied.csv');
  out('PRESERVE after moving every verb to noun and reloading: Class values', await p.evaluate(()=>allDimensions.find(d=>d.name==='Class').uniqueValues), await sum());
  // 5. anchor visible: tooltip + drawing do not error
  await load(D+'A2c-old-style-anchors.csv'); await p.evaluate(()=>{ document.getElementById('dummyVisible').checked=true; document.getElementById('dummyOpacity').value=1; updateDummySettings(); });
  out('VISIBLE anchors drawn', await p.locator('.dummy-point').count()); await p.locator('.dummy-point').first().hover(); out('  tooltip', (await p.locator('#tooltip').innerText()).replace(/\s+/g,' ').slice(0,90));
  // 6. role change on the ID column and on a dimension keeps anchors recognised after export
  await load(D+'A2c-old-style-anchors.csv'); await p.evaluate(()=>{ setColumnRole('ID','res'); setColumnRole('Class','dim'); });
  const csv3 = await p.evaluate(()=>generateCSV()); fs.writeFileSync(TMP+'/_roles.csv', csv3); await load(TMP+'/_roles.csv'); out('ROLES header', csv3.split('\n')[0], '| reload', await sum());
  out('ERRORS', errs);
  await b.close();
})();
