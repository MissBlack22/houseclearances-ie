// Generates location pages for Kildare, Wicklow, Kilkenny and Carlow towns, using the same
// rotating-variation content system as generate-locations.js, adapted for county towns
// (drops the Dublin-suburb framing, uses a county-town framing instead).
const fs = require('fs');
const path = require('path');

const LOC_DIR = path.join(__dirname, '..', 'locations');

const COUNTIES = {
  Kildare: ["Naas","Newbridge","Athy","Celbridge","Leixlip","Maynooth","Kilcock","Clane","Sallins","Kildare Town","Monasterevin","Kilcullen","Rathangan","Prosperous","Robertstown","Allenwood","Kill","Ballymore Eustace","Straffan","Castledermot","Ballitore","Moone","Nurney","Kilcullen","Johnstownbridge","Ardclough","Rathcoffey","Coill Dubh","Kildangan"],
  Wicklow: ["Bray","Greystones","Wicklow Town","Arklow","Blessington","Baltinglass","Rathdrum","Newtownmountkennedy","Kilcoole","Delgany","Enniskerry","Roundwood","Aughrim","Tinahely","Carnew","Rathnew","Ashford","Avoca","Dunlavin","Donard","Kiltegan","Shillelagh","Wicklow Gap","Redcross","Kilbride"],
  Kilkenny: ["Kilkenny City","Callan","Castlecomer","Thomastown","Graiguenamanagh","Freshford","Urlingford","Ballyragget","Piltown","Mooncoin","Bennettsbridge","Goresbridge","Kilmacow","Inistioge","Johnstown","Mullinavat"],
  Carlow: ["Carlow Town","Tullow","Bagenalstown","Borris","Hacketstown","Rathvilly","Leighlinbridge","Myshall","Ballon","Tinryland","Ballinabranna","Clonegal"],
};

