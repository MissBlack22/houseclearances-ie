// Static site builder for houseclearances.ie — wraps content fragments into full
// pages with shared header/nav/footer, outputs clean-URL folder/index.html structure
// ready for a straight Netlify drag-and-drop deploy.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const NAV_SERVICES = [
  ['House Clearance', '/house-clearance/'],
  ['Apartment Clearance', '/apartment-clearance/'],
  ['Shed Clearance', '/shed-clearance/'],
  ['Garage Clearance', '/garage-clearance/'],
  ['Attic Clearance', '/attic-clearance/'],
  ['Storage Unit Clearance', '/storage-unit-clearance/'],
  ['Warehouse Clearance', '/warehouse-clearance/'],
  ['Hoarder Clearance', '/hoarder-clearance/'],
  ['Bereavement Clearance', '/bereavement-clearance/'],
  ['Office Clearance', '/office-clearance/'],
  ['End of Tenancy Clearance', '/end-of-tenancy-clearance/'],
  ['Garden Waste Clearance', '/garden-waste-clearance/'],
];

// Genuine 5-star Google reviews from the operator's real Google Business Profile
// ("House Clearance Spotless" — spotless.ie, 5.0/57 reviews, all 5-star). Sourced directly
// from Google Maps by the site owner (Ciprian), named as the person these reviews are about.
// Text is the reviewer's own words as shown publicly on Google (some truncated by Google's own
// "... More" — left as-is rather than guessing the rest). Tags used to place relevant reviews on matching pages.
const REVIEWS = [
  { id: 'lucinda', name: 'Lucinda Gallwey', time: '2 months ago', tags: ['bereavement','apartment'],
    text: `Ciprian and his team were so sympathetic and efficient when I contacted them to help clear out the apartment after a bereavement. The came and were very respectful in clearing completely everything, rubbish, books, clothes, kitchen, living…` },
  { id: 'marian', name: 'Marian', time: '8 months ago', tags: ['attic'],
    text: `I found Ciprians company on a Google search as I needed help with a very cluttered attic. I liked that the website said he would allow sorting and keeping on the day as I was as hoping to find items not seen for a long time. All other…` },
  { id: 'irene', name: 'Irene Whelan', time: '2 months ago', tags: ['house'],
    text: `I highly recommend Ciprian and his team. From my first contact to booking, everything was handled professionally and efficiently.` },
  { id: 'kay', name: 'Kay Waldron', time: '2 months ago', tags: ['bereavement','house'],
    text: `Excellent service clearing a full house following a bereavement. Ciprian and crew were professional, highly efficient with good communication and completed the job within two days as promised. Their fees were very reasonable and there were…` },
  { id: 'sinead-g', name: 'Sinead Galligan', time: '4 months ago', tags: ['house'],
    text: `Would highly recommend Ciprian! Himself & his colleague did an excellent job on a house clearance recently. They were extremely thorough, professional & efficient. They arrived promptly & there was good communication with Ciprian who was easy to contact. A job well done.` },
  { id: 'dave', name: 'dave hamilton', time: '3 months ago', tags: ['bereavement'],
    text: `We got Ciprian in to do a bereavement house clearance and I couldn't recommend him higher. They made what was really a difficult experience for us so much easier and Ciprian was a gentleman throughout and very understanding of what we were…` },
  { id: 'fiona', name: 'Fiona White', time: 'a month ago', tags: ['house'],
    text: `An excellent service! Ciprian arrived promptly and worked flat out with his team until the house was clear. It really was a job well done and a big relief for me. Thank you Ciprian.` },
  { id: 'sinead-j', name: 'Sinead James', time: '2 months ago', tags: ['shed','house'],
    text: `Ciprian and the team did a fantastic job clearing our full house plus our shed in a day and a half. They were very professional, clean and so quick. I highly recommend these guys.` },
  { id: 'denis', name: 'Denis Nolan', time: '2 months ago', tags: ['bereavement'],
    text: `Ciprian and Brian and Willie were great. They cleared out our mom's house after she passed away last year. Professional, organized, empathetic and resourceful. It was a job we were dreading but they did it quickly with no fuss. I've never made an effort to make a recommendation online but Ciprian exceeded expectations.` },
  { id: 'brian', name: 'Brian Plumley', time: '4 months ago', tags: ['house'],
    text: `Ciprian was a pleasure to work with and he and his crew worked exceptionally hard to clear my dad's house. I am very pleased with the service and the results. Two thumbs up and I would recommend them to anyone.` },
  { id: 'star-sign', name: 'Star Sign', time: '6 months ago', tags: ['house'],
    text: `Absolutely a top job100% completed by Ciprian's company. 2 bed cottage in Dublin cleared out of all old contents and cleaned, in one and a half days.. promp replies and answers to questions, highly recommend this company.` },
  { id: 'marie-walsh', name: 'Marie Walsh', time: '6 months ago', tags: ['attic','shed'],
    text: `We were looking for somebody to clear out the attic and dismantle a large shed in bad condition. During an Internet search I found Ciprians company. I got in contact and he was there in a couple of days. Himself and his crew did a brilliant…` },
  { id: 'robbie', name: "Robbie O'Donoghue", time: '4 months ago', tags: ['house'],
    text: `I cannot recommend Ciprian and his team enough!! Courteous, professional, exceptionally hard-working and meticulous. Jovial, considerate, and laser-focussed on their clients' needs and objectives, Ciprian is as reliable as he is a "master…` },
  { id: 'shane', name: 'Shane Curran', time: 'a month ago', tags: ['house'],
    text: `Absolutely delighted with the work from Ciprian today... it was a big job for one large room... it looks amazing now with the beds and clutter gone. Thanks again.` },
  { id: 'richard', name: 'Richard Case', time: '5 months ago', tags: ['house'],
    text: `Ciprian and the team at Krystal Klean did a great job clearing out the house, they were very polite, arrived on time and took the headache away from my family having to do the clear out, would highly recommend the service` },
  { id: 'eileen', name: 'Eileen Dooley', time: '3 months ago', tags: ['shed','house'],
    text: `Got to say Ciprian was fast and thorough. He found rubbish in a shed we'd forgotten about - and offered to take that too - no extra charge. Highly recommend` },
  { id: 'patricia', name: 'Patricia Charles', time: '5 months ago', tags: ['bereavement'],
    text: `Following the sad passing of our mother, Ciprian and his team cleared her property with kind, efficient sensitivity that made the process very easy. Very grateful for the good work and would highly recommend them.` },
  { id: 'paul', name: 'Paul Kinsella', time: '5 months ago', tags: ['house'],
    text: `Ciprian, Brian and team did an amazing job on a full house clearance for me. Can't recommend them highly enough - professional in all aspects.` },
  { id: 'siobhan', name: 'Siobhan Devlin', time: '11 months ago', tags: ['hoarder','attic'],
    text: `Thanks so much to Krystal Klean Express Limited who made a daunting task manageable. We had to clear out our grandparents' house, who were hoarders… with artefacts from the early 1900's! There was excellent communication from the first…` },
];

