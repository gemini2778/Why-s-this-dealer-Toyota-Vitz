# Vitz 3D Implementation Plan

> For agentic workers: execute inline with superpowers:executing-plans; one final fresh-context review.

**Goal:** A working, inspectable silver Vitz with grounded squash/stretch and a reference-based cabin.

**Architecture:** Geometry helpers and separate exterior/interior builders produce a Three.js Group. A pure periodic motion function drives the group; scene owns lights/camera/rendering and main owns UI/clock.

**Tech Stack:** Existing Three.js 0.186.1, TypeScript 7.0.2, Vite 8.3.5; Node native test runner.

**Spec:** vitz-3d-design.md

## Global constraints
- Silver XP10 three-door; y=0 is ground; no airborne translation.
- Reference is supplied multiview plus verified first-generation cabin photograph.
- Standalone three-v4; keep earlier media intact; no new dependencies.

## Review focus
- Animation loops and zero amplitude must remain stable.
- Actual tires must remain grounded even at maximum deformation.
- Interior camera must show dashboard without clipping or opaque glazing.
- Narrow screens and reduced-motion preference must remain usable.
- HMR must dispose scene resources and event listeners.

## Task 1 — Model and motion
- [x] Add meaningful failing tests for neutral/looping/volume-preserving motion and grounded mesh bounds.
- [x] Implement motion.ts, geometry.ts, materials.ts, exterior.ts, interior.ts and car.ts.
- [x] Run Node tests against actual Three.js geometry.

Interfaces: createVitz(textures?) returns {root, bodyMaterials, glassMaterials, interior}; sampleBounce(phase, amplitude) returns {height, width, length}; applyBounce(root, pose) keeps root position at zero.

## Task 2 — Rendering interface
- [x] Replace placeholder with vehicle and studio lighting; add smooth camera presets.
- [x] Implement functional controls, timeline, reference dialog, responsive layout and reduced-motion behavior.
- [x] Run typecheck/build and inspect real WebGL output and control states.

## Task 3 — Verify and deliver
- [x] Final independent review; fix material findings and rerun relevant checks.
- [x] Save screenshots, reference provenance and verification report; update README.
- [x] Leave a working browser preview open for the user.