function slugify(t) {
  return t.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const existing = new Set(fs.readdirSync(LOC_DIR).map(f => f.replace('.html', '')));

const INTROS = [
  (t, c) => `If you're searching for <strong>House Clearance ${t}</strong>, HouseClearances.ie clears houses, apartments, garages, sheds and attics across ${t} and the wider ${c} area — fully insured, with a free quote before any work starts.`,
  (t, c) => `Need a reliable <strong>House Clearance ${t}</strong> team? HouseClearances.ie handles full and partial house clearances, garage and shed clearouts, and attic clearances across ${t} and County ${c}, with every job quoted for free.`,
  (t, c) => `HouseClearances.ie provides <strong>House Clearance ${t}</strong> for families, landlords, and anyone managing a property clearance in ${t} and the surrounding County ${c} area — fully insured, no fixed price list.`,
  (t, c) => `Looking for a trustworthy <strong>House Clearance ${t}</strong> service? We clear full properties, single rooms, garages, sheds and attics across ${t}, always with a free, no-obligation quote first.`,
];

const WHY = [
  (t) => `We're a fully insured waste carrier, and every job in ${t} is quoted individually rather than off a fixed price list. We prioritise donation and recycling ahead of landfill, aiming for an average recycling rate of up to 95%.`,
  (t) => `Every clearance we carry out in ${t} comes with a free, no-obligation quote and a fully insured crew. Items in good condition are set aside for donation or resale rather than sent straight to landfill.`,
  (t) => `Our ${t} customers get a clear, upfront quote, a fully insured team on the day, and responsible disposal that puts reuse and recycling ahead of landfill wherever the items allow.`,
];

const FAQ_COST = [
  (t) => `Cost depends on the volume of items and how easy the property is to access. We'll always give you a free, clear quote for ${t} before any work is booked.`,
  (t) => `Every ${t} clearance is priced individually based on volume and access — get in touch for a free quote and a straight answer on price.`,
];

const FAQ_SPEED = [
  (t) => `Many clearances in ${t} can be scheduled within a few days of booking. Get in touch with your timeline and we'll confirm what's realistic.`,
  (t) => `We can often turn around a ${t} clearance quickly — tell us your deadline and we'll do our best to work to it.`,
];

const SPECIALIST_PAIRS = [
  ['garage-clearance', 'Garage Clearance', 'attic-clearance', 'Attic Clearance'],
  ['apartment-clearance', 'Apartment Clearance', 'shed-clearance', 'Shed Clearance'],
  ['attic-clearance', 'Attic Clearance', 'bereavement-clearance', 'Bereavement Clearance'],
  ['shed-clearance', 'Shed Clearance', 'garage-clearance', 'Garage Clearance'],
];

function buildFragment(town, county, idx, neighbours) {
  const intro = INTROS[idx % INTROS.length](town, county);
  const why = WHY[idx % WHY.length](town);
  const faqCost = FAQ_COST[idx % FAQ_COST.length](town);
  const faqSpeed = FAQ_SPEED[idx % FAQ_SPEED.length](town);
  const [svc1slug, svc1name, svc2slug, svc2name] = SPECIALIST_PAIRS[idx % SPECIALIST_PAIRS.length];

  const n1 = neighbours[0], n2 = neighbours[1];
  const n1slug = slugify(n1), n2slug = slugify(n2);
  const slug = slugify(town);
  const displayTown = town.replace(/'/g, '&#039;');

  return `<!--
SEO TITLE: House Clearance ${town} | HouseClearances.ie
META DESCRIPTION: House clearance across ${town}, Co. ${county} — houses, apartments, garages and attics cleared by a fully insured local team. Free quotes.
FOCUS KEYWORD: House Clearance ${town}
URL SLUG: /locations/${slug}/
-->

<h1>House Clearance in ${displayTown}</h1>

<p>${intro}</p>

<h2>House Clearance Services in ${displayTown}</h2>

<p>Whether it's a full property, a single room, or a garage and attic alongside the main house, we quote for the job as a whole rather than treating each space separately. Every quote is free and comes with no obligation to book.</p>

<h2>What We Can Clear</h2>

<ul>
<li>Full and partial house clearances</li>
<li>Apartment clearances</li>
<li>Garage and shed clearances</li>
<li>Attic clearances</li>
<li>Bereavement and estate clearances</li>
</ul>

<h2>Relevant Specialist Services</h2>

<p>Alongside a standard <a href="/house-clearance/">house clearance</a>, our <a href="/${svc1slug}/">${svc1name}</a> and <a href="/${svc2slug}/">${svc2name}</a> services are commonly requested together in ${displayTown}.</p>

<h2>Why Choose HouseClearances.ie</h2>

<p>${why}</p>

<h2>How the Clearance Process Works</h2>

<ol>
<li>Get in touch with details of what needs clearing.</li>
<li>We provide a free, no-obligation quote.</li>
<li>We agree a time that works for you.</li>
<li>We clear the property, sorting items responsibly.</li>
<li>The property is left clean and ready for its next step.</li>
</ol>

<h2>Nearby Areas We Serve</h2>

<p>Alongside ${displayTown}, we regularly work in <a href="/locations/${n1slug}/">${n1}</a> and <a href="/locations/${n2slug}/">${n2}</a> — see our <a href="/locations/">full list of areas covered</a> for more.</p>

<h2>Frequently Asked Questions</h2>

<h3>How much does a house clearance in ${displayTown} cost?</h3>
<p>${faqCost}</p>

<h3>How quickly can you clear a property in ${displayTown}?</h3>
<p>${faqSpeed}</p>

<h3>Do you recycle or donate items during a clearance?</h3>
<p>Yes — we sort items for recycling and reuse wherever possible as part of every clearance, rather than sending everything straight to landfill.</p>

<h2>Request a Quote</h2>
<p>Tell us what needs clearing in ${displayTown} and we'll get back to you with a free, no-obligation quote.</p>
<!-- [CONTACT FORM PLACEHOLDER] -->
`;
}

let created = 0, skipped = 0;
let globalIdx = 0;
for (const [county, towns] of Object.entries(COUNTIES)) {
  towns.forEach((town, i) => {
    const slug = slugify(town);
    globalIdx++;
    if (existing.has(slug)) { skipped++; return; }
    const n1 = towns[(i - 1 + towns.length) % towns.length];
    const n2 = towns[(i + 1) % towns.length];
    fs.writeFileSync(path.join(LOC_DIR, slug + '.html'), buildFragment(town, county, globalIdx, [n1, n2]));
    created++;
  });
}

console.log(`Generated ${created} new county-town pages (Kildare/Wicklow/Kilkenny/Carlow), skipped ${skipped} duplicates.`);
