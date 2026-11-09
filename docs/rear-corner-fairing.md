# Rear-window corner fairing

The C-pillar fillet previously collapsed to zero over the last 8% of the rear-window edge. That pushed the highlight into a pointed fold at each end. The window frame also met the roof at a 36-degree normal discontinuity, and its lower crown differed from the hatch by up to 8.6 mm in the sampled corner region.

The fillet now runs out gradually with a C2 blend. Its lower boundary uses the hatch's actual crown. Both ends are faired against one shared, area-weighted implicit surface sampled from the adjacent side, roof, rear frame and hatch. The local field applies symmetrically to both sides; the glass, rubber frame and nearby tail-lamp edges follow the same geometry. An 8 mm tricubic field cache preserves continuous derivatives, and batch cache eviction avoids repeatedly scanning Map tombstones during dense mesh construction.

Two regression tests failed on the previous model and pass with this change. They check both sides for closed roof/hatch joins, matching surface normals and smooth normal changes through the runouts. In the sampled region, the maximum join normal change falls from 35.990 degrees to 0.001095 degrees, the maximum join gap falls from 8.606 mm to zero, and the maximum normal step over approximately 2 mm falls from 13.969 degrees to 1.514 degrees.

The production build and all 13 tests pass. The geometry audit retains 396 meshes, finite coordinates and normals, all ten contained openings, and a maximum tire-ground error of 9.179e-9 metres over 241 phases. Render evidence and detailed metrics are recorded in `checks/rear-corner-verification.json` and `checks/rear-corner-*.png`.
