// Link check. Usage: node tools/checks/links.js [port]   (the built site must be served under /PLeW/ on that port)
const { chromium } = require('playwright'); const fs=require('fs'); const os=require('os'); const path=require('path'); const ROOT=path.resolve(__dirname,'../..')+'/'; const PORT=process.argv[2]||'8765'; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'plew-check-'));
const ORIGIN='http://localhost:'+PORT, BASE='/PLeW/', REPO='https://github.com/len-sprague/PLeW/blob/main/';
const starts=['', 'examples/', 'examples/zoo/', 'guide/', 'design/', 'code-map/'];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); let total=0, bad=0; const ext=new Set();
  for (const s of starts) {
    await p.goto(ORIGIN+BASE+s); await p.waitForTimeout(300);
    const links = await p.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim().slice(0,40), raw:a.getAttribute('href'), href:a.href})));
    for (const l of links) {
      total++; let verdict='ok';
      const u = new URL(l.href);
      if (u.origin===ORIGIN) {
        if (!u.pathname.startsWith(BASE)) verdict='LEAVES SITE FOLDER -> '+u.pathname;
        else {
          const r = await p.request.get(u.origin+u.pathname); if (r.status()!==200) verdict='HTTP '+r.status();
          else if (u.hash) { const html=await r.text(); const id=decodeURIComponent(u.hash.slice(1)); if(!html.includes(`id="${id}"`)) verdict='ANCHOR MISSING '+u.hash; }
        }
      } else if (l.href.startsWith(REPO)) {
        const f=decodeURIComponent(u.pathname.split('/blob/main/')[1]); if(!fs.existsSync(ROOT+f)) verdict='REPO FILE MISSING '+f;
      } else { ext.add(l.href); verdict='external (not fetched)'; }
      if (verdict!=='ok' && !verdict.startsWith('external')) { bad++; console.log(`FAIL  page /${s}  "${l.text}"  href="${l.raw}"  ${verdict}`); }
    }
    console.log(`page /${s}: ${links.length} links`);
  }
  console.log(`TOTAL ${total} links, ${bad} failed. External, listed only:`, [...ext]);
  await b.close();
})();
