# SkyUdaan — "Birth of a Vessel" redesign

Date: 2026-09-24 · Status: approved by owner ("you decide and do")

## Goal
An Awwwards / CSSDA-grade site for SkyUdaan En-Fab (Bengaluru pressure-vessel fabricator).
Optimised for judges (design, UX, creativity, content, dev), while every claim stays
from the existing site copy. No new real assets: all visuals are procedural 3D + type.

## Concept
One continuous scroll film. A single persistent WebGL scene fabricates one vessel as
the visitor scrolls; DOM chapters narrate each stage. The film's last frame becomes a
working configurator that reshapes the same vessel.

| # | Chapter | 3D beat | Copy source |
|---|---------|---------|-------------|
| 00 | Plate | flat SA 516 plate on paper-white stage | hero |
| 01 | Rolling | plate curls into a shell (CPU bend) | 35 mm max rolling |
| 02 | Heads | 2:1 ellipsoidal heads seat onto shell | cold-spun heads |
| 03 | Weld | orange SAW seam traces long + circ seams, cools to steel | SAW / Sec IX |
| 04 | X-ray | cobalt scan band sweeps the seams; radiograph strip in DOM | 100 % RT UW-51 |
| 05 | Nozzles | manway, flanges, trunnions pop in | ANSI B16.5 150# |
| 06 | Hydrotest | shell ghosts, water rises (clip plane), gauge counts to 18.75 bar | 1.5× MAWP, 4 h |
| 07 | Saddles + coat | saddles rise; coating wipes on via moving clip plane | Zick saddles, SA 2.5 |
| 08 | Dispatch | vessel turntable; numbers | 500 kL / 100 % / 35 mm / 500+ |
| — | Configurator | same vessel reshapes: capacity, orientation, MOC | existing calc logic, ported |
| — | Products index, Works, RFQ, footer | DOM only, canvas hidden | existing copy |

## Visual system (light editorial)
- Paper `#f3f2ee`, ink `#0d0e10`, cobalt `#1d3bff` (single accent), weld orange `#ff5b1f` only in ch.03.
- Type: Instrument Serif (display, italic accents), Geist (UI/body), Geist Mono (engineering data).
- Huge editorial headlines, hairline rules, mono data rows, fixed chapter rail + mm ruler HUD.
- Studio lighting from drei Lightformers (no network HDRs), contact shadow.

## Architecture
- Next.js App Router, `output: 'export'` (static), Vercel project `skyudaan-storage-tanks`.
- `lib/film.ts`: chapter ranges + `seg(t, a, b)` helpers; one scalar `t` (0..9) drives everything.
- `lib/store.ts` (zustand): `t`, configurator state, `mode: 'film' | 'config'`.
- `components/scroll/*`: Lenis + GSAP ScrollTrigger write `t`; SplitText reveals.
- `components/three/*`: `Stage` (canvas, lights, camera rig), `Vessel` (plate/shell/heads/welds/
  nozzles/water/saddles/coat), each part a pure function of `t` and config.
- `lib/engineering.ts`: ported `calculateEngineeringParameters` + GA SVG generator (unit-tested).
- Canvas loaded with `next/dynamic` (ssr:false) so text LCP is not blocked; pauses when off-screen.

## Quality bars
- Lighthouse desktop ≥ 90 perf, 100 a11y/BP/SEO; mobile works with reduced DPR/segments.
- `prefers-reduced-motion`: no smooth scroll, no SplitText motion; film still scrubs.
- All content in semantic DOM; canvas `aria-hidden`.
- RFQ form composes a WhatsApp message (no fake "submitted" success).

## Open items for the owner
- WhatsApp number `+91 79426 38063` looks like an IndiaMART forwarding number.
- Indicative prices are formula estimates (kept, labelled "indicative").
