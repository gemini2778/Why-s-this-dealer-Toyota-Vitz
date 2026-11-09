# Front cowl and windscreen header refinement

2026-11-10. Scope: the two exterior transitions identified in the user's cropped screenshots. Keep the settled interior and all existing controls/effects.

The bonnet/fender fillet used to disappear over the final 10 mm before the cowl, producing a pinched highlight. Its runout is now gradual, and the meeting bonnet, side and lower windscreen charts share a small mirrored surface fairing. Projection preserves height, so the approved dashboard deck still attaches at the same elevation. The existing rear fairing retains its original defaults.

The front roof edge is 7 mm lower. The upper A-pillar control handle is relaxed while retaining the original cowl foot and tangent. A short tangent continuation replaces the clamped roof-shoulder reference used by boundary normal probes, removing the artificial header crease. Glass, ceramic border, painted frame and side shell continue to use the same profile.

Measurements: maximum sampled 1 mm cowl normal step decreased from 55.692 to 3.495 degrees; the windscreen/roof normal discontinuity decreased from 2.325 to 0.023 degrees. The existing bonnet seam deviates from its revised supporting surface by at most 0.421 mm, within its existing 2 mm offset. See `checks/front-metal-metrics.json`.

Two new regressions first failed against the original geometry. The cowl closure regression now probes the actual rounded bonnet mapper instead of the underlying unrounded profile. The complete 60-test suite and TypeScript/production build pass. Fourteen preserved interior, mechanical, detail and behavior source files match their pre-change hashes. Final bundle: `index-p-DeSKA5.js`.

Evidence: `checks/front-metal-full-tests.txt`, `checks/front-metal-build.txt`, `checks/front-metal-preserved.json`, `checks/front-metal-browser.json`, `checks/front-metal-*-final.png` and `checks/front-metal-cabin-preserved.png`.
