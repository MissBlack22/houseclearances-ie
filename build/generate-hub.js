// Regenerates locations-hub.html by reading every location fragment's town name/slug.
const fs = require('fs');
const path = require('path');

const LOC_DIR = path.join(__dirname, '..', 'locations');
const OUT = path.join(__dirname, '..', 'locations-hub.html');

const towns = fs.readdirSync(LOC_DIR).map(file => {
  const raw = fs.readFileSync(path.join(LOC_DIR, file), 'utf8');
  const slugMatch = raw.match(/URL SLUG:\s*(.+)/);
  const h1Match = raw.match(/<h1>House Clearance in (.*?)<\/h1>/);
  return { name: h1Match ? h1Match[1] : file, slug: slugMatch ? slugMatch[1].trim() : `/locations/${file.replace('.html', '')}/` };
}).sort((a, b) => a.name.localeCompare(b.name));

const listItems = towns.map(t => `<li><a href="${t.slug}">${t.name}</a></li>`).join('\n');

const content = `<!--
SEO TITLE: Areas We Cover | House Clearance Dublin & Leinster | HouseClearances.ie
META DESCRIPTION: House clearance areas covered across Dublin and Leinster — ${towns.length} locations listed. Free quotes.
URL SLUG: /locations/
-->

<h1>Areas We Cover</h1>

<p>HouseClearances.ie covers house, apartment, garage, shed, attic and storage clearance across Dublin and the wider Leinster area. Below are all ${towns.length} areas with a dedicated local page.</p>

<h2>All Areas (A&ndash;Z)</h2>
<ul class="location-grid">
${listItems}
</ul>

<h2>Get a Free Quote</h2>
<p>Tell us your area and what needs clearing — we'll get back to you with a free, no-obligation quote.</p>
<!-- [CONTACT FORM PLACEHOLDER] -->
`;

fs.writeFileSync(OUT, content);
console.log(`Hub page regenerated with ${towns.length} locations.`);
