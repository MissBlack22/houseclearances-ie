# Technical SEO — implementation guide for when the CMS is set up

houseclearances.ie has no live site, so none of this can be verified or applied yet. This is
a ready-to-implement checklist for whoever sets up the CMS/hosting.

## Per-page metadata (already written into each HTML file's top comment block)
Every service and location file includes: SEO title, meta description, focus keyword, and
target URL slug as an HTML comment at the top of the file — copy these directly into
whatever SEO plugin/CMS field is used.

## Canonical URLs
Each page should self-canonicalize to its own clean URL (no query strings, no trailing
duplicate paths). No cross-page canonicals are needed here since every page targets a
distinct keyword — there is no near-duplicate pair in this content set (unlike the
propertyclearance.ie legacy-URL situation from other work).

## Breadcrumbs
Recommended structure:
- Service pages: Home > [Service Name]
- Location pages: Home > Areas We Cover > [Location Name]

## Schema (structured data)
Use accurate information only — no fabricated ratings, review counts, or review content.

**Organization / LocalBusiness** (site-wide, home page):
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "HouseClearances.ie",
  "areaServed": ["Dublin", "Kildare", "Wicklow", "Carlow"],
  "url": "https://houseclearances.ie",
  "priceRange": "$$"
}
```
Fill in telephone, address and openingHours only once confirmed for this specific brand —
do not copy propertyclearance.ie's or krystalklean.ie's business details verbatim without
confirming HouseClearances.ie is operating under the same registered entity/permit.

**Service** (each service page):
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "House Clearance",
  "areaServed": "Dublin",
  "provider": { "@type": "LocalBusiness", "name": "HouseClearances.ie" }
}
```

**BreadcrumbList** (every page) — standard 2 or 3-level breadcrumb matching the structure above.

**FAQPage** — every service and location page has a genuine, unique FAQ section already
written; mark it up with FAQPage schema once live.

Do NOT add AggregateRating/Review schema unless real, verifiable reviews exist to cite —
per the explicit no-fake-reviews rule for this project.

## Sitemap & robots
- Once live, generate an XML sitemap covering: home, 9 service pages, /locations/ hub,
  and all location pages as they're built.
- robots.txt should allow crawling of all the above and disallow only genuine admin/CMS paths.
- Submit the sitemap to Search Console once the domain is verified and live — not before.

## Internal linking architecture (as built)
- Home links to all 9 service pages and the /locations/ hub.
- Every service page links to 2–4 genuinely related services (not all 9 — avoids a spammy
  link block) plus, where relevant, back to House Clearance as the hub.
- Every location page links to: 2–4 relevant service pages (chosen for genuine relevance,
  not all 9) and 2 nearby *already-built* location pages, plus a link back to the /locations/
  hub. This was corrected during self-audit — see AUDIT-FINDINGS.md for what was wrong
  and fixed.
- The /locations/ hub links to every built location page, grouped by area, and explicitly
  tells visitors that unlisted areas are very likely still served (avoids implying coverage
  gaps for the ~140 towns not yet built).

## Mobile & performance
Not testable without a live site or dev environment. Once a theme/CMS is chosen, standard
checks apply: responsive layout, tap targets, Core Web Vitals, image lazy-loading (see
IMAGE-SOURCING.md for the image-specific technical debt already identified).
