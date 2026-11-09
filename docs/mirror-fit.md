# Mirror housing and glass fit

The original front-detail photograph remains the reference for the lower front window mounting location and rounded black housing. Both mirrors now sit 14 mm lower and 8 mm farther outward than the preceding version. A broad pivot overlaps the closed sail panel and the inner housing flank.

The rounded box and separate white slab were replaced by a continuously curved, asymmetric dome, a rolled black lip, a thin gasket and shallow convex reflective glass. All four parts share one contour and placement. The glass boundary meets the gasket exactly and sits behind the protective lip. Left and right assemblies are mirrored together.

Verification on 2026-10-28:

- All 15 Node tests passed, including the existing window-mount bounds and new dome-curvature and glass-perimeter checks. The new tests failed before the repair.
- TypeScript and the production build passed. The usual Vite bundle-size advisory remains.
- Browser inspection confirmed the domed housing from the front and the fitted glass from a side/rear angle. The loaded bundle is `index-DndqND7n.js`; the browser reported no warnings or errors.
- Screenshots: `checks/mirror-dome-front.png` and `checks/mirror-glass-fit.png`.

The mirror material reflects the studio environment; it does not render a live rear-view camera. Body geometry, grounded squash animation, cabin and independent BGM controls were not changed by this repair.
