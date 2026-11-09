# Rounded bonnet and rear-window panel joints

The bonnet/fender and rear-window/C-pillar intersections retained different surface tangents after the earlier tessellation repair. Both joints now share genuine cubic fillet cross-sections, trimmed back into the original panels with matching endpoint tangents. Each adjoining mesh maps onto one half of the same rounded section, keeping the shared position and normal continuous.

The bonnet transition fades out before the lamp openings and cowl endpoints. The rear-window transition fades into the hatch and roof, while its glazing, black border and painted frame share the revised surface. Existing lights, emblems, mirrors, cabin, UI, music and bounce logic remain in place. Local subdivision follows the new curvature. Bounded caches reuse static cross-sections during procedural model construction.

Two new geometric regression checks failed before repair and now pass. They check physical corner displacement, seam closure and cross-panel normal agreement. The complete 11-test suite, TypeScript and production build pass. The geometry audit confirms finite data, all opening boundaries contained, and four grounded tires through 241 full-amplitude phases. Measurements and render evidence are in `checks/fillet-verification.json` and `checks/fillet-*.png`.
