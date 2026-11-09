# XP10 interior refinement

Reference: the existing `public/references/interior.jpg` (MOTA first-generation Vitz, right-hand drive, automatic). Cross-check: Toyota's 1999 launch description and the Toyota UK 1999–2003 interior gallery. Keep this early dashboard layout rather than importing later-generation details.

The current dashboard is a stack of rounded boxes, its central instrument is a separate rectangular case, and its center fascia is a flat trapezoid. Door trim and seats are similarly rectangular. Rebuild the visible cabin around flowing moulded shapes: a continuous crowned dashboard, recessed oval central meter under a blended hood, four embedded round vents, a narrowing curved center stack with radio/three HVAC knobs/lower audio, a flush passenger glovebox, a low rounded automatic-shift console, sculpted door cards, and soft seat cushions/bolsters/headrests. Retain the freshly corrected steering wheel and its shared column axis.

Use procedural three-dimensional meshes and shared surface functions so trim follows the parent surface. Open vent apertures, recessed meter/display and controls must remain visible; avoid coplanar layers and hard box corners. Use the existing blue-grey cloth and restrained matte plastics. Existing exterior, UI, BGM and ground-anchored squash remain in place. This is photo-guided reconstruction, not a surveyed factory CAD model.

Verify actual geometry with rays and normals, then build and inspect the cabin in the real browser. Keep useful screenshots and a compact verification report in `checks/`.
