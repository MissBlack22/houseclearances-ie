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
  let missing = [];
  for (const href of hrefs) {
    const r = await get(BASE + href);
    if (!r.body.includes('hero-photo')) missing.push(href);
  }
  console.log(`Checked ${hrefs.length} location pages. Missing hero photo: ${missing.length}`);
  if (missing.length) console.log(JSON.stringify(missing.slice(0,20), null, 2));
}
main();
