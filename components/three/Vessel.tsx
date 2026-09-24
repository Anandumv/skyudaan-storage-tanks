'use client';

import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { easeOutBack, lerp, seg, smooth } from '@/lib/film';
import { isHorizontal } from '@/lib/engineering';
import { useFilm } from '@/lib/store';

// Film units: shell radius R = 1, tangent length 6 (L/D = 3, the horizontal-tank ratio).
const R = 1;
const HALF = 3;
const SEAM_ROT = -0.5; // long seam finishes 0.5 rad behind top dead centre

const STEEL = new THREE.Color('#8f959c');
const COBALT = new THREE.Color('#1d3bff');
const ARC = new THREE.Color('#ff5b1f');
const COATS = {
  is2062: { color: new THREE.Color('#ecebe6'), metal: 0.05, rough: 0.32 },
  sa516: { color: new THREE.Color('#2b2d31'), metal: 0.2, rough: 0.4 },
  ss304: { color: new THREE.Color('#e4e7ea'), metal: 0.78, rough: 0.3 },
  ss316: { color: new THREE.Color('#eceef1'), metal: 0.78, rough: 0.24 },
} as const;

class Ring extends THREE.Curve<THREE.Vector3> {
  constructor(private x: number, private r: number) {
    super();
  }
  getPoint(u: number, target = new THREE.Vector3()) {
    const a = SEAM_ROT + Math.PI / 2 - u * Math.PI * 2; // start at the long seam
    return target.set(this.x, this.r * Math.sin(a), this.r * Math.cos(a) * -1);
  }
}

function headGeometry(scale = 1) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 32; i++) {
    const th = (i / 32) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R * scale * Math.cos(th) + 1e-4, 0.5 * R * scale * Math.sin(th)));
  }
  return new THREE.LatheGeometry(pts, 96);
}

function saddleGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.9, -1.6);
  s.lineTo(0.9, -1.6);
  s.lineTo(0.9, -1.52);
  s.lineTo(0.78, -1.52);
  s.lineTo(0.87, -0.5);
  s.absarc(0, 0, 1.0, -Math.PI / 6, (-5 * Math.PI) / 6, true);
  s.lineTo(-0.78, -1.52);
  s.lineTo(-0.9, -1.52);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false, curveSegments: 32 });
  g.translate(0, 0, -0.11);
  g.rotateY(Math.PI / 2);
  return g;
}