function starRow() {
  return `<span class="stars" aria-hidden="true">★★★★★</span>`;
}

function reviewCard(r) {
  const initial = r.name.trim().charAt(0).toUpperCase();
  return `<div class="review-card">
    <div class="review-head">
      <div class="review-avatar">${initial}</div>
      <div>
        <div class="review-name">${r.name}</div>
        ${starRow()}<span class="review-time">${r.time}</span>
      </div>
    </div>
    <p class="review-text">${r.text}</p>
  </div>`;
}

function reviewsSection(tag, heading, includeSchema) {
  const matches = tag ? REVIEWS.filter(r => r.tags.includes(tag)) : REVIEWS;
  const picked = matches.slice(0, tag ? 6 : 9);
  let schemaTag = '';
  if (includeSchema) {
    const reviewSchema = picked.map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.name },
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": r.text
    }));
    schemaTag = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "HouseClearances.ie",
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "57" },
      "review": reviewSchema
    })}</script>`;
  }
  return `<section class="reviews-section" id="reviews">
    <h2>${heading}</h2>
    <div class="reviews-summary"><span class="stars-big">★★★★★</span> <strong>5.0</strong> from 57 Google reviews</div>
    <div class="reviews-grid">
      ${picked.map(reviewCard).join('\n      ')}
    </div>
    <p class="reviews-source">Genuine customer reviews from <a href="https://www.google.com/maps/place/House+Clearance+Spotless/data=!4m7!3m6!1s0x4ea876d84493a21b:0xa8ecd987d79760e5" target="_blank" rel="noopener">our Google Business Profile</a>.</p>
    ${schemaTag}
  </section>`;
}

function trustBadge() {
  return `<div class="trust-badge"><span class="stars">★★★★★</span> <strong>5.0</strong> rated on Google &middot; <a href="/#reviews">57 reviews</a></div>`;
}

// Genuine job photos (privacy-screened — no visible personal mail, documents, or faces),
// sourced from the owner's own camera roll. Used as a "Recent Work" gallery across pages —
// honestly labelled as recent work, not claimed as before/after pairs since no matching
// after-shots were found for these particular jobs.
const GALLERY_IMAGES = [
  ['van-loaded-clearance.jpg', 'A van loaded with furniture and belongings during a clearance'],
  ['storage-unit-facility.jpg', 'A row of self-storage units cleared by HouseClearances.ie'],
  ['garage-clutter-clearance.jpg', 'A cluttered garage full of tools and furniture before clearance'],
  ['attic-skylight-boxes.jpg', 'An attic room full of boxes ready for clearance'],
  ['kitchen-house-clearance.jpg', 'A kitchen and dining area cleared during a house clearance'],
  ['living-room-house-clearance.jpg', 'A living room cleared as part of a house clearance'],
  ['bereavement-bedroom-clearance.jpg', 'A bedroom cleared with care during a bereavement clearance'],
  ['hoarder-bedroom-clearance.jpg', 'A bedroom with accumulated belongings cleared discreetly'],
  ['shed-garden-exterior.jpg', 'An overgrown garden and shed exterior before clearance'],
  ['garage-storage-clutter.jpg', 'A storage bin of cables and tools cleared from a garage'],
  ['furniture-storage-room.jpg', 'A room full of furniture cleared during a house clearance'],
  ['leather-sofa-clearance.jpg', 'A sofa removed as part of a furniture clearance'],
  ['living-room-display-cabinet.jpg', 'A living room display cabinet cleared during a house clearance'],
  ['attic-hatch-boxes.jpg', 'Boxes being cleared through an attic hatch'],
  ['bedroom-cleared-after.jpg', 'A bedroom left empty and cleared after a clearance'],
  ['room-empty-after-clearance.jpg', 'A room fully cleared and ready after a house clearance'],
  ['kitchen-cleared-cabinets.jpg', 'A kitchen cleared of contents during a house clearance'],
  ['van-timber-load.jpg', 'Timber and household items loaded into the clearance van'],
];

function gallerySection() {
  const items = GALLERY_IMAGES.map(([file, alt]) =>
    `<img src="/images/${file}" alt="${alt}" loading="lazy">`
  ).join('\n      ');
  return `<section class="gallery-section">
    <h2>Recent Work</h2>
    <p class="gallery-note">A selection of genuine photos from recent clearances — not staged, not stock.</p>
    <div class="photo-gallery">
      ${items}
    </div>
  </section>`;
}

function formatBlogDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function parseFragment(raw) {
  const commentMatch = raw.match(/<!--([\s\S]*?)-->/);
  const meta = {};
  if (commentMatch) {
    const block = commentMatch[1];
    const grab = (key) => {
      const m = block.match(new RegExp(key + ':\\s*(.+)'));
      return m ? m[1].trim() : '';
    };
    meta.title = grab('SEO TITLE');
    meta.description = grab('META DESCRIPTION');
    meta.slug = grab('URL SLUG');
    meta.date = grab('DATE');
    meta.image = grab('IMAGE');
    meta.imageAlt = grab('IMAGE ALT');
    meta.excerpt = grab('EXCERPT');
  }
  const body = raw.slice(commentMatch ? commentMatch.index + commentMatch[0].length : 0).trim();
  const h1Match = body.match(/<h1>(.*?)<\/h1>/);
  meta.h1 = h1Match ? h1Match[1] : meta.title;
  return { meta, body };
}

function page(meta, body, breadcrumb) {
  const formHtml = `
  <div class="quote-form">
    <h3>Request a Free Quote</h3>
    <form name="quote-request" method="POST" action="/thank-you/" data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="quote-request">
      <p class="form-hidden"><label>Don't fill this out if you're human: <input name="bot-field"></label></p>
      <div class="form-row">
        <input type="text" name="name" placeholder="Your name" required>
        <input type="tel" name="phone" placeholder="Phone number" required>
      </div>
      <input type="email" name="email" placeholder="Email address" required>
      <textarea name="message" placeholder="What needs clearing?" rows="3" required></textarea>
      <button type="submit">Get My Free Quote</button>
    </form>
  </div>`;
  const bodyWithForm = body.replace(/<!-- \[CONTACT FORM PLACEHOLDER\] -->/g, formHtml);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="https://houseclearances.ie${meta.slug}">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo">
      <span class="logo-house">House</span><span class="logo-clearances">Clearances</span><span class="logo-ie">.ie</span>
    </a>
    <nav class="main-nav">
      <div class="nav-dropdown">
        <span>Services ▾</span>
        <div class="dropdown-menu">
          ${NAV_SERVICES.map(([name, url]) => `<a href="${url}">${name}</a>`).join('\n          ')}
        </div>
      </div>
      <a href="/locations/">Areas We Cover</a>
      <a href="/blog/">Blog</a>
    </nav>
    <a href="tel:+353830904545" class="header-cta"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> 083 090 4545</a>
  </div>
</header>

${breadcrumb ? `<div class="breadcrumb-bar"><div class="breadcrumb-inner">${breadcrumb}</div></div>` : ''}

<main class="page-content">
  <div class="content-inner">
${bodyWithForm}
  </div>
</main>

<div class="floating-contact">
  <a href="mailto:info@houseclearances.ie" class="float-btn float-email" aria-label="Email us" title="Email us">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z" stroke="none"/><path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/></svg>
  </a>
  <a href="https://wa.me/353830904545" class="float-btn float-whatsapp" aria-label="WhatsApp us" title="WhatsApp us" target="_blank" rel="noopener">
    <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor"><path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.697 4.607 1.897 6.47L4 29l7.72-1.855A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3zm6.995 16.997c-.297.836-1.474 1.53-2.408 1.73-.64.135-1.475.244-4.287-.92-3.6-1.49-5.918-5.14-6.1-5.377-.176-.237-1.463-1.947-1.463-3.715 0-1.768.926-2.638 1.254-3 .329-.362.716-.452.955-.452.239 0 .478.002.687.013.22.011.516-.083.807.616.298.716 1.014 2.478 1.104 2.658.09.18.15.39.03.626-.12.237-.18.39-.36.6-.18.21-.375.469-.535.63-.18.18-.367.375-.157.732.209.358.93 1.535 1.997 2.487 1.373 1.225 2.53 1.605 2.888 1.785.358.18.567.15.777-.09.209-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.328.12 2.09.985 2.448 1.165.358.18.597.27.687.42.09.15.09.87-.208 1.706z"/></svg>
  </a>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <div class="logo footer-logo">
        <span class="logo-house">House</span><span class="logo-clearances">Clearances</span><span class="logo-ie">.ie</span>
      </div>
      <p>Fully insured house, apartment, garage, shed, attic, storage and warehouse clearance across Dublin &amp; Leinster.</p>
      <p class="footer-tagline">CLEAR &bull; REMOVE &bull; RECYCLE</p>
      <div class="footer-trust">
        <span>✔ Fully insured</span>
        <span>✔ Fully trained crews</span>
        <span>✔ Public liability insurance</span>
      </div>
      <p class="footer-permit">HouseClearances.ie is operated by Krystal Klean Express Limited, an authorised waste carrier holding a valid Waste Collection Permit issued by the National Waste Collection Permit Office (NWCPO). Permit No: NWCPO-25-13287-01.</p>
      <p class="footer-permit">Also need carpet or upholstery cleaning? Visit our sister company, <a href="https://krystalklean.ie/" target="_blank" rel="noopener">Krystal Klean Express</a></p>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      ${NAV_SERVICES.map(([name, url]) => `<a href="${url}">${name}</a>`).join('\n      ')}
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="/locations/">Areas We Cover</a>
      <a href="/blog/">Blog</a>
      <a href="tel:+353830904545">Call 083 090 4545</a>
      <a href="tel:+353598652981">Phone: 059 865 2981</a>
      <a href="https://wa.me/353830904545" target="_blank" rel="noopener">WhatsApp Us</a>
      <a href="mailto:info@houseclearances.ie">info@houseclearances.ie</a>
      <span class="footer-hours">Mon&ndash;Sat: 7am &ndash; 8pm</span>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; ${new Date().getFullYear()} HouseClearances.ie</p>
  </div>
</footer>
</body>
</html>`;
}

