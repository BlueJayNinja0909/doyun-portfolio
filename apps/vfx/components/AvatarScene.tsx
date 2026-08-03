'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * A Roblox R6 avatar rig that watches the cursor.
 *
 * Built from primitives rather than loaded as a model, because a Roblox avatar
 * genuinely *is* boxes and cylinders — R6 is six parts at fixed stud dimensions. A
 * procedural rig is the accurate representation, not an approximation, and it means
 * no external asset, no third-party runtime, and nothing to go stale.
 *
 * Proportions are the real R6 sizes in studs (1 stud = 1 unit here):
 *   Head  2 x 1 x 1 (rendered at 1.25 scale, as Roblox does)
 *   Torso 2 x 2 x 1
 *   Arm   1 x 2 x 1  (x = +/- 1.5)
 *   Leg   1 x 2 x 1  (x = +/- 0.5)
 *
 * Rendering runs on demand, not continuously: the canvas only draws when the cursor
 * moves or the rig is still easing toward it. An idle page costs nothing, which is the
 * difference between this and a permanently spinning 3D hero.
 */

const DUMMY_GREY = '#a3a2a5';
const DUMMY_GREY_DARK = '#838286';
const DUMMY_GREY_ARM = '#9a999d';

/** Yaw and pitch limits, in radians. Beyond these a head-turn stops reading as a look. */
const MAX_YAW = 0.62;
const MAX_PITCH = 0.34;
/** Torso follows the head at a fraction of the angle, the way a person turns. */
const TORSO_FOLLOW = 0.28;
const EASE = 0.12;

/** The classic Roblox smile, drawn to a canvas and mapped onto the head's front face. */
function useFaceTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = DUMMY_GREY;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1a1a1a';
    // Eyes — two rounded rectangles, set wide, slightly above centre.
    const eyeW = size * 0.1;
    const eyeH = size * 0.17;
    const eyeY = size * 0.36;
    for (const x of [size * 0.29, size * 0.61]) {
      ctx.beginPath();
      ctx.roundRect(x, eyeY, eyeW, eyeH, eyeW * 0.35);
      ctx.fill();
    }

    // Mouth — a shallow arc, not a full semicircle.
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = size * 0.035;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.56, size * 0.17, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

function Part({
  size,
  position,
  color = DUMMY_GREY,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.02} />
    </mesh>
  );
}

function Rig({ pointer, reduced }: { pointer: React.RefObject<{ x: number; y: number }>; reduced: boolean }) {
  const head = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const face = useFaceTexture();
  const current = useRef({ yaw: 0, pitch: 0 });
  const { invalidate } = useThree();

  useFrame(() => {
    if (reduced || !head.current || !body.current) return;

    const targetYaw = THREE.MathUtils.clamp(pointer.current.x * MAX_YAW * 1.6, -MAX_YAW, MAX_YAW);
    const targetPitch = THREE.MathUtils.clamp(
      -pointer.current.y * MAX_PITCH * 1.6,
      -MAX_PITCH,
      MAX_PITCH,
    );

    current.current.yaw += (targetYaw - current.current.yaw) * EASE;
    current.current.pitch += (targetPitch - current.current.pitch) * EASE;

    head.current.rotation.y = current.current.yaw;
    head.current.rotation.x = current.current.pitch;
    body.current.rotation.y = current.current.yaw * TORSO_FOLLOW;

    // Keep drawing only while still settling. Once the rig has caught up with the
    // cursor the loop goes quiet until the next pointer move.
    const settled =
      Math.abs(targetYaw - current.current.yaw) < 0.0008 &&
      Math.abs(targetPitch - current.current.pitch) < 0.0008;
    if (!settled) invalidate();
  });

  return (
    <group position={[0, -0.4, 0]}>
      <group ref={body}>
        {/* Torso */}
        <Part size={[2, 2, 1]} position={[0, 1, 0]} />
        {/* Arms */}
        <Part size={[0.94, 2, 0.94]} position={[-1.55, 1, 0]} color={DUMMY_GREY_ARM} />
        <Part size={[0.94, 2, 0.94]} position={[1.55, 1, 0]} color={DUMMY_GREY_ARM} />
        {/* Legs */}
        <Part size={[0.94, 2, 0.94]} position={[-0.53, -1, 0]} color={DUMMY_GREY_DARK} />
        <Part size={[0.94, 2, 0.94]} position={[0.53, -1, 0]} color={DUMMY_GREY_DARK} />

        {/* Head pivots at the neck, not at its own centre, so a turn swings the face
            rather than rotating it in place. */}
        <group ref={head} position={[0, 2, 0]}>
          <mesh position={[0, 0.625, 0]} castShadow>
            <boxGeometry args={[2, 1, 1]} />
            {/* Six materials so only the front face carries the printed face. */}
            <meshStandardMaterial attach="material-0" color={DUMMY_GREY} roughness={0.72} />
            <meshStandardMaterial attach="material-1" color={DUMMY_GREY} roughness={0.72} />
            <meshStandardMaterial attach="material-2" color={DUMMY_GREY} roughness={0.72} />
            <meshStandardMaterial attach="material-3" color={DUMMY_GREY} roughness={0.72} />
            <meshStandardMaterial
              attach="material-4"
              map={face ?? undefined}
              color={face ? '#ffffff' : DUMMY_GREY}
              roughness={0.72}
            />
            <meshStandardMaterial attach="material-5" color={DUMMY_GREY} roughness={0.72} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function AvatarScene() {
  const pointer = useRef({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);
  const invalidateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);

    // Tracking is on `window` deliberately: the rig should follow the cursor anywhere
    // on the page, not only while it is over the canvas. One listener total.
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidateRef.current?.();
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <Canvas
      // On-demand rendering. Without this the canvas would redraw 60 times a second
      // forever, which is most of what makes 3D heroes expensive.
      frameloop="demand"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.5, 12.4], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
      onCreated={({ invalidate }) => {
        invalidateRef.current = invalidate;
        invalidate();
      }}
    >
      <ambientLight intensity={0.34} />
      <directionalLight
        position={[3.5, 6, 5]}
        intensity={2.1}
       
        shadow-mapSize={[1024, 1024]}
      />
      {/* Cool rim from behind-left, picking up the site's violet accent. */}
      <directionalLight position={[-5, 2, -4]} intensity={0.85} color="#9b7bff" />
      <Rig pointer={pointer} reduced={reduced} />
    </Canvas>
  );
}
