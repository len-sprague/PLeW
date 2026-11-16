// Behaviour record: one line per check. Usage: node tools/checks/behaviour.js [port] > out.txt ; run on the old and the new build and diff the outputs.
const { chromium } = require('playwright'); const fs=require('fs'); const os=require('os'); const path=require('path'); const ROOT=path.resolve(__dirname,'../..')+'/'; const PORT=process.argv[2]||'8765'; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'plew-check-'));
const U='http://localhost:'+PORT+'/PLeW/', D=ROOT+'docs/', CSV=__dirname+'/smoke.csv';
const out = (...a)=>console.log(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({acceptDownloads:true}); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push('pageerror '+e.message)); p.on('console', m=>{ if(m.type()==='error') errs.push('console '+m.text().slice(0,120)); });
  p.on('dialog', d=>d.accept());
  const dots = () => p.locator('.data-point[data-row-index]').count();
  const drawn = () => p.evaluate(()=>[...document.querySelectorAll('.data-point[data-row-index]')].map(d=>+d.dataset.rowIndex).sort((a,b)=>a-b).join(','));
  const stats = () => p.locator('#vizStats').textContent();
  const enc = (name, v) => p.selectOption(`.dimension-item[data-name="${name}"] select`, v);
  const cb = (dim, val) => p.locator('.value-filter-dim', {has: p.locator('.value-filter-dim-title', {hasText: new RegExp('^'+dim+'$')})}).locator('.value-order-row', {has: p.locator('.value-order-label-text', {hasText: new RegExp('^'+val+'$')})}).locator('input');
  const encs = () => p.evaluate(()=>JSON.stringify(dimensionEncodings));
  const expectRows = (pred) => p.evaluate(src=>currentData.filter(eval('('+src+')')).map(r=>r._index).join(','), pred.toString());
  const load = async (file) => { await p.goto(U); await p.setInputFiles('#fileInput', file); await p.waitForFunction(()=>currentData!==null); };

  // ---- EDITOR ----
  await load(CSV);
  out('S1 editor opens; errors so far:', errs.length);
  out('S2 load:', await stats(), '| dots', await dots(), '| default', await encs());
  // S3 every dimension in every placement
  for (const d of ['Region','Vowel','Tone','Mood']) for (const s of ['grid-x','grid-y','panel-x','panel-y','color','shape']) { await enc(d,s); out('S3', d, s, 'dots', await dots()); }
  // S4 filters on each placement kind: hide one value, then leave only one value, then restore
  for (const s of ['grid-x','grid-y','panel-x','panel-y','color','shape']) {
    await load(CSV); for (const d of ['Region','Vowel','Tone','Mood']) await enc(d,''); await enc('Vowel', s); await enc('Tone', s==='grid-x'?'grid-y':'grid-x');
    await cb('Vowel','u').click(); const two = (await drawn())===(await expectRows(r=>r.Vowel!=='u'));
    await cb('Vowel','i').click(); const one = (await drawn())===(await expectRows(r=>r.Vowel==='a')); const nOne = await dots();
    await cb('Vowel','a').click(); const none = await dots();
    await cb('Vowel','a').click(); await cb('Vowel','i').click(); await cb('Vowel','u').click(); const all = await dots();
    out('S4', s, '| hide one: correct rows', two, '| one left: correct rows', one, '('+nOne+' dots, expect 12)', '| none left:', none, '| restored:', all);
  }
  // S4b both panel axes filtered to one value each; and panel dimension that only HAS one value
  await load(CSV); for (const d of ['Region','Vowel','Tone','Mood']) await enc(d,''); await enc('Vowel','panel-x'); await enc('Tone','panel-y'); await enc('Region','grid-x');
  await cb('Vowel','i').click(); await cb('Vowel','u').click(); await cb('Tone','low').click();
  out('S4b panel X and Y one value each: correct rows', (await drawn())===(await expectRows(r=>r.Vowel==='a'&&r.Tone==='high')), 'dots', await dots(), 'expect 6');
  // S5 drag
  await load(CSV);
  const before = await p.evaluate(()=>JSON.stringify(currentData[0]));
  const src = p.locator('.data-point[data-row-index="0"]'); const cells = p.locator('.panel-cell');
  const target = await p.evaluate(()=>{ const all=[...document.querySelectorAll('.panel-cell')]; const mine=document.querySelector('.data-point[data-row-index="0"]').closest('.panel-cell'); return all.findIndex(c=>c!==mine && c.closest('.grid')!==mine.closest('.grid')); });
  await src.dragTo(cells.nth(target));
  out('S5 drag: changed', before!==await p.evaluate(()=>JSON.stringify(currentData[0])), '| modified', await p.evaluate(()=>modifiedRows.size), '| log', await p.evaluate(()=>changeLog.length), '| ring', await p.locator('.data-point.modified').count(), '| dots', await dots());
  await p.click('#undoBtn'); out('S5 undo: restored', before===await p.evaluate(()=>JSON.stringify(currentData[0])), '| modified', await p.evaluate(()=>modifiedRows.size));
  await p.click('#redoBtn'); out('S5 redo: modified', await p.evaluate(()=>modifiedRows.size), '| log', await p.evaluate(()=>changeLog.length));
  // S5b drag INTO the single remaining panel column after filtering (the A1 side effect)
  await load(CSV); for (const d of ['Region','Vowel','Tone','Mood']) await enc(d,''); await enc('Vowel','panel-x'); await enc('Region','grid-x');
  await cb('Vowel','i').click(); await cb('Vowel','u').click();
  out('S5b one panel column left: rows drawn with Vowel other than a:', await p.evaluate(()=>[...document.querySelectorAll('.data-point[data-row-index]')].filter(d=>currentData[+d.dataset.rowIndex].Vowel!=='a').length));
  // S6 right-click colour change
  await load(CSV);
  await p.locator('.data-point[data-row-index="0"]').click({button:'right'}); const colField = await p.evaluate(()=>dimKey(encodings.color)); const oldC = await p.evaluate(f=>currentData[0][f], colField);
  await p.locator('#colorGrid .color-option:not(.selected)').first().click();
  out('S6 right-click:', colField, 'changed', oldC!==await p.evaluate(f=>currentData[0][f], colField), '| modified', await p.evaluate(()=>modifiedRows.size));
  await p.keyboard.press('Control+z'); out('S6 undo via keyboard: modified', await p.evaluate(()=>modifiedRows.size));
  // S7 comment
  await p.locator('.data-point[data-row-index="1"]').click(); await p.fill('#recordCommentTextarea','check: hello'); await p.keyboard.press('Escape');
  out('S7 comment: rings', await p.locator('.data-point.has-comment').count(), '| in CSV', (await p.evaluate(()=>generateCSV())).includes('check: hello'));
  // S8 compare
  await p.locator('.data-point[data-row-index="2"]').click(); await p.keyboard.press('Escape'); await p.locator('.data-point[data-row-index="2"]').click(); await p.keyboard.press('Escape');
  await p.locator('.data-point[data-row-index="2"]').click(); await p.evaluate(()=>document.querySelector('.data-point[data-row-index="3"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true})));
  out('S8 compare table:', await p.locator('.compare-diff-table').count(), '| differing rows', await p.locator('.compare-diff-row').count()); await p.keyboard.press('Escape');
  // S9 CSV round trip
  const csv = await p.evaluate(()=>generateCSV()); fs.writeFileSync(TMP+'/roundtrip.csv', csv);
  const n1 = await p.evaluate(()=>[currentData.length, dummyRows.length]); await load(TMP+'/roundtrip.csv');
  out('S9 round trip: before', n1, 'after', await p.evaluate(()=>[currentData.length, dummyRows.length]), '| comment kept', await p.evaluate(()=>currentData[1]['desc::comment']));
  // S10 setup round trip
  await load(CSV); await enc('Mood','shape'); await cb('Region','west').click(); await p.evaluate(()=>{ reorderValueRelative('Vowel','u','a'); customColorMap['high']='#123456'; updateVisualization(); });
  const fp = () => p.evaluate(()=>JSON.stringify([dimensionEncodings, Object.fromEntries(Object.entries(dimensionValueFilters).map(([k,v])=>[k,[...v]])), dimensionValueOrder, customColorMap, document.querySelectorAll('.data-point[data-row-index]').length]));
  const fp1 = await fp(); const cfg = await p.evaluate(()=>buildVisualizationConfig()); await load(CSV); const fpFresh = await fp();
  await p.evaluate(c=>applyVisualizationConfig(c,{silent:true}), cfg);
  out('S10 setup: restored', fp1===await fp(), '| differs from fresh load', fp1!==fpFresh, '| version', cfg.version);
  // S11 sidebar
  await p.keyboard.press('b'); const col = await p.locator('#sidebar.collapsed').count(); const fl = await p.locator('#floatingControls').isVisible(); await p.keyboard.press('b');
  out('S11 sidebar: collapsed', col, '| floating bar visible', fl, '| reopened', 1-await p.locator('#sidebar.collapsed').count());
  // S12 report
  await p.evaluate(()=>openReportModal()); await p.locator('#reportDimStats input[data-stat="count"]').first().check(); await p.click('text=+ Add crosstab');
  await p.locator('#reportCrosstabsList select').nth(0).selectOption({index:1}); await p.locator('#reportCrosstabsList select').nth(1).selectOption({index:2}); await p.click('#reportModalOverlay .btn-success');
  out('S12 report: tables', await p.locator('#reportOutput table').count(), '| text', (await p.locator('#reportOutput').innerText()).replace(/\s+/g,' ').slice(0,90)); await p.evaluate(()=>closeReportModal());
  // S13 snapshot
  const hasLib = await p.evaluate(()=>typeof html2canvas!=='undefined');
  if (hasLib) { const dl = p.waitForEvent('download',{timeout:15000}).catch(()=>null); await p.evaluate(()=>downloadSnapshot(false)); const d = await dl; out('S13 snapshot: library loaded, file', d?d.suggestedFilename():'NONE'); } else out('S13 snapshot: library not reachable here; not exercised');

  // ---- EXAMPLE PAGE ----
  await p.goto(U+'examples/zoo/'); await p.waitForSelector('.data-point[data-row-index]');
  out('E1 example loads:', await stats(), '| dots', await dots(), '|', await encs());
  await enc('class','panel-x'); await enc('danger','grid-x');
  const vals = await p.evaluate(()=>getOrderedDimensionValues(allDimensions.find(d=>d.name==='class')));
  for (const v of vals.slice(1)) await cb('class', v).click();
  out('E2 example, panel X one value left ('+vals[0]+'): correct rows', (await drawn())===(await p.evaluate(v=>currentData.filter(r=>r.class===v).map(r=>r._index).join(','), vals[0])), '| dots', await dots(), 'of', await p.evaluate(()=>currentData.length));
  for (const v of vals.slice(1)) await cb('class', v).click(); out('E3 example restored: dots', await dots());

  // ---- FINDING FILES ----
  await load(D+'A1-panel-filter-single-value.csv'); await enc('Vowel','panel-x'); await p.check('#showItemCounts'); const a=[await dots()];
  await cb('Vowel','u').click(); a.push(await dots()); await cb('Vowel','i').click(); a.push(await dots());
  out('A1 dots at 3 / 2 / 1 visible values:', a, '(expected 6,4,2) | vowels drawn:', await p.evaluate(()=>[...document.querySelectorAll('.data-point[data-row-index]')].map(d=>currentData[d.dataset.rowIndex].Vowel).join('')));
  await load(D+'A2a-lowercase-first-column.csv'); out('A2a records/anchors:', await p.evaluate(()=>[currentData.length, dummyRows.length]), '(expected 4 records)');
  await load(D+'A2b-lowercase-trailing-ids.csv'); out('A2b:', await stats(), '(expected 6 records)');
  await load(D+'A3-hidden-record-count.csv'); await cb('Group','B').click(); out('A3 dots', await dots(), '| header:', await stats());
  // A3 detail: panel counts and the header, against counts made here from the dots and the data
  const titles = () => p.evaluate(()=>[...document.querySelectorAll('.grid-title')].map(t=>t.textContent).join(' ; '));
  // for every panel: [real dots drawn, real records whose grid values match the panel's, anchors drawn]
  const panelTruth = () => p.evaluate(()=>{ const gx=getVisibleValues(encodings.gridX), gy=getVisibleValues(encodings.gridY); const gs=[...document.querySelectorAll('.grid')]; let i=0; const r=[];
    for (const y of gy) for (const x of gx) { const g=gs[i++]; const tot=currentData.filter(d=>(!encodings.gridX||d[dimKey(encodings.gridX)]===x)&&(!encodings.gridY||d[dimKey(encodings.gridY)]===y)).length;
      r.push(g.querySelectorAll('.data-point[data-row-index]').length+'/'+tot+'/'+g.querySelectorAll('.dummy-point').length); } return r.join(' ; '); });
  const a3 = async (tag) => out(tag, '| header:', await stats(), '| dots', await dots(), '| panel counts:', await titles(), '| drawn/total/anchors:', await panelTruth());
  const a3load = async () => { await load(D+'A3-hidden-record-count.csv'); await p.check('#showItemCounts'); };
  await a3load(); await a3('A3a nothing hidden');
  await cb('Group','B').click(); await a3('A3b grid value hidden (whole panels)');
  await cb('Group','B').click(); await a3('A3c restored');
  for (const s of ['panel-x','panel-y','color','shape']) { await a3load(); await enc('Tone', s); await cb('Tone','low').click(); await a3('A3d Tone on '+s+', low hidden'); }
  await a3load(); await enc('Tone','panel-x'); await cb('Tone','low').click(); await cb('Group','B').click(); await a3('A3e two filters');
  await a3load(); await p.evaluate(()=>saveRecordCommentFromValues(0,'note')); await p.check('#commentsOnlyToggle'); await a3('A3f comment filter, one record has a comment');
  await a3load(); await p.evaluate(()=>{ document.getElementById('dummyVisible').checked=true; updateDummySettings(); }); await a3('A3g anchors shown, nothing hidden');
  await enc('Tone','color'); await cb('Tone','low').click(); await a3('A3h anchors shown, Tone on colour, low hidden');
  await a3load(); await p.evaluate(()=>{ document.getElementById('dummyVisible').checked=true; updateDummySettings(); }); await enc('Tone','panel-x'); await cb('Tone','low').click(); await a3('A3i anchors shown, Tone on panel X, low hidden');
  await a3load(); await enc('Tone','panel-x'); await cb('Tone','low').click(); await enc('Tone',''); await a3('A3j Tone filtered, then taken off the picture (its filter hides nothing)');
  await a3load(); await cb('Group','A').click(); await cb('Group','B').click(); await a3('A3k every grid value hidden');
  await a3load(); await cb('Group','B').click(); await enc('Group',''); await enc('Tone',''); out('A3l filter on, then every dimension taken off the picture | header:', await stats(), '| dots', await dots(), '| message:', await p.locator('.empty-state-text').textContent());
  await enc('Tone','grid-x'); await a3('A3m then Tone put back');
  await load(D+'A4-export-differs.csv'); out('A4 export header:', (await p.evaluate(()=>generateCSV())).split('\n')[0], '| lines', (await p.evaluate(()=>generateCSV())).trim().split('\n').length);
  await p.evaluate(()=>setColumnRole('Tone','desc')); out('A4 after role change:', (await p.evaluate(()=>generateCSV())).split('\n')[0]);
  await load(D+'A5-multiline-and-quotes.csv'); out('A5:', await stats(), '| note 3:', await p.evaluate(()=>currentData.find(r=>r.ID==='3').note));
  await load(D+'A6-colour-follows-value.csv'); await enc('Focus','color'); await p.locator('#colorLegend input[type=color]').first().evaluate(el=>{el.value='#000000'; el.dispatchEvent(new Event('input',{bubbles:true}));}); await enc('Canonical','color');
  out('A6 colour of Canonical 0:', await p.evaluate(()=>getColorForValue(encodings,'0')));
  await load(D+'A7-palette-repeats.csv'); await enc('Language','color'); out('A7 Arabic/Korean colours:', await p.evaluate(()=>[getColorForValue(encodings,'Arabic'), getColorForValue(encodings,'Korean')]));
  await load(D+'A8-drag-discards-dropdown.csv'); await enc('Size','shape'); await p.dragAndDrop('.dimension-item[data-name="Tone"] .drag-handle', '.dimension-item[data-name="Region"]'); out('A8 after dropdown then drag:', await encs());
  const reqs=[]; p.on('request', r=>{ if(r.url().includes('wsrv.nl')) reqs.push('wsrv.nl'); });
  await load(D+'A9-image-proxy.csv'); await p.locator('.data-point[data-row-index]').first().click(); await p.waitForTimeout(800); out('A9 proxy requests on opening a record:', reqs.length);
  // A9 detail: the image itself is still requested; the proxy is contacted only once a snapshot is asked for (html2canvas is replaced by a stand-in, because its CDN may be unreachable)
  // Both outside hosts are answered here with a 1-pixel image, so the check does not depend on the network: without a loaded image the tool shows a placeholder and has nothing to send to the proxy.
  const PX=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64');
  for (const h of ['upload.wikimedia.org','wsrv.nl']) await p.route('**://'+h+'/**', r=>r.fulfill({status:200, contentType:'image/png', headers:{'access-control-allow-origin':'*'}, body:PX}));
  const imgReqs=[]; p.on('request', r=>{ if(new URL(r.url()).hostname==='upload.wikimedia.org') imgReqs.push(1); });
  await load(D+'A9-image-proxy.csv'); reqs.length=0; await p.locator('.data-point[data-row-index]').first().click(); await p.waitForTimeout(800);
  const open1=[imgReqs.length, reqs.length]; await p.keyboard.press('Escape'); await p.waitForTimeout(200); await p.locator('.data-point[data-row-index]').nth(2).click({modifiers:['Shift']}); await p.waitForTimeout(800); const cmp1=reqs.length;
  await p.evaluate(()=>{ window.html2canvas = async()=>{ const c=document.createElement('canvas'); c.width=c.height=2; return c; }; });
  const dl=p.waitForEvent('download',{timeout:8000}).then(d=>d.suggestedFilename()).catch(()=>'none'); await p.locator('.modal-snap-btn').first().click(); const snapFile=await dl; const afterSnap=reqs.length; const srcBack=await p.evaluate(()=>[...document.querySelectorAll('#modalOverlay .modal img')].every(i=>i.getAttribute('src').startsWith('https://upload.wikimedia.org')));
  await p.locator('.modal-snap-btn').first().click(); await p.waitForTimeout(1500);
  out('A9b open a record: image requests', open1[0], 'proxy requests', open1[1], '| open compare: proxy requests', cmp1, '| after pressing a snapshot button: proxy requests', afterSnap, 'file', snapFile, 'images restored', srcBack, '| after a second press: proxy requests', reqs.length, '| compare window open:', await p.locator('.modal.compare-modal').count(), '| button tooltip names the proxy:', await p.locator('.modal-snap-btn').first().evaluate(b=>b.title.includes('wsrv.nl')));
  out('ERRORS:', errs.filter(e=>!/favicon|ERR_|Failed to load resource/.test(e)));
  await b.close();
})();
