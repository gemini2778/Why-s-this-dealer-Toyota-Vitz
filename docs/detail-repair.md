# Lamp seams and rounded roof shoulder

Scope: seal the headlamp and tail-lamp joints, and round the upper side-to-roof transition. Preserve the established silver Vitz shape, cabin, controls and optional BGM.

The front/rear lamp faces and side lenses previously used independent depth offsets. A shared bridge now joins their actual edges at the opaque backing and clear-lens layers. Return surfaces close the recessed wing bezels and tail-lamp perimeters; the rear clear strip continues over the corner.

The original roof edge joined a nearly planar side with a 63-degree tangent change. The upper 70 mm of the side now rolls into the roof, whose cross-section matches that tangent while retaining its centre height. The adjacent upper glazing follows the same crown. Local conforming subdivision and analytic roof normals preserve the round shape and continuous highlights.

Validation: both new regression checks failed against the previous geometry and pass after repair. The complete 5-test suite, TypeScript check and Vite production build pass. The geometry audit reports finite positions/normals, all 10 opening boundaries inside their shells, and four tires grounded through 241 full-amplitude phases (maximum error 9.179e-9 m). Browser views are saved under `checks/detail-*.png`.
