# Engine and rear cabin refinement implementation plan

> For agentic workers: use parallel domain implementation with exclusive files, parent integration and one independent final review.

**Goal:** Refine the 1NZ-FE engine bay and finish seating/rear cabin/handbrake while preserving approved effects.
**Architecture:** Separate engine and cabin builders, shared existing car-root deformation; reversible existing mechanical views plus a rear-interior preset.
**Tech Stack:** Existing Three.js/TypeScript/Vite and Node tests, no new dependency.
**Spec:** docs/engine-rear-cabin-design.md

## Constraints
- Work in E:/Carmemes/three-v4; no Git repository or branch operation is needed.
- Preserve exterior, profile, chassis/axle interfaces, dashboard, steering, BGM and motion.
- Engine remains inside side/bonnet skin and in front of structural firewall z=.910; wheels at (+/-.718,.29,+/-1.185).
- Interior stays within x +/- .80, y .20..1.47, z -1.65..1.03 and clear of structural wheelhouses.
- New geometry must follow wireframe/disposal and shared grounded squash.

## Review focus
- Hoses/loom terminals truly meet their destinations and do not cross firewall, tires or bonnet.
- Cover badges, clamps and accessory connections are not buried or visibly floating.
- Rear trim, webbing and upholstery stay inside body/glass and do not occlude seat fabric or poke through wheel tubs.
- Handbrake connects to the floor/console, clears cup holders and front seats.
- Rear-cabin camera, compressed pose and all transitions restore previous visibility and camera limits, including reduced motion and small screens.

### Task 1: Engine refinement
Files: src/engine.ts, optional src/engine-geometry.ts / src/engine-plumbing.ts, tests/engine-detail.test.mjs. Keep buildEngine(parent,m) interface.
- [x] Inspect actual NCP13 photo and existing connection interfaces.
- [x] Observe meaningful failing checks for sculpted cover and physical connected routes; preserve current chassis-fit checks.
- [x] Replace box-like primary forms; connect intake, cooling, wiring and accessories with supports/clamps.
- [x] Run engine-detail and chassis-fit tests plus typecheck; report evidence to parent.

### Task 2: Rear cabin and upholstery
Files: src/cabin-trim.ts, optional src/rear-cabin.ts / src/cabin-upholstery.ts, fabric-only sections of src/materials.ts and src/textures.ts, tests/rear-cabin.test.mjs. Keep buildCabinTrim/buildCabinSeats interfaces.
- [x] Inspect bench and official interior references, retain current front-seat silhouette/palette.
- [x] Observe meaningful failing checks for rear belt/seat/trim fit and supported handbrake.
- [x] Build upholstered bench/headrest/posts/belts/quarter trim/shelf and handbrake; add subtle physical fabric detail.
- [x] Run new rear-cabin and existing interior-fit tests plus typecheck; report evidence to parent.

### Task 3: Integration and verification
Parent owns src/scene.ts, src/main.ts, index.html, src/style.css, documentation and final evidence.
- [x] Add rearInterior and cabinDetail cameras with shared interior scaling/limits and labelled UI; include reference sources.
- [x] Integrate both domains, inspect changes, run production build and complete test suite.
- [x] Get one independent final review, resolve important findings with focused regressions.
- [x] Verify actual browser engine/rear cabin/handbrake, full-amplitude compression and restoration; save screenshots and final verification record.

## Ledger
Scope decision: user already authorized iterative refinement and preservation of previous effects. Continue in the established local checkout without new approval gates. Parallel work is limited to independent engine/cabin geometry; no shared browser or full-suite jobs in children. No commits because the workspace is not a Git repository.

Integration: extracted shared view poses for actual-geometry framing tests. Added the seats/handbrake preset because the low lever is obscured from the established dashboard preset. Rear FOV 85 contains the full bench in neutral and maximum compression at desktop and portrait aspects. Initial combined build passed; engine focused tests 11/11, cabin focused tests 14/14, camera tests 2/2. Independent final review and live browser verification are in progress.

Final verification: the one independent review confirmed physical engine connector contact, rear pillar/glass clearance and all nine preserved-core hashes. It identified redundant shadow edges from thin cloth overlays. Full-vertex ray probes (14,811 rear insert points) confirmed positive 1.24–2.20 mm shell clearance, so only thin overlay and stitching shadow casting was disabled; global lighting is unchanged. The final build (`index-eFKiKCn0.js`) and all 56 tests passed, with zero failures/skips. Actual browser checks covered neutral/compressed engine and rear cabin, handbrake, wireframe, restored dashboard/exterior, animation, independent BGM and 390×844 layout. No warning/error logs. Final page: neutral rear cabin, amplitude 80%, studio lighting, BGM paused at 40%. Evidence: `checks/engine-rear-verification.json`, `checks/engine-rear-browser.json`, `checks/engine-rear-full-tests.txt`, and `checks/*-v5-*.png`.
