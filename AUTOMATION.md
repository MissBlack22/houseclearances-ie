# Blog Automation Plan

## What I checked first

You asked me to follow the same automation pattern already running on carpetcleaningservice.ie
or rvfitfinder.com. I looked at carpetcleaningservice.ie directly: it has a real git repo, a
`.netlify` folder proving it's linked to Netlify, and 3 blog posts — but no GitHub Actions
workflow, no cron script, and no scheduler anywhere in it. Its "automation" is really just
**Netlify's git-based auto-deploy**: whenever new files get pushed to the connected repo, Netlify
rebuilds and publishes automatically, with no manual dashboard step. The blog posts themselves
were added by hand (or by a Claude session), then pushed.

So there's no existing "1 post per day" content-generation automation to copy — I've built one
for houseclearances.ie instead, using the same deploy-on-push foundation.

## What's built now

- `blog/` — 6 published posts (5 topic guides + 1 location-tied post for Swords), each with a
  real photo from the approved/privacy-screened pool, wired into `build.js` with a proper
  `/blog/` index page, cards, and dates.
- `blog/CONTENT-QUEUE.md` — 15 more topics queued up, in order, ready to be written.
- This file, documenting how daily publishing would actually run once you're ready.

## How daily publishing would work once live

1. **You deploy the site to Netlify** (as planned) and connect it to a git repo — same as
   carpetcleaningservice.ie. This alone gives you auto-deploy on every push.
2. **I schedule a recurring task** (once daily) using Claude Code's own scheduler. Each run:
   - Takes the next topic off `blog/CONTENT-QUEUE.md`
   - Writes a new post in the same style and with the same rules as the existing 6 (no fabricated
     reviews/stats/credentials, real photos only, no medical claims)
   - Runs `node build/build.js` to rebuild the site
   - Commits and pushes to the connected git repo, which triggers Netlify's auto-deploy
3. Netlify publishes the new post automatically — no manual step from you.

## What I have NOT done

I have not created a live recurring job yet, and this site has not been pushed to any git
remote — nothing here will publish itself. Setting up an autonomous job that writes and pushes
new content every day on its own is exactly the kind of standing, recurring action I want your
explicit go-ahead on before switching on, in line with "do not publish" for this build.

**When you're ready**: tell me you've connected the repo to Netlify (or want me to set that part
up too), and whether you want the daily task active immediately or only from a specific date —
I'll take it from there.
