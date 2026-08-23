const http = require('http');

function get(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', () => resolve({ status: 0, body: '' }));
  });
}

async function main() {
  const BASE = 'http://localhost:8055';
  const hub = await get(BASE + '/locations/');
  const hrefs = [...hub.body.matchAll(/href="(\/locations\/[a-z0-9-]+\/)"/g)].map(m => m[1]);
  console.log(`Hub lists ${hrefs.length} location links.`);

  let checked = 0, broken = [], allLinks = new Set();
  for (const href of hrefs) {
    const r = await get(BASE + href);
    checked++;
    if (r.status !== 200) { broken.push({ page: href, status: r.status }); continue; }
    const pageLinks = [...r.body.matchAll(/href="(\/[a-z0-9-]*\/(?:[a-z0-9-]+\/)?)"/g)].map(m => m[1]);
    pageLinks.forEach(l => allLinks.add(l));
  }
  console.log(`Checked ${checked} location pages directly: ${broken.length} returned non-200.`);
  if (broken.length) console.log(JSON.stringify(broken, null, 2));

  // now check every unique internal link found across all pages
  let linkBroken = [];
  for (const link of allLinks) {
    const r = await get(BASE + link);
    if (r.status !== 200) linkBroken.push({ link, status: r.status });
  }
  console.log(`Checked ${allLinks.size} unique internal hrefs found across all pages: ${linkBroken.length} broken.`);
  if (linkBroken.length) console.log(JSON.stringify(linkBroken, null, 2));
}

main();
