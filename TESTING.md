# Testing and shipping this site

## The idea
Every change goes through the same path, so mistakes are caught by a machine before a visitor sees them:

    your computer -> branch -> pull request -> automatic tests -> merge -> automatic deploy -> live check

## The test layers (cheapest and fastest first)

| Layer | Command | What it catches | Speed |
|---|---|---|---|
| HTML validation | `npm run lint:html` | broken tags, bad attributes, unescaped quotes | 1 s |
| Static checks | `npm run test:static` | missing files, dead links, leftover placeholders, missing titles/alt text, oversized images | 1 s |
| Behaviour tests (jsdom) | `npm run test:unit` | menu, problem cards, report form logic, Formspree success and failure | 2 s |
| Browser tests (Playwright) | `npm run test:e2e` | real clicks, sideways scrolling at 4 screen widths, broken images, console errors, accessibility (axe), diagrams drawing | 1-2 min |

Run everything: `npm test`

## One-time setup on your computer
    npm ci
    npx playwright install chromium

## Day-to-day
    git switch -c fix-hero-text        # work on a branch, not on main
    # ...edit...
    npm test                           # fast feedback before you push
    git push -u origin fix-hero-text   # open a pull request on GitHub; the same tests run there

## Adding a test when you find a bug
1. Write a test that fails because of the bug.
2. Fix the bug until the test passes.
3. Keep the test forever. That is how the same bug never returns.
(The sideways-scroll and "image vanishes" bugs we fixed already have tests.)

## What happens on GitHub (.github/workflows/site.yml)
- **Pull request:** tests only. Nothing is published.
- **Merge to main:** tests, then `npm run build` makes the `_site` folder, the browser tests run against that folder, and only if all pass is it published to softwarebreaks.online.
- **After publishing:** a last job opens the live site and fails loudly if it is not answering.
- CSS and JS links get a version stamp (`style.css?v=abc1234`) on every deploy, so visitors never see a stale stylesheet.

## One-time GitHub settings
1. **Settings > Pages > Build and deployment > Source: GitHub Actions.** After switching, check that Custom domain still says `softwarebreaks.online` (type it again if empty) and that Enforce HTTPS is ticked.
2. **Settings > Branches > Add rule for `main`:** require a pull request, and require the "Test" check to pass before merging.
3. Before the first real deploy, set `FORMSPREE_ENDPOINT` in `report.js`.

## Rolling back
Fastest: **Actions tab > open the last good "Test and deploy" run > Re-run all jobs** (republishes that exact version).
Cleanest: `git revert <bad-commit>` and push. The pipeline publishes the reverted site.

## Not covered (still needs a person)
- Looking at the site on a real phone and in Safari/Firefox.
- Reading the copy, checking facts, and trying the form end to end after the Formspree address is set.
- Screen-reader testing. Automated checks find only part of the accessibility problems.
- Speed on slow networks (try Chrome DevTools > Lighthouse before big changes).
