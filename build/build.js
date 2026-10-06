// Static site builder for houseclearances.ie — wraps content fragments into full
// pages with shared header/nav/footer, outputs clean-URL folder/index.html structure
// ready for a straight Netlify drag-and-drop deploy.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const WA_NUMBER = '353830904545';
const WA_PHOTO_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi, I'd like a clearance quote. Photos of the property are attached. Area: ")}`;

// ---- Image dimensions (reads JPEG/PNG headers; no dependencies) -------------------------
// Adds width/height to every <img src="/images/..."> so the browser can reserve space
// (prevents layout shift / CLS). Silently skips anything it cannot read.
const IMG_DIR = path.join(ROOT, 'site-assets', 'images');
const _dimCache = {};
function imgSize(file) {
  if (file in _dimCache) return _dimCache[file];
  let dim = null;
  try {
    const buf = fs.readFileSync(path.join(IMG_DIR, file));
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let o = 2;
      while (o < buf.length) {
        if (buf[o] !== 0xff) { o++; continue; }
        const marker = buf[o + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          dim = [buf.readUInt16BE(o + 7), buf.readUInt16BE(o + 5)]; break;
        }
        o += 2 + buf.readUInt16BE(o + 2);
      }
    } else if (buf.slice(1, 4).toString() === 'PNG') {
      dim = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    }
  } catch (e) { dim = null; }
  _dimCache[file] = dim;
  return dim;
}
// Also wraps each local photo in <picture> with a WebP source when a pre-converted .webp sits next
// to the JPEG in site-assets/images (made once with Pillow, so no build dependency). The JPEG stays
// as the fallback and as the og:image. CSS sets picture { display: contents } so layouts don't change.
function addImageDimensions(html) {
  return html.replace(/<img\b([^>]*?)>/g, (m, attrs) => {
    const src = attrs.match(/src="\/images\/([^"]+)\.(jpe?g|png)"/);
    if (!src) return m;
    let img = m;
    if (!/\swidth=/.test(attrs)) {
      const d = imgSize(`${src[1]}.${src[2]}`);
      if (d) img = `<img${attrs} width="${d[0]}" height="${d[1]}">`;
    }
    if (!fs.existsSync(path.join(IMG_DIR, `${src[1]}.webp`))) return img;
    return `<picture><source srcset="/images/${src[1]}.webp" type="image/webp">${img}</picture>`;
  });
}
// The first hero image on a page is above the fold: it must NOT be lazy-loaded (hurts LCP).
function prioritiseHeroImage(html) {
  return html.replace(/<img class="(hero-photo|hero-van-photo)"([^>]*?) loading="lazy"/,
    '<img class="$1"$2 loading="eager" fetchpriority="high"');
}
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
// ("House Clearance Spotless" — spotless.ie, 5.0/60 reviews as of 2026-10-05, all 5-star). Sourced directly
// from Google Maps by the site owner (Ciprian), named as the person these reviews are about.
// Text is the reviewer's own words as shown publicly on Google (some truncated by Google's own
// "... More" — left as-is rather than guessing the rest). Tags used to place relevant reviews on matching pages.
// Rating and count shown on the site. Update GBP_COUNT when the profile gains reviews.
// The ?cid= link opens the listing reliably; the old /maps/place/...data= link did not.
const GBP_RATING = '5.0';
const GBP_COUNT = 60;
const GBP_URL = 'https://www.google.com/maps?cid=12172343070336442597';
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

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Choose which genuine reviews to show. opts.n limits the count; opts.seed (e.g. the page slug)
// rotates the starting point so every page does not repeat the identical review block.
function reviewsSection(tag, heading, includeSchema, opts = {}) {
  let matches = tag ? REVIEWS.filter(r => r.tags.includes(tag)) : REVIEWS.slice();
  if (opts.ids) matches = opts.ids.map(id => REVIEWS.find(r => r.id === id)).filter(Boolean);
  const n = opts.n || (tag ? 6 : 9);
  if (opts.seed && matches.length > n) {
    const start = hashSeed(opts.seed) % matches.length;
    matches = matches.slice(start).concat(matches.slice(0, start));
  }
  const picked = matches.slice(0, n);
  // NOTE: No Review/AggregateRating structured data is emitted. Google does not allow
  // self-serving reviews (a business marking up reviews about itself on its own site) to earn
  // review rich results, and marking them up risks a structured-data manual action. The reviews
  // stay visible on the page as ordinary content, attributed to the Google Business Profile.
  return `<section class="reviews-section" id="reviews">
    <h2>${heading}</h2>
    <div class="reviews-summary"><span class="stars-big">★★★★★</span> <strong>${GBP_RATING}</strong> from ${GBP_COUNT} Google reviews</div>
    <div class="reviews-grid">
      ${picked.map(reviewCard).join('\n      ')}
    </div>
    <p class="reviews-source">Genuine customer reviews from <a href="${GBP_URL}" target="_blank" rel="noopener">our Google Business Profile</a>.</p>
  </section>`;
}