function writePage(slug, html) {
  const dir = slug === '/' ? SITE : path.join(SITE, slug.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function build() {
  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });

  // Shared assets
  fs.copyFileSync(path.join(ROOT, 'site-assets', 'style.css'), path.join(SITE, 'style.css'));
  const imgSrc = path.join(ROOT, 'site-assets', 'images');
  const imgDst = path.join(SITE, 'images');
  fs.mkdirSync(imgDst, { recursive: true });
  for (const f of fs.readdirSync(imgSrc)) fs.copyFileSync(path.join(imgSrc, f), path.join(imgDst, f));
  fs.writeFileSync(path.join(SITE, 'netlify.toml'), `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
`);

  // Home
  const home = parseFragment(fs.readFileSync(path.join(ROOT, 'home.html'), 'utf8'));
  const homeBody = home.body + '\n' + gallerySection() + '\n' + reviewsSection(null, 'What Our Customers Say', true);
  writePage('/', page(home.meta, homeBody, null));

  // Locations hub
  const hub = parseFragment(fs.readFileSync(path.join(ROOT, 'locations-hub.html'), 'utf8'));
  writePage('/locations/', page(hub.meta, hub.body, `<a href="/">Home</a> &rsaquo; Areas We Cover`));

  // Services
  const svcDir = path.join(ROOT, 'services');
  const SERVICE_REVIEW_TAGS = {
    '/bereavement-clearance/': ['bereavement', 'For Families Dealing with a Bereavement'],
    '/attic-clearance/': ['attic', 'What Attic Clearance Customers Say'],
    '/shed-clearance/': ['shed', 'What Shed Clearance Customers Say'],
    '/house-clearance/': ['house', 'What Our House Clearance Customers Say'],
  };
  for (const file of fs.readdirSync(svcDir)) {
    const frag = parseFragment(fs.readFileSync(path.join(svcDir, file), 'utf8'));
    const crumb = `<a href="/">Home</a> &rsaquo; ${frag.meta.h1}`;
    const svcTag = SERVICE_REVIEW_TAGS[frag.meta.slug];
    const extra = svcTag ? reviewsSection(svcTag[0], svcTag[1], false) : reviewsSection(null, 'What Our Customers Say', false);
    writePage(frag.meta.slug, page(frag.meta, frag.body + '\n' + gallerySection() + '\n' + extra, crumb));
  }

  // Locations
  const locDir = path.join(ROOT, 'locations');
  let locCount = 0;
  for (const file of fs.readdirSync(locDir)) {
    const frag = parseFragment(fs.readFileSync(path.join(locDir, file), 'utf8'));
    const townName = frag.meta.h1.replace('House Clearance in ', '');
    const crumb = `<a href="/">Home</a> &rsaquo; <a href="/locations/">Areas We Cover</a> &rsaquo; ${townName}`;
    const heroImg = `<img class="hero-photo" src="/images/van-exterior-hero.jpg" alt="A HouseClearances.ie clearance van on site during a job in ${townName}" loading="lazy">`;
    const bodyWithImg = frag.body.replace(/(<h1>.*?<\/h1>)/, `$1\n${heroImg}`) + '\n' + gallerySection() + '\n' + reviewsSection(null, 'What Our Customers Say', false);
    writePage(frag.meta.slug, page(frag.meta, bodyWithImg, crumb));
    locCount++;
  }

  // Blog posts
  const blogDir = path.join(ROOT, 'blog');
  const posts = [];
  if (fs.existsSync(blogDir)) {
    for (const file of fs.readdirSync(blogDir).filter(f => f.endsWith('.html'))) {
      const frag = parseFragment(fs.readFileSync(path.join(blogDir, file), 'utf8'));
      posts.push(frag.meta);
      const crumb = `<a href="/">Home</a> &rsaquo; <a href="/blog/">Blog</a> &rsaquo; ${frag.meta.h1}`;
      const heroImg = frag.meta.image
        ? `<img class="hero-photo" src="/images/${frag.meta.image}" alt="${frag.meta.imageAlt || frag.meta.h1}" loading="lazy">`
        : '';
      const dateLine = frag.meta.date
        ? `<p class="blog-post-date">${formatBlogDate(frag.meta.date)}</p>`
        : '';
      const bodyWithExtras = frag.body.replace(/(<h1>.*?<\/h1>)/, `$1\n${dateLine}\n${heroImg}`);
      writePage(frag.meta.slug, page(frag.meta, bodyWithExtras, crumb));
    }
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Blog index
  const blogCards = posts.map(p => `
    <a class="blog-card" href="${p.slug}">
      <img src="/images/${p.image}" alt="${p.imageAlt || p.h1}" loading="lazy">
      <div class="blog-card-body">
        <p class="blog-post-date">${formatBlogDate(p.date)}</p>
        <h3>${p.h1}</h3>
        <p>${p.excerpt || ''}</p>
      </div>
    </a>`).join('\n');
  const blogIndexBody = `<h1>House Clearance Tips, Guides &amp; Advice</h1>
<p>Practical guides on house clearance, waste, and clearing a property in Dublin and Leinster — from the team at HouseClearances.ie.</p>
<div class="blog-grid">
  ${blogCards}
</div>
<!-- [CONTACT FORM PLACEHOLDER] -->`;
  writePage('/blog/', page(
    { title: 'Blog | House Clearance Tips & Guides | HouseClearances.ie', description: 'Practical guides on house clearance, waste and clearing a property in Dublin and Leinster.', slug: '/blog/', h1: 'House Clearance Tips, Guides & Advice' },
    blogIndexBody,
    `<a href="/">Home</a> &rsaquo; Blog`
  ));

  // Thank you (form submission redirect)
  writePage('/thank-you/', page(
    { title: 'Thank You | HouseClearances.ie', description: 'Thanks for your quote request — we will be in touch shortly.', slug: '/thank-you/', h1: 'Thanks — We\'ve Got Your Request' },
    `<h1>Thanks — We've Got Your Request</h1><p>We've received your details and will be in touch shortly to arrange your free, no-obligation quote. If it's urgent, call us on <a href="tel:+353830904545">083 090 4545</a>.</p><p><a href="/">Return to the homepage</a></p>`,
    `<a href="/">Home</a> &rsaquo; Thank You`
  ));

  // 404
  const notFoundHtml = page(
    { title: 'Page Not Found | HouseClearances.ie', description: 'Page not found.', slug: '/404/', h1: 'Page Not Found' },
    `<h1>Page Not Found</h1><p>Sorry, that page doesn't exist. <a href="/">Return to the homepage</a> or see our <a href="/locations/">areas we cover</a>.</p>`,
    null
  );
  fs.writeFileSync(path.join(SITE, '404.html'), notFoundHtml);

  console.log(`Built: home, locations hub, ${fs.readdirSync(svcDir).length} service pages, ${locCount} location pages, ${posts.length} blog posts.`);
}

build();
