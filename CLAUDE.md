# SkyUdaan En-Fab — "Birth of a Vessel"

Awwwards-targeted one-page site for a Bengaluru pressure-vessel fabricator. Spec:
`docs/superpowers/specs/2026-09-24-birth-of-a-vessel-design.md`.

## Commands
- `npm run dev` (port 3100) · `npm run build` → static export in `out/` · `npm test` (vitest)
- Deploy: `vercel deploy --prod` (project `skyudaan-storage-tanks`; vercel.json sets framework `nextjs` only — adding `outputDirectory: out` breaks the build)
- Screenshot QA: serve `out/` (`python3 -m http.server 8932 -d out`) and scroll `#film` to
  `t/9 * (film.offsetHeight - innerHeight)` for chapter t. Wait ~1.8 s per shot (camera damping).

## How the film works (read before touching 3D)
- One scalar clock `t ∈ [0, 9]` in `lib/store.ts` (zustand). `ScrollDriver` writes it from
  the `#film` ScrollTrigger; `config ∈ [0,1]` comes from `#configure` entering.
- Chapter i owns `t ∈ [i, i+1]` (`lib/film.ts`). Every part in `components/three/Vessel.tsx`
  is a pure function of `t` via `seg(t, a, b)` windows — keep it that way (scrubbable both ways).
- Camera keyframes live in `FRAMES` in `components/three/Stage.tsx`; `sx/sy` shift the scene
  with `setViewOffset` so text owns the left 40 % (desktop) / bottom sheet (mobile).
- Configurator camera math in `Stage.tsx` must stay in step with vessel stretch/leg offsets in
  `Vessel.tsx` (vertical: L/D ÷ 3 stretch, 0.9 legs, ground at y = -1.6).
- Clip planes (water level, coat wipe) are world-space: only valid while the root isn't rotated.

## Content rules
- All claims come from the original site (`git show ca0cd3a:index.html`). Don't invent specs,
  clients, or certificates. The legacy "sample MTR certificate" was dropped on purpose.
- Engineering estimator (`lib/engineering.ts`) is a verbatim port; tests pin legacy outputs.
- Hero h1 uses a CSS reveal, not SplitText — SplitText re-creates nodes and delays LCP.

## Open with owner
- WhatsApp/phone `+91 79426 38063` looks like an IndiaMART forwarding number.
- Canonical domain is the vercel.app URL until a real domain is given (layout.tsx, robots, sitemap).
