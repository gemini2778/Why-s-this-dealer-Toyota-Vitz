# Vitz 3D rendering interface

2026-10-22. User request: build a Three.js bouncing Vitz using the supplied multiview sheet and independently researched first-generation interior photographs.

## Design

Use the existing standalone Three.js/Vite project. Create an editable, genuine mesh model of the silver XP10 three-door hatchback: curved shell with wheel openings, separate glazing, rounded headlights, small grille, five-lobed wheel covers, rear hatch, wiper, mirrors, handles and antenna. Nominal dimensions follow Toyota's 1999 launch release: 3.61 × 1.66 × 1.50 m; wheelbase 2.37 m. Do not reproduce the inconsistent mirrored side reference.

Include a right-hand-drive cabin with rounded two-tone dashboard, central hooded digital meter, round vents, three-spoke wheel, automatic shifter, front seats and rear bench. MOTA's first-generation cabin photograph is the visual reference; the original Toyota release corroborates the central instruments and round climate controls. This is an original procedural reconstruction, not a scanned or factory CAD model.

Animate squash/stretch about world y=0, without vertical translation. Apply the same deformation to every component to keep windows, wheel arches and interior aligned. Tires touch y=0 at every phase. Provide play/pause, amplitude, speed, phase scrubbing, orbit, camera presets including interior, studio/night lighting, wireframe and reference inspection. Make reduced motion start paused. Pause the animation clock while the page is hidden.

Use a large studio viewport with a compact control panel and timeline. Preserve the existing projects. Keep tooling/cache/output on E:. No extra runtime dependencies.

## Verification

Meaningful automated checks: periodic continuous motion, neutral amplitude, volume compensation, and actual mesh grounding/finite bounds at sampled phases. Typecheck and production build; real browser inspection of front, rear, side, interior, playback, sliders, orbit, lighting and references. Save screenshots and a verification record.
