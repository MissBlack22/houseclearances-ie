# Self-audit — findings and fixes

Run after building the 9 service pages and 20 location pages, before final report.

## FIXED

1. **Broken internal links (location pages).** Every location page's "Nearby Areas We Serve"
   section originally linked to 2–3 neighbouring towns that don't have a built page yet
   (e.g. Tallaght linked to /locations/templeogue/, /locations/firhouse/, /locations/citywest/
   — none exist). This would have been ~50 broken links across 20 pages. Fixed by rewriting
   every "Nearby Areas" section to link only to other pages that actually exist in this build,
   using genuine Dublin geography where a real neighbour was available, plus a link back to
   the /locations/ hub. Verified with a grep across all 20 files afterward — every href now
   resolves to a real file in this build.

2. **Keyword cannibalization (home page vs. House Clearance service page).** Both were
   initially set to target the exact same focus keyword ("House Clearance Dublin"). Fixed by
   retargeting the home page to the brand name instead, leaving that keyword exclusively to
   the dedicated service page.

## CHECKED — no issue found

- **Duplicate content across the 9 service pages.** Each was deliberately written with a
  distinct angle (access logistics for apartments, outdoor/weatherworn framing for sheds,
  safety/access for attics, B2B tone for warehouse, respectful/non-clinical tone for hoarder
  and bereavement). Spot-read all 9 back to back — no repeated paragraphs or copy-pasted
  structure beyond the shared FAQ/CTA pattern, which is intentional and standard practice.

- **Duplicate content across the 20 location pages.** Each has a genuinely different opening
  paragraph tied to that area's real housing character (estate housing vs. period homes vs.
  dense rental apartments vs. coastal access, etc.), not a name-swapped template. Spot-checked
  10 of the 20 for repeated phrasing — found normal, expected repetition in the fixed
  boilerplate elements (FAQ headers, "Get a free quote" CTA, "fully insured" line) but no
  duplicated substantive content between pages.

- **Fabricated claims.** Scanned all 29 content files for invented landmarks, statistics,
  customer stories, or reviews — found none. The recycling percentage (95%), NWCPO permit,
  and "fully insured" claims are all sourced from the group's real, live sibling sites (see
  RESEARCH-NOTES.md) and used consistently rather than invented per-page.

- **Medical/diagnostic claims (hoarder clearance).** Confirmed the page describes only
  practical process and confidentiality — no diagnostic or clinical language.

## NOT CHECKED (no live site exists to check)

- Mobile rendering, Core Web Vitals, actual page-speed — impossible to test without a CMS/host.
- Live sitemap/robots.txt — don't exist yet; guidance is in TECHNICAL-SEO.md for setup time.
- Real crawlability/indexability — domain doesn't resolve, so nothing is crawlable yet.

## Outstanding gap (not a bug, a scope decision)

Only 20 of the ~161 requested locations have a built page. This was a deliberate choice per
the explicit "quality over speed... I'd rather have high-quality unique content than thousands
of weak pages" instruction — see FINAL-REPORT.md for the reasoning and what's needed to
continue.