/** Bends a flat plate (lying in XZ at y = -R) into a cylinder of radius R about the X axis. */
function bendPlate(geo: THREE.BufferGeometry, base: Float32Array, b: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const k = b / R;
  for (let i = 0; i < pos.count; i++) {
    const u = base[i * 3];
    const v = base[i * 3 + 1];
    if (k < 1e-4) pos.setXYZ(i, u, -R, v);
    else {
      const a = k * v;
      pos.setXYZ(i, u, -R + (1 - Math.cos(a)) / k, Math.sin(a) / k);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

const damp = THREE.MathUtils.damp;

export function Vessel({ lowDetail = false }: { lowDetail?: boolean }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const plate = useRef<THREE.Mesh>(null!);
  const headL = useRef<THREE.Mesh>(null!);
  const headR = useRef<THREE.Mesh>(null!);
  const seams = useRef<THREE.Mesh[]>([]);
  const arc = useRef<THREE.Mesh>(null!);
  const arcLight = useRef<THREE.PointLight>(null!);
  const xray = useRef<THREE.Group>(null!);
  const fittings = useRef<THREE.Group[]>([]);
  const water = useRef<THREE.Group>(null!);
  const saddles = useRef<THREE.Group>(null!);
  const legs = useRef<THREE.Group>(null!);
  const outer = useRef<THREE.Mesh>(null!);
  const coat = useRef<THREE.Group>(null!);
  const lastBend = useRef(-1);
  const live = useRef({ s: 1, sx: 1, vert: 0, under: 0, y: 0, saddle: 1 });

  const segs = lowDetail ? { u: 36, v: 64, r: 48 } : { u: 60, v: 112, r: 96 };

  const geo = useMemo(() => {
    const plateGeo = new THREE.PlaneGeometry(HALF * 2, Math.PI * 2 * R, segs.u, segs.v);
    const plateBase = Float32Array.from(plateGeo.attributes.position.array as Float32Array);
    const seamCurves: THREE.Curve<THREE.Vector3>[] = [
      new THREE.LineCurve3(
        new THREE.Vector3(-HALF, R * 1.012 * Math.cos(SEAM_ROT), -R * 1.012 * Math.sin(SEAM_ROT) * -1),
        new THREE.Vector3(HALF, R * 1.012 * Math.cos(SEAM_ROT), -R * 1.012 * Math.sin(SEAM_ROT) * -1),
      ),
      new Ring(-HALF, R * 1.012),
      new Ring(0, R * 1.012),
      new Ring(HALF, R * 1.012),
    ];
    return {
      plateGeo,
      plateBase,
      seamCurves,
      seamGeos: seamCurves.map((c, i) => new THREE.TubeGeometry(c, i === 0 ? 120 : 160, 0.028, 8, false)),
      head: headGeometry(1),
      headWater: headGeometry(0.975),
      headCoat: headGeometry(1.008),
      saddle: saddleGeometry(),
    };
  }, [segs.u, segs.v]);

  const mat = useMemo(() => {
    const clipWater = new THREE.Plane(new THREE.Vector3(0, -1, 0), -10);
    const clipCoat = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -10);
    return {
      clipWater,
      clipCoat,
      steel: new THREE.MeshStandardMaterial({ color: STEEL, metalness: 0.92, roughness: 0.36, side: THREE.DoubleSide, transparent: true }),
      fitting: new THREE.MeshStandardMaterial({ color: '#7d838a', metalness: 0.9, roughness: 0.3, transparent: true }),
      seam: new THREE.MeshStandardMaterial({ color: '#6f757b', metalness: 0.8, roughness: 0.55, emissive: ARC, emissiveIntensity: 0 }),
      arc: new THREE.MeshBasicMaterial({ color: '#fff3e0', toneMapped: false }),
      xray: new THREE.MeshBasicMaterial({ color: COBALT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
      xrayGlow: new THREE.MeshBasicMaterial({ color: COBALT, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      water: new THREE.MeshStandardMaterial({ color: '#7f95ff', metalness: 0, roughness: 0.15, transparent: true, opacity: 0.55, clippingPlanes: [clipWater], side: THREE.DoubleSide, depthWrite: false }),
      coat: new THREE.MeshStandardMaterial({ color: COATS.is2062.color.clone(), metalness: 0.05, roughness: 0.32, clippingPlanes: [clipCoat], side: THREE.DoubleSide }),
      band: new THREE.MeshStandardMaterial({ color: COBALT, metalness: 0.1, roughness: 0.4, clippingPlanes: [clipCoat] }),
      saddle: new THREE.MeshStandardMaterial({ color: '#55585e', metalness: 0.5, roughness: 0.55 }),
      ghost: new THREE.MeshStandardMaterial({ color: '#b9b6ad', metalness: 0, roughness: 0.9, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    };
  }, []);

  useLayoutEffect(() => () => {
    Object.values(geo).forEach((g) => g instanceof THREE.BufferGeometry && g.dispose());
    geo.seamGeos.forEach((g) => g.dispose());
    Object.values(mat).forEach((m) => m instanceof THREE.Material && m.dispose());
  }, [geo, mat]);

  useFrame((state, dt) => {
    const { t, config, vessel } = useFilm.getState();
    const time = state.clock.elapsedTime;
    dt = Math.min(dt, 0.1);

    // 01 Rolling ---------------------------------------------------------------
    const bend = smooth(seg(t, 1.08, 1.86));
    if (Math.abs(bend - lastBend.current) > 1e-4) {
      bendPlate(geo.plateGeo, geo.plateBase, bend);
      lastBend.current = bend;
    }
    plate.current.rotation.x = SEAM_ROT * bend;
    // hero idle: the plate breathes before it is worked
    const idle = 1 - seg(t, 0.4, 1.1);
    plate.current.position.y = idle * (0.08 * Math.sin(time * 0.8));
    plate.current.rotation.y = idle * 0.08 * Math.sin(time * 0.35);

    // 02 Heads -------------------------------------------------------------------
    const hk = smooth(seg(t, 2.05, 2.8));
    for (const [m, s] of [[headL.current, -1], [headR.current, 1]] as const) {
      m.visible = hk > 0.001;
      m.position.x = s * (HALF + (1 - hk) * 5);
      m.rotation.x = (1 - hk) * s * 1.2;
    }

    // 03 SAW weld ---------------------------------------------------------------
    const wipeDone = seg(t, 7.35, 7.95);
    const windows = [[3.05, 3.42], [3.42, 3.6], [3.58, 3.76], [3.74, 3.94]];
    let head: THREE.Vector3 | null = null;
    windows.forEach(([a, b], i) => {
      const p = seg(t, a, b);
      const g = geo.seamGeos[i];
      const step = 8 * 6;
      g.setDrawRange(0, Math.floor((g.index!.count / step) * p) * step);
      const m = seams.current[i];
      m.visible = p > 0 && wipeDone < 1;
      if (p > 0 && p < 1) head = geo.seamCurves[i].getPoint(p);
    });
    // seams glow orange while hot and cool to weld-metal grey over the next half chapter
    const heat = seg(t, 3.02, 3.1) * (1 - seg(t, 3.92, 4.4));
    mat.seam.emissiveIntensity = heat * 2.2;
    arc.current.visible = !!head;
    arcLight.current.intensity = head ? 6 + Math.sin(time * 60) * 2 : 0;
    if (head) {
      arc.current.position.copy(head);
      arcLight.current.position.copy(head);
      arc.current.scale.setScalar(0.9 + Math.random() * 0.5);
    }

    // 04 Radiography --------------------------------------------------------------
    const xp = seg(t, 4.08, 4.92);
    const xa = seg(t, 4.02, 4.12) * (1 - seg(t, 4.9, 5.0));
    xray.current.position.x = lerp(-HALF - 0.6, HALF + 0.6, smooth(xp));
    mat.xray.opacity = 0.9 * xa;
    mat.xrayGlow.opacity = 0.28 * xa;
    xray.current.visible = xa > 0.001;

    // 05 Nozzles & manway ---------------------------------------------------------
    fittings.current.forEach((f, i) => {
      const k = easeOutBack(seg(t, 5.08 + i * 0.1, 5.4 + i * 0.1));
      f.visible = k > 0.001;
      f.scale.setScalar(Math.max(k, 0.0001));
      if (i === 0) f.visible = f.visible && vessel.accessories.manhole;
    });

    // 06 Hydrotest ----------------------------------------------------------------
    const ghost = seg(t, 6.0, 6.18) * (1 - seg(t, 6.82, 7.0));
    const op = 1 - 0.8 * ghost;
    mat.steel.opacity = op;
    mat.fitting.opacity = op;
    mat.steel.depthWrite = op > 0.99;
    const level = lerp(-R - 0.05, R + 0.05, smooth(seg(t, 6.12, 6.7)));
    mat.clipWater.constant = level;
    water.current.visible = ghost > 0.001;
    mat.water.opacity = 0.55 * ghost;

    // 07 Saddles + coating -------------------------------------------------------
    const sk = smooth(seg(t, 7.0, 7.35));
    const wipe = seg(t, 7.35, 7.95);
    mat.clipCoat.constant = wipe >= 1 ? 100 : lerp(-HALF - 0.8, HALF + 0.8, smooth(wipe));
    coat.current.visible = wipe > 0;

    // 08 Dispatch turntable + configurator ---------------------------------------
    const turn = smooth(seg(t, 8.0, 9.0)) * Math.PI * 0.35 + config * 0.35;
    const L = live.current;
    const horiz = isHorizontal(vessel.orientation);
    const ld = horiz ? 3 : vessel.application === 'silo' ? 3.5 : 2;
    const sizeT = config > 0 ? THREE.MathUtils.clamp(Math.cbrt(vessel.capacityLiters / 25000), 0.72, 1.3) : 1;
    L.s = damp(L.s, sizeT, 4, dt);
    L.sx = damp(L.sx, config > 0 ? ld / 3 : 1, 4, dt);
    L.vert = damp(L.vert, config > 0 && !horiz ? 1 : 0, 4, dt);
    L.under = damp(L.under, config > 0 && vessel.orientation === 'underground' ? 1 : 0, 4, dt);
    L.saddle = damp(L.saddle, 1 - L.vert, 6, dt);

    root.current.scale.setScalar(L.s);
    root.current.rotation.y = turn * (1 - L.vert);
    body.current.scale.set(L.sx, 1, 1);
    body.current.rotation.z = (L.vert * Math.PI) / 2;
    // stand vertical vessels on their legs: bottom head apex sits 0.9 above the slab
    body.current.position.y = L.vert * (-1.6 + 0.9 + (HALF + 0.5) * L.sx);

    saddles.current.scale.set(1, Math.max(sk * L.saddle, 0.0001), 1);
    saddles.current.visible = sk * L.saddle > 0.01;
    saddles.current.children.forEach((c, i) => (c.position.x = (i ? 1 : -1) * 2 * L.sx));
    legs.current.visible = L.vert > 0.01;
    legs.current.scale.set(1, Math.max(L.vert, 0.0001), 1);
    outer.current.visible = L.under > 0.01;
    (outer.current.material as THREE.MeshStandardMaterial).opacity = 0.28 * L.under;
    outer.current.scale.set(1.14, 1.06, 1.14); // capsule length runs along its local Y

    const c = COATS[vessel.moc];
    const k = 1 - Math.exp(-5 * dt);
    mat.coat.color.lerp(c.color, config > 0 ? k : 1);
    mat.coat.metalness = lerp(mat.coat.metalness, c.metal, config > 0 ? k : 1);
    mat.coat.roughness = lerp(mat.coat.roughness, c.rough, config > 0 ? k : 1);
  });

  const fittingParts = (
    [
      // [x, radius, height, flangeR] – manway first so the accessory toggle can target it
      [1.35, 0.3, 0.42, 0.42],
      [-1.35, 0.09, 0.34, 0.16],
      [-2.15, 0.12, 0.3, 0.2],
      [2.35, 0.07, 0.3, 0.13],
    ] as const
  ).map(([x, r, h, fr], i) => (
    <group key={i} ref={(g) => { if (g) fittings.current[i] = g; }} position={[x, 0.86, 0]}>
      <mesh material={mat.fitting} position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h, 40]} />
      </mesh>
      <mesh material={mat.fitting} position={[0, h, 0]} castShadow>
        <cylinderGeometry args={[fr, fr, 0.06, 48]} />
      </mesh>
      {i === 0 && (
        <mesh material={mat.band} position={[0, h + 0.05, 0]}>
          <cylinderGeometry args={[fr, fr, 0.03, 48]} />
        </mesh>
      )}
    </group>
  ));

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh ref={plate} geometry={geo.plateGeo} material={mat.steel} castShadow />
        <mesh ref={headL} geometry={geo.head} material={mat.steel} rotation-z={Math.PI / 2} castShadow />
        <mesh ref={headR} geometry={geo.head} material={mat.steel} rotation-z={-Math.PI / 2} castShadow />

        {geo.seamGeos.map((g, i) => (
          <mesh key={i} ref={(m) => { if (m) seams.current[i] = m; }} geometry={g} material={mat.seam} />
        ))}
        <mesh ref={arc} material={mat.arc}>
          <sphereGeometry args={[0.05, 12, 12]} />
        </mesh>
        <pointLight ref={arcLight} color={ARC} distance={3.5} decay={2} intensity={0} />

        <group ref={xray}>
          <mesh material={mat.xray} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[R * 1.06, R * 1.06, 0.018, 96, 1, true]} />
          </mesh>
          <mesh material={mat.xrayGlow} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[R * 1.05, R * 1.05, 0.5, 96, 1, true]} />
          </mesh>
        </group>

        {fittingParts}

        <group ref={water}>
          <mesh material={mat.water} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[R * 0.975, R * 0.975, HALF * 2, 64, 1, true]} />
          </mesh>
          <mesh geometry={geo.headWater} material={mat.water} position-x={-HALF} rotation-z={Math.PI / 2} />
          <mesh geometry={geo.headWater} material={mat.water} position-x={HALF} rotation-z={-Math.PI / 2} />
        </group>

        <group ref={coat}>
          <mesh material={mat.coat} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[R * 1.008, R * 1.008, HALF * 2, segs.r, 1, true]} />
          </mesh>
          <mesh geometry={geo.headCoat} material={mat.coat} position-x={-HALF} rotation-z={Math.PI / 2} />
          <mesh geometry={geo.headCoat} material={mat.coat} position-x={HALF} rotation-z={-Math.PI / 2} />
          {[-2.55, 2.55].map((x) => (
            <mesh key={x} material={mat.band} position-x={x} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[R * 1.014, R * 1.014, 0.1, segs.r, 1, true]} />
            </mesh>
          ))}
        </group>

        <mesh ref={outer} material={mat.ghost} rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[R, HALF * 2, 12, 64]} />
        </mesh>
      </group>

      <group ref={saddles} position-y={-1.6}>
        {[-2, 2].map((x) => (
          <mesh key={x} geometry={geo.saddle} material={mat.saddle} position={[x, 1.6, 0]} castShadow />
        ))}
      </group>

      <ContactShadows position={[0, -1.61, 0]} scale={16} blur={2.6} opacity={0.42} far={4} resolution={lowDetail ? 256 : 512} color="#2b2a26" />

      <group ref={legs} position-y={-1.6}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh key={i} material={mat.saddle} position={[Math.cos(a) * 0.78, 0.45, Math.sin(a) * 0.78]} castShadow>
              <boxGeometry args={[0.1, 0.9, 0.1]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
