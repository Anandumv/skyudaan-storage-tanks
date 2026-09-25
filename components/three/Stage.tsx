'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FILM_END, lerp, smooth } from '@/lib/film';
import { isHorizontal } from '@/lib/engineering';
import { useFilm } from '@/lib/store';
import { Vessel } from './Vessel';

/** Camera keyframe per chapter: position, look-at, and screen shift (fraction of viewport). */
type Frame = { p: [number, number, number]; l: [number, number, number]; sx: number; sy: number };

const FRAMES: Frame[] = [
  { p: [4.6, 8.4, 10.6], l: [0, -1.1, 0], sx: 0.16, sy: 0.24 }, // 00 plate, low-right under the hero headline
  { p: [8.6, 3.6, 8.8], l: [0, -0.2, 0], sx: 0.24, sy: 0 }, // 01 rolling
  { p: [12.6, 2.6, 6.2], l: [0, 0, 0], sx: 0.24, sy: 0 }, // 02 heads
  { p: [5.4, 5.0, 5.6], l: [-0.4, 0.4, -0.2], sx: 0.24, sy: 0 }, // 03 weld, closer on the seam
  { p: [0.6, 2.0, 11.6], l: [0, 0, 0], sx: 0.24, sy: 0 }, // 04 x-ray, broadside
  { p: [6.0, 6.4, 7.6], l: [0.4, 0.5, 0], sx: 0.24, sy: 0 }, // 05 nozzles from above
  { p: [0, 0.5, 12], l: [0, 0, 0], sx: 0.24, sy: 0 }, // 06 hydrotest, level with the water
  { p: [10, 2.4, 10], l: [0, -0.4, 0], sx: 0.24, sy: 0 }, // 07 saddles + coat
  { p: [8.6, 4.6, 13.2], l: [0, 0.2, 0], sx: 0.24, sy: 0 }, // 08 dispatch, truck + crane
];

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), look = new THREE.Vector3();
const pointer = { x: 0, y: 0 };