function trustBadge() {
  return `<div class="trust-badge"><span class="stars">★★★★★</span> <strong>${GBP_RATING}</strong> rated on Google &middot; <a href="/#reviews">${GBP_COUNT} reviews</a></div>`;
}

// Genuine job photos (privacy-screened — no visible personal mail, documents, or faces),
// sourced from the owner's own camera roll. Used as a "Recent Work" gallery across pages —
// honestly labelled as recent work, not claimed as before/after pairs since no matching
// after-shots were found for these particular jobs.
const GALLERY_IMAGES = [
  ['van-loaded-clearance.jpg', 'A van loaded with furniture and belongings during a clearance'],
  ['storage-unit-clearance-dun-laoghaire-empty.jpg', 'A self-storage unit in Dún Laoghaire left fully empty after a HouseClearances.ie clearance'],
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
    meta.modified = grab('MODIFIED');
    meta.ogtype = grab('OG TYPE');
  }
  const body = raw.slice(commentMatch ? commentMatch.index + commentMatch[0].length : 0).trim();
  const h1Match = body.match(/<h1>(.*?)<\/h1>/);
  meta.h1 = h1Match ? h1Match[1] : meta.title;
  return { meta, body };
}

const SERVICE_URLS = new Set(NAV_SERVICES.map(([, url]) => url));
// Standalone pillar page that isn't in the main nav dropdown but is a genuine service-type page
// and should get Service schema.
SERVICE_URLS.add('/junk-removal-dublin/');

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// FAQPage schema — only from the genuine, visible FAQ section (after the "Frequently Asked
// Questions" heading), so it can never accidentally pick up unrelated <h3>/<p> markup
// elsewhere on the page (e.g. the quote form's heading or blog index cards) and always
// matches what a visitor actually sees, per Google's FAQPage requirements.
function buildFaqSchema(bodyHtml) {
  const faqStart = bodyHtml.indexOf('Frequently Asked Questions');
  if (faqStart === -1) return '';
  const faqSection = bodyHtml.slice(faqStart);
  const pairs = [...faqSection.matchAll(/<h3>(.*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)];
  if (pairs.length < 2) return '';
  const mainEntity = pairs.map(([, q, a]) => ({
    "@type": "Question",
    "name": stripTags(q),
    "acceptedAnswer": { "@type": "Answer", "text": stripTags(a) }
  }));
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mainEntity
  })}</script>`;
}

// BreadcrumbList schema — built from the exact same breadcrumb trail already rendered as
// visible HTML (see the `crumb`/breadcrumb variables at each call site), so the two can
// never drift out of sync.
function buildBreadcrumbSchema(breadcrumbHtml, currentName, currentUrl) {
  if (!breadcrumbHtml) return '';
  const items = [...breadcrumbHtml.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)]
    .map(([, href, name]) => ({
      name: stripTags(name),
      url: href.startsWith('http') ? href : `https://houseclearances.ie${href}`
    }));
  items.push({ name: stripTags(currentName), url: currentUrl });
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({ "@type": "ListItem", "position": i + 1, "name": it.name, "item": it.url }))
  })}</script>`;
}

// Service schema — only on the 12 real service pages, matched against NAV_SERVICES so it
// can never fire on a location/blog/home page by mistake.
function buildServiceSchema(meta, shareUrl) {
  if (!SERVICE_URLS.has(meta.slug)) return '';
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": meta.h1,
    "name": meta.h1,
    "url": shareUrl,
    "areaServed": ["Dublin", "Kildare", "Wicklow", "Kilkenny", "Carlow"],
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://houseclearances.ie/#business",
      "name": "HouseClearances.ie",
      "telephone": "+353830904545",
      "url": "https://houseclearances.ie"
    }
  })}</script>`;
}

