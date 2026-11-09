# Exterior reference refinement

User feedback, 2026-10-22: the side silhouette, roof and windows differ from the supplied Vitz photographs; the lamps are crude and unnatural. Redo these parts in the existing Three.js scene.

## Geometry decisions

- Trace a rounded XP10 three-door profile with a rising A-pillar, gently arched roof shoulder, nearly upright B-pillar, short rounded rear quarter glass and a thick curved C-pillar. The door-glass lower edge rises toward the rear. Use continuous side shells with actual window holes.
- Share curves between the side shell, roof, windscreen and rear window so adjoining parts meet. Give the roof a smooth crown in both axes and the body a rounded sill, shoulders and wheel arches.
- Build the front/rear caps as continuous curved surfaces. Project headlight bezels, reflector bowls, amber sections and lenses onto the same front surface. Rebuild the rounded triangular headlights and wraparound rear clusters with recessed details, not floating ellipsoids.
- Keep the silver paint, right-hand-drive cabin, controls and grounded squash/stretch. Reference images are the user's supplied front close-up and multiview sheet.

## Work and validation

1. Back up the previous model sources under .work/refinement-before.
2. Replace the body/cabin outlines and cap surfaces; rebuild glazing and lights; retain useful independent trim and wheels.
3. Run existing actual-mesh grounding tests and production build. Inspect neutral side, front and rear renders against the supplied references, plus interior and compressed pose; revise visible mismatches before delivery.
4. Save updated screenshots and a concise verification record. Refresh the existing production preview only after a full build, avoiding partially updated module interfaces.

## Implemented

- Shared roof/A/C-pillar profiles and curved front/rear caps; actual holes for side glazing and the fender portions of both lamp clusters.
- Rounded front/rear glazing, silver frame margins and open ceramic borders. Cabin mirror and meter hood moved inside the revised windscreen.
- Recessed halogen reflector bowls and corner bezels, amber sections, transparent lenses, and continuous rear/side red sections with clear areas.
- Conforming subdivision preserves matching edge positions. Original cap/return smoothing islands are retained; normals use the mapper's cofactor instead of triangle-area averaging. The latter caused up to 64-degree alternating normals along microscopic sliver triangles despite closed topology.
- Smooth beltline transition removes the former width jump around y=.97. Thin exterior parts cast shadows onto the floor; exterior self-shadow reception is disabled to avoid stippling on the small trim.

The model is a reference-guided procedural approximation, not a dimensional scan or factory CAD. Keep this distinction when evaluating photographic fidelity.

## Verified result

- Production build and all 3 motion/actual-mesh tests passed.
- Independent source findings were checked against actual cap normals and rendered views; roof-rail normal steps are below 0.072 degrees.
- Geometry audit: 10 sampled opening boundaries remain inside their outer contours; all mesh positions/normals are finite; four tires stay grounded through 241 phases.
- Actual browser views saved for front, rear, side, side compression, interior, interior compression and night lighting. Playback advanced, and no warnings/errors were captured. Previous mobile verification remains in the initial record; no new mobile result is claimed for this refinement.
