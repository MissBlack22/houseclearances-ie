// Appends 3 more FAQ items to every existing location page's FAQ section, in place.
const fs = require('fs');
const path = require('path');

const LOC_DIR = path.join(__dirname, '..', 'locations');

function extraFaqs(town) {
  return `
<h3>Are you insured?</h3>
<p>Yes — we're a fully insured waste carrier holding a valid Waste Collection Permit, so you're covered throughout the ${town} clearance.</p>

<h3>Do I need to be present during the clearance?</h3>
<p>Not necessarily — as long as access is arranged in advance, many clients aren't there for the whole job. Let us know what works best for you.</p>

<h3>Do you cover areas near ${town}?</h3>
<p>Yes — see our <a href="/locations/">full list of areas covered</a> across Dublin and Leinster, or just ask when you get in touch.</p>
`;
}

let updated = 0, skipped = 0;
for (const file of fs.readdirSync(LOC_DIR)) {
  const filePath = path.join(LOC_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('Do I need to be present during the clearance?')) { skipped++; continue; }

  const h1Match = content.match(/<h1>House Clearance in (.*?)<\/h1>/);
  const town = h1Match ? h1Match[1].replace(/&#039;/g, "'") : '';

  const anchor = '<h2>Request a Quote</h2>';
  const idx = content.indexOf(anchor);
  if (idx === -1) { console.log('NO ANCHOR:', file); continue; }

  content = content.slice(0, idx) + extraFaqs(town) + '\n' + content.slice(idx);
  fs.writeFileSync(filePath, content);
  updated++;
}
console.log(`Updated ${updated} location files, skipped ${skipped} already-updated.`);
