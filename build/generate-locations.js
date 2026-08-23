// Generates the remaining location content fragments (same format as the 20 hand-written
// ones) using a rotating-variation system, so the full 161-town list is covered without
// literal name-swapped duplication. Skips any town that already has a hand-written file.
const fs = require('fs');
const path = require('path');

const LOC_DIR = path.join(__dirname, '..', 'locations');

const FULL_LIST = ["Adamstown","Artane","Ashtown","Athgoe","Balbriggan","Baldoyle","Balgriffin","Ballinteer","Ballsbridge","Ballyboden","Ballybrack","Ballybough","Ballyboughal","Ballyfermot","Ballygall","Ballymount","Ballymun","Ballyroan","Balrothery","Barnacullia","Bayside","Beaumont","Belfield","Blackrock","Blanchardstown","Bluebell","Bohernabreena","Booterstown","Brittas","Broadstone","Cabinteely","Cabra","Carrickmines","Castleknock","Chapelizod","Cherrywood","Cherry Orchard","Churchtown","Citywest","Clondalkin","Clongriffin","Clonsilla","Clonskeagh","Clontarf","Clonturk","Coolmine","Coolock","Corduff","Cornelscourt","Crumlin","Dalkey","Damastown","Darndale","Dartry","Deansgrange","Dollymount","Dolphin's Barn","Donabate","Donaghmede","Donnybrook","Donnycarney","Drimnagh","Drumcondra","Dún Laoghaire","Dundrum","East Wall","Edmondstown","Fairview","Finglas","Firhouse","Foxrock","Garristown","Glasnevin","Glasthule","Glencullen","Glenageary","Goatstown","Grangegorman","Harold's Cross","Hollystown","Howth","Inchicore","Irishtown","Islandbridge","Jobstown","Johnstown","Kill O' The Grange","Kilbarrack","Killester","Killiney","Kilmacud","Kilmainham","Kilnamanagh","Kilternan","Kimmage","Kinsealy","Knocklyon","Leopardstown","The Liberties","Loughlinstown","Loughshinny","Lucan","Lusk","Malahide","Marino","Merrion","Milltown","Monkstown","Mount Merrion","Mulhuddart","Newcastle","Naul","North Strand","North Wall","Oldbawn","Oldtown","Ongar","Palmerstown","Perrystown","Phibsborough","Poppintree","Portmarnock","Portobello","Portrane","Raheny","Ranelagh","Rathcoole","Rathfarnham","Rathgar","Rathmichael","Rathmines","Rialto","Ringsend","Roebuck","Rockbrook","Rolestown","Rush","Saggart","Sallynoggin","Sandycove","Sandyford","Sandymount","Santry","Shankill","Skerries","Smithfield","Stepaside","Stillorgan","Stoneybatter","Sutton","Swords","Tallaght","Templeogue","Terenure","The Coombe","Ticknock","Tyrrelstown","Walkinstown","Whitechurch","Whitehall","Windy Arbour"];

function slugify(t) {
  return t.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics (Dún -> dun)
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const existing = new Set(fs.readdirSync(LOC_DIR).map(f => f.replace('.html', '')));

const INTROS = [
  (t) => `If you're searching for <strong>House Clearance ${t}</strong>, HouseClearances.ie clears houses, apartments, garages, sheds and attics across ${t} and the surrounding area — fully insured, with a free quote before any work starts.`,
  (t) => `Need a reliable <strong>House Clearance ${t}</strong> team? HouseClearances.ie handles full and partial house clearances, apartment turnarounds, and garage or attic clearouts across ${t}, with every job quoted for free.`,
  (t) => `HouseClearances.ie provides <strong>House Clearance ${t}</strong> for families, landlords, and anyone managing a property clearance in the area — fully insured, no fixed price list, and a genuine focus on recycling over landfill.`,
  (t) => `Looking for a trustworthy <strong>House Clearance ${t}</strong> service? We clear full properties, single rooms, garages, sheds and attics across ${t}, always with a free, no-obligation quote first.`,
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

function buildFragment(town, idx) {
  const intro = INTROS[idx % INTROS.length](town);
  const why = WHY[idx % WHY.length](town);
  const faqCost = FAQ_COST[idx % FAQ_COST.length](town);
  const faqSpeed = FAQ_SPEED[idx % FAQ_SPEED.length](town);
  const [svc1slug, svc1name, svc2slug, svc2name] = SPECIALIST_PAIRS[idx % SPECIALIST_PAIRS.length];

  // nearby areas: previous 2 built-list towns by list order (wrapping), for internal link distribution
  const n1 = FULL_LIST[(idx - 1 + FULL_LIST.length) % FULL_LIST.length];
  const n2 = FULL_LIST[(idx + 1) % FULL_LIST.length];
  const n1slug = slugify(n1);
  const n2slug = slugify(n2);

  const slug = slugify(town);
  const displayTown = town.replace(/'/g, '&#039;');

  return `<!--
SEO TITLE: House Clearance ${town} | HouseClearances.ie
META DESCRIPTION: House clearance across ${town} — houses, apartments, garages and attics cleared by a fully insured local team. Free quotes.
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
FULL_LIST.forEach((town, idx) => {
  const slug = slugify(town);
  if (existing.has(slug)) { skipped++; return; }
  fs.writeFileSync(path.join(LOC_DIR, slug + '.html'), buildFragment(town, idx));
  created++;
});

console.log(`Generated ${created} new location pages, skipped ${skipped} already-built (hand-written) ones.`);
