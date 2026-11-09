# XP10 cabin refinement implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task.

**Goal:** Replace the block-shaped cabin with the rounded first-generation Vitz dashboard, center console and related trim seen in the reference.

**Architecture:** A dedicated dashboard builder owns its shared curved shell, openings and attached controls. A cabin-trim builder owns the sculpted doors, seats and floor console. Existing interior composition retains the steering assembly and returns the same group.

**Tech Stack:** TypeScript, installed Three.js, Vite, Node tests; no new dependencies.

**Spec:** `docs/interior-refinement-design.md`

## Global constraints
- Preserve exterior, corrected steering, optional BGM and grounded animation.
- Work in the existing E-drive checkout; no Git repository exists.
- Use real meshes and the supplied/local period reference, not a flat dashboard image.
- Execute the already-authorized repair without an additional design approval pause.

## Review focus
- Curved components must not cover the meter or vent recesses: ray-test visibility.
- Dashboard and door skins must fit the existing body: cabin bounds and browser inspection.
- Keep all normals finite and outward across the visible shoulder: analytic and ray-normal checks.
- Seating and controls must retain clearances around the approved wheel: wheel tests and cabin screenshots.
- Newly cloned materials must participate in the existing wireframe control: traverse actual mesh materials when toggling.

### Task 1: dashboard and center stack
Files: create `src/dashboard.ts`; modify `src/interior.ts`; test `tests/interior-fit.test.mjs`.
Interface: `buildDashboard(parent:T.Object3D,m:CarMaterials):T.Group`; shared `dashPoint(x:number,t:number,depth?:number):T.Vector3` for surface attachments.
- [x] Write and run failing checks for dashboard crown, recessed oval meter and actual vent wells.
- [x] Implement continuous shell, integrated hood, curved fascia, fitted vents, glovebox and controls.
- [x] Run targeted geometry tests and TypeScript build; fix physical fit failures.

### Task 2: surrounding cabin mouldings
Files: create `src/cabin-trim.ts`; modify `src/interior.ts`, `src/textures.ts`, `src/materials.ts` if required; update `src/main.ts` wireframe material traversal.
Interfaces: `buildCabinTrim(parent:T.Object3D,m:CarMaterials):void`, `buildCabinSeats(parent:T.Object3D,m:CarMaterials):void`.
- [x] Check current cloth/door shape against the reference and pin meaningful physical clearance/bounds checks.
- [x] Build sculpted door cards, recessed grab handles and lower pockets, rounded floor console/gear gate, continuous seat cushions/backrests and headrests.
- [x] Verify cabin geometry and existing steering checks; build production.

### Task 3: integrated verification
- [x] Run the complete Node test suite once the geometry is stable.
- [x] Inspect the real browser: neutral cabin and visible controls, compressed cabin, exterior and wireframe behavior.
- [x] Record screenshots, bundle identity, console results and current tests in `checks/` and the progress ledger.

## Ledger
Ruling: This is a continuation of the user's iterative visual repair, so implement inline without further approval gates; preserve source references and evidence. No branch/worktree or commit steps apply to this non-Git workspace.
Pre-flight: both builders consume the same CarMaterials and cabin coordinate system; only dashboard surface attachments depend on `dashPoint`. The approved steering module stays separate.
Task 1: geometry implemented; the four initial shape/fit tests failed against the old cabin. Dashboard, meter recess and duct checks now pass.
Task 2: sculpted door cards, stitched seat inserts, integrated seat bolsters, shift gate and cup wells implemented. All six cabin checks and four existing steering checks pass; TypeScript/production build pass.
Ruling: Shift the existing interior camera slightly rearward and toward the cabin center so the complete dashboard, steering wheel and shift console fit in the same view. This changes only the preset framing and retains the existing orbit and squash-follow behavior.

Review: One independent read-only review found two fit issues: the center vents overlapped the meter hood/fascia, and the shift pedestal covered the gate/PRND surface. Added failing regressions, moved the inner vents outward and replaced the pedestal with a shared curved surface and real slot aperture. Both now pass. The gate probe starts below the elevated selector knob to test the actual opening rather than legitimate knob overlap.
Task 3: complete. Final eight cabin tests and full 37-test suite pass, along with TypeScript and production build. The actual in-app browser loaded index-CDkZXfVm.js, rendered neutral and compressed cabin views, toggled wireframe on/off, and displayed the neutral exterior side view. No browser warnings/errors were reported. Restored the neutral cabin, studio lighting, BGM off and wireframe off. Four screenshots, the full test log and checks/interior-verification.json preserve current evidence.
