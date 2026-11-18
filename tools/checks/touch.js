// Touch record: press-and-hold dragging on phones and tablets (FEATURE: touch-drag). One line per check.
// Usage: node tools/checks/touch.js [port] > out.txt ; run on the old and the new build and diff the outputs.
// Touches are sent through the browser's DevTools protocol (Input.dispatchTouchEvent) in a phone-sized,
// touch-enabled page. This is an emulation: it shows the tool's own code works, not how a real phone's
// browser treats a long press. Check on a real iPhone and Android phone as well.
const { chromium, devices } = require('playwright'); const path = require('path');
const PORT = process.argv[2] || '8765'; const U = 'http://localhost:' + PORT + '/PLeW/'; const CSV = path.join(__dirname, 'smoke.csv');
const out = (...a) => console.log(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));
const HOLD = 450; // must match TOUCH_LONG_PRESS_MS in the tool; the checks hold for HOLD+250 and tap for HOLD-200

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 120)); });
  p.on('dialog', d => d.accept());
  const c = await ctx.newCDPSession(p);
  const touch = (type, pts) => c.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const wait = ms => p.waitForTimeout(ms);
  const centre = async sel => { const r = await p.locator(sel).first().boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
  const glide = async (from, to, steps = 8) => { for (let i = 1; i <= steps; i++) { await touch('touchMove', [{ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }]); await wait(16); } };
  const row = i => p.evaluate(i => JSON.stringify(currentData[i]), i);
  const state = () => p.evaluate(() => ({
    modified: modifiedRows.size, log: changeLog.length, undo: undoStack.length,
    record: document.getElementById('modalOverlay').classList.contains('active'),
    menu: document.getElementById('contextMenu').classList.contains('visible'),
    ghosts: document.querySelectorAll('.touch-drag-ghost').length,
    highlighted: document.querySelectorAll('.drop-target').length,
    dragging: document.querySelectorAll('.data-point.dragging').length,
    held: typeof touchDrag === 'undefined' ? 'no feature' : touchDrag === null ? 'none' : 'still held'
  }));
  const reset = async () => { await p.evaluate(() => { closeContextMenu(); closeModal(); clearSelection(); }); await wait(450); /* record window fades out over 0.3 s */ };
  const load = async () => { await p.goto(U); await p.setInputFiles('#fileInput', CSV); await p.waitForFunction(() => currentData !== null); await wait(700); /* sidebar slide-in settles */ await p.evaluate(() => { document.querySelector('.main-area').scrollTo(0, 0); window.scrollTo(0, 0); }); };
  // A target cell in another panel, centred on screen so no edge scrolling interferes.
  const pickTarget = () => p.evaluate(() => {
    const mine = document.querySelector('.data-point[data-row-index="0"]').closest('.panel-cell');
    const cell = [...document.querySelectorAll('.panel-cell')].find(c => c !== mine && c.closest('.grid') !== mine.closest('.grid') && (() => { const r = c.getBoundingClientRect(); return r.left > 50 && r.right < innerWidth - 50 && r.top > 50 && r.bottom < innerHeight - 50; })());
    if (!cell) return null;
    cell.scrollIntoView({ block: 'center', inline: 'center' });
    const i = [...document.querySelectorAll('.panel-cell')].indexOf(cell); return i;
  });

  await load();
  out('T0 feature present:', await p.evaluate(() => typeof TOUCH_LONG_PRESS_MS === 'undefined' ? 'no' : 'hold ' + TOUCH_LONG_PRESS_MS + ' ms'), '| dots', await p.locator('.data-point[data-row-index]').count());

  // T1 quick tap: record window opens, nothing changes
  let before = await row(0); let a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(80); await touch('touchEnd', []); await wait(300);
  out('T1 tap: record window', (await state()).record, '| row unchanged', before === await row(0), '| state', await state());
  await reset();

  // T2 touch shorter than the hold: still a tap
  a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(HOLD - 200); await touch('touchEnd', []); await wait(300);
  out('T2 touch for', HOLD - 200, 'ms: record window', (await state()).record, '| menu', (await state()).menu, '| row unchanged', before === await row(0));
  await reset();

  // T3 hold and let go in place: colour / shape menu, no record window, nothing changed; then pick a colour from the menu
  a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(HOLD + 250); const during = await state(); await touch('touchEnd', []); await wait(300);
  const s3 = await state();
  out('T3 hold in place: during hold ghost', during.ghosts, 'dot dimmed', during.dragging, '| after release menu', s3.menu, '| record window', s3.record, '| row unchanged', before === await row(0), '| cleaned up', s3.ghosts === 0 && s3.highlighted === 0 && s3.dragging === 0 && s3.held === 'none');
  const colField = await p.evaluate(() => encodings.color ? dimKey(encodings.color) : null);
  if (s3.menu && colField) {
    const oldC = await p.evaluate(f => currentData[0][f], colField);
    const o = await centre('#colorGrid .color-option:not(.selected)'); await touch('touchStart', [o]); await wait(60); await touch('touchEnd', []); await wait(300);
    out('T3b tap a colour in the menu:', colField, 'changed', oldC !== await p.evaluate(f => currentData[0][f], colField), '| modified', (await state()).modified, '| menu closed', !(await state()).menu);
    await p.evaluate(() => undo());
  } else out('T3b skipped: no menu or no colour placement');
  await reset();

  // T4 hold, move to a cell in another panel, let go: row takes that cell's values; undo / redo
  await load(); before = await row(0);
  const ti = await pickTarget(); a = await centre('.data-point[data-row-index="0"]');
  const tc = await p.locator('.panel-cell').nth(ti).boundingBox(); const tgt = { x: tc.x + tc.width / 2, y: tc.y + tc.height / 2 };
  const expect = await p.evaluate(i => typeof touchDropCellValues === 'undefined' ? 'no feature' : touchDropCellValues.get(document.querySelectorAll('.panel-cell')[i]), ti);
  await touch('touchStart', [a]); await wait(HOLD + 250); await glide(a, tgt); await wait(100);
  const mid = await state(); const dotsMid = await p.locator('.data-point[data-row-index]').count();
  await touch('touchEnd', []); await wait(400);
  const got = await p.evaluate(() => { const r = currentData[0]; return [encodings.gridX, encodings.gridY, encodings.panelX, encodings.panelY].map(d => d ? r[dimKey(d)] : ''); });
  const s4 = await state();
  out('T4 hold and drag: during drag highlighted cells', mid.highlighted, 'ghost', mid.ghosts, 'dots', dotsMid, '| row changed', before !== await row(0), '| row now has the cell\'s values', JSON.stringify(got) === JSON.stringify(expect), '| modified', s4.modified, 'log', s4.log, 'undo steps', s4.undo, '| ring', await p.locator('.data-point.modified').count(), '| record window', s4.record, 'menu', s4.menu, '| cleaned up', s4.ghosts === 0 && s4.highlighted === 0 && s4.held === 'none');
  await p.evaluate(() => undo()); out('T4 undo (sidebar Undo button): restored', before === await row(0), '| modified', (await state()).modified);
  await p.evaluate(() => redo()); out('T4 redo: modified', (await state()).modified, '| log', (await state()).log);

  // T5 swipe that starts on a dot (moves before the hold completes): nothing picked up, nothing changed
  await load(); before = await row(0); a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(60); await glide(a, { x: a.x - 120, y: a.y - 200 }, 6); await wait(HOLD + 100); const s5mid = await state(); await touch('touchEnd', []); await wait(300);
  const s5 = await state();
  out('T5 swipe from a dot: picked up', s5mid.ghosts > 0, '| row unchanged', before === await row(0), '| record window', s5.record, 'menu', s5.menu, '| modified', s5.modified);
  await reset();

  // T6 hold, move, let go outside the grid (on the header): nothing changes
  await load(); before = await row(0); a = await centre('.data-point[data-row-index="0"]');
  const hdr = await centre('#vizStats');
  await touch('touchStart', [a]); await wait(HOLD + 250); await glide(a, { x: hdr.x, y: Math.max(hdr.y, 60) }); await wait(50); await touch('touchEnd', []); await wait(300);
  const s6 = await state();
  out('T6 let go outside the grid: row unchanged', before === await row(0), '| modified', s6.modified, '| menu', s6.menu, 'record window', s6.record, '| cleaned up', s6.ghosts === 0 && s6.highlighted === 0 && s6.held === 'none');
  await reset();

  // T7 hold, move back to its own cell, let go: no change, no menu
  await load(); before = await row(0); a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(HOLD + 250); await glide(a, { x: a.x + 40, y: a.y }, 4); await glide({ x: a.x + 40, y: a.y }, a, 4); await touch('touchEnd', []); await wait(300);
  const s7 = await state();
  out('T7 moved and brought back: row unchanged', before === await row(0), '| modified', s7.modified, '| undo steps', s7.undo, '| menu', s7.menu);
  await reset();

  // T8 second finger during the hold cancels it (pinch zoom)
  await load(); before = await row(0); a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(150); await touch('touchStart', [a, { x: a.x + 80, y: a.y + 80 }]); await wait(HOLD + 100); const s8mid = await state(); await touch('touchEnd', []); await wait(300);
  out('T8 second finger: held after', s8mid.held, 'ghost', s8mid.ghosts, '| row unchanged', before === await row(0), '| menu', (await state()).menu);
  await reset();

  // T9 touch cancelled by the browser mid-drag: nothing changes, everything cleaned up
  await load(); before = await row(0); a = await centre('.data-point[data-row-index="0"]');
  await touch('touchStart', [a]); await wait(HOLD + 250); await glide(a, { x: a.x + 60, y: a.y + 60 }, 4); await touch('touchCancel', []); await wait(300);
  const s9 = await state();
  out('T9 touch cancelled: row unchanged', before === await row(0), '| cleaned up', s9.ghosts === 0 && s9.highlighted === 0 && s9.dragging === 0 && s9.held === 'none', '| menu', s9.menu);

  // T10 edge scrolling: hold, then rest the finger at the right edge, then the bottom edge, of the screen; the view scrolls
  await load(); a = await centre('.data-point[data-row-index="0"]');
  const scrollPos = () => p.evaluate(() => { const v = document.getElementById('vizContainer'), m = document.querySelector('.main-area'), g = document.scrollingElement;
    return { side: v.scrollLeft + m.scrollLeft + g.scrollLeft, down: v.scrollTop + m.scrollTop + g.scrollTop, canSide: v.scrollWidth > v.clientWidth || m.scrollWidth > m.clientWidth || g.scrollWidth > g.clientWidth }; });
  const vw = await p.evaluate(() => innerWidth), vh = await p.evaluate(() => innerHeight);
  const p0 = await scrollPos(); before = await row(0);
  await touch('touchStart', [a]); await wait(HOLD + 250); await glide(a, { x: vw - 4, y: a.y }); await wait(600); const p1 = await scrollPos();
  await glide({ x: vw - 4, y: a.y }, { x: vw / 2, y: vh - 4 }); await wait(600); const p2 = await scrollPos();
  await touch('touchCancel', []); await wait(200);
  out('T10 edge scrolling: view can scroll sideways', p0.canSide, '| sideways at right edge', p1.side > p0.side, '| down at bottom edge', p2.down > p1.down, '| row unchanged after cancel', before === await row(0));

  // T11 anchors shown: an anchor dot cannot be picked up
  await load(); await p.evaluate(() => { document.getElementById('dummyVisible').checked = true; updateDummySettings(); });
  const anc = await p.locator('.data-point.dummy-point:not(.hidden-dummy)').count();
  if (anc) { const r = await p.locator('.data-point.dummy-point').first().boundingBox(); const ap = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    await touch('touchStart', [ap]); await wait(HOLD + 250); const s11 = await state(); await touch('touchEnd', []); await wait(200);
    out('T11 hold an anchor: picked up', s11.ghosts > 0, '| menu', (await state()).menu, '| modified', (await state()).modified);
  } else out('T11 skipped: no anchor drawn');
  await reset();

  // T12 the mouse still works after touch use (same page): mouse drag reclassifies
  await load(); before = await row(0);
  const mt = await p.evaluate(() => { const all = [...document.querySelectorAll('.panel-cell')]; const mine = document.querySelector('.data-point[data-row-index="0"]').closest('.panel-cell'); return all.findIndex(c => c !== mine && c.closest('.grid') !== mine.closest('.grid')); });
  await p.locator('.data-point[data-row-index="0"]').dragTo(p.locator('.panel-cell').nth(mt));
  out('T12 mouse drag in the same page: row changed', before !== await row(0), '| modified', (await state()).modified);

  // T13 example page (the other tool file): hold and drag works there too
  await p.goto(U + 'examples/zoo/'); await p.waitForSelector('.data-point[data-row-index]');
  const ez = await p.evaluate(() => {
    const pts = [...document.querySelectorAll('.data-point[data-row-index]')];
    for (const pt of pts) { const mine = pt.closest('.panel-cell'); const cell = [...document.querySelectorAll('.panel-cell')].find(c => c !== mine && c.closest('.grid') !== mine.closest('.grid'));
      if (cell) { return { idx: +pt.dataset.rowIndex, cell: [...document.querySelectorAll('.panel-cell')].indexOf(cell) }; } }
    return null; });
  if (ez) {
    const eb = await row(ez.idx); await p.locator('.panel-cell').nth(ez.cell).scrollIntoViewIfNeeded();
    await p.locator(`.data-point[data-row-index="${ez.idx}"]`).scrollIntoViewIfNeeded();
    const ea = await centre(`.data-point[data-row-index="${ez.idx}"]`); const ec = await p.locator('.panel-cell').nth(ez.cell).boundingBox();
    const inView = ec.y > 0 && ec.y + ec.height < (await p.evaluate(() => innerHeight)) && ec.x > 0 && ec.x + ec.width < vw;
    await touch('touchStart', [ea]); await wait(HOLD + 250); await glide(ea, { x: ec.x + ec.width / 2, y: ec.y + ec.height / 2 }); await wait(80); await touch('touchEnd', []); await wait(400);
    out('T13 example page zoo: target on screen', inView, '| row changed', eb !== await row(ez.idx), '| modified', (await state()).modified, '| cleaned up', (await state()).ghosts === 0);
  } else out('T13 skipped: no second panel on the example page');

  out('ERRORS:', errs.filter(e => !/favicon|ERR_|Failed to load resource/.test(e)));
  await b.close();
})();
