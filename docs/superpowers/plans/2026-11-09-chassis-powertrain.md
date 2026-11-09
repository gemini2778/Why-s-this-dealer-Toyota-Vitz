# Chassis and powertrain implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline, with one independent final review.

**Goal:** Complete the floor, pedals and mechanical underside with a fitted 1NZ-FE while preserving the approved car and animation.
**Architecture:** Shared floor profile; dedicated footwell, chassis and engine builders; a reversible mechanical-view controller wired into two new camera presets.
**Tech Stack:** Installed Three.js, TypeScript, Vite and Node tests. No new dependencies.
**Spec:** docs/chassis-powertrain-design.md

## Global constraints
- Keep all project files and evidence in this existing E-drive workspace. No Git repository exists.
- Preserve existing exterior shapes, steering, dashboard, BGM and root-level squash.
- Use the actual wheel centers (+/-0.718, 0.29, +/-1.185 metres) and fit inside current body surfaces.
- Keep the automatic cabin's two pedals; no RS-wide cosmetic conversion.
- Inspection views must be reversible and must not change model transforms.

## Review focus
- Tire/arch/suspension clearance and actual attachments at both axles.
- Engine bay parts stay behind the bonnet/front skin and clear of the cabin firewall.
- Raised carpet, pedal brackets and seat bases do not interpenetrate or expose outside space.
- Inspection transitions, reduced motion and narrow viewports restore the original assembled view and floor.
- New materials follow wireframe/disposal, and added geometry does not become the ground-contact minimum.

### Task 1: floor and pedals
- [x] Add and observe failing physical coverage/pedal checks in tests/chassis-fit.test.mjs.
- [x] Create src/floor-profile.ts and src/footwell.ts, replace cabin-floor/pedal placeholders in src/interior.ts, and implement the structural pan in src/chassis.ts.
- [x] Verify opaque coverage, mounted pads, finite normals and cabin bounds.

### Task 2: powertrain and running gear
- [x] Add/observe failing engine-envelope and running-gear checks.
- [x] Create src/engine.ts; complete chassis with front/rear suspension, wheelhouses, frame, fuel/exhaust; remove old underbody/tip in src/details.ts.
- [x] Integrate buildChassis in src/car.ts, add optional engine-cover texture, and verify all new parts fit and remain above ground during squash.

### Task 3: inspection and final verification
- [x] Add/observe failing restoration checks; add reversible mechanical visibility and chassis/engine camera presets with minimal UI changes.
- [x] Build, run the full suite, and request one independent final review of the final code and physical fit.
- [x] Fix important review findings with regressions; verify real browser underside, engine, pedals, compressed pose and restored exterior; save evidence and progress.

## Ledger
Scope decision: execute the user's already-authorized repair in the existing workspace. A photo-guided mechanical approximation is sufficient; do not add an engine simulation or alter the approved body. Inspection views are necessary to make the enclosed additions reviewable and revert on ordinary camera selection.

Implementation: formed pan, toe board/firewall, mounted pedal assemblies, mechanical running gear and photo-guided 1NZ-FE installed. All five new mechanical checks and existing nine cabin checks pass; TypeScript/production build pass. Tire-volume probing caught and removed front spring-seat/caliper and lower firewall overlap. The brake discs are the lowest mechanical parts (0.145 m neutral, 0.0928 m at maximum compression), so clearance tests measure against the tire contact plane rather than an arbitrary 0.10 m threshold. Inspection restore assertions were moved into the existing full-car motion test to reuse its expensive geometry build; mechanical-only tests exercise the actual builders directly. Final review and browser inspection underway.

Independent final review found five issues, addressed in one fix pass: extended all four hubs into the existing wheel backings; connected front tower plates to wheel tubs with pressed support webs; joined both engine bushes down to subframe rails; moved the airbox and its hose away from the firewall; cancelled stale camera transitions when switching immediately or enabling reduced motion. Physical regressions reproduced the hub/support/firewall defects and all seven mechanical tests now pass. Browser inspection also exposed poor cover-label contrast/occlusion, corrected by placing the dark mark on an unobstructed part of the cover. Final production bundle: index-Dkq59OMe.js. No re-review requested.

Final verification: all 45 tests pass after the review fixes, along with TypeScript and the production build. Real-browser inspection verified the engine bay, underside, mounted pedals, both cabin and underbody at maximum compression, mechanical wireframe and restored assembled car. The 390 x 844 layout has no horizontal overflow and both new inspection buttons remain enabled; viewport restored to 918 x 720. No warning/error logs. BGM remains optional and paused at 40 percent. Evidence is recorded in checks/chassis-verification.json and checks/chassis-*.png. Work complete.