function Rig() {
  const { camera, size } = useThree();
  const cur = useMemo(() => ({ p: new THREE.Vector3(3.2, 6.6, 7.4), l: new THREE.Vector3(0, -1.1, 0), sx: 0, sy: 0.2 }), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.1);
    const { t, config, vessel } = useFilm.getState();
    const narrow = size.width / size.height < 0.9;

    // chapter keyframes are centred on i + 0.5; hold, then ease into the next
    const x = THREE.MathUtils.clamp(t - 0.5, 0, FILM_END - 1);
    const i = Math.min(Math.floor(x), FILM_END - 2);
    const k = smooth(THREE.MathUtils.clamp((x - i - 0.2) / 0.6, 0, 1));
    const a = FRAMES[i], b = FRAMES[i + 1];
    v1.fromArray(a.p).lerp(v2.fromArray(b.p), k);
    look.fromArray(a.l).lerp(v2.fromArray(b.l), k);
    let sx = lerp(a.sx, b.sx, k), sy = lerp(a.sy, b.sy, k);

    // configurator framing: vessel on the left, panel on the right
    if (config > 0) {
      const horiz = isHorizontal(vessel.orientation);
      const size = THREE.MathUtils.clamp(Math.cbrt(vessel.capacityLiters / 25000), 0.72, 1.3);
      // keep in step with Vessel: vertical shells stretch by L/D ÷ 3 and stand on 0.9 legs
      const stretch = horiz ? 1 : (vessel.application === 'silo' ? 3.5 : 2) / 3;
      const midY = horiz ? -0.4 : (-0.7 + 3.5 * stretch) * size * 0.9;
      const reach = horiz ? size : size * Math.max(1.15, 3.5 * stretch * 0.5);
      v2.set(horiz ? 9.6 : 10, horiz ? 4 : 1.4, horiz ? 11.4 : 12).multiplyScalar(reach);
      v2.y += horiz ? 0 : midY;
      v1.lerp(v2, config);
      look.lerp(v2.set(0, midY, 0), config);
      sx = lerp(sx, -0.17, config);
      sy = lerp(sy, 0, config);
    }

    if (narrow) {
      const hero = config === 0 ? 1 - THREE.MathUtils.clamp(t - 0.5, 0, 1) : 0;
      v1.multiplyScalar(1.75 + hero * 0.5);
      sx = 0;
      sy = lerp(-0.17, 0.34, hero);
    }

    // Fit: pull back until the whole vessel sits inside the free part of the screen
    // (right of the text on desktop, above the sheet on mobile), whatever the aspect ratio.
    if (config < 1) {
      const cam = camera as THREE.PerspectiveCamera;
      const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const tanH = tanV * (size.width / size.height);
      v2.copy(v1).sub(look);
      const dist = v2.length();
      const along = Math.abs(v2.x) / dist; // how end-on we look down the vessel axis
      let reach = 3.7 * Math.sqrt(1 - along * along) + 1.15; // half-width seen on screen
      if (t < 1.9) reach = Math.max(reach, 4.3); // flat / half-rolled plate is wider
      // dished heads start 5 units out and slide in across chapter 02
      reach += (1 - smooth(THREE.MathUtils.clamp((t - 2.05) / 0.75, 0, 1))) * (t > 1.9 ? 5 : 0) * Math.sqrt(1 - along * along);
      // dispatch: the truck (≈11 units long) and the lifted vessel widen and heighten the scene
      const dispatch = THREE.MathUtils.clamp((t - 8.25) / 0.3, 0, 1);
      // truck spans x ≈ -6.2 … +5 from the vessel centre, plus the cab's depth when seen at an angle
      reach = Math.max(reach, lerp(0, 6.4 * Math.sqrt(1 - along * along) + 1.6, dispatch));
      const reachV = 2.0 + dispatch * 0.9;
      const availW = Math.max(0.3, 0.9 - 2 * Math.abs(sx));
      const availH = Math.max(0.3, 0.84 - 2 * Math.abs(sy));
      const need = Math.max(reach / (availW * tanH), reachV / (availH * tanV));
      if (dist < need) v1.copy(look).addScaledVector(v2, lerp(need / dist, 1, config) );
    }

    // a little life from the pointer
    v1.x += pointer.x * 0.35;
    v1.y -= pointer.y * 0.2;

    const lam = 3.2;
    cur.p.x = THREE.MathUtils.damp(cur.p.x, v1.x, lam, dt);
    cur.p.y = THREE.MathUtils.damp(cur.p.y, v1.y, lam, dt);
    cur.p.z = THREE.MathUtils.damp(cur.p.z, v1.z, lam, dt);
    cur.l.x = THREE.MathUtils.damp(cur.l.x, look.x, lam, dt);
    cur.l.y = THREE.MathUtils.damp(cur.l.y, look.y, lam, dt);
    cur.l.z = THREE.MathUtils.damp(cur.l.z, look.z, lam, dt);
    cur.sx = THREE.MathUtils.damp(cur.sx, sx, lam, dt);
    cur.sy = THREE.MathUtils.damp(cur.sy, sy, lam, dt);

    camera.position.copy(cur.p);
    camera.lookAt(cur.l);
    const cam = camera as THREE.PerspectiveCamera;
    cam.setViewOffset(size.width, size.height, -cur.sx * size.width, -cur.sy * size.height, size.width, size.height);
  });

  return null;
}

/** Flags the first rendered frame so the entry gate can finish counting. */
function ReadySignal() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => useFilm.setState({ stageReady: true }));
  });
  return null;
}

function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[-6, 1, 3]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[6, 1, -3]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      <Lightformer form="rect" intensity={0.8} position={[0, 1, 8]} scale={[14, 1.2, 1]} />
      <Lightformer form="ring" color="#dfe4ff" intensity={1.2} position={[0, 2, -8]} scale={4} />
    </Environment>
  );
}

export default function Stage() {
  const visible = useFilm((s) => s.visible);
  const [low, setLow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px), (pointer: coarse)');
    setLow(mq.matches);
  }, []);

  return (
    <Canvas
      className="stage-canvas"
      aria-hidden
      frameloop={visible ? 'always' : 'never'}
      dpr={low ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', localClippingEnabled: true } as THREE.WebGLRendererParameters & { localClippingEnabled: boolean }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
      camera={{ fov: 32, near: 0.1, far: 80, position: [3.2, 6.6, 7.4] }}
    >
      <Rig />
      <ReadySignal />
      <Studio />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 5]} intensity={1.1} />
      <Vessel lowDetail={low} />
    </Canvas>
  );
}