// BlogPosting schema — every real blog post (anything under /blog/ with its own DATE, i.e.
// not the /blog/ index itself). Built only from the post's own metadata, never invented.
function buildArticleSchema(meta, shareUrl) {
  if (!meta.slug || meta.slug === '/blog/' || !meta.slug.startsWith('/blog/') || !meta.date) return '';
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": meta.h1 || meta.title,
    "description": meta.description,
    "image": `https://houseclearances.ie/images/${meta.image || 'brand/og-default.jpg'}`,
    "datePublished": meta.date,
    "dateModified": meta.modified || meta.date,
    "author": { "@type": "Organization", "name": "HouseClearances.ie" },
    "publisher": { "@type": "Organization", "name": "HouseClearances.ie" },
    "mainEntityOfPage": shareUrl
  })}</script>`;
}

// VideoObject schema — only for a specific, verified real embed (matched by YouTube video ID),
// using metadata pulled from YouTube's own oEmbed/watch-page data rather than invented figures.
// Deliberately allowlisted rather than generic, so a future unrelated embed can never emit
// schema with someone else's video's facts.
const KNOWN_VIDEOS = {
  '461xCRAIBgc': {
    name: 'Hoarder Clearance Dublin | Krystal Klean Express',
    description: 'A short clip showing the clearance team removing household contents as part of a hoarder/severe clutter clearance job in Dublin.',
    thumbnailUrl: 'https://i.ytimg.com/vi/461xCRAIBgc/hqdefault.jpg',
    uploadDate: '2025-11-11T12:50:21-08:00',
    duration: 'PT39S'
  },
  'bsG3-0IcAzo': {
    name: 'Storage Unit Clearance Dublin | Krystal Klean Express',
    description: 'A short clip showing the clearance team at work during a storage unit clearance job in Dublin.',
    thumbnailUrl: 'https://i.ytimg.com/vi/bsG3-0IcAzo/hqdefault.jpg',
    uploadDate: '2025-10-20T13:49:02-07:00',
    duration: 'PT8S'
  }
};
function buildVideoSchema(bodyHtml) {
  const m = bodyHtml.match(/data-video-id="([a-zA-Z0-9_-]+)"/);
  const v = m && KNOWN_VIDEOS[m[1]];
  if (!v) return '';
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": v.name,
    "description": v.description,
    "thumbnailUrl": v.thumbnailUrl,
    "uploadDate": v.uploadDate,
    "duration": v.duration,
    "embedUrl": `https://www.youtube.com/embed/${m[1]}`,
    "contentUrl": `https://www.youtube.com/watch?v=${m[1]}`
  })}</script>`;
}

// Organisation / LocalBusiness / WebSite — home page only. Deliberately contains NO rating or
// review markup. Address is locality-level only (Athy, Co. Kildare, as stated on the operator's
// sibling site propertyclearance.ie); no street address is published for this brand.
function buildOrgSchema(meta) {
  if (meta.slug !== '/') return '';
  const graph = [
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": "https://houseclearances.ie/#business",
      "name": "HouseClearances.ie",
      "legalName": "Krystal Klean Express Limited",
      "url": "https://houseclearances.ie/",
      "telephone": "+353830904545",
      "email": "info@houseclearances.ie",
      "logo": "https://houseclearances.ie/images/brand/icon-192.png",
      "image": "https://houseclearances.ie/images/brand/og-default.jpg",
      "description": "House, apartment, garage, shed, attic, storage and commercial clearance across Dublin and Leinster. Fully insured, authorised waste carrier.",
      "address": { "@type": "PostalAddress", "addressLocality": "Athy", "addressRegion": "County Kildare", "addressCountry": "IE" },
      "areaServed": ["Dublin", "County Kildare", "County Wicklow", "County Kilkenny", "County Carlow"].map(n => ({ "@type": "AdministrativeArea", "name": n })),
      "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], "opens": "07:00", "closes": "20:00" }]
    },
    {
      "@type": "WebSite",
      "@id": "https://houseclearances.ie/#website",
      "url": "https://houseclearances.ie/",
      "name": "HouseClearances.ie",
      "publisher": { "@id": "https://houseclearances.ie/#business" }
    }
  ];
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

// Netlify Forms accepts ONE file per field and at most 8 MB per submission, so a raw phone video
// or a few full-size photos would make the whole quote request fail. On submit this script
// shrinks photos (longest edge 1600px, JPEG) and spreads up to 4 of them across photo_1..photo_4.
// If the browser can't do that, or the photos are still too big, it says so and points to
// WhatsApp instead of letting the submission fail. Without JS the form still sends one photo.
const QUOTE_PHOTO_SCRIPT = `
<script>
(function(){
  if (window.__hcQuotePhotos) return; window.__hcQuotePhotos = 1;
  var MAX = 7.5 * 1024 * 1024, SLOTS = 4, EDGE = 1600, WA = ${JSON.stringify(WA_PHOTO_LINK)};
  function wa(text) { return '<a href="' + WA + '" target="_blank" rel="noopener">' + text + '</a>'; }
  function shrink(file) {
    return new Promise(function(res) {
      if (!/^image\\/(jpeg|png|webp)$/i.test(file.type) || file.size < 400 * 1024) return res(file);
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function() {
        var s = Math.min(1, EDGE / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function(b) {
          res(b && b.size < file.size ? new File([b], file.name.replace(/\\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file);
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function() { URL.revokeObjectURL(url); res(file); };
      img.src = url;
    });
  }
  [].forEach.call(document.querySelectorAll('form[name="quote-request"]'), function(form) {
    var picker = form.querySelector('[data-photo-picker]'); if (!picker) return;
    var slots = [picker].concat([].slice.call(form.querySelectorAll('[data-photo-slot]')));
    var note = form.querySelector('[data-photo-note]'), btn = form.querySelector('button[type=submit]');
    var label = btn ? btn.textContent : '', busy = false;
    function say(msg) { if (note) { note.innerHTML = msg; note.hidden = !msg; } }
    var tooBig = 'These photos are too large to send with the form. Remove some, or ' + wa('send them on WhatsApp') + ' instead.';
    picker.addEventListener('change', function() {
      say(picker.files.length > SLOTS ? 'Only the first ' + SLOTS + ' photos will be sent. You can ' + wa('send the rest on WhatsApp') + '.' : '');
    });
    form.addEventListener('submit', function(e) {
      var files = [].slice.call(picker.files || []).slice(0, SLOTS);
      if (!files.length) return;
      if (busy) { e.preventDefault(); return; }
      if (typeof DataTransfer !== 'function' || typeof File !== 'function') {
        var size = files.reduce(function(a, f) { return a + f.size; }, 0);
        if (files.length > 1 || size > MAX) { e.preventDefault(); say(files.length > 1 ? 'Please choose one photo here, or ' + wa('send several on WhatsApp') + '.' : tooBig); }
        return;
      }
      e.preventDefault(); busy = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Preparing photos...'; }
      function reset() { busy = false; if (btn) { btn.disabled = false; btn.textContent = label; } }
      Promise.all(files.map(shrink)).then(function(out) {
        var total = out.reduce(function(a, f) { return a + f.size; }, 0);
        if (total > MAX) { reset(); say(tooBig); return; }
        slots.forEach(function(inp, i) { var dt = new DataTransfer(); if (out[i]) dt.items.add(out[i]); inp.files = dt.files; });
        if (btn) btn.textContent = 'Sending...';
        form.submit();
      }).catch(function() { reset(); say(tooBig); });
    });
  });
})();
</script>`;

function page(meta, body, breadcrumb) {
  const photoCta = `
  <div class="photo-quote">
    <h3>Send photos for a quick quote</h3>
    <p>Photos or a short video of each room (and any attic, garage or shed) usually let us price a job without a site visit. They show the size of the property, how much is there, how easy the access is and any large or heavy items.</p>
    <p class="photo-quote-actions">
      <a class="btn-whatsapp" href="${WA_PHOTO_LINK}" target="_blank" rel="noopener">Send photos on WhatsApp</a>
      <a class="btn-call" href="tel:+353830904545">Call 083 090 4545</a>
    </p>
  </div>`;
  const formHtml = photoCta + `
  <div class="quote-form" id="quote-form">
    <h3>Request a Free Quote</h3>
    <form name="quote-request" method="POST" action="/thank-you/" enctype="multipart/form-data" data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="quote-request">
      <p class="form-hidden"><label>Don't fill this out if you're human: <input name="bot-field"></label></p>
      <div class="form-row">
        <input type="text" name="name" placeholder="Your name" autocomplete="name" required>
        <input type="tel" name="phone" placeholder="Phone number" autocomplete="tel" required>
      </div>
      <div class="form-row">
        <input type="text" name="area" placeholder="Area or Eircode" autocomplete="postal-code" required>
        <select name="property_type" aria-label="What needs clearing?">
          <option value="">What needs clearing?</option>
          <option>Full house</option>
          <option>Apartment / flat</option>
          <option>A few rooms</option>
          <option>Attic, garage or shed</option>
          <option>Storage unit</option>
          <option>Office / commercial</option>
          <option>Other</option>
        </select>
      </div>
      <input type="email" name="email" placeholder="Email (optional)" autocomplete="email">
      <textarea name="message" placeholder="Anything we should know? Access, stairs or lift, timing, items to keep" rows="3"></textarea>
      <label class="file-label">Add up to 4 photos (optional)
        <input type="file" name="photo_1" accept="image/*" multiple data-photo-picker>
      </label>
      <input type="file" name="photo_2" accept="image/*" hidden data-photo-slot>
      <input type="file" name="photo_3" accept="image/*" hidden data-photo-slot>
      <input type="file" name="photo_4" accept="image/*" hidden data-photo-slot>
      <p class="photo-note" data-photo-note hidden></p>
      <button type="submit">Get My Free Quote</button>
    </form>
  </div>${QUOTE_PHOTO_SCRIPT}`;
  const bodyWithForm = addImageDimensions(prioritiseHeroImage(body.replace(/<!-- \[CONTACT FORM PLACEHOLDER\] -->/g, formHtml)));
  // Pages without their own photo share the branded card (owner van photo + logo, 1200x630).
  const shareImage = meta.image || 'brand/og-default.jpg';
  const shareUrl = `https://houseclearances.ie${meta.slug}`;
  // Schema built from `body` (pre-form-injection) so the FAQ extractor never sees the
  // quote form's own "Request a Free Quote" <h3>.
  const faqSchema = buildFaqSchema(body);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumb, meta.h1 || meta.title, shareUrl);
  const serviceSchema = buildServiceSchema(meta, shareUrl);
  const articleSchema = buildArticleSchema(meta, shareUrl);
  const videoSchema = buildVideoSchema(body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${shareUrl}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/images/brand/apple-touch-icon.png">
<meta name="theme-color" content="#102A43">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap">
<meta property="og:type" content="${meta.ogtype || (meta.slug && meta.slug.startsWith('/blog/') && meta.date ? 'article' : 'website')}">
<meta property="og:site_name" content="HouseClearances.ie">
<meta property="og:title" content="${meta.h1 || meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${shareUrl}">
<meta property="og:image" content="https://houseclearances.ie/images/${shareImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.h1 || meta.title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="https://houseclearances.ie/images/${shareImage}">
<link rel="stylesheet" href="/style.css">
${buildOrgSchema(meta)}
${breadcrumbSchema}
${serviceSchema}
${faqSchema}
${articleSchema}
${videoSchema}
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo" aria-label="HouseClearances.ie home">
      <img src="/images/brand/logo-header.svg" alt="HouseClearances.ie" width="263" height="46">
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
      <a href="/checklists/">Checklists</a>
    </nav>
    <details class="mobile-nav">
      <summary aria-label="Menu">Menu</summary>
      <div class="mobile-nav-panel">
        ${NAV_SERVICES.map(([name, url]) => `<a href="${url}">${name}</a>`).join('\n        ')}
        <a href="/locations/">Areas We Cover</a>
        <a href="/blog/">Blog</a>
        <a href="/checklists/">Checklists</a>
      </div>
    </details>
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
  <a href="${WA_PHOTO_LINK}" class="float-btn float-whatsapp" aria-label="Send photos on WhatsApp" title="Send photos on WhatsApp" target="_blank" rel="noopener">
    <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor"><path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.697 4.607 1.897 6.47L4 29l7.72-1.855A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3zm6.995 16.997c-.297.836-1.474 1.53-2.408 1.73-.64.135-1.475.244-4.287-.92-3.6-1.49-5.918-5.14-6.1-5.377-.176-.237-1.463-1.947-1.463-3.715 0-1.768.926-2.638 1.254-3 .329-.362.716-.452.955-.452.239 0 .478.002.687.013.22.011.516-.083.807.616.298.716 1.014 2.478 1.104 2.658.09.18.15.39.03.626-.12.237-.18.39-.36.6-.18.21-.375.469-.535.63-.18.18-.367.375-.157.732.209.358.93 1.535 1.997 2.487 1.373 1.225 2.53 1.605 2.888 1.785.358.18.567.15.777-.09.209-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.328.12 2.09.985 2.448 1.165.358.18.597.27.687.42.09.15.09.87-.208 1.706z"/></svg>
  </a>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <div class="footer-logo">
        <img src="/images/brand/logo-white.svg" alt="HouseClearances.ie: clear, remove, recycle" width="260" height="43" loading="lazy">
      </div>
      <p>Fully insured house, apartment, garage, shed, attic, storage and warehouse clearance across Dublin &amp; Leinster.</p>
      <div class="footer-trust">
        <span>✔ Fully insured</span>
        <span>✔ Experienced crews</span>
        <span>✔ Public liability insurance</span>
      </div>
      <p class="footer-permit">HouseClearances.ie is operated by Krystal Klean Express Limited, an authorised waste carrier holding a valid Waste Collection Permit issued by the National Waste Collection Permit Office (NWCPO). Permit No: NWCPO-25-13287-01.</p>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      ${NAV_SERVICES.map(([name, url]) => `<a href="${url}">${name}</a>`).join('\n      ')}
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="/locations/">Areas We Cover</a>
      <a href="/blog/">Blog</a>
      <a href="/checklists/">Free Checklists</a>
      <a href="tel:+353830904545">Call 083 090 4545</a>
      <a href="tel:+353598652981">Phone: 059 865 2981</a>
      <a href="${WA_PHOTO_LINK}" target="_blank" rel="noopener">Send Photos on WhatsApp</a>
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

// ---- Related guides & checklists (additive internal-linking layer) ---------------------------
// Appended after a page's own content so no existing copy is edited. Anchor text is varied and
// descriptive on purpose. Remove an entry here to remove the link; nothing else depends on it.
const G = {
  choose:  ['How to choose a house clearance company (permit check and questions to ask)', '/blog/how-to-choose-a-house-clearance-company-ireland/'],
  family:  ["Clearing a loved one's home after a death: a guide for families", '/blog/clearing-a-loved-ones-home-after-a-death-dublin/'],
  moving:  ['What to clear before you move house in Dublin', '/blog/moving-house-what-to-clear-before-you-move/'],
  cost:    ['What drives house clearance costs in Dublin', '/blog/house-clearance-cost-dublin/'],
  probate: ['Can you clear a house before probate is granted?', '/blog/can-you-clear-house-before-probate/'],
  exec:    ["Executor's checklist: what to do when someone dies in Ireland", '/blog/what-to-do-when-someone-dies-in-ireland/'],
  hoard:   ['A discreet, non-judgemental guide to hoarder clearance in Dublin', '/blog/hoarder-clearance-dublin/'],
  prop:    ['Property clearance for landlords, executors and property managers', '/blog/property-clearance-guide/'],
  clHouse: ['Printable house clearance checklist', '/checklists/house-clearance-checklist/'],
  clBer:   ['Bereavement clearance checklist', '/checklists/bereavement-clearance-checklist/'],
  clMove:  ['Moving house clearance checklist', '/checklists/moving-house-clearance-checklist/'],
  clLand:  ['Landlord clearance checklist for rentals between tenants', '/checklists/landlord-end-of-tenancy-clearance-checklist/'],
  clApt:   ['Apartment clearance checklist (lifts, stairs, parking)', '/checklists/apartment-clearance-checklist/'],
  storage: ['When a storage unit costs more than it is worth', '/blog/storage-unit-costing-more-than-worth/'],
  attic:   ["What's usually worth keeping from an attic", '/blog/attic-clearance-what-to-keep/'],
};
const RELATED = {
  '/house-clearance/': ['choose', 'clHouse', 'cost', 'moving'],
  '/apartment-clearance/': ['clApt', 'clLand', 'choose'],
  '/bereavement-clearance/': ['family', 'clBer', 'exec', 'probate'],
  '/hoarder-clearance/': ['hoard', 'choose', 'clHouse'],
  '/end-of-tenancy-clearance/': ['clLand', 'prop', 'clApt'],
  '/attic-clearance/': ['attic', 'moving', 'clHouse'],
  '/garage-clearance/': ['moving', 'clHouse'],
  '/shed-clearance/': ['moving', 'clHouse'],
  '/storage-unit-clearance/': ['storage', 'moving'],
  '/blog/man-and-van-vs-clearance-company/': ['choose'],
  '/blog/skip-hire-alternative/': ['choose', 'clHouse'],
  '/blog/what-happens-to-your-stuff-after-clearance/': ['choose'],
  '/blog/downsizing-what-to-keep-sell-donate-clear/': ['moving', 'clMove'],
  '/blog/old-sofa-cant-sell/': ['moving'],
  '/blog/house-clearance-swords-guide/': ['clHouse', 'choose'],
  '/blog/house-clearance-bray-guide/': ['clHouse', 'choose'],
  '/blog/house-clearance-naas-guide/': ['clHouse', 'choose'],
  '/blog/preparing-rental-property-new-tenants/': ['clLand'],
  '/blog/what-to-do-when-someone-dies-in-ireland/': ['family', 'clBer'],
  '/blog/can-you-clear-house-before-probate/': ['family', 'clBer'],
  '/blog/clearing-deceased-relative-business-office/': ['family'],
  '/blog/how-to-choose-a-house-clearance-company-ireland/': ['clHouse'],
  '/blog/moving-house-what-to-clear-before-you-move/': ['clMove'],
  '/blog/clearing-a-loved-ones-home-after-a-death-dublin/': ['clBer'],
};
function relatedBlock(slug) {
  const keys = RELATED[slug];
  if (!keys || !keys.length) return '';
  return `\n<section class="related-guides"><h2>Helpful Guides and Checklists</h2><ul>\n${keys.map(k => `<li><a href="${G[k][1]}">${G[k][0]}</a></li>`).join('\n')}\n</ul></section>`;
}

const SITEMAP_SLUGS = [];
const LASTMOD = {};

function writePage(slug, html, lastmod) {
  if (lastmod) LASTMOD[slug] = lastmod;
  const dir = slug === '/' ? SITE : path.join(SITE, slug.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  SITEMAP_SLUGS.push(slug);
}

function build() {
  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });

  // Shared assets
  fs.copyFileSync(path.join(ROOT, 'site-assets', 'style.css'), path.join(SITE, 'style.css'));
  fs.copyFileSync(path.join(ROOT, 'site-assets', 'favicon.svg'), path.join(SITE, 'favicon.svg'));
  fs.copyFileSync(path.join(ROOT, 'site-assets', 'favicon.ico'), path.join(SITE, 'favicon.ico'));
  const imgSrc = path.join(ROOT, 'site-assets', 'images');
  const imgDst = path.join(SITE, 'images');
  fs.cpSync(imgSrc, imgDst, { recursive: true }); // includes images/brand/

  const dlSrc = path.join(ROOT, 'site-assets', 'downloads');
  if (fs.existsSync(dlSrc)) {
    const dlDst = path.join(SITE, 'downloads');
    fs.mkdirSync(dlDst, { recursive: true });
    for (const f of fs.readdirSync(dlSrc)) fs.copyFileSync(path.join(dlSrc, f), path.join(dlDst, f));
  }
  // Permanent redirects for pages merged into a stronger page (approved 2026-10-05). The merged
  // source files are kept in archive/merged-2026-10/ for reference. _redirects is processed before
  // the netlify.toml 404 catch-all.
  fs.writeFileSync(path.join(SITE, '_redirects'), [
    '/storage-clearance-dublin/  /storage-unit-clearance/  301',
    '/storage-clearance-dublin   /storage-unit-clearance/  301',
    '/blog/clearing-hoarders-home-guide-for-families/  /blog/hoarder-clearance-dublin/  301',
    '/blog/clearing-hoarders-home-guide-for-families   /blog/hoarder-clearance-dublin/  301',
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(SITE, 'netlify.toml'), `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
`);

  // Home
  const home = parseFragment(fs.readFileSync(path.join(ROOT, 'home.html'), 'utf8'));
  const homeBody = home.body + '\n' + gallerySection() + '\n' + reviewsSection(null, 'What Our Customers Say', false);
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
    writePage(frag.meta.slug, page(frag.meta, frag.body + relatedBlock(frag.meta.slug) + '\n' + gallerySection() + '\n' + extra, crumb));
  }

  // Locations
  const locDir = path.join(ROOT, 'locations');
  let locCount = 0;
  for (const file of fs.readdirSync(locDir)) {
    const frag = parseFragment(fs.readFileSync(path.join(locDir, file), 'utf8'));
    const townName = frag.meta.h1.replace('House Clearance in ', '');
    const crumb = `<a href="/">Home</a> &rsaquo; <a href="/locations/">Areas We Cover</a> &rsaquo; ${townName}`;
    const heroImg = `<img class="hero-photo" src="/images/house-clearance-van-dublin.jpg" alt="The HouseClearances.ie van with its tail lift down, loading furniture during a clearance" loading="lazy">`;
    const bodyWithImg = frag.body.replace(/(<h1>.*?<\/h1>)/, `$1\n${heroImg}`) + '\n' + gallerySection() + '\n' + reviewsSection(null, 'What Our Customers Say', false, { n: 3, seed: frag.meta.slug });
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
      const bodyWithExtras = (frag.body + relatedBlock(frag.meta.slug)).replace(/(<h1>.*?<\/h1>)/, `$1\n${dateLine}\n${heroImg}`);
      writePage(frag.meta.slug, page(frag.meta, bodyWithExtras, crumb), frag.meta.modified || frag.meta.date);
    }
  }

  // Checklists — interactive (tick, saved in the visitor's browser, print / save as PDF, share).
  const clDir = path.join(ROOT, 'checklists');
  const checklists = [];
  if (fs.existsSync(clDir)) {
    const TOOLBAR = `<div class="checklist-tools" data-nosnippet>
      <button type="button" class="ct-btn" data-ct="print">Print / save as PDF</button>
      <button type="button" class="ct-btn" data-ct="share">Share</button>
      <button type="button" class="ct-btn ct-reset" data-ct="reset">Clear ticks</button>
      <span class="ct-progress" aria-live="polite"></span>
    </div>`;
    const CL_SCRIPT = `<script>
(function(){
  var root=document.querySelector('.checklist-page'); if(!root) return;
  var key='hc-checklist:'+location.pathname, boxes=[].slice.call(root.querySelectorAll('.checklist input[type=checkbox]'));
  var store=null; try{store=window.localStorage;}catch(e){store=null;}
  var saved={}; try{ if(store) saved=JSON.parse(store.getItem(key)||'{}'); }catch(e){ saved={}; }
  var prog=root.querySelector('.ct-progress');
  function update(){ var n=boxes.filter(function(b){return b.checked;}).length; if(prog) prog.textContent=n+' of '+boxes.length+' done'; }
  boxes.forEach(function(b,i){
    if(saved[i]) b.checked=true;
    b.addEventListener('change',function(){ saved[i]=b.checked; try{ if(store) store.setItem(key,JSON.stringify(saved)); }catch(e){} update(); });
  });
  update();
  root.addEventListener('click',function(e){
    var t=e.target.closest('[data-ct]'); if(!t) return; var a=t.getAttribute('data-ct');
    if(a==='print'){ window.print(); }
    if(a==='reset'){ boxes.forEach(function(b){b.checked=false;}); saved={}; try{ if(store) store.removeItem(key); }catch(e){} update(); }
    if(a==='share'){
      var data={title:document.title,url:location.href};
      if(navigator.share){ navigator.share(data).catch(function(){}); }
      else if(navigator.clipboard){ navigator.clipboard.writeText(location.href).then(function(){ t.textContent='Link copied'; }); }
      else { window.prompt('Copy this link:',location.href); }
    }
  });
})();
</script>`;
    for (const file of fs.readdirSync(clDir).filter(f => f.endsWith('.html')).sort()) {
      const frag = parseFragment(fs.readFileSync(path.join(clDir, file), 'utf8'));
      checklists.push(frag.meta);
      let body = frag.body.replace('<!-- [CHECKLIST TOOLS] -->', TOOLBAR);
      body = body.replace(/<ul class="checklist">([\s\S]*?)<\/ul>/g, (m, inner) =>
        `<ul class="checklist">${inner.replace(/<li>([\s\S]*?)<\/li>/g, '<li><label><input type="checkbox"> <span>$1</span></label></li>')}</ul>`);
      body = `<div class="checklist-page">${body}</div>` + CL_SCRIPT;
      const crumb = `<a href="/">Home</a> &rsaquo; <a href="/checklists/">Checklists</a> &rsaquo; ${frag.meta.h1}`;
      writePage(frag.meta.slug, page(frag.meta, body, crumb), frag.meta.modified || frag.meta.date);
    }
    const cards = checklists.map(c => `<a class="blog-card" href="${c.slug}"><div class="blog-card-body"><h3>${c.h1}</h3><p>${c.excerpt || ''}</p></div></a>`).join('\n');
    writePage('/checklists/', page(
      { title: 'Free House Clearance Checklists (Printable) | HouseClearances.ie', description: 'Free, printable clearance checklists for Ireland: house clearance, bereavement, moving house, apartments and landlords. Tick items off online or print them.', slug: '/checklists/', h1: 'Free Clearance Checklists' },
      `<h1>Free Clearance Checklists</h1>
<p>Practical, printable checklists for the situations we are asked about most. Tick items off on screen (your ticks are saved in your own browser), print them, or save them as a PDF.</p>
<div class="blog-grid">${cards}</div>
<p>Handling an estate? Our <a href="/blog/what-to-do-when-someone-dies-in-ireland/">executor's checklist</a> also has a free downloadable asset inventory.</p>
<!-- [CONTACT FORM PLACEHOLDER] -->`,
      `<a href="/">Home</a> &rsaquo; Checklists`
    ));
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

  // Sitemap (thank-you page excluded — it's a utility redirect target, not real content)
  const sitemapUrls = SITEMAP_SLUGS.filter(s => s !== '/thank-you/');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(s => `  <url><loc>https://houseclearances.ie${s}</loc>${LASTMOD[s] ? `<lastmod>${LASTMOD[s]}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'), sitemapXml);

  // Robots
  fs.writeFileSync(path.join(SITE, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: https://houseclearances.ie/sitemap.xml
`);

  console.log(`Built: home, locations hub, ${fs.readdirSync(svcDir).length} service pages, ${locCount} location pages, ${posts.length} blog posts, ${checklists.length} checklists, ${sitemapUrls.length} sitemap URLs.`);
}

build();
